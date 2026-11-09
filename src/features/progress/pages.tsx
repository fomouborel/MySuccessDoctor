import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { chapters, questions, questionsOfChapter, questionById } from '../../content';
import { useProgress } from '../../state/ProgressContext';
import { db } from '../../services/db';
import { backupFileName, exportBackup, importBackup, parseBackup, type Backup } from '../../services/backup';
import { DAY, chapterMastery, coverage, dueQuestions } from '../../services/progress';
import { MasteryBadge, ProgressBar, Stat, formatDate, pct, shortStem } from '../../components/ui';
import { useErrorEntries } from '../revision/pages';

/* ─────────── Tableau de bord (accueil) ─────────── */
export function HomePage() {
  const { states, attempts, evaluations, lastExport, ready } = useProgress();
  const cov = coverage(questions, states);
  const graded = attempts.filter((a) => a.result !== 'ungraded');
  const ok = graded.filter((a) => a.result === 'correct').length;
  const due = dueQuestions(states);
  const errors = useErrorEntries().slice(0, 5);
  const recent = [...attempts].reverse().slice(0, 6);
  const chapterRows = chapters
    .filter((c) => c.status === 'available')
    .map((c) => ({ c, m: chapterMastery(questionsOfChapter(c.id), states, evaluations.filter((e) => e.chapterId === c.id)) }));
  const backupLate = attempts.length > 0 && (!lastExport || Date.now() - lastExport > 14 * DAY);

  if (!ready) return <p className="muted">Chargement…</p>;

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Bonjour 👋</h1>
        <p className="lead">{attempts.length === 0 ? 'Bienvenue sur DIGEST ACADEMY. Commencez par un cours, ou lancez-vous directement sur les anciens examens.' : 'Voici où vous en êtes.'}</p>
      </div>

      {attempts.length === 0 && (
        <div className="card stack">
          <h2 style={{ margin: 0 }}>Par où commencer ?</h2>
          <div className="grid grid-3">
            <Link className="btn" to="/cours/oesophage">
              📘 Parcours Œsophage
            </Link>
            <Link className="btn secondary" to="/examens">
              🗂️ Anciens examens
            </Link>
            <Link className="btn secondary" to="/cas-cliniques">
              🩺 Cas cliniques
            </Link>
          </div>
          <p className="small muted" style={{ margin: 0 }}>
            Votre progression est enregistrée automatiquement sur cet appareil. Pensez à la sauvegarder de temps en temps (rubrique « Ma progression »).
          </p>
        </div>
      )}

      {backupLate && (
        <div className="notice warn row spread">
          <span>💾 Votre dernière sauvegarde date de {lastExport ? formatDate(lastExport) : 'jamais'}. Une sauvegarde protège votre progression si le navigateur est réinitialisé.</span>
          <Link className="btn secondary small" to="/progression#sauvegarde">
            Sauvegarder
          </Link>
        </div>
      )}

      <div className="grid grid-4">
        <Stat value={`${cov.worked}/${cov.total}`} label="Questions travaillées" />
        <Stat value={pct(graded.length ? ok / graded.length : null)} label="Taux de réussite" />
        <Stat value={due.length} label="Révisions dues aujourd’hui" />
        <Stat value={cov.mastered} label="Questions maîtrisées" />
      </div>

      <div className="card">
        <div className="row spread">
          <strong>Avancement global sur les archives intégrées</strong>
          <span className="small muted">{pct(cov.total ? cov.worked / cov.total : 0)}</span>
        </div>
        <ProgressBar value={cov.total ? cov.worked / cov.total : 0} label="Avancement global" />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Maîtrise par chapitre</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Chapitre</th>
                  <th>Progression</th>
                  <th>Maîtrise</th>
                </tr>
              </thead>
              <tbody>
                {chapterRows.map(({ c, m }) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/cours/${c.id}`}>{c.title}</Link>
                    </td>
                    <td style={{ minWidth: 110 }}>
                      <ProgressBar value={m.coverage} label={c.title} /> <span className="small muted">{pct(m.coverage)}</span>
                    </td>
                    <td>
                      <MasteryBadge level={m.level} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small muted">Les autres chapitres apparaîtront ici dès leur intégration.</p>
        </div>
        <div className="card">
          <div className="row spread">
            <h2 style={{ marginTop: 0 }}>Prochaines révisions</h2>
            <Link to="/revisions" className="small">
              Tout voir
            </Link>
          </div>
          {due.length ? (
            <>
              <p>
                <strong>{due.length}</strong> question(s) à revoir aujourd’hui.
              </p>
              <Link className="btn" to="/revisions">
                Réviser maintenant
              </Link>
            </>
          ) : (
            <p className="muted">Aucune révision due aujourd’hui.</p>
          )}
          <h3>Dernières erreurs</h3>
          {errors.length === 0 ? (
            <p className="muted small">Aucune erreur enregistrée.</p>
          ) : (
            <ul className="small">
              {errors.map((e) => (
                <li key={e.q.id}>
                  <Link to={`/question/${e.q.id}`}>{shortStem(e.q, 70)}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Activité récente</h2>
        {recent.length === 0 ? (
          <p className="muted">Pas encore d’activité.</p>
        ) : (
          <ul className="small">
            {recent.map((a) => {
              const q = questionById.get(a.questionId);
              return (
                <li key={`${a.questionId}${a.date}`}>
                  {new Date(a.date).toLocaleString('fr-BE', { dateStyle: 'short', timeStyle: 'short' })} —{' '}
                  {a.result === 'correct' ? '✅' : a.result === 'incorrect' ? '❌' : a.result === 'partial' ? '🟠' : 'ℹ️'}{' '}
                  {q ? <Link to={`/question/${q.id}`}>{shortStem(q, 60)}</Link> : a.questionId}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ─────────── Ma progression + sauvegarde ─────────── */
export function ProgressPage() {
  const { states, evaluations, attempts, lastExport } = useProgress();
  const cov = coverage(questions, states);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Backup | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'ko'; text: string } | null>(null);

  const download = async () => {
    const backup = await exportBackup(db);
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backupFileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage({ kind: 'ok', text: 'Sauvegarde téléchargée. Gardez ce fichier en lieu sûr (e-mail, cloud, clé USB).' });
  };

  const onFile = async (file: File) => {
    const r = parseBackup(await file.text());
    if (!r.ok) {
      setPending(null);
      setMessage({ kind: 'ko', text: r.error });
    } else {
      setPending(r.backup);
      setMessage(null);
    }
  };

  const doImport = async (mode: 'merge' | 'replace') => {
    if (!pending) return;
    const { added } = await importBackup(db, pending, mode);
    setPending(null);
    setMessage({ kind: 'ok', text: mode === 'merge' ? `Sauvegarde fusionnée : ${added} réponse(s) ajoutée(s).` : 'Sauvegarde restaurée.' });
  };

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Ma progression</h1>
        <p className="lead">Couverture des anciens examens, maîtrise par chapitre, et sauvegarde de vos données.</p>
      </div>
      <h2>Couverture des archives</h2>
      <div className="grid grid-4">
        <Stat value={cov.total} label="Questions disponibles (occurrences)" />
        <Stat value={cov.distinctTotal} label="Questions distinctes (doublons regroupés)" />
        <Stat value={cov.worked} label="Travaillées (au moins une tentative)" />
        <Stat value={cov.remaining} label="Restantes" />
        <Stat value={cov.success} label="Réussies" />
        <Stat value={cov.failed} label="Échouées" />
        <Stat value={cov.review} label="À revoir" />
        <Stat value={cov.mastered} label="Maîtrisées" />
      </div>
      <p className="small muted">
        Une question n’est comptée « travaillée » qu’après une vraie tentative (l’avoir seulement affichée ne compte pas). {cov.ungraded} question(s) travaillée(s) n’ont pas de
        correction de référence dans les archives. ≈ 45 questions annoncées dans les retranscriptions n’ont jamais été retranscrites : elles ne sont pas comptées.
      </p>
      <div className="card">
        <ProgressBar value={cov.total ? cov.worked / cov.total : 0} label="Couverture" />
        <p className="small" style={{ marginBottom: 0 }}>
          {cov.worked === cov.total && cov.total > 0
            ? '🎉 Vous avez travaillé toutes les questions exploitables actuellement intégrées.'
            : `Encore ${cov.remaining} question(s) jamais travaillée(s).`}
        </p>
      </div>

      <h2>Maîtrise par chapitre</h2>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Chapitre</th>
              <th>Questions</th>
              <th>Couverture</th>
              <th>Réussite</th>
              <th>Évaluations</th>
              <th>Maîtrise</th>
            </tr>
          </thead>
          <tbody>
            {chapters
              .filter((c) => c.status === 'available')
              .map((c) => {
                const qs = questionsOfChapter(c.id);
                const ev = evaluations.filter((e) => e.chapterId === c.id);
                const m = chapterMastery(qs, states, ev);
                return (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/cours/${c.id}`}>{c.title}</Link>
                    </td>
                    <td>{qs.length}</td>
                    <td>{pct(m.coverage)}</td>
                    <td>{pct(m.successRate)}</td>
                    <td>{ev.length ? ev.map((e) => pct(e.score)).join(', ') : '—'}</td>
                    <td>
                      <MasteryBadge level={m.level} />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <p className="small muted">
        Règle de maîtrise : couverture ≥ 90 %, réussite ≥ 80 % sur les dernières tentatives et deux évaluations finales ≥ 80 % passées à au moins 7 jours d’écart.
      </p>

      <h2 id="sauvegarde">Sauvegarde</h2>
      <div className="card stack">
        <p style={{ margin: 0 }}>
          Votre progression ({attempts.length} réponse(s)) est enregistrée <strong>automatiquement dans ce navigateur</strong>, sur cet appareil. Elle n’est{' '}
          <strong>pas synchronisée</strong> entre plusieurs appareils : pour changer d’appareil ou de navigateur, téléchargez une sauvegarde ici, puis importez-la
          sur l’autre appareil.
        </p>
        <p className="small muted" style={{ margin: 0 }}>
          Dernière sauvegarde téléchargée : {formatDate(lastExport)}.
        </p>
        <div className="row">
          <button className="btn" type="button" onClick={() => void download()}>
            💾 Télécharger ma sauvegarde
          </button>
          <button className="btn secondary" type="button" onClick={() => fileRef.current?.click()}>
            📂 Importer une sauvegarde
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Fichier de sauvegarde"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = '';
            }}
          />
        </div>
        {pending && (
          <div className="notice">
            <p>
              Sauvegarde du <strong>{formatDate(pending.exportedAt)}</strong> : {pending.data.attempts.length} réponse(s). Que souhaitez-vous faire ?
            </p>
            <div className="row">
              <button className="btn" type="button" onClick={() => void doImport('merge')}>
                Fusionner avec mes données actuelles
              </button>
              <button className="btn danger" type="button" onClick={() => void doImport('replace')}>
                Remplacer mes données actuelles
              </button>
              <button className="btn secondary" type="button" onClick={() => setPending(null)}>
                Annuler
              </button>
            </div>
            <p className="small muted">« Remplacer » garde une copie de sécurité de vos données actuelles dans le navigateur.</p>
          </div>
        )}
        {message && <div className={`notice ${message.kind}`}>{message.text}</div>}
      </div>
    </div>
  );
}
