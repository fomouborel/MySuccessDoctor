/**
 * Sauvegarde : export / import de toute la progression au format JSON.
 * Le fichier est vérifié (schéma + empreinte) avant toute écriture.
 */
import { z } from 'zod';
import type { DigestDB } from './db';

export const BACKUP_SCHEMA_VERSION = 1;

const attemptSchema = z.object({
  id: z.number().optional(),
  questionId: z.string(),
  revision: z.number(),
  date: z.number(),
  mode: z.enum(['practice', 'exam', 'revision', 'evaluation', 'lesson-check']),
  result: z.enum(['correct', 'incorrect', 'partial', 'ungraded']),
  score: z.number().nullable(),
  hintsUsed: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  answer: z.unknown(),
  durationMs: z.number().optional(),
  selfAssessed: z.boolean().optional(),
});

const dataSchema = z.object({
  attempts: z.array(attemptSchema),
  flags: z.array(z.object({ questionId: z.string(), flagged: z.boolean(), date: z.number() })),
  lessons: z.array(z.object({ lessonId: z.string(), readAt: z.number() })),
  exams: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      questionIds: z.array(z.string()),
      answers: z.record(z.string(), z.unknown()),
      hints: z.record(z.string(), z.number()),
      startedAt: z.number(),
      durationMin: z.number().nullable(),
      submittedAt: z.number().nullable(),
      kind: z.enum(['custom', 'archive']),
      sourceExamId: z.string().optional(),
    }),
  ),
  evaluations: z.array(z.object({ id: z.number().optional(), chapterId: z.string(), date: z.number(), score: z.number(), questionIds: z.array(z.string()) })),
});
export type BackupData = z.infer<typeof dataSchema>;

export const backupSchema = z.object({
  app: z.literal('digest-academy'),
  schemaVersion: z.number().int(),
  exportedAt: z.number(),
  checksum: z.string(),
  data: dataSchema,
});
export type Backup = z.infer<typeof backupSchema>;

/** Empreinte FNV-1a 32 bits : détecte un fichier tronqué ou modifié par erreur. */
export function checksum(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export async function readAll(db: DigestDB): Promise<BackupData> {
  const [attempts, flags, lessons, exams, evaluations] = await Promise.all([
    db.attempts.toArray(),
    db.flags.toArray(),
    db.lessons.toArray(),
    db.exams.toArray(),
    db.evaluations.toArray(),
  ]);
  return { attempts: attempts as BackupData['attempts'], flags, lessons, exams, evaluations };
}

export async function exportBackup(db: DigestDB, now = Date.now()): Promise<Backup> {
  const data = await readAll(db);
  const backup: Backup = {
    app: 'digest-academy',
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: now,
    checksum: checksum(JSON.stringify(data)),
    data,
  };
  await db.meta.put({ key: 'lastExport', value: now });
  return backup;
}

export function backupFileName(date = new Date()): string {
  const d = date.toISOString().slice(0, 10);
  return `digest-academy-sauvegarde-${d}.json`;
}

export type ParseResult = { ok: true; backup: Backup } | { ok: false; error: string };

export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Ce fichier n’est pas une sauvegarde lisible (format JSON invalide).' };
  }
  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Ce fichier n’est pas une sauvegarde DIGEST ACADEMY valide.' };
  if (parsed.data.schemaVersion > BACKUP_SCHEMA_VERSION)
    return { ok: false, error: 'Cette sauvegarde provient d’une version plus récente de l’application. Rechargez la page puis réessayez.' };
  // L'empreinte porte sur les données telles qu'écrites dans le fichier (avant normalisation).
  if (checksum(JSON.stringify((raw as { data: unknown }).data)) !== parsed.data.checksum)
    return { ok: false, error: 'La sauvegarde semble abîmée ou modifiée (empreinte incorrecte).' };
  return { ok: true, backup: parsed.data };
}

const attemptKey = (a: { questionId: string; date: number; mode: string }) => `${a.questionId}|${a.date}|${a.mode}`;

/**
 * Importe une sauvegarde.
 * - replace : l'état actuel est d'abord conservé dans meta.preImportSnapshot, puis remplacé.
 * - merge   : les deux historiques sont réunis sans doublon ; les statuts sont recalculés.
 */
export async function importBackup(db: DigestDB, backup: Backup, mode: 'merge' | 'replace'): Promise<{ added: number }> {
  const incoming = backup.data;
  let added = 0;
  await db.transaction('rw', [db.attempts, db.flags, db.lessons, db.exams, db.evaluations, db.meta], async () => {
    if (mode === 'replace') {
      const snapshot = await readAll(db);
      await db.meta.put({ key: 'preImportSnapshot', value: { at: Date.now(), data: snapshot } });
      await Promise.all([db.attempts.clear(), db.flags.clear(), db.lessons.clear(), db.exams.clear(), db.evaluations.clear()]);
    }
    const existing = new Set((await db.attempts.toArray()).map(attemptKey));
    const newAttempts = incoming.attempts.filter((a) => !existing.has(attemptKey(a))).map(({ id: _id, ...rest }) => rest);
    added = newAttempts.length;
    await db.attempts.bulkAdd(newAttempts as never[]);
    for (const f of incoming.flags) {
      const cur = await db.flags.get(f.questionId);
      if (!cur || cur.date < f.date) await db.flags.put(f);
    }
    for (const l of incoming.lessons) {
      const cur = await db.lessons.get(l.lessonId);
      if (!cur || cur.readAt > l.readAt) await db.lessons.put(l);
    }
    for (const e of incoming.exams) if (!(await db.exams.get(e.id))) await db.exams.put(e);
    const evKeys = new Set((await db.evaluations.toArray()).map((e) => `${e.chapterId}|${e.date}`));
    await db.evaluations.bulkAdd(incoming.evaluations.filter((e) => !evKeys.has(`${e.chapterId}|${e.date}`)).map(({ id: _id, ...rest }) => rest) as never[]);
    await db.meta.put({ key: 'lastImport', value: Date.now() });
  });
  return { added };
}
