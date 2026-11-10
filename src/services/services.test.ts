import { describe, expect, it, beforeEach } from 'vitest';
import { audienceOf, type Question } from '../content/schema';
import { applyFilters, EMPTY_FILTERS } from '../features/quizzes/Filters';
import { emptyAnswer, grade, isGradable } from './scoring';
import { DAY, chapterMastery, computeState, coverage, computeAllStates, dueQuestions, schedule, type Attempt } from './progress';
import { DigestDB } from './db';
import { checksum, exportBackup, importBackup, parseBackup } from './backup';

const base = {
  revision: 1, session: 'ND', discipline: 'GASTRO' as const, chapter: 'oesophage', tags: [], difficulty: 1 as const,
  stem: 'Q', quality: [], sourceComments: [], provenance: [{ file: 'compilation' as const, page: 1, section: 's' }],
};
const single: Question = {
  ...base, id: 'DIGEST-ND-GASTRO-QCM-901', type: 'single', answerStatus: 'proposed',
  options: [{ key: 'A', text: 'a' }, { key: 'B', text: 'b', expected: true }, { key: 'C', text: 'c' }],
};
const multiple: Question = {
  ...base, id: 'DIGEST-ND-GASTRO-QCMM-901', type: 'multiple', answerStatus: 'proposed', expectedCount: 2,
  options: [{ key: 'A', text: 'a', expected: true }, { key: 'B', text: 'b' }, { key: 'C', text: 'c', expected: true }, { key: 'D', text: 'd' }],
};
const unavailable: Question = { ...single, id: 'DIGEST-ND-GASTRO-QCM-902', answerStatus: 'unavailable', options: single.options.map(({ expected: _e, ...o }) => o) };
const count: Question = {
  ...base, id: 'DIGEST-ND-GASTRO-COMB-901', type: 'count', answerStatus: 'inferred', answerNote: 'x', countOf: 'true',
  choices: ['0', '1', '2'], expectedChoice: '1', statements: [{ key: '1', text: 'x', expected: true }, { key: '2', text: 'y', expected: false }],
};
const qroc: Question = {
  ...base, id: 'DIGEST-ND-GASTRO-QROC-901', type: 'qroc', answerStatus: 'unavailable',
  model: { essentials: ['e1', 'e2'], keywords: [], optional: [], majorErrors: [], exampleAnswer: 'ex', origin: 'complement', review: 'to-validate' },
};

describe('correction', () => {
  it('QCM simple : juste / faux et détail par option', () => {
    expect(grade(single, { kind: 'single', key: 'B' }).result).toBe('correct');
    const g = grade(single, { kind: 'single', key: 'A' });
    expect(g.result).toBe('incorrect');
    expect(g.perKey).toMatchObject({ A: 'wrong', B: 'missed', C: 'neutral' });
  });
  it('QCM multiple : juste seulement si l’ensemble est exact, score partiel indicatif', () => {
    expect(grade(multiple, { kind: 'multiple', keys: ['C', 'A'] }).result).toBe('correct');
    const g = grade(multiple, { kind: 'multiple', keys: ['A'] });
    expect(g.result).toBe('incorrect');
    expect(g.score).toBe(0.75);
    expect(grade(multiple, { kind: 'multiple', keys: ['A', 'B', 'C'] }).result).toBe('incorrect');
  });
  it('question sans réponse de référence : non évaluable, jamais comptée fausse', () => {
    expect(isGradable(unavailable)).toBe(false);
    expect(grade(unavailable, { kind: 'single', key: 'A' }).result).toBe('ungraded');
  });
  it('« combien » : compare le nombre choisi', () => {
    expect(grade(count, { kind: 'count', choice: '1' }).result).toBe('correct');
    expect(grade(count, { kind: 'count', choice: '2' }).result).toBe('incorrect');
  });
  it('QROC : auto-évaluation par éléments indispensables cochés', () => {
    expect(grade(qroc, { kind: 'qroc', text: 't', checked: ['e1', 'e2'] }).result).toBe('correct');
    expect(grade(qroc, { kind: 'qroc', text: 't', checked: ['e1'] }).result).toBe('partial');
    expect(grade(qroc, { kind: 'qroc', text: 't', checked: [] }).result).toBe('incorrect');
    expect(grade(qroc, emptyAnswer(qroc)).selfAssessed).toBe(true);
  });
});

const att = (questionId: string, date: number, result: Attempt['result'], hintsUsed: Attempt['hintsUsed'] = 0): Attempt => ({
  questionId, revision: 1, date, mode: 'practice', result, score: null, hintsUsed, answer: null,
});

