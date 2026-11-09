/**
 * Chargement du contenu au moment du build (aucune requête réseau à l'exécution).
 */
import chaptersRaw from '../../content/chapters.json';
import examsRaw from '../../content/exams.json';
import { chapterSchema, examSchema, questionFileSchema, type Chapter, type Exam, type Question } from './schema';

const questionModules = import.meta.glob('../../content/questions/*.json', { eager: true, import: 'default' });
const lessonModules = import.meta.glob('../../content/lessons/**/*.md', { eager: true, query: '?raw', import: 'default' });

export const chapters: Chapter[] = chapterSchema.array().parse(chaptersRaw);
export const exams: Exam[] = examSchema.array().parse(examsRaw);

export const questions: Question[] = Object.values(questionModules)
  .flatMap((m) => questionFileSchema.parse(m).questions)
  .filter((q) => !q.retired);

export const questionById = new Map(questions.map((q) => [q.id, q]));

export function lessonMarkdown(file: string): string | undefined {
  const key = Object.keys(lessonModules).find((k) => k.endsWith(`/content/lessons/${file}`));
  return key ? (lessonModules[key] as string) : undefined;
}

export const lessonById = new Map(chapters.flatMap((c) => c.lessons.map((l) => [l.id, { ...l, chapterId: c.id }] as const)));

export function questionsOfChapter(chapterId: string): Question[] {
  return questions.filter((q) => q.chapter === chapterId);
}

/** Ordre « examen d'origine » : par page, puis numéro d'origine. */
export function sortBySource(qs: Question[]): Question[] {
  const num = (q: Question) => parseInt(q.provenance[0].originalNumber ?? '', 10);
  return [...qs].sort((a, b) => a.provenance[0].page - b.provenance[0].page || (num(a) || 0) - (num(b) || 0) || a.id.localeCompare(b.id));
}

export function examOfQuestion(q: Question): string {
  return q.session.startsWith('AP') ? 'AP' : q.session;
}

export function questionsOfExam(examId: string): Question[] {
  return sortBySource(questions.filter((q) => examOfQuestion(q) === examId));
}

/** Étapes d'un cas clinique, dans l'ordre. */
export function caseSteps(caseId: string): Question[] {
  return questions.filter((q) => q.caseId === caseId).sort((a, b) => (a.caseStep ?? 0) - (b.caseStep ?? 0));
}

export const SESSION_LABELS: Record<string, string> = Object.fromEntries(exams.map((e) => [e.session, e.title]));
export function sessionLabel(session: string): string {
  if (session.startsWith('AP')) return `Anatomo-pathologie ${session.slice(2)}`;
  if (session === 'ND') return 'Non datée';
  return SESSION_LABELS[session] ?? session;
}
