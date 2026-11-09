import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Rendu des cours. Les blocs « :::archives » et « :::complement » sont affichés
 * dans des encadrés distincts, pour que la provenance de chaque contenu soit visible.
 */
const BLOCK_LABELS: Record<string, string> = {
  archives: '🟦 Archives UCL — ce que les examens interrogent',
  complement: '🟨 Explication complémentaire — à valider (non issue des archives UCL)',
  validated: '🟩 Explication complémentaire — validée',
};

export function renderLesson(md: string): string {
  const parts: string[] = [];
  const re = /^:::(archives|complement|validated)\s*\n([\s\S]*?)^:::\s*$/gm;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    if (m.index > last) parts.push(marked.parse(md.slice(last, m.index), { async: false }));
    parts.push(
      `<section class="prov-box ${m[1]}"><span class="prov-tag">${BLOCK_LABELS[m[1]]}</span>${marked.parse(m[2], { async: false })}</section>`,
    );
    last = m.index + m[0].length;
  }
  if (last < md.length) parts.push(marked.parse(md.slice(last), { async: false }));
  return DOMPurify.sanitize(parts.join('\n'), { ADD_TAGS: ['details', 'summary', 'section'] });
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => DOMPurify.sanitize(marked.parse(text, { async: false })), [text]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function LessonBody({ md }: { md: string }) {
  const html = useMemo(() => renderLesson(md), [md]);
  return <article className="lesson" dangerouslySetInnerHTML={{ __html: html }} />;
}
