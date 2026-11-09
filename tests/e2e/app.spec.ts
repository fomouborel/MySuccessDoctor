import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const go = (page: Page, hash: string) => page.goto(`./#${hash}`);

async function openMenuIfMobile(page: Page) {
  const menu = page.getByRole('button', { name: 'Menu' });
  if (await menu.isVisible()) await menu.click();
}

test('les 9 rubriques s’ouvrent sans erreur', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await go(page, '/');
  await expect(page.getByRole('heading', { name: /Bonjour/ })).toBeVisible();
  const sections: [string, RegExp][] = [
    ['Mes cours', /Mes cours/],
    ['Entraînement', /Entraînement/],
    ['Anciens examens', /Anciens examens/],
    ['Cas cliniques', /Cas cliniques/],
    ['Examens blancs', /Examens blancs/],
    ['Mes erreurs', /Mes erreurs/],
    ['Mes révisions', /Mes révisions/],
    ['Ma progression', /Ma progression/],
  ];
  for (const [link, heading] of sections) {
    await openMenuIfMobile(page);
    await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: link }).click();
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('QCM simple : indice, réponse fausse → correction, carnet d’erreurs, compteur', async ({ page }) => {
  await go(page, '/question/DIGEST-ND-GASTRO-QCM-003'); // Barrett, réponse attendue E
  await page.getByRole('button', { name: /Un indice/ }).click();
  await expect(page.getByText('Indice 1 :')).toBeVisible();
  await page.getByRole('button', { name: /^A\. est une métaplasie/ }).click();
  await page.getByRole('button', { name: 'Valider ma réponse' }).click();
  await expect(page.getByText('❌ Réponse incorrecte')).toBeVisible();
  await expect(page.getByText(/Explication complémentaire — à valider/).first()).toBeVisible();
  await expect(page.getByText(/Compilation DIGEST 2016-2025 p\.46/)).toBeVisible();

  await go(page, '/erreurs');
  await expect(page.getByText(/A propos de l’œsophage de Barrett/)).toBeVisible();
  await go(page, '/');
  await expect(page.getByText('1/70')).toBeVisible();
});

test('QCM à réponses multiples : bonne combinaison', async ({ page }) => {
  await go(page, '/question/DIGEST-ND-GASTRO-QCMM-001');
  await page.getByRole('button', { name: /^A\. une achalasie/ }).click();
  await page.getByRole('button', { name: /^D\. les varices/ }).click();
  await page.getByRole('button', { name: 'Valider ma réponse' }).click();
  await expect(page.getByText('✅ Bonne réponse')).toBeVisible();
});

test('question sans réponse dans les archives : non évaluée, jamais comptée fausse', async ({ page }) => {
  await go(page, '/question/DIGEST-2023-01-RADIO-QCM-001');
  await expect(page.getByText('Pas de réponse dans les archives').first()).toBeVisible();
  await page.getByRole('button', { name: /^D\. OED/ }).click();
  await page.getByRole('button', { name: 'Valider ma réponse' }).click();
  await expect(page.getByText(/Pas de correction de référence/)).toBeVisible();
  await go(page, '/erreurs');
  await expect(page.getByText('Aucune erreur enregistrée pour le moment.')).toBeVisible();
});

test('QROC : rédaction puis auto-évaluation guidée', async ({ page }) => {
  await go(page, '/question/DIGEST-2026-08-GASTRO-QROC-001');
  await page.getByLabel('Votre réponse').fill('Œsophagite à éosinophiles chez un patient atopique');
  await page.getByRole('button', { name: 'Valider ma réponse' }).click();
  await expect(page.getByText('Auto-évaluation.')).toBeVisible();
  await page.getByRole('checkbox').first().check();
  await page.getByRole('button', { name: 'Confirmer mon auto-évaluation' }).click();
  await expect(page.getByText('✅ Bonne réponse')).toBeVisible();
  await expect(page.getByText(/auto-évaluation : indicatif/)).toBeVisible();
});

