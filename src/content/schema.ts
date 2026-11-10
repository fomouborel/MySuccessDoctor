/**
 * Schémas du contenu pédagogique (questions, chapitres, examens).
 * Partagés par l'application, le script de validation (CI) et les tests.
 * Toute donnée qui ne respecte pas ces schémas BLOQUE le déploiement.
 */
import { z } from 'zod';

export const DISCIPLINES = ['GASTRO', 'HEPATO', 'CHIR', 'CHIRPED', 'PEDIA', 'RADIO', 'PHARMA', 'ANAPATH', 'CLIN'] as const;
export const disciplineSchema = z.enum(DISCIPLINES);
export type Discipline = z.infer<typeof disciplineSchema>;

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  GASTRO: 'Gastro-entérologie',
  HEPATO: 'Hépatologie',
  CHIR: 'Chirurgie digestive',
  CHIRPED: 'Chirurgie pédiatrique',
  PEDIA: 'Pédiatrie digestive',
  RADIO: 'Radiologie',
  PHARMA: 'Pharmacologie',
  ANAPATH: 'Anatomo-pathologie',
  CLIN: 'Cliniques',
};

/** Public visé par la question : partie adulte ou partie pédiatrique de l'examen. */
export type Audience = 'adult' | 'pedia';
export function audienceOf(q: { chapter: string; discipline: Discipline }): Audience {
  return q.chapter === 'pediatrie' || q.discipline === 'PEDIA' || q.discipline === 'CHIRPED' ? 'pedia' : 'adult';
}
export const AUDIENCE_LABELS: Record<Audience, string> = { adult: 'Adulte', pedia: 'Pédiatrie' };

/** Statut de fiabilité de la réponse attendue — voir docs/AUDIT-PHASE-1.md §7. */
export const answerStatusSchema = z.enum(['official', 'proposed', 'disputed', 'inferred', 'unavailable']);
export type AnswerStatus = z.infer<typeof answerStatusSchema>;

export const qualityFlagSchema = z.enum([
  'incomplete-options',
  'stem-only',
  'uncertain-wording',
  'image-missing',
  'image-reveals-answer',
  'transcription-error-suspected',
]);
export type QualityFlag = z.infer<typeof qualityFlagSchema>;

export const provenanceSchema = z.object({
  file: z.enum(['compilation', 'jan2026', 'aug2026', 'jan2025', 'qcm-nc', 'qroc-nc']),
  page: z.number().int().positive(),
  section: z.string().min(1),
  originalNumber: z.string().optional(),
});

export const sourceRefSchema = z.object({
  label: z.string().min(1),
  url: z.string().url().optional(),
  /** Une source n'est affichée que si elle a été vérifiée. Aucune référence inventée. */
  verified: z.boolean(),
});

export const explanationSchema = z.object({
  /** archives = issu des archives UCL ; complement = explication ajoutée par DIGEST ACADEMY */
  origin: z.enum(['archives', 'complement']),
  review: z.enum(['to-validate', 'validated']),
  text: z.string().min(1),
  pitfalls: z.array(z.string()).optional(),
  sources: z.array(sourceRefSchema).optional(),
});
export type Explanation = z.infer<typeof explanationSchema>;

export const optionSchema = z.object({
  key: z.string().min(1),
  text: z.string(),
  /** Pour une consigne « la fausse », expected=true marque l'option FAUSSE qu'il faut cocher. */
  expected: z.boolean().optional(),
  /** Justification issue des archives (commentaire étudiant) ou complémentaire. */
  note: z.string().optional(),
  noteOrigin: z.enum(['archives', 'complement']).optional(),
});
export type Option = z.infer<typeof optionSchema>;

export const qrocModelSchema = z.object({
  essentials: z.array(z.string()).min(1),
  keywords: z.array(z.string()),
  optional: z.array(z.string()),
  majorErrors: z.array(z.string()),
  exampleAnswer: z.string(),
  origin: z.enum(['archives', 'complement']),
  review: z.enum(['to-validate', 'validated']),
});

