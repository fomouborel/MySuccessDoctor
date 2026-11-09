import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { Question } from '../../content/schema';
import { lessonById } from '../../content';
import { emptyAnswer, grade as gradeAnswer, isAnswered, isGradable, type Grade, type UserAnswer } from '../../services/scoring';
import { useProgress } from '../../state/ProgressContext';
import type { Mode } from '../../services/progress';
import { Markdown } from '../../components/Markdown';
import { ANSWER_STATUS, QuestionMeta, SourceLine } from '../../components/ui';

/* ─────────────── Corps de la question (contrôlé) ─────────────── */

export function QuestionBody({
  q,
  answer,
  onChange,
  grade,
  disabled,
}: {
  q: Question;
  answer: UserAnswer;
  onChange: (a: UserAnswer) => void;
  grade?: Grade | null;
  disabled?: boolean;
}) {
  const per = grade?.perKey ?? {};
  const cls = (k: string) => (grade ? (per[k] && per[k] !== 'neutral' ? ` ${per[k]}` : '') : '');

  return (
    <div>
      <p className="q-stem">{q.stem}</p>
      {q.stemNote && <div className="q-note">ℹ️ {q.stemNote}</div>}
      {q.media?.map((m) => (
        <figure className="q-media" key={m.src} style={{ margin: '0.5rem 0' }}>
          <img src={`${import.meta.env.BASE_URL}${m.src}`} alt={m.alt} loading="lazy" />
        </figure>
      ))}
      {q.quality.includes('image-missing') && <div className="notice warn small">L’image utilisée à l’examen n’est pas disponible dans les archives.</div>}

      {(q.type === 'single' || q.type === 'multiple') && answer.kind === q.type && (
        <>
          <p className="small muted" style={{ margin: '0.5rem 0 0' }}>
            {q.type === 'single' ? 'Une seule réponse.' : q.expectedCount ? `Cochez ${q.expectedCount} réponses.` : 'Plusieurs réponses possibles.'}
          </p>
          <div className="options" role={q.type === 'single' ? 'radiogroup' : 'group'}>
            {q.options.map((o) => {
              const selected = answer.kind === 'single' ? answer.key === o.key : answer.kind === 'multiple' && answer.keys.includes(o.key);
              return (
                <button
                  type="button"
                  key={o.key}
                  className={`option${selected ? ' selected' : ''}${cls(o.key)}`}
                  aria-pressed={selected}
                  disabled={disabled}
                  onClick={() => {
                    if (answer.kind === 'single') onChange({ kind: 'single', key: o.key });
                    else if (answer.kind === 'multiple')
                      onChange({ kind: 'multiple', keys: selected ? answer.keys.filter((k) => k !== o.key) : [...answer.keys, o.key] });
                  }}
                >
                  <span className={`box${q.type === 'single' ? ' round' : ''}`}>{selected ? '✓' : ''}</span>
                  <span className="k">{o.key}.</span>
                  <span style={{ flex: 1 }}>
                    {o.text}
                    {grade && o.note && (
                      <span className="option-note" style={{ display: 'block' }}>
                        {o.noteOrigin === 'complement' ? '🟨 ' : '🟦 '}
                        {o.note}
                      </span>
                    )}
                  </span>
                  {grade && per[o.key] === 'missed' && <span className="badge ok">attendue</span>}
                </button>
              );
            })}
          </div>
        </>
      )}

      {q.type === 'count' && answer.kind === 'count' && (
        <>
          <ol className="stack" style={{ paddingLeft: '1.2rem', margin: '1rem 0' }}>
            {q.statements.map((s) => (
              <li key={s.key}>
                {s.text}
                {grade && typeof s.expected === 'boolean' && (
                  <span className={`badge ${s.expected ? 'ok' : 'ko'}`} style={{ marginLeft: 8 }}>
                    {s.expected ? 'vraie' : 'fausse'}
                  </span>
                )}
                {grade && s.note && <div className="option-note">{s.noteOrigin === 'complement' ? '🟨 ' : '🟦 '}{s.note}</div>}
              </li>
            ))}
          </ol>
          <p className="small muted">
            {q.countOf === 'true' ? 'Combien de propositions sont vraies ?' : q.countOf === 'false' ? 'Combien de propositions sont fausses ?' : 'Votre réponse (selon la consigne) :'}
          </p>
          <div className="choice-row">
            {q.choices.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={answer.choice === c}
                disabled={disabled}
                onClick={() => onChange({ kind: 'count', choice: c })}
                style={grade && q.expectedChoice === c ? { borderColor: 'var(--ok)' } : undefined}
              >
                {c}
              </button>
            ))}
          </div>
        </>
      )}

      {q.type === 'truefalse' && answer.kind === 'truefalse' && (
        <div className="stack" style={{ margin: '1rem 0' }}>
          {q.statements.map((s) => (
            <div key={s.key} className={`tf-row${cls(s.key)}`}>
              <div>
                <strong>{s.key}.</strong> {s.text}
              </div>
              <div className="tf-buttons">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    aria-pressed={answer.values[s.key] === v}
                    disabled={disabled}
                    onClick={() => onChange({ kind: 'truefalse', values: { ...answer.values, [s.key]: v } })}
                  >
                    {v ? 'Vrai' : 'Faux'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {q.type === 'qroc' && answer.kind === 'qroc' && (
        <label className="field" style={{ margin: '1rem 0' }}>
          Votre réponse
          <textarea
            value={answer.text}
            disabled={disabled}
            placeholder="Rédigez votre réponse ici…"
            onChange={(e) => onChange({ ...answer, text: e.target.value })}
          />
        </label>
      )}
    </div>
  );
}

/* ─────────────── Correction détaillée ─────────────── */

export function CorrectionPanel({ q, grade, answer }: { q: Question; grade: Grade; answer: UserAnswer }) {
  const status = ANSWER_STATUS[q.answerStatus];
  const verdict =
    grade.result === 'correct'
      ? { cls: 'ok', text: '✅ Bonne réponse' }
      : grade.result === 'incorrect'
        ? { cls: 'ko', text: '❌ Réponse incorrecte' }
        : grade.result === 'partial'
          ? { cls: 'neutral', text: '🟠 Réponse partielle' }
          : { cls: 'neutral', text: 'ℹ️ Pas de correction de référence dans les archives' };
  return (
    <div className="correction stack" aria-live="polite">
      <div className={`verdict ${verdict.cls}`}>
        {verdict.text}
        {grade.score !== null && grade.result !== 'correct' && q.type !== 'single' && q.type !== 'count' && (
          <span className="small" style={{ fontWeight: 500 }}> — {Math.round(grade.score * 100)} % des éléments justes (indicatif)</span>
        )}
      </div>
      {grade.selfAssessed && <p className="small muted">Résultat issu de votre auto-évaluation : indicatif, ce n’est pas une note officielle.</p>}
      {(q.answerStatus === 'proposed' || q.answerStatus === 'disputed' || q.answerStatus === 'inferred') && q.type !== 'qroc' && (
        <div className="small">
          Réponse attendue — <span className={`badge ${status.cls}`}>{status.label}</span>
          {q.answerStatus !== 'proposed' && <span> : corrigée « selon la réponse proposée », à confirmer.</span>}
        </div>
      )}
      {q.answerNote && <div className="notice warn small">⚠️ {q.answerNote}</div>}
      {q.type === 'qroc' && answer.kind === 'qroc' && answer.text && (
        <div className="small">
          <strong>Votre réponse :</strong> {answer.text}
        </div>
      )}
      {q.type === 'qroc' && q.model && (
        <div className={`prov-box ${q.model.origin === 'archives' ? 'archives' : q.model.review === 'validated' ? 'validated' : 'complement'}`}>
          <span className="prov-tag">
            {q.model.origin === 'archives' ? '🟦 Réponse proposée dans les archives' : '🟨 Modèle de réponse complémentaire — à valider'}
          </span>
          <strong>Exemple de réponse complète :</strong>
          <p>{q.model.exampleAnswer}</p>
          {q.model.keywords.length > 0 && (
            <p className="small">
              <strong>Mots-clés :</strong> {q.model.keywords.join(', ')}
            </p>
          )}
          {q.model.optional.length > 0 && (
            <p className="small">
              <strong>Éléments facultatifs :</strong> {q.model.optional.join(' ; ')}
            </p>
          )}
          {q.model.majorErrors.length > 0 && (
            <p className="small">
              <strong>Erreurs importantes :</strong> {q.model.majorErrors.join(' ; ')}
            </p>
          )}
          <p className="small muted">D’autres formulations médicalement équivalentes sont acceptables.</p>
        </div>
      )}
      {q.explanation && (
        <div className={`prov-box ${q.explanation.origin === 'archives' ? 'archives' : q.explanation.review === 'validated' ? 'validated' : 'complement'}`}>
          <span className="prov-tag">
            {q.explanation.origin === 'archives'
              ? '🟦 Explication issue des archives'
              : q.explanation.review === 'validated'
                ? '🟩 Explication complémentaire — validée'
                : '🟨 Explication complémentaire — à valider (non issue des archives UCL)'}
          </span>
          <Markdown text={q.explanation.text} />
          {q.explanation.pitfalls && q.explanation.pitfalls.length > 0 && (
            <>
              <strong className="small">Pièges à éviter</strong>
              <ul className="small">
                {q.explanation.pitfalls.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </>
          )}
          {q.explanation.sources?.filter((s) => s.verified).map((s) => (
            <div className="small" key={s.label}>
              Source : {s.url ? <a href={s.url}>{s.label}</a> : s.label}
            </div>
          ))}
        </div>
      )}
      {q.sourceComments.length > 0 && (
        <div className="small">
          <strong>Commentaires des archives :</strong>
          <ul>
            {q.sourceComments.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      {q.lessonLinks && q.lessonLinks.length > 0 && (
        <div className="row small">
          📘 Revoir le cours :
          {q.lessonLinks.map((l) => {
            const lesson = lessonById.get(l);
            return lesson ? (
              <Link key={l} to={`/cours/${lesson.chapterId}/${l}`}>
                {lesson.title}
              </Link>
            ) : null;
          })}
        </div>
      )}
      <SourceLine q={q} />
    </div>
  );
}

/* ─────────────── Question en mode entraînement (avec indices et enregistrement) ─────────────── */

export function PracticeQuestion({
  q,
  mode,
  allowHints = true,
  onDone,
  context,
}: {
  q: Question;
  mode: Mode;
  allowHints?: boolean;
  onDone?: (g: Grade) => void;
  context?: React.ReactNode;
}) {
  const { recordAttempt, setFlag, flags } = useProgress();
  const [answer, setAnswer] = useState<UserAnswer>(() => emptyAnswer(q));
  const [hints, setHints] = useState(0);
  const [phase, setPhase] = useState<'answering' | 'self-eval' | 'done'>('answering');
  const [result, setResult] = useState<Grade | null>(null);
  const started = useRef(Date.now());

  useEffect(() => {
    setAnswer(emptyAnswer(q));
    setHints(0);
    setPhase('answering');
    setResult(null);
    started.current = Date.now();
  }, [q]);

  const finish = async (g: Grade, a: UserAnswer) => {
    setResult(g);
    setPhase('done');
    await recordAttempt({
      questionId: q.id,
      revision: q.revision,
      date: Date.now(),
      mode,
      result: g.result,
      score: g.score,
      hintsUsed: Math.min(3, hints) as 0 | 1 | 2 | 3,
      answer: a,
      durationMs: Date.now() - started.current,
      selfAssessed: g.selfAssessed,
    });
    onDone?.(g);
  };

  const validate = () => {
    if (q.type === 'qroc') setPhase('self-eval');
    else void finish(gradeAnswer(q, answer), answer);
  };

  const giveUp = () => {
    const g: Grade =
      isGradable(q) || q.type === 'qroc'
        ? { result: 'incorrect', score: 0, perKey: {}, selfAssessed: false }
        : { result: 'ungraded', score: null, perKey: {}, selfAssessed: false };
    const shown = q.type === 'qroc' ? answer : emptyAnswer(q);
    if (isGradable(q)) Object.assign(g, { perKey: gradeAnswer(q, emptyAnswer(q)).perKey });
    void finish(g, shown);
  };

  const flagged = flags.has(q.id);
  const qrocAnswer = answer.kind === 'qroc' ? answer : null;

  return (
    <div className="card">
      <QuestionMeta q={q} />
      {context}
      <QuestionBody q={q} answer={answer} onChange={setAnswer} grade={phase === 'done' ? result : null} disabled={phase !== 'answering'} />

      {phase === 'answering' && allowHints && q.hints && hints > 0 && (
        <div className="stack" style={{ marginBottom: '1rem' }}>
          {q.hints.slice(0, hints).map((h, i) => (
            <div className="hint" key={h}>
              <strong>Indice {i + 1} :</strong> {h}
            </div>
          ))}
        </div>
      )}

      {phase === 'answering' && (
        <div className="row">
          <button className="btn" type="button" onClick={validate} disabled={!isAnswered(answer)}>
            Valider ma réponse
          </button>
          {allowHints && q.hints && hints < 3 && (
            <button className="btn secondary" type="button" onClick={() => setHints((h) => h + 1)}>
              💡 {hints === 0 ? 'Un indice' : `Indice ${hints + 1}/3`}
            </button>
          )}
          <button className="btn secondary" type="button" onClick={giveUp}>
            Voir la solution
          </button>
        </div>
      )}
      {phase === 'answering' && <p className="small muted">« Voir la solution » sans répondre compte comme une question à retravailler.</p>}

      {phase === 'self-eval' && qrocAnswer && (
        <QrocSelfEval
          q={q}
          answer={qrocAnswer}
          onConfirm={(a) => {
            setAnswer(a);
            void finish(gradeAnswer(q, a), a);
          }}
        />
      )}

      {phase === 'done' && result && <CorrectionPanel q={q} grade={result} answer={answer} />}

      <div className="row" style={{ marginTop: '1rem' }}>
        <button className="btn secondary small" type="button" onClick={() => void setFlag(q.id, !flagged)}>
          {flagged ? '✓ Marquée « à revoir »' : '🔖 Marquer à revoir'}
        </button>
      </div>
    </div>
  );
}

function QrocSelfEval({ q, answer, onConfirm }: { q: Question; answer: Extract<UserAnswer, { kind: 'qroc' }>; onConfirm: (a: UserAnswer) => void }) {
  const [checked, setChecked] = useState<string[]>([]);
  const model = q.type === 'qroc' ? q.model : undefined;
  return (
    <div className="correction stack">
      <div className="notice">
        <strong>Auto-évaluation.</strong> Comparez votre réponse au modèle ci-dessous, puis indiquez honnêtement ce que vous aviez.
        {q.answerStatus === 'unavailable' && ' Les archives ne contiennent pas de correction pour cette question : le modèle est une proposition complémentaire, à valider.'}
      </div>
      {model ? (
        <>
          <div className={`prov-box ${model.origin === 'archives' ? 'archives' : 'complement'}`}>
            <span className="prov-tag">{model.origin === 'archives' ? '🟦 Réponse proposée dans les archives' : '🟨 Modèle complémentaire — à valider'}</span>
            <p>{model.exampleAnswer}</p>
          </div>
          <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>Éléments indispensables : lesquels aviez-vous cités ?</legend>
            {model.essentials.map((e) => (
              <label key={e} className="option" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checked.includes(e)}
                  onChange={(ev) => setChecked((c) => (ev.target.checked ? [...c, e] : c.filter((x) => x !== e)))}
                  style={{ width: 22, height: 22 }}
                />
                <span>{e}</span>
              </label>
            ))}
          </fieldset>
          <button className="btn" type="button" onClick={() => onConfirm({ ...answer, checked })}>
            Confirmer mon auto-évaluation
          </button>
        </>
      ) : (
        <div className="row">
          {(['correct', 'partial', 'incorrect'] as const).map((v) => (
            <button key={v} className="btn secondary" type="button" onClick={() => onConfirm({ ...answer, selfVerdict: v })}>
              {v === 'correct' ? 'J’avais juste' : v === 'partial' ? 'Partiellement' : 'J’avais faux'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
