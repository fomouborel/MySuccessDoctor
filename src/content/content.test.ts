import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateContent } from './validate';
import { questions, chapters, caseSteps, questionsOfExam, exams } from './index';

const root = join(__dirname, '../..');

describe('contenu pédagogique', () => {
  it('passe la validation sémantique complète', () => {
    const qDir = join(root, 'content/questions');
    const questionFiles = Object.fromEntries(readdirSync(qDir).map((f) => [f, JSON.parse(readFileSync(join(qDir, f), 'utf8'))]));
    const lessonFiles = chapters.flatMap((c) => c.lessons.map((l) => l.file));
    const { errors } = validateContent({ questionFiles, chapters, exams, lessonFiles });
    expect(errors).toEqual([]);
  });
  it('les identifiants sont uniques et stables (registre)', () => {
    const ids = questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('aucune réponse « officielle » : les archives ne contiennent que des retranscriptions', () => {
    expect(questions.filter((q) => q.answerStatus === 'official')).toEqual([]);
  });
  it('les cas cliniques ont des étapes consécutives', () => {
    for (const id of new Set(questions.map((q) => q.caseId).filter(Boolean)) as Set<string>) {
      expect(caseSteps(id).map((q) => q.caseStep)).toEqual(caseSteps(id).map((_, i) => i + 1));
    }
  });
  it('chaque question est retrouvable par son examen d’origine', () => {
    const all = exams.flatMap((e) => questionsOfExam(e.id));
    expect(all.length).toBe(questions.length);
  });
  it('le chapitre Œsophage du prototype contient toutes les questions extraites (70)', () => {
    expect(questions.filter((q) => q.chapter === 'oesophage').length).toBe(70);
  });
});
