import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { chapters, lessonMarkdown, questionsOfChapter, questions } from '../../content';
import { useProgress } from '../../state/ProgressContext';
import { chapterMastery, coverage } from '../../services/progress';
import { LessonBody } from '../../components/Markdown';
import { MasteryBadge, ProgressBar, StatusBadge, pct, shortStem, formatDate } from '../../components/ui';
import { useStartSession } from '../quizzes/pages';
import { keepCasesTogether, shuffle } from '../quizzes/session';

export function CoursesPage() {
  const { states, evaluations, lessons } = useProgress();
  return (
    <div className="stack">
      <div className="page-head">
        <h1>Mes cours</h1>
        <p className="lead">Chaque chapitre suit un parcours en 6 étapes : apprendre, vérifier, s’entraîner, niveau examen, évaluation, bilan.</p>
      </div>
      <div className="notice small">
        Les archives ne contiennent pas de cours : les leçons sont des <strong>explications complémentaires</strong> construites à partir des questions d’examen,
        signalées « à valider » tant qu’elles n’ont pas été relues.
      </div>
      <div className="grid grid-2">
        {chapters.map((c) => {
          const qs = questionsOfChapter(c.id);
          const m = chapterMastery(qs, states, evaluations.filter((e) => e.chapterId === c.id));
          const read = c.lessons.filter((l) => lessons.some((x) => x.lessonId === l.id)).length;
          const available = c.status === 'available';
          const body = (
            <>
              <div className="row spread">
                <span className="ico" aria-hidden>
                  {c.icon}
                </span>
                {available ? <MasteryBadge level={m.level} /> : <span className="badge">Intégration en cours</span>}
              </div>
              <h3 style={{ margin: 0 }}>{c.title}</h3>
              <p className="small muted" style={{ margin: 0 }}>
                {c.short}
              </p>
              {available && (
                <>
                  <ProgressBar value={m.coverage} label={`Progression ${c.title}`} />
                  <span className="small muted">
                    {qs.length} questions · {pct(m.coverage)} travaillées · {read}/{c.lessons.length} leçons lues
                  </span>
                </>
              )}
            </>
          );
          return available ? (
            <Link key={c.id} to={`/cours/${c.id}`} className="card chapter-card">
              {body}
            </Link>
          ) : (
            <div key={c.id} className="card chapter-card disabled" aria-disabled>
              {body}
              <span className="small muted">Les questions de ce chapitre seront intégrées lors de la phase 4.</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ChapterPage() {
  const { chapterId = '' } = useParams();
  const chapter = chapters.find((c) => c.id === chapterId);
  const { states, evaluations, lessons, attempts } = useProgress();
  const start = useStartSession();
  const qs = useMemo(() => questionsOfChapter(chapterId), [chapterId]);

  if (!chapter || chapter.status !== 'available') return <div className="card empty">Ce chapitre n’est pas encore disponible.</div>;

  const evals = evaluations.filter((e) => e.chapterId === chapterId).sort((a, b) => b.date - a.date);
  const m = chapterMastery(qs, states, evals);
  const cov = coverage(qs, states);
  const lessonsRead = chapter.lessons.filter((l) => lessons.some((x) => x.lessonId === l.id)).length;
  const basics = qs.filter((q) => q.difficulty === 1 && q.answerStatus !== 'unavailable');
  const practice = qs.filter((q) => q.difficulty <= 2);
  const tried = (ids: string[]) => ids.filter((id) => (states.get(id)?.attempts ?? 0) > 0).length;
  const back = `/cours/${chapterId}`;

  const steps = [
    {
      title: '1. Apprendre',
      desc: `${chapter.lessons.length} unités de cours courtes.`,
      done: lessonsRead === chapter.lessons.length,
      progress: `${lessonsRead}/${chapter.lessons.length} lues`,
      action: (
        <Link className="btn secondary" to={`/cours/${chapterId}/${chapter.lessons.find((l) => !lessons.some((x) => x.lessonId === l.id))?.id ?? chapter.lessons[0].id}`}>
          {lessonsRead ? 'Continuer' : 'Commencer'}
        </Link>
      ),
    },
    {
      title: '2. Vérifier ma compréhension',
      desc: 'Questions fondamentales (faciles), avec indices.',
      done: basics.length > 0 && tried(basics.map((q) => q.id)) === basics.length,
      progress: `${tried(basics.map((q) => q.id))}/${basics.length}`,
      action: (
        <button
          className="btn secondary"
          type="button"
          onClick={() => start({ ids: keepCasesTogether(basics, questions).map((q) => q.id), mode: 'lesson-check', title: `${chapter.title} — vérification`, allowHints: true, chapterId, backTo: back })}
        >
          Lancer
        </button>
      ),
    },
    {
      title: '3. M’entraîner',
      desc: 'Difficulté progressive (★ puis ★★), avec indices.',
      done: tried(practice.map((q) => q.id)) >= practice.length * 0.8,
      progress: `${tried(practice.map((q) => q.id))}/${practice.length}`,
      action: (
        <button
          className="btn secondary"
          type="button"
          onClick={() => {
            const todo = practice.filter((q) => states.get(q.id)?.status !== 'mastered').sort((a, b) => a.difficulty - b.difficulty);
            start({ ids: keepCasesTogether(todo.slice(0, 12), questions).map((q) => q.id), mode: 'practice', title: `${chapter.title} — entraînement`, allowHints: true, chapterId, backTo: back });
          }}
        >
          Lancer 12 questions
        </button>
      ),
    },
    {
      title: '4. Niveau examen',
      desc: 'Toutes les questions d’archives du chapitre, dans l’ordre des examens, sans indice.',
      done: cov.worked === cov.total,
      progress: `${cov.worked}/${cov.total}`,
      action: (
        <button
          className="btn secondary"
          type="button"
          onClick={() => {
            const todo = qs.filter((q) => (states.get(q.id)?.attempts ?? 0) === 0);
            const list = todo.length ? todo : qs;
            start({ ids: keepCasesTogether(list, questions).map((q) => q.id), mode: 'practice', title: `${chapter.title} — niveau examen`, allowHints: false, chapterId, backTo: back });
          }}
        >
          {cov.worked < cov.total ? `Les ${cov.total - cov.worked} restantes` : 'Tout refaire'}
        </button>
      ),
    },
    {
      title: '5. Évaluation finale',
      desc: '15 questions mélangées (tous formats), sans indice. Il faut 2 évaluations ≥ 80 % à 7 jours d’écart pour valider le chapitre.',
      done: evals.some((e) => e.score >= 0.8),
      progress: evals.length ? `dernière : ${pct(evals[0].score)}` : 'jamais passée',
      action: (
        <button
          className="btn"
          type="button"
          onClick={() => {
            const pool = shuffle(qs.filter((q) => !q.caseId || q.caseStep === 1));
            start({ ids: keepCasesTogether(pool.slice(0, 15), questions).map((q) => q.id), mode: 'evaluation', title: `${chapter.title} — évaluation finale`, allowHints: false, chapterId, backTo: back });
          }}
        >
          Passer l’évaluation
        </button>
      ),
    },
    {
      title: '6. Bilan',
      desc: 'Score, points forts, lacunes, erreurs et questions non maîtrisées.',
      done: false,
      progress: '',
      action: (
        <a className="btn secondary" href="#bilan">
          Voir
        </a>
      ),
    },
  ];

  // Bilan par sous-chapitre
  const bySub = chapter.subchapters.map((s) => {
    const sq = qs.filter((q) => q.subchapter === s.id);
    const graded = sq.filter((q) => ['correct', 'incorrect', 'partial'].includes(states.get(q.id)?.lastResult ?? ''));
    const ok = graded.filter((q) => states.get(q.id)?.lastResult === 'correct').length;
    return { s, total: sq.length, graded: graded.length, rate: graded.length ? ok / graded.length : null };
  });
  const strengths = bySub.filter((b) => b.rate !== null && b.rate >= 0.75 && b.graded >= 3);
  const weaknesses = bySub.filter((b) => b.rate !== null && b.rate < 0.6);
  const wrong = qs.filter((q) => ['failed', 'review'].includes(states.get(q.id)?.status ?? ''));
  const notMastered = qs.filter((q) => (states.get(q.id)?.attempts ?? 0) > 0 && states.get(q.id)?.status !== 'mastered');
  const chapterAttempts = attempts.filter((a) => qs.some((q) => q.id === a.questionId)).length;

  return (
    <div className="stack">
      <div className="page-head">
        <Link to="/cours" className="small">
          ← Mes cours
        </Link>
        <div className="row spread">
          <h1>
            {chapter.icon} {chapter.title}
          </h1>
          <MasteryBadge level={m.level} />
        </div>
        <p className="lead">{chapter.short}</p>
        <ProgressBar value={m.coverage} label="Progression du chapitre" />
        <p className="small muted">
          {cov.worked}/{cov.total} questions travaillées ({cov.distinctWorked}/{cov.distinctTotal} questions distinctes) · réussite {pct(m.successRate)}
        </p>
      </div>
      <div className="card steps">
        {steps.map((s) => (
          <div key={s.title} className={`step${s.done ? ' done' : ''}`}>
            <span className="num" aria-hidden>
              {s.done ? '✓' : s.title.charAt(0)}
            </span>
            <div>
              <strong>{s.title}</strong>
              <div className="small muted">
                {s.desc} {s.progress && <span className="badge">{s.progress}</span>}
              </div>
            </div>
            {s.action}
          </div>
        ))}
      </div>

      <h2 id="bilan">Bilan du chapitre</h2>
      {chapterAttempts === 0 ? (
        <div className="card empty">Le bilan apparaîtra dès vos premières réponses.</div>
      ) : (
        <div className="grid grid-2">
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Niveau de maîtrise</h3>
            <p>
              <MasteryBadge level={m.level} /> — couverture {pct(m.coverage)}, réussite {pct(m.successRate)} (dernière tentative de chaque question).
            </p>
            <p className="small muted">
              Évaluations finales : {evals.length ? evals.map((e) => `${pct(e.score)} le ${formatDate(e.date)}`).join(' · ') : 'aucune'}.
            </p>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Par thème</h3>
            <table className="table">
              <tbody>
                {bySub.map((b) => (
                  <tr key={b.s.id}>
                    <td>{b.s.title}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{b.rate === null ? '—' : pct(b.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {strengths.length > 0 && <p className="small">💪 Points forts : {strengths.map((b) => b.s.title).join(', ')}.</p>}
            {weaknesses.length > 0 && <p className="small">🎯 À retravailler : {weaknesses.map((b) => b.s.title).join(', ')}.</p>}
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Erreurs en cours ({wrong.length})</h3>
            {wrong.length === 0 ? (
              <p className="muted">Aucune erreur en attente.</p>
            ) : (
              <ul className="small">
                {wrong.slice(0, 10).map((q) => (
                  <li key={q.id}>
                    <Link to={`/question/${q.id}`}>{shortStem(q, 80)}</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Questions d’archives non maîtrisées ({notMastered.length})</h3>
            <p className="small muted">Une question est « maîtrisée » après au moins 3 réussites, dont les 2 dernières espacées d’au moins 3 jours.</p>
            <ul className="small">
              {notMastered.slice(0, 8).map((q) => (
                <li key={q.id}>
                  <Link to={`/question/${q.id}`}>{shortStem(q, 70)}</Link> <StatusBadge status={states.get(q.id)?.status ?? 'new'} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export function LessonPage() {
  const { chapterId = '', lessonId = '' } = useParams();
  const chapter = chapters.find((c) => c.id === chapterId);
  const idx = chapter?.lessons.findIndex((l) => l.id === lessonId) ?? -1;
  const lesson = chapter?.lessons[idx];
  const md = lesson ? lessonMarkdown(lesson.file) : undefined;
  const { markLessonRead } = useProgress();
  const start = useStartSession();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [lessonId]);

  if (!chapter || !lesson || !md) return <div className="card empty">Leçon introuvable.</div>;
  const linked = questionsOfChapter(chapterId).filter((q) => q.lessonLinks?.includes(lesson.id));
  const prev = chapter.lessons[idx - 1];
  const next = chapter.lessons[idx + 1];

  return (
    <div className="stack">
      <Link to={`/cours/${chapterId}`} className="small">
        ← {chapter.title}
      </Link>
      <div className="row spread">
        <h1>{lesson.title}</h1>
        <span className="badge">≈ {lesson.minutes} min</span>
      </div>
      <div className="card">
        <LessonBody md={md} />
      </div>
      <div className="card row spread">
        <span>
          <strong>{linked.length}</strong> question(s) d’archives liées à cette leçon.
        </span>
        <div className="row">
          <button
            className="btn secondary"
            type="button"
            onClick={async () => {
              await markLessonRead(lesson.id);
              start({ ids: keepCasesTogether(linked, questions).map((q) => q.id), mode: 'practice', title: lesson.title, allowHints: true, chapterId, backTo: `/cours/${chapterId}/${lesson.id}` });
            }}
          >
            M’exercer sur cette leçon
          </button>
        </div>
      </div>
      <div className="row spread">
        {prev ? (
          <Link className="btn secondary" to={`/cours/${chapterId}/${prev.id}`} onClick={() => void markLessonRead(lesson.id)}>
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="btn" to={`/cours/${chapterId}/${next.id}`} onClick={() => void markLessonRead(lesson.id)}>
            J’ai lu — leçon suivante →
          </Link>
        ) : (
          <Link className="btn" to={`/cours/${chapterId}`} onClick={() => void markLessonRead(lesson.id)}>
            J’ai lu — retour au parcours
          </Link>
        )}
      </div>
    </div>
  );
}
