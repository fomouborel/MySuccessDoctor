import type { ReactNode } from 'react';
import type { AnswerStatus, Question } from '../content/schema';
import { DISCIPLINE_LABELS } from '../content/schema';
import { sessionLabel } from '../content';
import { STATUS_LABELS, type QuestionStatus, MASTERY_LABELS, type MasteryLevel } from '../services/progress';

export const ANSWER_STATUS: Record<AnswerStatus, { label: string; cls: string; help: string }> = {
  official: { label: 'Correction officielle', cls: 'ok', help: 'Corrigé publié par l’enseignant.' },
  proposed: { label: 'Réponse proposée (archives)', cls: 'info', help: 'Réponse proposée par des étudiant·e·s dans la compilation — pas un corrigé officiel.' },
  disputed: { label: 'Réponse discutée', cls: 'warn', help: 'Les archives se contredisent ou la réponse est contestée.' },
  inferred: { label: 'Réponse déduite — à vérifier', cls: 'warn', help: 'Réponse reconstituée à partir de commentaires, à vérifier.' },
  unavailable: { label: 'Pas de réponse dans les archives', cls: '', help: 'Aucune réponse n’est proposée dans les documents.' },
};

export function AnswerStatusBadge({ status }: { status: AnswerStatus }) {
  const s = ANSWER_STATUS[status];
  return (
    <span className={`badge ${s.cls}`} title={s.help}>
      {s.label}
    </span>
  );
}

const STATUS_CLS: Record<QuestionStatus, string> = {
  new: '', 'in-progress': 'info', success: 'ok', failed: 'ko', review: 'warn', mastered: 'teal', ungraded: 'info',
};
export function StatusBadge({ status }: { status: QuestionStatus }) {
  return <span className={`badge ${STATUS_CLS[status]}`}>{STATUS_LABELS[status]}</span>;
}

const MASTERY_CLS: Record<MasteryLevel, string> = { none: '', 'to-work': 'ko', progressing: 'warn', consolidate: 'info', mastered: 'ok' };
export function MasteryBadge({ level }: { level: MasteryLevel }) {
  return <span className={`badge ${MASTERY_CLS[level]}`}>{MASTERY_LABELS[level]}</span>;
}

export function ProgressBar({ value, label, navy }: { value: number; label: string; navy?: boolean }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className={`progress${navy ? ' navy' : ''}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="card stat">
      <div className="v">{value}</div>
      <div className="l">{label}</div>
    </div>
  );
}

export function QuestionMeta({ q }: { q: Question }) {
  return (
    <div className="q-meta">
      <span className="badge navy">{sessionLabel(q.session)}</span>
      <span className="badge">
        {DISCIPLINE_LABELS[q.discipline]}
        {q.teacher ? ` · ${q.teacher}` : ''}
      </span>
      {q.formerTeacher && <span className="badge warn">Ancien titulaire</span>}
      {q.clinical && <span className="badge teal">Cas clinique</span>}
      <AnswerStatusBadge status={q.answerStatus} />
    </div>
  );
}

export function SourceLine({ q }: { q: Question }) {
  return (
    <div className="source-line">
      Source :{' '}
      {q.provenance
        .map((p) => `${FILE_LABELS[p.file]} p.${p.page}${p.originalNumber ? ` (n° ${p.originalNumber})` : ''}`)
        .join(' · ')}{' '}
      — <code>{q.id}</code>
    </div>
  );
}

export const FILE_LABELS: Record<Question['provenance'][number]['file'], string> = {
  compilation: 'Compilation DIGEST 2016-2025',
  jan2026: 'Retranscription janvier 2026',
  aug2026: 'Retranscription août 2026',
  jan2025: 'Retranscription janvier 2025',
  'qcm-nc': 'QCM par partie (non corrigés)',
  'qroc-nc': 'QROC par partie (non corrigés)',
};

export const TYPE_LABELS: Record<Question['type'], string> = {
  single: 'QCM (1 réponse)',
  multiple: 'QCM (plusieurs réponses)',
  count: '« Combien… ? »',
  truefalse: 'Vrai / Faux',
  qroc: 'QROC',
};

export function pct(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : `${Math.round(v * 100)} %`;
}

export function formatDate(ms: number | null | undefined): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function shortStem(q: Question, n = 110): string {
  const s = q.stem.replace(/\s+/g, ' ').trim();
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
