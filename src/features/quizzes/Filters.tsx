import { useMemo } from 'react';
import { usePersistentState } from '../../state/usePersistentState';
import { chapters, questions, sessionLabel } from '../../content';
import type { Question } from '../../content/schema';
import { DISCIPLINE_LABELS, audienceOf } from '../../content/schema';
import { STATUS_LABELS, type QuestionState, type QuestionStatus } from '../../services/progress';
import { TYPE_LABELS } from '../../components/ui';

export interface FilterValues {
  session: string;
  teacher: string;
  discipline: string;
  chapter: string;
  subchapter: string;
  type: string;
  difficulty: string;
  status: string;
  answer: string;
  clinical: string;
  audience: string;
}
export const EMPTY_FILTERS: FilterValues = { session: '', teacher: '', discipline: '', chapter: '', subchapter: '', type: '', difficulty: '', status: '', answer: '', clinical: '', audience: '' };

export function applyFilters(qs: Question[], f: FilterValues, states: Map<string, QuestionState>): Question[] {
  return qs.filter(
    (q) =>
      (!f.audience || audienceOf(q) === f.audience) &&
      (!f.session || q.session === f.session) &&
      (!f.teacher || (q.teacher ?? '—') === f.teacher) &&
      (!f.discipline || q.discipline === f.discipline) &&
      (!f.chapter || q.chapter === f.chapter) &&
      (!f.subchapter || q.subchapter === f.subchapter) &&
      (!f.type || q.type === f.type) &&
      (!f.difficulty || String(q.difficulty) === f.difficulty) &&
      (!f.status || (states.get(q.id)?.status ?? 'new') === f.status) &&
      (!f.answer || (f.answer === 'with' ? q.answerStatus !== 'unavailable' : q.answerStatus === 'unavailable')) &&
      (!f.clinical || !!q.clinical === (f.clinical === 'yes')),
  );
}

const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b, 'fr'));

/** Filtres mémorisés par page (`key`) : ils sont restaurés au retour d'une question. */
export function useFilters(key: string, initial: Partial<FilterValues> = {}) {
  return usePersistentState<FilterValues>(`filtres:${key}`, { ...EMPTY_FILTERS, ...initial });
}

export function Filters({ value, onChange, compact }: { value: FilterValues; onChange: (f: FilterValues) => void; compact?: boolean }) {
  const opts = useMemo(
    () => ({
      sessions: uniq(questions.map((q) => q.session)).sort((a, b) => (a === 'ND' ? 1 : b === 'ND' ? -1 : b.localeCompare(a))),
      teachers: uniq(questions.map((q) => q.teacher ?? '—')),
      disciplines: uniq(questions.map((q) => q.discipline)),
      types: uniq(questions.map((q) => q.type)),
    }),
    [],
  );
  const chapter = chapters.find((c) => c.id === value.chapter);
  const set = (k: keyof FilterValues) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    onChange({ ...value, [k]: e.target.value, ...(k === 'chapter' ? { subchapter: '' } : {}) });
  const active = Object.values(value).some(Boolean);

  return (
    <div className="card">
      <div className="grid grid-3">
        <label className="field">
          Chapitre
          <select aria-label="Chapitre" value={value.chapter} onChange={set('chapter')}>
            <option value="">Tous</option>
            {chapters
              .filter((c) => questions.some((q) => q.chapter === c.id))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
          </select>
        </label>
        <label className="field">
          Adulte / Pédiatrie
          <select aria-label="Adulte / Pédiatrie" value={value.audience} onChange={set('audience')}>
            <option value="">Les deux</option>
            <option value="adult">Adulte ({questions.filter((q) => audienceOf(q) === 'adult').length})</option>
            <option value="pedia">
              Pédiatrie ({questions.filter((q) => audienceOf(q) === 'pedia').length}
              {questions.some((q) => audienceOf(q) === 'pedia') ? '' : ' — chapitre à venir'})
            </option>
          </select>
        </label>
        <label className="field">
          Sous-chapitre
          <select aria-label="Sous-chapitre" value={value.subchapter} onChange={set('subchapter')} disabled={!chapter}>
            <option value="">Tous</option>
            {chapter?.subchapters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Année / session
          <select aria-label="Année / session" value={value.session} onChange={set('session')}>
            <option value="">Toutes</option>
            {opts.sessions.map((s) => (
              <option key={s} value={s}>
                {sessionLabel(s)}
              </option>
            ))}
          </select>
        </label>
        {!compact && (
          <>
            <label className="field">
              Professeur
              <select aria-label="Professeur" value={value.teacher} onChange={set('teacher')}>
                <option value="">Tous</option>
                {opts.teachers.map((t) => (
                  <option key={t} value={t}>
                    {t === '—' ? 'Non précisé' : t}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Discipline
              <select aria-label="Discipline" value={value.discipline} onChange={set('discipline')}>
                <option value="">Toutes</option>
                {opts.disciplines.map((d) => (
                  <option key={d} value={d}>
                    {DISCIPLINE_LABELS[d as keyof typeof DISCIPLINE_LABELS]}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <label className="field">
          Type de question
          <select aria-label="Type de question" value={value.type} onChange={set('type')}>
            <option value="">Tous</option>
            {opts.types.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t as Question['type']]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Difficulté (estimée)
          <select aria-label="Difficulté (estimée)" value={value.difficulty} onChange={set('difficulty')}>
            <option value="">Toutes</option>
            <option value="1">★ Facile</option>
            <option value="2">★★ Moyenne</option>
            <option value="3">★★★ Difficile</option>
          </select>
        </label>
        <label className="field">
          Mon statut
          <select aria-label="Mon statut" value={value.status} onChange={set('status')}>
            <option value="">Tous</option>
            {(Object.keys(STATUS_LABELS) as QuestionStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        {!compact && (
          <label className="field">
            Correction
            <select aria-label="Correction" value={value.answer} onChange={set('answer')}>
              <option value="">Toutes</option>
              <option value="with">Avec réponse proposée</option>
              <option value="without">Sans réponse dans les archives</option>
            </select>
          </label>
        )}
      </div>
      {active && (
        <button className="btn secondary small" type="button" style={{ marginTop: '0.75rem' }} onClick={() => onChange(EMPTY_FILTERS)}>
          Effacer les filtres
        </button>
      )}
    </div>
  );
}
