import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { exams, questions, questionsOfExam, questionById, caseSteps, chapters, sessionLabel } from '../../content';

const availableChapters = () => chapters.filter((c) => c.status === 'available').map((c) => c.title).join(', ');
import type { Question } from '../../content/schema';
import { DISCIPLINE_LABELS } from '../../content/schema';
import { useProgress } from '../../state/ProgressContext';
import { db, type ExamSession } from '../../services/db';
import { emptyAnswer, grade, isAnswered, type Grade, type UserAnswer } from '../../services/scoring';
import { Filters, applyFilters, useFilters } from '../quizzes/Filters';
import { QuestionList, useStartSession } from '../quizzes/pages';
import { keepCasesTogether, shuffle } from '../quizzes/session';
import { QuestionBody, CorrectionPanel } from '../quizzes/QuestionView';
import { ProgressBar, QuestionMeta, pct, formatDate, shortStem } from '../../components/ui';
import { coverage } from '../../services/progress';

/* ─────────── Anciens examens ─────────── */
export function ExamsPage() {
  const [tab, setTab] = useState<'exam' | 'bank'>('exam');
  const { states } = useProgress();
  const [f, setF] = useFilters();
  const filtered = useMemo(() => applyFilters(questions, f, states), [f, states]);
  const cov = coverage(questions, states);
  const start = useStartSession();

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Anciens examens</h1>
        <p className="lead">Toutes les questions retranscrites, retrouvables par examen d’origine ou par thème.</p>
      </div>
      <div className="card">
        <div className="row spread">
          <strong>Couverture des archives intégrées</strong>
          <span className="small muted">
            {cov.worked}/{cov.total} travaillées · {cov.distinctWorked}/{cov.distinctTotal} questions distinctes
          </span>
        </div>
        <ProgressBar value={cov.total ? cov.worked / cov.total : 0} label="Couverture des archives" />
        <p className="small muted" style={{ marginBottom: 0 }}>
          Intégration progressive : {questions.length} questions intégrées à ce jour (chapitres : {availableChapters()}) sur ≈ 661 dans les archives.
        </p>
      </div>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'exam'} onClick={() => setTab('exam')}>
          Par examen
        </button>
        <button role="tab" aria-selected={tab === 'bank'} onClick={() => setTab('bank')}>
          Banque complète (filtres)
        </button>
      </div>
      {tab === 'exam' ? (
        <div className="grid grid-2">
          {exams.map((e) => {
            const qs = questionsOfExam(e.id);
            const c = coverage(qs, states);
            return (
              <Link key={e.id} to={`/examens/${e.id}`} className="card chapter-card">
                <div className="row spread">
                  <h3 style={{ margin: 0 }}>{e.title}</h3>
                  <span className="badge">{qs.length} q.</span>
                </div>
                {e.format && <span className="small muted">{e.format}</span>}
                <ProgressBar value={c.total ? c.worked / c.total : 0} label={`Couverture ${e.title}`} />
                <span className="small muted">
                  {c.worked}/{c.total} travaillées{e.missingSlots.length ? ` · ${e.missingSlots.length} question(s) non retranscrite(s)` : ''}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <>
          <Filters value={f} onChange={setF} />
          <div className="row spread">
            <h2 style={{ margin: 0 }}>{filtered.length} question(s)</h2>
            <button
              className="btn"
              type="button"
              disabled={!filtered.length}
              onClick={() => start({ ids: keepCasesTogether(filtered, questions).map((q) => q.id), mode: 'practice', title: 'Anciens examens — sélection', allowHints: true, backTo: '/examens' })}
            >
              S’entraîner sur cette sélection
            </button>
          </div>
          <QuestionList qs={filtered} />
        </>
      )}
    </div>
  );
}

export function ExamDetailPage() {
  const { examId = '' } = useParams();
  const exam = exams.find((e) => e.id === examId);
  const qs = useMemo(() => questionsOfExam(examId), [examId]);
  const start = useStartSession();
  const navigate = useNavigate();
  if (!exam) return <div className="card empty">Examen introuvable.</div>;
  const byDisc = Object.entries(
    qs.reduce<Record<string, Question[]>>((acc, q) => ((acc[q.discipline] = [...(acc[q.discipline] ?? []), q]), acc), {}),
  );
  return (
    <div className="stack">
      <Link to="/examens" className="small">
        ← Anciens examens
      </Link>
      <div className="page-head">
        <h1>{exam.title}</h1>
        <p className="lead">
          {[exam.duration, exam.format].filter(Boolean).join(' · ') || 'Format non documenté dans les archives.'}
        </p>
      </div>
      {exam.compositionKnown && exam.composition ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Composition annoncée dans la retranscription</h3>
          <ul>
            {exam.composition.map((c) => (
              <li key={`${c.discipline}${c.teacher}`}>
                {DISCIPLINE_LABELS[c.discipline]}
                {c.teacher ? ` (${c.teacher})` : ''} : {c.announced}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="notice warn small">La composition officielle de cette session n’est pas connue : elle n’est pas reconstituée.</div>
      )}
      {exam.notes.map((n) => (
        <div key={n} className="notice small">
          {n}
        </div>
      ))}
      {exam.missingSlots.length > 0 && (
        <details className="card">
          <summary>
            <strong>{exam.missingSlots.length} question(s) non retranscrite(s)</strong> — absentes des archives
          </summary>
          <ul className="small">
            {exam.missingSlots.map((m) => (
              <li key={m.originalNumber}>
                n° {m.originalNumber} : {m.note}
              </li>
            ))}
          </ul>
        </details>
      )}
      <div className="notice small">
        Intégration progressive : seules les questions des chapitres déjà disponibles ({availableChapters()}) sont reprises pour cette session ({qs.length}). Les autres seront ajoutées au fur et à mesure.
      </div>
      <div className="row">
        <button
          className="btn"
          type="button"
          disabled={!qs.length}
          onClick={() => start({ ids: keepCasesTogether(qs, questions).map((q) => q.id), mode: 'practice', title: exam.title, allowHints: true, backTo: `/examens/${examId}` })}
        >
          S’entraîner sur cet examen
        </button>
        <button className="btn secondary" type="button" disabled={!qs.length} onClick={() => navigate(`/examens-blancs?session=${examId}`)}>
          En faire un examen blanc
        </button>
      </div>
      {byDisc.map(([d, list]) => (
        <section key={d}>
          <h2>{DISCIPLINE_LABELS[d as keyof typeof DISCIPLINE_LABELS]}</h2>
          <QuestionList qs={list} />
        </section>
      ))}
    </div>
  );
}

/* ─────────── Cas cliniques ─────────── */
export function CasesPage() {
  const start = useStartSession();
  const { states } = useProgress();
  const multi = [...new Set(questions.map((q) => q.caseId).filter(Boolean))] as string[];
  const vignettes = questions.filter((q) => q.clinical && !q.caseId);
  return (
    <div className="stack">
      <div className="page-head">
        <h1>Cas cliniques</h1>
        <p className="lead">Raisonnez étape par étape : chaque étape se débloque après votre réponse.</p>
      </div>
      <h2>Cas à plusieurs étapes ({multi.length})</h2>
      <div className="grid grid-2">
        {multi.map((id) => {
          const steps = caseSteps(id);
          const done = steps.filter((s) => (states.get(s.id)?.attempts ?? 0) > 0).length;
          return (
            <div key={id} className="card stack">
              <span className="badge teal" style={{ alignSelf: 'flex-start' }}>
                {steps.length} étapes · {sessionLabel(steps[0].session)}
              </span>
              <strong>{shortStem(steps[0], 140)}</strong>
              <ProgressBar value={done / steps.length} label="Étapes réalisées" />
              <button
                className="btn"
                type="button"
                onClick={() => start({ ids: steps.map((s) => s.id), mode: 'practice', title: 'Cas clinique', allowHints: true, backTo: '/cas-cliniques' })}
              >
                {done ? 'Refaire le cas' : 'Commencer le cas'}
              </button>
            </div>
          );
        })}
      </div>
      <div className="row spread">
        <h2>Vignettes cliniques ({vignettes.length})</h2>
        <button
          className="btn secondary"
          type="button"
          onClick={() => start({ ids: shuffle(vignettes).map((q) => q.id), mode: 'practice', title: 'Vignettes cliniques', allowHints: true, backTo: '/cas-cliniques' })}
        >
          Toutes, dans le désordre
        </button>
      </div>
      <QuestionList qs={vignettes} />
    </div>
  );
}

/* ─────────── Examens blancs ─────────── */
export function MockExamsPage() {
  const { exams: sessions } = useProgress();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [source, setSource] = useState(params.get('session') ?? 'mix');
  const [count, setCount] = useState(20);
  const [minutes, setMinutes] = useState(30);
  const [chapter, setChapter] = useState('');

  const create = async () => {
    let pool: Question[];
    let title: string;
    let kind: ExamSession['kind'] = 'custom';
    if (source === 'mix') {
      pool = keepCasesTogether(shuffle(questions.filter((q) => !chapter || q.chapter === chapter)).slice(0, count), questions);
      title = `Examen blanc personnalisé (${pool.length} questions)`;
    } else {
      pool = keepCasesTogether(questionsOfExam(source), questions);
      title = `Examen blanc — ${exams.find((e) => e.id === source)?.title ?? source} (partiel)`;
      kind = 'archive';
    }
    const id = `exam-${Date.now()}`;
    await db.exams.put({
      id, title, kind, sourceExamId: source === 'mix' ? undefined : source, questionIds: pool.map((q) => q.id), answers: {}, hints: {},
      startedAt: Date.now(), durationMin: minutes > 0 ? minutes : null, submittedAt: null,
    });
    navigate(`/examens-blancs/${id}`);
  };

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Examens blancs</h1>
        <p className="lead">Conditions d’examen : chronomètre, pas d’indice, correction uniquement à la fin.</p>
      </div>
      <div className="card stack">
        <h2 style={{ margin: 0 }}>Nouvel examen blanc</h2>
        <div className="grid grid-3">
          <label className="field">
            Contenu
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="mix">Personnalisé (mélange)</option>
              {exams
                .filter((e) => e.dated && questionsOfExam(e.id).length)
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    Session : {e.title}
                  </option>
                ))}
            </select>
          </label>
          {source === 'mix' && (
            <>
              <label className="field">
                Chapitre
                <select value={chapter} onChange={(e) => setChapter(e.target.value)}>
                  <option value="">Tous les chapitres disponibles</option>
                  {chapters
                    .filter((c) => c.status === 'available')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                </select>
              </label>
              <label className="field">
                Nombre de questions
                <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
                  {[10, 20, 30, 46].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label className="field">
            Durée
            <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
              <option value={0}>Sans chronomètre</option>
              {[15, 30, 45, 60, 120, 150].map((n) => (
                <option key={n} value={n}>
                  {n >= 60 ? `${Math.floor(n / 60)} h${n % 60 ? ` ${n % 60}` : ''}` : `${n} min`}
                </option>
              ))}
            </select>
          </label>
        </div>
        {source !== 'mix' && (
          <div className="notice warn small">
            Session d’archives : seules les questions déjà intégrées sont reprises. Ce n’est pas l’examen complet ; la composition officielle n’est pas inventée.
          </div>
        )}
        <button className="btn" type="button" onClick={() => void create()}>
          Commencer l’examen blanc
        </button>
      </div>
      <h2>Mes examens blancs</h2>
      {sessions.length === 0 ? (
        <div className="card empty">Aucun examen blanc pour le moment.</div>
      ) : (
        <div className="q-list">
          {sessions.map((s) => (
            <Link key={s.id} to={`/examens-blancs/${s.id}`} className="q-item">
              <span>
                <span className="t">{s.title}</span>
                <span className="small muted" style={{ display: 'block' }}>
                  {formatDate(s.startedAt)}
                </span>
              </span>
              <span className={`badge ${s.submittedAt ? 'ok' : 'warn'}`}>{s.submittedAt ? 'Terminé' : 'En cours'}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

export function MockExamRunPage() {
  const { sessionId = '' } = useParams();
  const { exams: sessions, recordAttempt } = useProgress();
  const session = sessions.find((s) => s.id === sessionId);
  const [index, setIndex] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const now = useNow(!!session && !session.submittedAt);
  const qs = useMemo(() => (session?.questionIds ?? []).map((id) => questionById.get(id)).filter(Boolean) as Question[], [session]);

  const deadline = session?.durationMin ? session.startedAt + session.durationMin * 60_000 : null;
  const remaining = deadline ? Math.max(0, deadline - now) : null;

  const submit = async () => {
    if (!session || session.submittedAt) return;
    const at = Date.now();
    await db.exams.update(session.id, { submittedAt: at });
    for (const q of qs) {
      const a = (session.answers[q.id] as UserAnswer | undefined) ?? null;
      if (!a || !isAnswered(a)) continue; // une question laissée vide n'est pas « travaillée »
      if (q.type === 'qroc') continue; // les QROC sont auto-évaluées lors de la correction
      const g = grade(q, a);
      await recordAttempt({ questionId: q.id, revision: q.revision, date: at, mode: 'exam', result: g.result, score: g.score, hintsUsed: 0, answer: a });
    }
  };

  useEffect(() => {
    if (remaining === 0 && session && !session.submittedAt) void submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  if (!session) return <div className="card empty">Examen blanc introuvable. <Link to="/examens-blancs">Retour</Link></div>;
  if (session.submittedAt) return <MockExamReport session={session} qs={qs} />;

  const q = qs[index];
  const answer = (session.answers[q.id] as UserAnswer | undefined) ?? emptyAnswer(q);
  const setAnswer = (a: UserAnswer) => void db.exams.update(session.id, { answers: { ...session.answers, [q.id]: a } });
  const answeredCount = qs.filter((x) => session.answers[x.id] && isAnswered(session.answers[x.id] as UserAnswer)).length;
  const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;

  return (
    <div className="stack">
      <div className="runner-head">
        <div>
          <h1 style={{ marginBottom: 0 }}>{session.title}</h1>
          <span className="small muted">
            Question {index + 1}/{qs.length} · {answeredCount} répondue(s) · réponses enregistrées automatiquement
          </span>
        </div>
        {remaining !== null && <span className={`timer${remaining < 5 * 60_000 ? ' low' : ''}`}>⏱ {fmt(remaining)}</span>}
      </div>
      <div className="dots" aria-label="Navigation entre les questions">
        {qs.map((x, i) => (
          <button
            key={x.id}
            type="button"
            className={`${session.answers[x.id] && isAnswered(session.answers[x.id] as UserAnswer) ? 'answered' : ''}${i === index ? ' current' : ''}`}
            onClick={() => setIndex(i)}
            aria-label={`Question ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className="card">
        <QuestionMeta q={q} />
        {q.caseId && (q.caseStep ?? 1) > 1 && <div className="q-note">Cas clinique — étape {q.caseStep} (suite de la question précédente).</div>}
        <QuestionBody q={q} answer={answer} onChange={setAnswer} />
      </div>
      <div className="row spread">
        <button className="btn secondary" type="button" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          ← Précédente
        </button>
        {index + 1 < qs.length ? (
          <button className="btn navy" type="button" onClick={() => setIndex((i) => i + 1)}>
            Suivante →
          </button>
        ) : (
          <button className="btn" type="button" onClick={() => setConfirming(true)}>
            Terminer l’examen
          </button>
        )}
      </div>
      <button className="btn secondary small" type="button" onClick={() => setConfirming(true)} style={{ alignSelf: 'flex-start' }}>
        Rendre ma copie maintenant
      </button>
      {confirming && (
        <div className="card notice warn" role="dialog" aria-modal="true">
          <p>
            <strong>Valider définitivement ?</strong> {qs.length - answeredCount} question(s) sans réponse. Après validation, vous ne pourrez plus modifier vos réponses.
          </p>
          <div className="row">
            <button className="btn" type="button" onClick={() => void submit()}>
              Oui, rendre ma copie
            </button>
            <button className="btn secondary" type="button" onClick={() => setConfirming(false)}>
              Continuer l’examen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MockExamReport({ session, qs }: { session: ExamSession; qs: Question[] }) {
  const { recordAttempt, attempts } = useProgress();
  const results = qs.map((q) => {
    const a = session.answers[q.id] as UserAnswer | undefined;
    const answered = !!a && isAnswered(a);
    const g: Grade | null = answered && q.type !== 'qroc' ? grade(q, a!) : null;
    return { q, a: a ?? emptyAnswer(q), answered, g };
  });
  const graded = results.filter((r) => r.g && r.g.result !== 'ungraded');
  const ok = graded.filter((r) => r.g!.result === 'correct').length;
  const qrocs = results.filter((r) => r.q.type === 'qroc');
  const selfDone = (id: string) => attempts.some((x) => x.questionId === id && x.mode === 'exam' && x.date >= (session.submittedAt ?? 0));
  const durationMin = Math.round(((session.submittedAt ?? 0) - session.startedAt) / 60000);

  return (
    <div className="stack">
      <Link to="/examens-blancs" className="small">
        ← Examens blancs
      </Link>
      <div className="page-head">
        <h1>Bilan — {session.title}</h1>
        <p className="lead">
          Rendu le {formatDate(session.submittedAt)} · {durationMin} min
        </p>
      </div>
      <div className="grid grid-4">
        <div className="card stat"><div className="v">{graded.length ? pct(ok / graded.length) : '—'}</div><div className="l">Réussite (QCM corrigés)</div></div>
        <div className="card stat"><div className="v">{ok}/{graded.length}</div><div className="l">Bonnes réponses</div></div>
        <div className="card stat"><div className="v">{results.filter((r) => !r.answered).length}</div><div className="l">Sans réponse</div></div>
        <div className="card stat"><div className="v">{results.filter((r) => r.g?.result === 'ungraded').length + qrocs.length}</div><div className="l">Sans correction automatique</div></div>
      </div>
      <p className="small muted">
        Les questions sans réponse de référence ne comptent ni comme justes ni comme fausses. Les QROC sont à auto-évaluer ci-dessous (résultat indicatif).
      </p>
      {results.map(({ q, a, answered, g }, i) => (
        <details key={q.id} className="card" open={g?.result === 'incorrect'}>
          <summary className="row spread">
            <span>
              <strong>{i + 1}.</strong> {shortStem(q, 90)}
            </span>
            <span className={`badge ${!answered ? '' : g?.result === 'correct' ? 'ok' : g?.result === 'incorrect' ? 'ko' : 'info'}`}>
              {!answered ? 'Sans réponse' : g?.result === 'correct' ? 'Juste' : g?.result === 'incorrect' ? 'Fausse' : q.type === 'qroc' ? 'À auto-évaluer' : 'Non corrigée'}
            </span>
          </summary>
          <QuestionMeta q={q} />
          <QuestionBody q={q} answer={a} onChange={() => {}} grade={g} disabled />
          {g && <CorrectionPanel q={q} grade={g} answer={a} />}
          {q.type === 'qroc' && answered && !selfDone(q.id) && (
            <div className="row">
              <span className="small">Auto-évaluation :</span>
              {(['correct', 'partial', 'incorrect'] as const).map((v) => (
                <button
                  key={v}
                  className="btn secondary small"
                  type="button"
                  onClick={() =>
                    void recordAttempt({
                      questionId: q.id, revision: q.revision, date: Date.now(), mode: 'exam', result: v,
                      score: v === 'correct' ? 1 : v === 'partial' ? 0.5 : 0, hintsUsed: 0, answer: { ...a, selfVerdict: v }, selfAssessed: true,
                    })
                  }
                >
                  {v === 'correct' ? 'J’avais juste' : v === 'partial' ? 'Partiellement' : 'J’avais faux'}
                </button>
              ))}
            </div>
          )}
          {q.type === 'qroc' && <CorrectionPanel q={q} grade={{ result: 'ungraded', score: null, perKey: {}, selfAssessed: true }} answer={a} />}
        </details>
      ))}
    </div>
  );
}