const ID_RE = /^DIGEST-(\d{4}-\d{2}|AP\d{4}|ND)-(GASTRO|HEPATO|CHIR|CHIRPED|PEDIA|RADIO|PHARMA|ANAPATH|CLIN)-(QCM|QCMM|COMB|VF|APP|QROC)-\d{3}$/;

const baseFields = {
  id: z.string().regex(ID_RE, 'Identifiant non conforme (DIGEST-<SESSION>-<DISCIPLINE>-<TYPE>-<NNN>)'),
  revision: z.number().int().min(1),
  session: z.string().regex(/^(\d{4}-\d{2}|AP\d{4}|ND)$/),
  discipline: disciplineSchema,
  teacher: z.string().optional(),
  formerTeacher: z.boolean().optional(),
  chapter: z.string().min(1),
  subchapter: z.string().optional(),
  tags: z.array(z.string()),
  clinical: z.boolean().optional(),
  /** Difficulté ESTIMÉE (1 facile → 3 difficile). */
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  /** Consigne telle que retranscrite (formulation originale conservée). */
  stem: z.string().min(1),
  stemNote: z.string().optional(),
  media: z.array(z.object({ src: z.string(), alt: z.string() })).optional(),
  answerStatus: answerStatusSchema,
  answerNote: z.string().optional(),
  quality: z.array(qualityFlagSchema),
  sourceComments: z.array(z.string()),
  provenance: z.array(provenanceSchema).min(1),
  duplicateGroup: z.string().optional(),
  explanation: explanationSchema.optional(),
  hints: z.tuple([z.string(), z.string(), z.string()]).optional(),
  lessonLinks: z.array(z.string()).optional(),
  caseId: z.string().optional(),
  caseStep: z.number().int().positive().optional(),
  retired: z.boolean().optional(),
};

export const questionSchema = z.discriminatedUnion('type', [
  z.object({ ...baseFields, type: z.literal('single'), options: z.array(optionSchema).min(2) }),
  z.object({
    ...baseFields,
    type: z.literal('multiple'),
    options: z.array(optionSchema).min(2),
    expectedCount: z.number().int().positive().optional(),
  }),
  z.object({
    ...baseFields,
    type: z.literal('count'),
    statements: z.array(optionSchema).min(2),
    countOf: z.enum(['true', 'false', 'unknown']),
    choices: z.array(z.string()).min(2),
    expectedChoice: z.string().optional(),
  }),
  z.object({ ...baseFields, type: z.literal('truefalse'), statements: z.array(optionSchema).min(1) }),
  z.object({ ...baseFields, type: z.literal('qroc'), model: qrocModelSchema.optional() }),
]);
export type Question = z.infer<typeof questionSchema>;
export type QuestionType = Question['type'];

export const questionFileSchema = z.object({
  source: z.string(),
  questions: z.array(questionSchema),
});

export const chapterSchema = z.object({
  id: z.string(),
  title: z.string(),
  short: z.string(),
  icon: z.string(),
  status: z.enum(['available', 'pending']),
  subchapters: z.array(z.object({ id: z.string(), title: z.string() })),
  lessons: z.array(z.object({ id: z.string(), title: z.string(), file: z.string(), minutes: z.number() })),
});
export type Chapter = z.infer<typeof chapterSchema>;

export const examSchema = z.object({
  id: z.string(),
  title: z.string(),
  session: z.string(),
  dated: z.boolean(),
  duration: z.string().optional(),
  format: z.string().optional(),
  composition: z.array(z.object({ discipline: disciplineSchema, teacher: z.string().optional(), announced: z.string() })).optional(),
  compositionKnown: z.boolean(),
  missingSlots: z.array(z.object({ originalNumber: z.string(), note: z.string() })),
  notes: z.array(z.string()),
});
export type Exam = z.infer<typeof examSchema>;
