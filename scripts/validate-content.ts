/**
 * Valide tout le contenu pédagogique. Échoue (code 1) à la moindre erreur :
 * en CI, cela empêche le déploiement d'une question mal formée.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { validateContent } from '../src/content/validate';

const root = join(import.meta.dirname, '..');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const qDir = join(root, 'content/questions');
const questionFiles = Object.fromEntries(
  readdirSync(qDir).filter((f) => f.endsWith('.json')).map((f) => [f, JSON.parse(readFileSync(join(qDir, f), 'utf8'))]),
);
const lessonFiles = walk(join(root, 'content/lessons')).map((p) => relative(join(root, 'content/lessons'), p).replaceAll('\\', '/'));
const mediaFiles = walk(join(root, 'public')).map((p) => relative(join(root, 'public'), p).replaceAll('\\', '/'));

const { errors, warnings, questions } = validateContent({
  questionFiles,
  chapters: JSON.parse(readFileSync(join(root, 'content/chapters.json'), 'utf8')),
  exams: JSON.parse(readFileSync(join(root, 'content/exams.json'), 'utf8')),
  lessonFiles,
  mediaFiles,
});

for (const w of warnings) console.warn(`⚠️  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`❌ ${e}`);
  console.error(`\n${errors.length} erreur(s) — contenu refusé.`);
  process.exit(1);
}
const byStatus = questions.reduce<Record<string, number>>((acc, q) => ((acc[q.answerStatus] = (acc[q.answerStatus] ?? 0) + 1), acc), {});
console.log(`✅ ${questions.length} questions valides`, byStatus);
