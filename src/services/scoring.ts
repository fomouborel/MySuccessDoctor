/**
 * Correction d'une réponse selon le type de question.
 * Fonctions pures : aucune dépendance à l'interface ni au stockage.
 */
import type { Question } from '../content/schema';

export type UserAnswer =
  | { kind: 'single'; key: string | null }
  | { kind: 'multiple'; keys: string[] }
  | { kind: 'count'; choice: string | null }
  | { kind: 'truefalse'; values: Record<string, boolean | null> }
  | { kind: 'qroc'; text: string; checked: string[]; selfVerdict?: 'correct' | 'partial' | 'incorrect' };

/** correct / incorrect / partial (QROC auto-évaluée) / ungraded (pas de réponse de référence) */
export type Result = 'correct' | 'incorrect' | 'partial' | 'ungraded';

export interface Grade {
  result: Result;
  /** 0..1, indicatif (affiché comme tel, jamais comme une note officielle) */
  score: number | null;
  /** Pour chaque clé : la réponse de l'étudiante était-elle juste sur ce point ? */
  perKey: Record<string, 'right' | 'wrong' | 'missed' | 'neutral'>;
  selfAssessed: boolean;
}

export function isGradable(q: Question): boolean {
  if (q.answerStatus === 'unavailable') return false;
  switch (q.type) {
    case 'single':
    case 'multiple':
      return q.options.some((o) => o.expected);
    case 'count':
      return !!q.expectedChoice;
    case 'truefalse':
      return q.statements.every((s) => typeof s.expected === 'boolean');
    case 'qroc':
      return false; // les QROC sont toujours auto-évaluées
  }
}

export function emptyAnswer(q: Question): UserAnswer {
  switch (q.type) {
    case 'single':
      return { kind: 'single', key: null };
    case 'multiple':
      return { kind: 'multiple', keys: [] };
    case 'count':
      return { kind: 'count', choice: null };
    case 'truefalse':
      return { kind: 'truefalse', values: Object.fromEntries(q.statements.map((s) => [s.key, null])) };
    case 'qroc':
      return { kind: 'qroc', text: '', checked: [] };
  }
}

export function isAnswered(a: UserAnswer): boolean {
  switch (a.kind) {
    case 'single':
      return a.key !== null;
    case 'multiple':
      return a.keys.length > 0;
    case 'count':
      return a.choice !== null;
    case 'truefalse':
      return Object.values(a.values).some((v) => v !== null);
    case 'qroc':
      return a.text.trim().length > 0;
  }
}

export function grade(q: Question, a: UserAnswer): Grade {
  const perKey: Grade['perKey'] = {};

  if (q.type === 'qroc' && a.kind === 'qroc') {
    const essentials = q.model?.essentials ?? [];
    if (a.selfVerdict) {
      const score = a.selfVerdict === 'correct' ? 1 : a.selfVerdict === 'partial' ? 0.5 : 0;
      return { result: a.selfVerdict, score, perKey, selfAssessed: true };
    }
    if (essentials.length === 0) return { result: 'ungraded', score: null, perKey, selfAssessed: true };
    const ratio = a.checked.filter((c) => essentials.includes(c)).length / essentials.length;
    const result: Result = ratio >= 1 ? 'correct' : ratio >= 0.5 ? 'partial' : 'incorrect';
    return { result, score: ratio, perKey, selfAssessed: true };
  }

  if (!isGradable(q)) return { result: 'ungraded', score: null, perKey, selfAssessed: false };

  if (q.type === 'single' && a.kind === 'single') {
    const expected = q.options.find((o) => o.expected)?.key;
    for (const o of q.options) {
      if (o.key === expected) perKey[o.key] = a.key === o.key ? 'right' : 'missed';
      else perKey[o.key] = a.key === o.key ? 'wrong' : 'neutral';
    }
    const ok = a.key === expected;
    return { result: ok ? 'correct' : 'incorrect', score: ok ? 1 : 0, perKey, selfAssessed: false };
  }

  if (q.type === 'multiple' && a.kind === 'multiple') {
    const expected = new Set(q.options.filter((o) => o.expected).map((o) => o.key));
    const chosen = new Set(a.keys);
    let right = 0;
    for (const o of q.options) {
      const e = expected.has(o.key);
      const c = chosen.has(o.key);
      perKey[o.key] = e && c ? 'right' : !e && c ? 'wrong' : e && !c ? 'missed' : 'neutral';
      if (e === c) right++;
    }
    const exact = [...expected].every((k) => chosen.has(k)) && [...chosen].every((k) => expected.has(k));
    return { result: exact ? 'correct' : 'incorrect', score: right / q.options.length, perKey, selfAssessed: false };
  }

  if (q.type === 'count' && a.kind === 'count') {
    const ok = a.choice === q.expectedChoice;
    for (const s of q.statements) perKey[s.key] = 'neutral';
    return { result: ok ? 'correct' : 'incorrect', score: ok ? 1 : 0, perKey, selfAssessed: false };
  }

  if (q.type === 'truefalse' && a.kind === 'truefalse') {
    let right = 0;
    for (const s of q.statements) {
      const v = a.values[s.key];
      perKey[s.key] = v === null || v === undefined ? 'missed' : v === s.expected ? 'right' : 'wrong';
      if (v === s.expected) right++;
    }
    const all = right === q.statements.length;
    return { result: all ? 'correct' : 'incorrect', score: right / q.statements.length, perKey, selfAssessed: false };
  }

  throw new Error(`Réponse de type ${a.kind} incompatible avec la question ${q.id} (${q.type})`);
}

/** Texte lisible de la réponse attendue (pour le carnet d'erreurs). */
export function expectedLabel(q: Question): string {
  switch (q.type) {
    case 'single':
    case 'multiple': {
      const e = q.options.filter((o) => o.expected);
      return e.length ? e.map((o) => `${o.key}. ${o.text}`).join(' · ') : 'Non disponible';
    }
    case 'count':
      return q.expectedChoice ? `${q.expectedChoice}` : 'Non disponible';
    case 'truefalse':
      return q.statements.every((s) => typeof s.expected === 'boolean')
        ? q.statements.map((s) => `${s.key} : ${s.expected ? 'vrai' : 'faux'}`).join(' · ')
        : 'Non disponible';
    case 'qroc':
      return q.model?.exampleAnswer ?? 'Non disponible';
  }
}

export function answerLabel(q: Question, a: UserAnswer): string {
  switch (a.kind) {
    case 'single': {
      const o = q.type === 'single' ? q.options.find((x) => x.key === a.key) : undefined;
      return o ? `${o.key}. ${o.text}` : '—';
    }
    case 'multiple':
      return a.keys.length ? [...a.keys].sort().join(', ') : '—';
    case 'count':
      return a.choice ?? '—';
    case 'truefalse':
      return Object.entries(a.values).map(([k, v]) => `${k} : ${v === null ? '?' : v ? 'vrai' : 'faux'}`).join(' · ');
    case 'qroc':
      return a.text.trim() || '—';
  }
}