describe('répétition espacée et statuts', () => {
  const t0 = Date.UTC(2026, 0, 1);
  it('une erreur renvoie en boîte 1 (révision le lendemain), une réussite fait monter', () => {
    expect(schedule(3, 'incorrect', 0, t0)).toEqual({ box: 1, due: t0 + DAY });
    expect(schedule(1, 'correct', 0, t0)).toEqual({ box: 2, due: t0 + 3 * DAY });
    expect(schedule(2, 'correct', 3, t0).box).toBe(2);
  });
  it('affichée mais jamais tentée = non commencée', () => {
    expect(computeState('q', []).status).toBe('new');
  });
  it('une seule bonne réponse ne suffit pas pour « maîtrisée »', () => {
    const s = computeState('q', [att('q', t0, 'correct')], { now: t0 + 1000 });
    expect(s.status).toBe('success');
  });
  it('maîtrisée : ≥ 3 réussites, les 2 dernières espacées d’au moins 3 jours, sans indice 3', () => {
    const a = [att('q', t0, 'correct'), att('q', t0 + DAY, 'correct'), att('q', t0 + 5 * DAY, 'correct')];
    expect(computeState('q', a, { now: t0 + 5 * DAY + 1 }).status).toBe('mastered');
    const b = [att('q', t0, 'correct'), att('q', t0 + DAY, 'correct'), att('q', t0 + 2 * DAY, 'correct')];
    expect(computeState('q', b, { now: t0 + 2 * DAY + 1 }).status).not.toBe('mastered');
  });
  it('échéance dépassée → à revoir ; marquage manuel → à revoir', () => {
    const a = [att('q', t0, 'incorrect')];
    expect(computeState('q', a, { now: t0 + 1000 }).status).toBe('failed');
    expect(computeState('q', a, { now: t0 + 2 * DAY }).status).toBe('review');
    expect(computeState('q', [att('q', t0, 'correct')], { now: t0 + 1, flagged: true }).status).toBe('review');
  });
  it('couverture : distingue occurrences et questions distinctes', () => {
    const qs = [{ ...single }, { ...single, id: 'X2', duplicateGroup: 'g' }, { ...single, id: 'X3', duplicateGroup: 'g' }] as Question[];
    const states = computeAllStates(qs, [att('X2', t0, 'correct')], new Set(), new Set(), t0 + 1);
    const c = coverage(qs, states);
    expect(c).toMatchObject({ total: 3, distinctTotal: 2, worked: 1, distinctWorked: 1, remaining: 2 });
  });
  it('maîtrise de chapitre : exige 2 évaluations ≥ 80 % espacées de 7 jours', () => {
    const qs = [single, multiple];
    const attempts = [att(single.id, t0, 'correct'), att(multiple.id, t0, 'correct')];
    const states = computeAllStates(qs, attempts, new Set(), new Set(), t0 + 1);
    expect(chapterMastery(qs, states, []).level).toBe('consolidate');
    const evals = [{ chapterId: 'c', date: t0, score: 0.9, questionIds: [] }, { chapterId: 'c', date: t0 + 8 * DAY, score: 0.85, questionIds: [] }];
    expect(chapterMastery(qs, states, evals).level).toBe('mastered');
  });
  it('les questions dues remontent dans la révision', () => {
    const states = computeAllStates([single], [att(single.id, t0, 'incorrect')], new Set(), new Set(), t0 + 2 * DAY);
    expect(dueQuestions(states, t0 + 2 * DAY).map((s) => s.questionId)).toEqual([single.id]);
  });
});

describe('sauvegarde', () => {
  let db: DigestDB;
  beforeEach(async () => {
    db = new DigestDB(`test-${Math.random()}`);
    await db.open();
  });

  it('export → import (remplacement) restaure les données à l’identique', async () => {
    await db.attempts.add(att('q1', 1, 'correct'));
    await db.lessons.put({ lessonId: 'l1', readAt: 5 });
    const backup = await exportBackup(db, 100);
    const text = JSON.stringify(backup);

    const other = new DigestDB(`test-${Math.random()}`);
    await other.attempts.add(att('zzz', 9, 'incorrect'));
    const parsed = parseBackup(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    await importBackup(other, parsed.backup, 'replace');
    expect((await other.attempts.toArray()).map((a) => a.questionId)).toEqual(['q1']);
    expect(await other.lessons.get('l1')).toMatchObject({ readAt: 5 });
    const snap = await other.meta.get('preImportSnapshot');
    expect(snap).toBeTruthy();
  });

  it('fusion : réunit les historiques sans doublon', async () => {
    await db.attempts.add(att('q1', 1, 'correct'));
    const backup = await exportBackup(db);
    await db.attempts.add(att('q2', 2, 'incorrect'));
    const r = await importBackup(db, backup, 'merge');
    expect(r.added).toBe(0);
    expect(await db.attempts.count()).toBe(2);
  });

  it('refuse un fichier abîmé ou étranger', async () => {
    expect(parseBackup('pas du json').ok).toBe(false);
    expect(parseBackup('{"hello":1}').ok).toBe(false);
    const backup = await exportBackup(db);
    backup.data.attempts.push(att('pirate', 1, 'correct') as never);
    expect(parseBackup(JSON.stringify(backup))).toMatchObject({ ok: false });
    expect(checksum('abc')).toHaveLength(8);
  });
});

describe('public adulte / pédiatrie', () => {
  it('une question est pédiatrique si elle est dans le chapitre Pédiatrie ou de discipline pédiatrique', () => {
    expect(audienceOf(single)).toBe('adult');
    expect(audienceOf({ ...single, chapter: 'pediatrie' })).toBe('pedia');
    expect(audienceOf({ ...single, discipline: 'CHIRPED' })).toBe('pedia');
  });
  it('le filtre Adulte / Pédiatrie sélectionne les bonnes questions', () => {
    const ped = { ...single, id: 'P1', chapter: 'pediatrie', discipline: 'PEDIA' } as Question;
    const qs = [single, ped];
    expect(applyFilters(qs, { ...EMPTY_FILTERS, audience: 'pedia' }, new Map()).map((q) => q.id)).toEqual(['P1']);
    expect(applyFilters(qs, { ...EMPTY_FILTERS, audience: 'adult' }, new Map()).map((q) => q.id)).toEqual([single.id]);
  });
});