test('cas clinique à étapes : l’étape 2 rappelle le contexte', async ({ page }) => {
  await go(page, '/cas-cliniques');
  // Cas « perforation de l'œsophage » (3 étapes, QCM)
  await page.locator('.card', { hasText: 'emphysème cutané' }).getByRole('button', { name: 'Commencer le cas' }).click();
  await expect(page.getByText(/question 1 \/ 3/)).toBeVisible();
  await page.getByRole('button', { name: /^C\. Perforation de l’oesophage/ }).click();
  await page.getByRole('button', { name: 'Valider ma réponse' }).click();
  await expect(page.getByText('✅ Bonne réponse')).toBeVisible();
  await page.getByRole('button', { name: /Question suivante/ }).click();
  await expect(page.getByText(/Cas clinique — étape 2\//)).toBeVisible();
});

test('examen blanc : pas de correction avant la fin, puis bilan', async ({ page }) => {
  await go(page, '/examens-blancs');
  await page.getByLabel('Durée').selectOption('0');
  await page.getByRole('button', { name: 'Commencer l’examen blanc' }).click();
  await expect(page.getByText(/réponses enregistrées automatiquement/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Un indice/ })).toHaveCount(0);
  const first = page.locator('.option').first();
  if (await first.isVisible()) await first.click();
  await page.getByRole('button', { name: 'Rendre ma copie maintenant' }).click();
  await page.getByRole('button', { name: 'Oui, rendre ma copie' }).click();
  await expect(page.getByRole('heading', { name: /Bilan — Examen blanc/ })).toBeVisible();
});

test('cours : encadrés de provenance et parcours en 6 étapes', async ({ page }) => {
  await go(page, '/cours/oesophage');
  for (const s of ['1. Apprendre', '2. Vérifier ma compréhension', '3. M’entraîner', '4. Niveau examen', '5. Évaluation finale', '6. Bilan'])
    await expect(page.getByText(s, { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Commencer' }).click();
  await expect(page.getByText(/Archives UCL — ce que les examens interrogent/)).toBeVisible();
  await expect(page.getByText(/Explication complémentaire — à valider/)).toBeVisible();
  await page.getByRole('link', { name: /J’ai lu — leçon suivante/ }).click();
  await go(page, '/cours/oesophage');
  await expect(page.getByText('1/4 lues')).toBeVisible();
});

test('sauvegarde : export puis restauration dans un navigateur vierge', async ({ page, browser }) => {
  await go(page, '/question/DIGEST-ND-GASTRO-QCM-001');
  await page.getByRole('button', { name: /^A\. les varices/ }).click();
  await page.getByRole('button', { name: 'Valider ma réponse' }).click();
  await expect(page.getByText('✅ Bonne réponse')).toBeVisible();
  await go(page, '/progression');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Télécharger ma sauvegarde/ }).click()]);
  expect(download.suggestedFilename()).toMatch(/^digest-academy-sauvegarde-\d{4}-\d{2}-\d{2}\.json$/);
  const path = await download.path();
  const json = JSON.parse(readFileSync(path, 'utf8'));
  expect(json.data.attempts).toHaveLength(1);

  const fresh = await browser.newContext();
  const p2 = await fresh.newPage();
  await p2.goto(page.url().replace(/#.*/, '#/progression'));
  await p2.getByLabel('Fichier de sauvegarde').setInputFiles(path);
  await p2.getByRole('button', { name: 'Remplacer mes données actuelles' }).click();
  await expect(p2.getByText('Sauvegarde restaurée.')).toBeVisible();
  await p2.goto(page.url().replace(/#.*/, '#/'));
  await expect(p2.getByText('1/70')).toBeVisible();
  await fresh.close();
});

test('une sauvegarde invalide est refusée avec un message clair', async ({ page }) => {
  await go(page, '/progression');
  await page.getByLabel('Fichier de sauvegarde').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"nope":true}') });
  await expect(page.getByText('Ce fichier n’est pas une sauvegarde DIGEST ACADEMY valide.')).toBeVisible();
});
