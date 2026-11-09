import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { chapters, questionById, questions, questionsOfChapter } from '../../content';
import type { Question } from '../../content/schema';
import { useProgress } from '../../state/ProgressContext';
import { answerLabel, expectedLabel, type UserAnswer } from '../../services/scoring';
import { DAY, chapterMastery, dueQuestions, type Attempt } from '../../services/progress';
import { useStartSession } from '../quizzes/pages';
import { keepCasesTogether } from '../quizzes/session';
import { AnswerStatusBadge, StatusBadge, formatDate, shortStem, MasteryBadge } from '../../components/ui';

interface ErrorEntry {
  q: Question;
  last: Attempt;
  count: number;
  attempts: number;
}

export function useErrorEntries(): ErrorEntry[] {
  const { attempts, states } = useProgress();
  return useMemo(() => {
    const byQ = new Map<string, Attempt[]>();
    for (const a of attempts) byQ.set(a.questionId, [...(byQ.get(a.questionId) ?? []), a]);
    const out: ErrorEntry[] = [];
    for (const [id, list] of byQ) {
      const q = questionById.get(id);
      const errs = list.filter((a) => a.result === 'incorrect' || a.result === 'partial');
      if (!q || errs.length === 0) continue;
      out.push({ q, last: errs.at(-1)!, count: errs.length, attempts: list.length });
    }
    return out.sort((a, b) => b.last.date - a.last.date);
  }, [attempts, states]);
}

export function ErrorsPage() {
  const { states } = useProgress();
  const start = useStartSession();
  const entries = useErrorEntries();
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const open = entries.filter((e) => !['success', 'mastered'].includes(states.get(e.q.id)?.status ?? ''));
  const shown = filter === 'open' ? open : entries;
  const recent = open.filter((e) => e.last.date >= Date.now() - 7 * DAY);
  const recurrent = entries.filter((e) => e.count >= 2);
  const launch = (list: ErrorEntry[], title: string) =>
    start({ ids: keepCasesTogether(list.map((e) => e.q), questions).map((q) => q.id), mode: 'revision', title, allowHints: true, backTo: '/erreurs' });

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Mes erreurs</h1>
        <p className="lead">Chaque mauvaise réponse est conservée ici avec la réponse attendue et l’explication.</p>
      </div>
      <div className="grid grid-3">
        <div className="card stack">
          <strong>Erreurs récentes (7 jours)</strong>
          <span className="small muted">{recent.length} question(s)</span>
          <button className="btn" type="button" disabled={!recent.length} onClick={() => launch(recent, 'Erreurs récentes')}>
            Retravailler
          </button>
        </div>
        <div className="card stack">
          <strong>Erreurs récurrentes (≥ 2 fois)</strong>
          <span className="small muted">{recurrent.length} question(s)</span>
          <button className="btn" type="button" disabled={!recurrent.length} onClick={() => launch(recurrent, 'Erreurs récurrentes')}>
            Retravailler
          </button>
        </div>
        <div className="card stack">
          <strong>Toutes les erreurs non corrigées</strong>
          <span className="small muted">{open.length} question(s)</span>
          <button className="btn" type="button" disabled={!open.length} onClick={() => launch(open, 'Mes erreurs')}>
            Retravailler
          </button>
        </div>
      </div>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={filter === 'open'} onClick={() => setFilter('open')}>
          À corriger ({open.length})
        </button>
        <button role="tab" aria-selected={filter === 'all'} onClick={() => setFilter('all')}>
          Historique complet ({entries.length})
        </button>
      </div>
      {shown.length === 0 ? (
        <div className="card empty">{entries.length ? 'Toutes vos erreurs ont été corrigées depuis. Bravo !' : 'Aucune erreur enregistrée pour le moment.'}</div>
      ) : (
        shown.map((e) => {
          const chapter = chapters.find((c) => c.id === e.q.chapter);
          return (
            <details key={e.q.id} className="card">
              <summary className="row spread">
                <span>
                  <strong>{shortStem(e.q, 100)}</strong>
                  <span className="small muted" style={{ display: 'block' }}>
                    {chapter?.title} · dernière erreur le {formatDate(e.last.date)} · {e.count} erreur(s) / {e.attempts} tentative(s)
                  </span>
                </span>
                <StatusBadge status={states.get(e.q.id)?.status ?? 'failed'} />
              </summary>
              <div className="stack small" style={{ marginTop: '0.75rem' }}>
                <div>
                  <strong>Votre réponse :</strong> {answerLabel(e.q, e.last.answer as UserAnswer)}
                </div>
                <div>
                  <strong>Réponse attendue :</strong> {expectedLabel(e.q)} <AnswerStatusBadge status={e.q.answerStatus} />
                </div>
                {e.q.explanation && <div className="muted">{e.q.explanation.text.replace(/\*\*/g, '').slice(0, 400)}…</div>}
                <Link className="btn secondary small" to={`/question/${e.q.id}`} style={{ alignSelf: 'flex-start' }}>
                  Revoir et refaire la question
                </Link>
              </div>
            </details>
          );
        })
      )}
    </div>
  );
}

