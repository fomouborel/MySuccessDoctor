/**
 * Stockage local de la progression (IndexedDB via Dexie).
 * Rien ne quitte le navigateur, sauf si l'étudiante exporte sa sauvegarde.
 */
import Dexie, { type EntityTable } from 'dexie';
import type { Attempt, Evaluation } from './progress';

export interface Flag {
  questionId: string;
  flagged: boolean;
  date: number;
}
export interface LessonProgress {
  lessonId: string;
  readAt: number;
}
export interface ExamSession {
  id: string;
  title: string;
  questionIds: string[];
  answers: Record<string, unknown>;
  hints: Record<string, number>;
  startedAt: number;
  durationMin: number | null;
  submittedAt: number | null;
  kind: 'custom' | 'archive';
  sourceExamId?: string;
}
export interface Meta {
  key: string;
  value: unknown;
}

export class DigestDB extends Dexie {
  attempts!: EntityTable<Attempt, 'id'>;
  flags!: EntityTable<Flag, 'questionId'>;
  lessons!: EntityTable<LessonProgress, 'lessonId'>;
  exams!: EntityTable<ExamSession, 'id'>;
  evaluations!: EntityTable<Evaluation, 'id'>;
  meta!: EntityTable<Meta, 'key'>;

  constructor(name = 'digest-academy') {
    super(name);
    this.version(1).stores({
      attempts: '++id, questionId, date, mode',
      flags: 'questionId',
      lessons: 'lessonId',
      exams: 'id, startedAt, submittedAt',
      evaluations: '++id, chapterId, date',
      meta: 'key',
    });
  }
}

export const db = new DigestDB();

/** Demande au navigateur de ne pas effacer les données en cas de manque d'espace. */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
