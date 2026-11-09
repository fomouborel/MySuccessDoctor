import type { Mode } from '../../services/progress';

export interface SessionSpec {
  ids: string[];
  mode: Mode;
  title: string;
  allowHints: boolean;
  chapterId?: string;
  backTo?: string;
}

const KEY = 'digest-session';

/** La session courante est gardée dans sessionStorage pour survivre à un rechargement de page. */
export function saveSession(spec: SessionSpec): void {
  sessionStorage.setItem(KEY, JSON.stringify(spec));
}
export function loadSession(): SessionSpec | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionSpec) : null;
  } catch {
    return null;
  }
}

export function shuffle<T>(arr: T[], seed = Date.now()): T[] {
  const a = [...arr];
  let s = seed % 2147483647;
  const rnd = () => ((s = (s * 48271) % 2147483647) / 2147483647);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Garde les étapes d'un même cas clinique ensemble et dans l'ordre. */
export function keepCasesTogether<T extends { id: string; caseId?: string; caseStep?: number }>(list: T[], all: T[]): T[] {
  const out: T[] = [];
  const done = new Set<string>();
  for (const q of list) {
    if (done.has(q.id)) continue;
    if (q.caseId) {
      const steps = all.filter((x) => x.caseId === q.caseId).sort((a, b) => (a.caseStep ?? 0) - (b.caseStep ?? 0));
      for (const s of steps) if (!done.has(s.id)) (out.push(s), done.add(s.id));
    } else {
      out.push(q);
      done.add(q.id);
    }
  }
  return out;
}
