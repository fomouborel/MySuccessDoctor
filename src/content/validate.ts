/**
 * Validation sémantique du contenu (au-delà du schéma).
 * Utilisée par `npm run validate:content` (CI) et par les tests.
 */
import { chapterSchema, examSchema, questionFileSchema, type Chapter, type Question } from './schema';

export interface ContentInput {
  questionFiles: Record<string, unknown>;
  chapters: unknown;
  exams: unknown;
  lessonFiles: string[]; // chemins relatifs à content/lessons
  mediaFiles?: string[]; // chemins relatifs à public/
}

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

export function expectedKeys(q: Question): string[] {
  if (q.type === 'single' || q.type === 'multiple') return q.options.filter((o) => o.expected).map((o) => o.key);
  return [];
}

export function validateContent(input: ContentInput): { errors: string[]; questions: Question[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const questions: Question[] = [];

  const chaptersParsed = chapterSchema.array().safeParse(input.chapters);
  if (!chaptersParsed.success) errors.push(`chapters.json invalide : ${chaptersParsed.error.message}`);
  const chapters: Chapter[] = chaptersParsed.success ? chaptersParsed.data : [];
  const examsParsed = examSchema.array().safeParse(input.exams);
  if (!examsParsed.success) errors.push(`exams.json invalide : ${examsParsed.error.message}`);

  const lessonIds = new Set(chapters.flatMap((c) => c.lessons.map((l) => l.id)));
  for (const c of chapters) for (const l of c.lessons) if (!input.lessonFiles.includes(l.file)) errors.push(`Leçon introuvable : ${l.file}`);

  for (const [file, raw] of Object.entries(input.questionFiles)) {
    const parsed = questionFileSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) errors.push(`${file} → ${issue.path.join('.')} : ${issue.message}`);
      continue;
    }
    questions.push(...parsed.data.questions);
  }

  const seen = new Map<string, number>();
  for (const q of questions) seen.set(q.id, (seen.get(q.id) ?? 0) + 1);
  for (const [id, n] of seen) if (n > 1) errors.push(`Identifiant en double : ${id}`);

  const cases = new Map<string, number[]>();
  for (const q of questions) {
    const where = q.id;
    const [, sessionInId, disc, typeInId] = q.id.match(/^DIGEST-(\d{4}-\d{2}|AP\d{4}|ND)-([A-Z]+)-([A-Z]+)-/) ?? [];
    if (sessionInId !== q.session) errors.push(`${where} : session ${q.session} ≠ identifiant`);
    if (disc !== q.discipline) errors.push(`${where} : discipline ${q.discipline} ≠ identifiant`);
    const typeMap: Record<string, string[]> = { single: ['QCM'], multiple: ['QCMM'], count: ['COMB'], truefalse: ['VF'], qroc: ['QROC'] };
    if (!typeMap[q.type].includes(typeInId)) errors.push(`${where} : type ${q.type} incompatible avec ${typeInId}`);

    const chapter = chapters.find((c) => c.id === q.chapter);
    if (!chapter) errors.push(`${where} : chapitre inconnu ${q.chapter}`);
    else if (q.subchapter && !chapter.subchapters.some((s) => s.id === q.subchapter)) errors.push(`${where} : sous-chapitre inconnu ${q.subchapter}`);
    // Décision : les questions pédiatriques sont rangées UNIQUEMENT dans le chapitre Pédiatrie.
    if ((q.discipline === 'PEDIA' || q.discipline === 'CHIRPED') && q.chapter !== 'pediatrie')
      errors.push(`${where} : question pédiatrique hors du chapitre « pediatrie »`);
    for (const l of q.lessonLinks ?? []) if (!lessonIds.has(l)) errors.push(`${where} : leçon liée inconnue ${l}`);

    if (input.mediaFiles) for (const m of q.media ?? []) if (!input.mediaFiles.includes(m.src)) errors.push(`${where} : image introuvable ${m.src}`);

    // Cohérence statut ↔ réponse attendue
    const keys = expectedKeys(q);
    const gradable = q.answerStatus !== 'unavailable';
    if (q.type === 'single') {
      if (gradable && keys.length !== 1 && q.answerStatus !== 'disputed') errors.push(`${where} : QCM simple avec ${keys.length} réponse(s) attendue(s)`);
      if (!gradable && keys.length > 0) errors.push(`${where} : réponse « non disponible » mais une option est marquée attendue`);
    }
    if (q.type === 'multiple') {
      if (!gradable && keys.length > 0) errors.push(`${where} : réponse « non disponible » mais des options sont marquées attendues`);
      if (gradable && q.answerStatus !== 'disputed' && keys.length === 0) errors.push(`${where} : aucune option attendue`);
      if (gradable && q.expectedCount && keys.length && q.expectedCount !== keys.length && q.answerStatus !== 'disputed')
        errors.push(`${where} : ${keys.length} options attendues pour une consigne de ${q.expectedCount}`);
    }
    if (q.type === 'count') {
      if (q.expectedChoice && !q.choices.includes(q.expectedChoice)) errors.push(`${where} : choix attendu absent des choix`);
      if (!gradable && q.expectedChoice) errors.push(`${where} : réponse « non disponible » mais un choix est attendu`);
      if (gradable && q.answerStatus !== 'disputed' && !q.expectedChoice) errors.push(`${where} : aucun choix attendu`);
      // Le décompte n'est vérifié que si chaque affirmation est annotée vraie/fausse.
      if (q.expectedChoice && q.countOf === 'true' && q.statements.every((s) => typeof s.expected === 'boolean')) {
        const n = q.statements.filter((s) => s.expected === true).length;
        if (String(n) !== q.expectedChoice) errors.push(`${where} : ${n} affirmations vraies ≠ réponse ${q.expectedChoice}`);
      }
    }
    if ((q.answerStatus === 'disputed' || q.answerStatus === 'inferred') && !q.answerNote)
      errors.push(`${where} : une réponse contestée ou déduite doit être expliquée (answerNote)`);
    if (q.explanation?.sources?.some((s) => !s.verified)) warnings.push(`${where} : source non vérifiée (elle ne sera pas affichée)`);

    // Les indices ne doivent pas révéler la réponse
    if (q.hints && (q.type === 'single' || q.type === 'multiple')) {
      for (const o of q.options.filter((o) => o.expected)) {
        const t = norm(o.text);
        if (t.length >= 8 && q.hints.some((h) => norm(h).includes(t))) errors.push(`${where} : un indice contient le texte de la réponse ${o.key}`);
      }
    }
    if (q.caseId) {
      if (!q.caseStep) errors.push(`${where} : cas clinique sans numéro d’étape`);
      else cases.set(q.caseId, [...(cases.get(q.caseId) ?? []), q.caseStep]);
    }
  }
  for (const [caseId, steps] of cases) {
    const sorted = [...steps].sort((a, b) => a - b);
    if (sorted.some((s, i) => s !== i + 1)) errors.push(`Cas clinique ${caseId} : étapes non consécutives (${sorted.join(', ')})`);
  }
  return { errors, warnings, questions };
}
