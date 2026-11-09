/**
 * Statuts des questions, répétition espacée (boîtes de Leitner) et maîtrise.
 * Tout est recalculé à partir de l'historique des tentatives : la progression
 * reste cohérente après une importation ou une fusion de sauvegardes.
 */
import type { Question } from '../content/schema';
import type { Result } from './scoring';

export const DAY = 24 * 60 * 60 * 1000;
/** Intervalle de révision (en jours) pour chaque boîte 1..5 */
export const BOX_INTERVALS = [1, 3, 7, 14, 30] as const;

export type Mode = 'practice' | 'exam' | 'revision' | 'evaluation' | 'lesson-check';

export interface Attempt {
  id?: number;
  questionId: string;
  revision: number;
  date: number; // ms
  mode: Mode;
  result: Result;
  score: number | null;
  hintsUsed: 0 | 1 | 2 | 3;
  answer: unknown;
  durationMs?: number;
  selfAssessed?: boolean;
}

export type QuestionStatus = 'new' | 'in-progress' | 'success' | 'failed' | 'review' | 'mastered' | 'ungraded';

export const STATUS_LABELS: Record<QuestionStatus, string> = {
  new: 'Non commencée',
  'in-progress': 'En cours',
  success: 'Réussie',
  failed: 'Échouée',
  review: 'À revoir',
  mastered: 'Maîtrisée',
  ungraded: 'Travaillée (sans correction)',
};

export interface QuestionState {
  questionId: string;
  status: QuestionStatus;
  box: number; // 0 = jamais vue, 1..5
  due: number | null;
  attempts: number;
  errors: number;
  lastResult: Result | null;
  lastDate: number | null;
  lastErrorDate: number | null;
}

export function schedule(box: number, result: Result, hintsUsed: number, date: number): { box: number; due: number } {
  let next = box;
  if (result === 'correct') next = hintsUsed >= 3 ? Math.max(1, box) : Math.min(5, box + 1);
  else if (result === 'incorrect') next = 1;
  else next = Math.max(1, box); // partial / ungraded : boîte inchangée
  return { box: next, due: date + BOX_INTERVALS[next - 1] * DAY };
}

function isMastered(sorted: Attempt[]): boolean {
  const graded = sorted.filter((a) => a.result !== 'ungraded');
  if (graded.filter((a) => a.result === 'correct').length < 3) return false;
  const [prev, last] = graded.slice(-2);
  if (!prev || !last) return false;
  if (prev.result !== 'correct' || last.result !== 'correct') return false;
  if (prev.hintsUsed >= 3 || last.hintsUsed >= 3) return false;
  return last.date - prev.date >= 3 * DAY;
}

export function computeState(
  questionId: string,
  attempts: Attempt[],
  opts: { now?: number; flagged?: boolean; inProgress?: boolean } = {},
): QuestionState {
  const now = opts.now ?? Date.now();
  const sorted = attempts.filter((a) => a.questionId === questionId).sort((a, b) => a.date - b.date);
  let box = 0;
  let due: number | null = null;
  for (const a of sorted) ({ box, due } = schedule(box, a.result, a.hintsUsed, a.date));
  const last = sorted.at(-1) ?? null;
  const errors = sorted.filter((a) => a.result === 'incorrect' || a.result === 'partial');
  let status: QuestionStatus;
  if (!last) status = opts.inProgress ? 'in-progress' : 'new';
  else if (opts.inProgress) status = 'in-progress';
  else if (isMastered(sorted)) status = 'mastered';
  else if (opts.flagged || (due !== null && due <= now && last.result !== 'ungraded')) status = 'review';
  else if (last.result === 'correct') status = 'success';
  else if (last.result === 'ungraded') status = 'ungraded';
  else status = 'failed';
  return {
    questionId,
    status,
    box,
    due,
    attempts: sorted.length,
    errors: errors.length,
    lastResult: last?.result ?? null,
    lastDate: last?.date ?? null,
    lastErrorDate: errors.at(-1)?.date ?? null,
  };
}