export function RevisionsPage() {
  const { states, evaluations, flags } = useProgress();
  const start = useStartSession();
  const due = dueQuestions(states);
  const flagged = [...flags].map((id) => questionById.get(id)).filter(Boolean) as Question[];
  const upcoming = [...states.values()]
    .filter((s) => s.due && s.due > Date.now() && s.lastResult !== 'ungraded' && s.status !== 'mastered')
    .sort((a, b) => (a.due ?? 0) - (b.due ?? 0));
  const weakChapters = chapters
    .filter((c) => c.status === 'available')
    .map((c) => ({ c, m: chapterMastery(questionsOfChapter(c.id), states, evaluations.filter((e) => e.chapterId === c.id)) }))
    .filter((x) => x.m.level !== 'mastered')
    .sort((a, b) => (a.m.successRate ?? 0) - (b.m.successRate ?? 0));

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Mes révisions</h1>
        <p className="lead">
          Révision espacée : une question ratée revient le lendemain ; une question réussie revient de plus en plus tard (1, 3, 7, 14 puis 30 jours).
        </p>
      </div>
      <div className="card row spread">
        <div>
          <div className="stat">
            <div className="v">{due.length}</div>
            <div className="l">question(s) à réviser aujourd’hui</div>
          </div>
        </div>
        <button
          className="btn"
          type="button"
          disabled={!due.length}
          onClick={() => start({ ids: due.slice(0, 30).map((s) => s.questionId), mode: 'revision', title: 'Révision du jour', allowHints: true, backTo: '/revisions' })}
        >
          Réviser maintenant{due.length > 30 ? ' (30 premières)' : ''}
        </button>
      </div>
      {flagged.length > 0 && (
        <div className="card row spread">
          <span>
            🔖 <strong>{flagged.length}</strong> question(s) marquée(s) « à revoir »
          </span>
          <button
            className="btn secondary"
            type="button"
            onClick={() => start({ ids: flagged.map((q) => q.id), mode: 'revision', title: 'Questions marquées à revoir', allowHints: true, backTo: '/revisions' })}
          >
            Les revoir
          </button>
        </div>
      )}
      <h2>Chapitres les moins maîtrisés</h2>
      <div className="q-list">
        {weakChapters.map(({ c, m }) => (
          <div key={c.id} className="q-item">
            <span>
              <span className="t">
                {c.icon} {c.title}
              </span>{' '}
              <MasteryBadge level={m.level} />
            </span>
            <button
              className="btn secondary small"
              type="button"
              onClick={() => {
                const qs = questionsOfChapter(c.id).filter((q) => states.get(q.id)?.status !== 'mastered' && states.get(q.id)?.status !== 'success');
                start({ ids: keepCasesTogether(qs.slice(0, 15), questions).map((q) => q.id), mode: 'revision', title: `Révision — ${c.title}`, allowHints: true, chapterId: c.id, backTo: '/revisions' });
              }}
            >
              Réviser ce chapitre
            </button>
          </div>
        ))}
      </div>
      <h2>Prochaines révisions</h2>
      {upcoming.length === 0 ? (
        <div className="card empty">Rien de planifié pour l’instant : répondez à des questions pour remplir votre calendrier.</div>
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Prévue le</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.slice(0, 20).map((s) => {
                const q = questionById.get(s.questionId)!;
                return (
                  <tr key={s.questionId}>
                    <td>
                      <Link to={`/question/${q.id}`}>{shortStem(q, 80)}</Link>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(s.due)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
