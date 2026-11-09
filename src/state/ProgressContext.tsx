import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type ExamSession, type LessonProgress } from '../services/db';
import { computeAllStates, type Attempt, type Evaluation, type QuestionState } from '../services/progress';
import { questions } from '../content';

interface ProgressValue {
  ready: boolean;
  attempts: Attempt[];
  states: Map<string, QuestionState>;
  flags: Set<string>;
  lessons: LessonProgress[];
  evaluations: Evaluation[];
  exams: ExamSession[];
  lastExport: number | null;
  recordAttempt: (a: Omit<Attempt, 'id'>) => Promise<void>;
  setFlag: (questionId: string, flagged: boolean) => Promise<void>;
  markLessonRead: (lessonId: string) => Promise<void>;
  saveEvaluation: (e: Omit<Evaluation, 'id'>) => Promise<void>;
}

const Ctx = createContext<ProgressValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const attempts = useLiveQuery(() => db.attempts.orderBy('date').toArray(), []);
  const flagRows = useLiveQuery(() => db.flags.toArray(), []);
  const lessons = useLiveQuery(() => db.lessons.toArray(), []);
  const evaluations = useLiveQuery(() => db.evaluations.toArray(), []);
  const exams = useLiveQuery(() => db.exams.orderBy('startedAt').reverse().toArray(), []);
  const lastExport = useLiveQuery(async () => ((await db.meta.get('lastExport'))?.value as number | undefined) ?? null, []);

  const value = useMemo<ProgressValue>(() => {
    const flags = new Set((flagRows ?? []).filter((f) => f.flagged).map((f) => f.questionId));
    const inProgress = new Set((exams ?? []).filter((e) => !e.submittedAt).flatMap((e) => Object.keys(e.answers)));
    const list = attempts ?? [];
    return {
      ready: attempts !== undefined && flagRows !== undefined && lessons !== undefined && evaluations !== undefined && exams !== undefined,
      attempts: list,
      states: computeAllStates(questions, list, flags, inProgress),
      flags,
      lessons: lessons ?? [],
      evaluations: evaluations ?? [],
      exams: exams ?? [],
      lastExport: lastExport ?? null,
      recordAttempt: async (a) => {
        await db.attempts.add(a as Attempt);
      },
      setFlag: async (questionId, flagged) => {
        await db.flags.put({ questionId, flagged, date: Date.now() });
      },
      markLessonRead: async (lessonId) => {
        if (!(await db.lessons.get(lessonId))) await db.lessons.put({ lessonId, readAt: Date.now() });
      },
      saveEvaluation: async (e) => {
        await db.evaluations.add(e as Evaluation);
      },
    };
  }, [attempts, flagRows, lessons, evaluations, exams, lastExport]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProgress hors ProgressProvider');
  return v;
}
