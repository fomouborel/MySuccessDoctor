import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { questions, questionById, caseSteps, chapters } from '../../content';
import type { Question } from '../../content/schema';
import { useProgress } from '../../state/ProgressContext';
import { PracticeQuestion } from './QuestionView';
import { Filters, applyFilters, useFilters } from './Filters';
import { keepCasesTogether, saveSession, shuffle, type SessionSpec } from './session';
import { StatusBadge, TYPE_LABELS, shortStem, AnswerStatusBadge } from '../../components/ui';

export function useStartSession() {
  const navigate = useNavigate();
  return (spec: SessionSpec) => {
    saveSession(spec);
    navigate('/session');
  };
}

export function QuestionList({ qs, limit = 200 }: { qs: Question[]; limit?: number }) {
  const { states } = useProgress();
  if (qs.length === 0) return <div className="card empty">Aucune question ne correspond.</div>;
  return (
    <div className="q-list">
      {qs.slice(0, limit).map((q) => (
        <Link key={q.id} className="q-item" to={`/question/${q.id}`}>
          <span>
            <span className="t">{shortStem(q)}</span>
            <span className="row small muted" style={{ gap: '0.4rem', marginTop: 4 }}>
              <span>{TYPE_LABELS[q.type]}</span>·<span>{'★'.repeat(q.difficulty)}</span>·<AnswerStatusBadge status={q.answerStatus} />
              {q.clinical && <span className="badge teal">Cas clinique</span>}
            </span>
          </span>
          <StatusBadge status={states.get(q.id)?.status ?? 'new'} />
        </Link>
      ))}
      {qs.length > limit && <p className="small muted">… et {qs.length - limit} autres (affinez les filtres).</p>}
    </div>
  );
}

/* ─────────── Entraînement ─────────── */
export function TrainingPage() {
  const { states } = useProgress();
  const start = useStartSession();
  const [f, setF] = useFilters();
  const [count, setCount] = useState(10);
  const [order, setOrder] = useState<'progressive' | 'random'>('progressive');
  const filtered = useMemo(() => applyFilters(questions, f, states), [f, states]);

  const launch = () => {
    const base = order === 'random' ? shuffle(filtered) : [...filtered].sort((a, b) => a.difficulty - b.difficulty);
    const picked = keepCasesTogether(base.slice(0, count), questions); // les étapes d'un cas clinique restent ensemble
    start({ ids: picked.map((q) => q.id), mode: 'practice', title: 'Entraînement', allowHints: true, backTo: '/entrainement' });
  };

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Entraînement</h1>
        <p className="lead">Choisissez un thème, puis lancez une série. Indices disponibles, correction après chaque question.</p>
      </div>
      <Filters value={f} onChange={setF} />
      <div className="card row spread">
        <div className="row">
          <label className="field" style={{ width: 160 }}>
            Nombre de questions
            <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[5, 10, 20, 40, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="field" style={{ width: 230 }}>
            Ordre
            <select value={order} onChange={(e) => setOrder(e.target.value as 'progressive' | 'random')}>
              <option value="progressive">Progressif (facile → difficile)</option>
              <option value="random">Aléatoire</option>
            </select>
          </label>
        </div>
        <button className="btn" type="button" disabled={filtered.length === 0} onClick={launch}>
          Commencer ({Math.min(count, filtered.length)} question{Math.min(count, filtered.length) > 1 ? 's' : ''})
        </button>
      </div>
      <h2>{filtered.length} question(s) disponible(s)</h2>
      <QuestionList qs={filtered} />
    </div>
  );
}

/* ─────────── Question isolée ─────────── */
export function QuestionPage() {
  const { id = '' } = useParams();
  const q = questionById.get(id);
  const navigate = useNavigate();
  const { states } = useProgress();
  const [nonce, setNonce] = useState(0);
  if (!q)
    return (
      <div className="card empty">
        Question introuvable. <Link to="/examens">Retour aux anciens examens</Link>
      </div>
    );
  const st = states.get(q.id);
  const steps = q.caseId ? caseSteps(q.caseId) : [];
  const chapter = chapters.find((c) => c.id === q.chapter);
  return (
    <div className="stack">
      <div className="row spread">
        <button className="btn secondary small" type="button" onClick={() => navigate(-1)}>
          ← Retour
        </button>
        <span className="row small muted">
          {chapter?.title} · {st?.attempts ?? 0} tentative(s) <StatusBadge status={st?.status ?? 'new'} />
        </span>
      </div>
      {steps.length > 1 && (
        <div className="notice small">
          Cette question fait partie d’un cas clinique en {steps.length} étapes (étape {q.caseStep}).{' '}
          {steps.map((s) => (
            <Link key={s.id} to={`/question/${s.id}`} style={{ marginRight: 8 }}>
              Étape {s.caseStep}
            </Link>
          ))}
        </div>
      )}
      <PracticeQuestion key={`${q.id}-${nonce}`} q={q} mode="practice" />
      {(st?.attempts ?? 0) > 0 && (
        <button className="btn secondary" type="button" onClick={() => setNonce((n) => n + 1)}>
          🔁 Refaire cette question
        </button>
      )}
    </div>
  );
}
