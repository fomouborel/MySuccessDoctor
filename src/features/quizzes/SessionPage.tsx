import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { questionById, caseSteps, lessonById } from '../../content';
import type { Question } from '../../content/schema';
import type { Grade } from '../../services/scoring';
import { useProgress } from '../../state/ProgressContext';
import { PracticeQuestion } from './QuestionView';
import { loadSession } from './session';
import { ProgressBar, pct, shortStem } from '../../components/ui';

const MODE_LABEL = { practice: 'Entraînement', revision: 'Révision', evaluation: 'Évaluation finale', exam: 'Examen', 'lesson-check': 'Vérification' } as const;

export default function SessionPage() {
  const spec = useMemo(() => loadSession(), []);
  const { saveEvaluation } = useProgress();
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<string, Grade>>({});
  const saved = useRef(false);

  const qs = useMemo(() => (spec?.ids ?? []).map((id) => questionById.get(id)).filter(Boolean) as Question[], [spec]);

  if (!spec || qs.length === 0)
    return (
      <div className="card empty">
        <p>Aucune session en cours.</p>
        <Link className="btn" to="/entrainement">
          Commencer un entraînement
        </Link>
      </div>
    );

  const finished = index >= qs.length;
  const q = qs[Math.min(index, qs.length - 1)];
  const answeredCurrent = !!results[q.id];

  if (finished) {
    const graded = qs.filter((x) => results[x.id] && results[x.id].result !== 'ungraded');
    const correct = graded.filter((x) => results[x.id].result === 'correct');
    const wrong = qs.filter((x) => results[x.id] && (results[x.id].result === 'incorrect' || results[x.id].result === 'partial'));
    const ungraded = qs.filter((x) => results[x.id]?.result === 'ungraded');
    const score = graded.length ? correct.length / graded.length : null;
    if (spec.mode === 'evaluation' && spec.chapterId && !saved.current && score !== null) {
      saved.current = true;
      void saveEvaluation({ chapterId: spec.chapterId, date: Date.now(), score, questionIds: qs.map((x) => x.id) });
    }
    const lessonsToReview = [...new Set(wrong.flatMap((x) => x.lessonLinks ?? []))];
    return (
      <div className="stack">
        <div className="page-head">
          <h1>Bilan — {spec.title}</h1>
          <p className="lead">{MODE_LABEL[spec.mode]} terminé·e.</p>
        </div>
        <div className="grid grid-4">
          <div className="card stat"><div className="v">{pct(score)}</div><div className="l">Réussite (questions corrigées)</div></div>
          <div className="card stat"><div className="v">{correct.length}</div><div className="l">Bonnes réponses</div></div>
          <div className="card stat"><div className="v">{wrong.length}</div><div className="l">À retravailler</div></div>
          <div className="card stat"><div className="v">{ungraded.length}</div><div className="l">Sans correction de référence</div></div>
        </div>
        {spec.mode === 'evaluation' && (
          <div className="notice">
            Une évaluation ≥ 80 % compte pour la maîtrise du chapitre. Il en faut <strong>deux</strong>, à au moins 7 jours d’écart : une seule réussite ne suffit pas.
          </div>
        )}
        {wrong.length > 0 && (
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Erreurs à retravailler</h2>
            <div className="q-list">
              {wrong.map((x) => (
                <Link key={x.id} className="q-item" to={`/question/${x.id}`}>
                  <span className="t">{shortStem(x)}</span>
                  <span className="badge ko">{results[x.id].result === 'partial' ? 'Partielle' : 'Fausse'}</span>
                </Link>
              ))}
            </div>
            <p className="small muted">Elles reviendront automatiquement dans « Mes révisions ».</p>
          </div>
        )}
        {lessonsToReview.length > 0 && (
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Notions à revoir</h2>
            <ul>
              {lessonsToReview.map((l) => {
                const lesson = lessonById.get(l);
                return lesson ? (
                  <li key={l}>
                    <Link to={`/cours/${lesson.chapterId}/${l}`}>{lesson.title}</Link>
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        )}
        <div className="row">
          <Link className="btn" to={spec.backTo ?? '/'}>
            Continuer
          </Link>
          <Link className="btn secondary" to="/erreurs">
            Mon carnet d’erreurs
          </Link>
        </div>
      </div>
    );
  }

  const steps = q.caseId ? caseSteps(q.caseId) : [];
  const context =
    q.caseId && (q.caseStep ?? 1) > 1 ? (
      <div className="q-note">
        <strong>
          Cas clinique — étape {q.caseStep}/{steps.length}.
        </strong>{' '}
        Énoncé des étapes précédentes :
        <ul style={{ margin: '0.3rem 0 0' }}>
          {steps
            .filter((s) => (s.caseStep ?? 0) < (q.caseStep ?? 0))
            .map((s) => (
              <li key={s.id}>{s.stem}</li>
            ))}
        </ul>
      </div>
    ) : q.caseId ? (
      <div className="q-note">
        <strong>Cas clinique en {steps.length} étapes</strong> — la suite se débloque après votre réponse.
      </div>
    ) : null;

  return (
    <div>
      <div className="runner-head">
        <div>
          <h1 style={{ marginBottom: 0 }}>{spec.title}</h1>
          <span className="small muted">
            {MODE_LABEL[spec.mode]} · question {index + 1} / {qs.length}
          </span>
        </div>
        <Link className="btn secondary small" to={spec.backTo ?? '/'}>
          Quitter
        </Link>
      </div>
      <ProgressBar value={index / qs.length} label="Avancement de la session" />
      <div style={{ height: 16 }} />
      <PracticeQuestion
        key={q.id}
        q={q}
        mode={spec.mode}
        allowHints={spec.allowHints}
        context={context}
        onDone={(g) => setResults((r) => ({ ...r, [q.id]: g }))}
      />
      <div className="row" style={{ marginTop: '1rem', justifyContent: 'flex-end' }}>
        <button className="btn navy" type="button" disabled={!answeredCurrent} onClick={() => setIndex((i) => i + 1)}>
          {index + 1 < qs.length ? 'Question suivante →' : 'Voir mon bilan'}
        </button>
      </div>
    </div>
  );
}