export function computeAllStates(questions: Question[], attempts: Attempt[], flags: Set<string>, inProgress: Set<string>, now = Date.now()) {
  const byQ = new Map<string, Attempt[]>();
  for (const a of attempts) byQ.set(a.questionId, [...(byQ.get(a.questionId) ?? []), a]);
  return new Map(
    questions.map((q) => [q.id, computeState(q.id, byQ.get(q.id) ?? [], { now, flagged: flags.has(q.id), inProgress: inProgress.has(q.id) })]),
  );
}

// ───────────────────────── Couverture & maîtrise ─────────────────────────

export interface Coverage {
  total: number;
  distinctTotal: number;
  worked: number;
  distinctWorked: number;
  success: number;
  failed: number;
  review: number;
  mastered: number;
  ungraded: number;
  remaining: number;
}

/** Une « question distincte » = un groupe de doublons, ou une question isolée. */
export const distinctKey = (q: Question) => q.duplicateGroup ?? q.id;

export function coverage(questions: Question[], states: Map<string, QuestionState>): Coverage {
  const live = questions.filter((q) => !q.retired);
  const st = (q: Question) => states.get(q.id)?.status ?? 'new';
  const workedQs = live.filter((q) => (states.get(q.id)?.attempts ?? 0) > 0);
  const distinct = new Set(live.map(distinctKey));
  const distinctWorked = new Set(workedQs.map(distinctKey));
  const count = (s: QuestionStatus) => live.filter((q) => st(q) === s).length;
  return {
    total: live.length,
    distinctTotal: distinct.size,
    worked: workedQs.length,
    distinctWorked: distinctWorked.size,
    success: count('success'),
    failed: count('failed'),
    review: count('review'),
    mastered: count('mastered'),
    ungraded: count('ungraded'),
    remaining: live.length - workedQs.length,
  };
}

export type MasteryLevel = 'none' | 'to-work' | 'progressing' | 'consolidate' | 'mastered';
export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  none: 'Pas encore commencé',
  'to-work': 'À travailler',
  progressing: 'En progression',
  consolidate: 'À consolider',
  mastered: 'Maîtrisé',
};

export interface Evaluation {
  id?: number;
  chapterId: string;
  date: number;
  score: number; // 0..1
  questionIds: string[];
}

export function chapterMastery(
  questions: Question[],
  states: Map<string, QuestionState>,
  evaluations: Evaluation[],
): { level: MasteryLevel; coverage: number; successRate: number | null; graded: number } {
  const live = questions.filter((q) => !q.retired);
  if (live.length === 0) return { level: 'none', coverage: 0, successRate: null, graded: 0 };
  const worked = live.filter((q) => (states.get(q.id)?.attempts ?? 0) > 0);
  const cov = worked.length / live.length;
  const graded = worked.filter((q) => {
    const r = states.get(q.id)?.lastResult;
    return r === 'correct' || r === 'incorrect' || r === 'partial';
  });
  const okCount = graded.filter((q) => states.get(q.id)?.lastResult === 'correct').length;
  const rate = graded.length ? okCount / graded.length : null;
  if (worked.length === 0) return { level: 'none', coverage: 0, successRate: null, graded: 0 };
  const r = rate ?? 0;
  const goodEvals = evaluations.filter((e) => e.score >= 0.8).sort((a, b) => a.date - b.date);
  const twoSpaced = goodEvals.some((e, i) => goodEvals.slice(i + 1).some((f) => f.date - e.date >= 7 * DAY));
  let level: MasteryLevel = 'to-work';
  if (cov >= 0.9 && r >= 0.8 && twoSpaced) level = 'mastered';
  else if (cov >= 0.7 && r >= 0.7) level = 'consolidate';
  else if (cov >= 0.3 && r >= 0.5) level = 'progressing';
  return { level, coverage: cov, successRate: rate, graded: graded.length };
}

/** Questions dues pour la révision, les plus urgentes d'abord. */
export function dueQuestions(states: Map<string, QuestionState>, now = Date.now()): QuestionState[] {
  return [...states.values()]
    .filter((s) => s.due !== null && s.due <= now && s.lastResult !== 'ungraded' && s.status !== 'mastered')
    .sort((a, b) => a.box - b.box || (a.due ?? 0) - (b.due ?? 0));
}
