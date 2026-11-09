# DIGEST ACADEMY — Architecture et conception (Phase 2)

> Statut : **validé** (options B, effacement de l’historique, prototype Œsophage) — mis en œuvre en phase 3 · Prérequis : `docs/AUDIT-PHASE-1.md`
> Décision déjà prise : les sections « ancien titulaire » (Bertrand, Sokal) sont **incluses**, avec une étiquette.

---

## 1. Vue d'ensemble

```
┌──────────────── COUCHE 1 — Développement (Claude Code + GitHub) ───────────────┐
│ sources/ (PDF, NON publiés) → scripts d'extraction → content/*.json (validé)     │
│ src/ (React + TypeScript) lit content/ au build → application statique           │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │ push sur main
┌──────────────── COUCHE 2 — GitHub Actions ──────────▼───────────────────────────┐
│ checkout → npm ci → tsc → validation du contenu → tests → build → upload Pages    │
└──────────────────────────────────────┬──────────────────────────────────────────┘
┌──────────────── COUCHE 3 — GitHub Pages ────────────▼───────────────────────────┐
│ Site statique HTTPS + PWA. Progression : IndexedDB du navigateur. Export/import. │
└─────────────────────────────────────────────────────────────────────────────────┘
```

Aucun serveur, aucune base distante, aucune API d'IA à l'exécution. Tout le contenu (questions, cours, indices) est **figé dans des fichiers JSON et Markdown** versionnés.

---

## 2. Confidentialité : le compromis à trancher

### 2.1 Les faits

| Fait | Confiance |
|---|---|
| Le dépôt `fomouborel/MySuccessDoctor` est **public** (vérifié par l'API GitHub) | ✅ vérifié |
| Un site GitHub Pages est **toujours public** sur Internet, même si le dépôt est privé. Restreindre l'accès exige GitHub Enterprise Cloud | 🔶 plusieurs sources concordantes, mais la doc officielle n'a pas pu être lue depuis cette session (réseau) |
| Avec le plan **GitHub Free**, on ne peut **pas** publier Pages depuis un dépôt **privé**. Il faut un plan payant, au minimum Pro | 🔶 idem |
| Cloudflare Zero Trust (Access) a une offre **gratuite jusqu'à 50 utilisateurs**, avec connexion par code à usage unique envoyé par e-mail | 🔶 page produit Cloudflare + sources tierces |
| Pour protéger un site par Access, son domaine doit passer par Cloudflare. Pour un site GitHub Pages, il faut donc un **nom de domaine personnel** (≈ 10 €/an : **pas zéro coût**) | 🔶 à confirmer dans la doc Cloudflare |

### 2.2 Options

| Option | Coût | Simplicité | Confidentialité réelle | Écart au cahier des charges |
|---|---|---|---|---|
| **A. Dépôt public, sources retirées** : les PDF et les noms d'étudiants sortent du dépôt et de son historique. Seules les questions anonymisées sont publiées | 0 € | ★★★ | Faible : quiconque a l'URL voit les questions. La progression reste privée (elle est locale) | Aucun |
| **B. Deux dépôts** : un dépôt **privé** `digest-sources` (PDF, extraction, brouillons) et le dépôt **public** de l'application | 0 € | ★★☆ (vous créez le dépôt privé une fois, en 2 clics) | Identique à A pour le site, mais les sources ne sont jamais publiques | Aucun |
| **C. GitHub Pages + nom de domaine + Cloudflare Access** | ≈ 10 €/an (domaine) | ★☆☆ (compte Cloudflare, DNS) | **Réelle** : seule l'adresse e-mail autorisée peut entrer | Coût non nul |
| **D. Cloudflare Pages + Access** (au lieu de GitHub Pages) | 0 € annoncé | ★★☆ | Réelle | Remplace la couche 3 imposée. Gratuité sur `*.pages.dev` à confirmer |

**Ce qui est vrai dans tous les cas :**
- Les **données de progression** de l'étudiante ne quittent jamais son navigateur. Elles ne sont jamais publiques.
- **Aucun faux écran de connexion** ne sera ajouté. Un mot de passe codé dans un site statique ne protège rien.
- Les prénoms des retranscripteurs seront **supprimés** des données publiées (anonymisation).

**Recommandation : B maintenant**, avec un passage possible à C ou D plus tard sans rien réécrire. L'application est identique dans tous les scénarios, seul l'hébergement change.

**Action liée (destructive, à votre accord explicite) :** retirer le ZIP de l'**historique** du dépôt public. Cela demande une réécriture de l'historique et un `push --force`. Sans cela, il reste téléchargeable dans les anciens commits.

---

## 3. Choix techniques

| Domaine | Choix | Raison |
|---|---|---|
| Framework | **React 18 + TypeScript (strict) + Vite** | Imposé. Build statique rapide |
| Routage | **HashRouter** (`/#/examens/2025`) | Fonctionne sur GitHub Pages sans configuration serveur. Pas de 404 au rechargement |
| Chemin de base | `base: '/MySuccessDoctor/'` dans Vite, déduit automatiquement du nom du dépôt en CI | Ressources correctement chargées sur Pages |
| Style | **CSS Modules + variables CSS** (palette bleu marine, turquoise, blanc, gris clair). Pas de framework lourd | Léger, lisible, responsive avec un minimum de dépendances |
| Stockage local | **Dexie** (surcouche IndexedDB) | Requêtes simples, migrations de schéma versionnées |
| Validation du contenu | **Zod** : schémas partagés par le build, les tests et l'import de sauvegarde | Une question mal formée **bloque le déploiement** |
| Rendu des cours | Markdown (`marked` + nettoyage HTML), tableaux, schémas **Mermaid** pré-rendus en SVG au build | Contenu séparé du code. Pas de JavaScript lourd chez l'étudiante |
| PWA | `vite-plugin-pwa` : installable, fonctionne **hors ligne** après la 1re visite | Révision dans le train, sans réseau |
| Tests unitaires | **Vitest** + Testing Library + `fake-indexeddb` | Logique de score, de statuts, de répétition espacée, d'export / import |
| Tests de bout en bout | **Playwright** (Chromium, écrans bureau + mobile 390 px) | Parcours réels : répondre, se tromper, retrouver l'erreur, exporter |
| Qualité | ESLint + `tsc --noEmit` | Exécuté en CI |

---

## 4. Organisation du dépôt (application)

```
.github/workflows/deploy.yml
content/                       ← DONNÉES (aucun code d'interface)
  chapters.json                  liste des chapitres et sous-chapitres
  exams/                         une fiche par session (composition connue ou non)
    2025-01.json  2026-01.json  2026-08.json  …  undated-dewit.json …
  questions/                     une question = un objet, regroupé par source
    2025-01.json  …  nd-dewit.json …
  lessons/<chapitre>/<unité>.md  cours (front-matter : provenance, statut de relecture)
  duplicates.json                groupes de doublons
  id-registry.json               registre append-only des identifiants (jamais réutilisés)
scripts/
  validate-content.ts            vérifie schéma, unicité des ID, liens chapitre ↔ question
  build-stats.ts                 recalcule l'inventaire (rapport d'audit à jour)
src/
  app/            routes, layout, navigation
  components/     UI générique (Button, Card, ProgressRing, Badge…)
  features/
    learning/       lecteur de cours, parcours en 6 étapes
    quizzes/        moteurs par type de question + indices + correction
    clinical-cases/ cas cliniques à étapes
    exams/          banque d'anciens examens, examens blancs chronométrés
    revision/       carnet d'erreurs, répétition espacée
    progress/       tableau de bord, couverture, maîtrise
    backup/         export / import
  services/
    storage/        Dexie : schéma et migrations
    scoring/        correction par type (fonctions pures, testées)
    scheduling/     répétition espacée (fonctions pures, testées)
    mastery/        statuts et niveaux de maîtrise (fonctions pures, testées)
  content/        chargement et indexation du contenu (filtres, recherche)
  types/          types partagés (générés depuis les schémas Zod)
tests/e2e/
```

Les sources (PDF, textes extraits, scripts d'extraction) vivent **hors du dépôt public** (option B), dans `digest-sources`.

---

## 5. Modèle de données du contenu

### 5.1 Identifiants stables

Format : `DIGEST-<SESSION>-<DISCIPLINE>-<TYPE>-<NNN>`

| Partie | Valeurs |
|---|---|
| SESSION | `2026-01`, `2026-08`, `2025-01`, `2024-01`, `2023-01`, `2022-01`, `AP2015`…`AP2020` (anatomo-patho), `ND` (non daté) |
| DISCIPLINE | `GASTRO`, `HEPATO`, `CHIR`, `CHIRPED`, `PEDIA`, `RADIO`, `PHARMA`, `ANAPATH`, `CLIN` |
| TYPE | `QCM`, `QCMM` (multiple), `COMB` (combien), `VF`, `APP` (appariement), `QROC`, `CAS` |
| NNN | numéro séquentiel attribué **une fois pour toutes** |

Exemples : `DIGEST-2025-01-GASTRO-QCM-003` (Biermer, 2 fausses) · `DIGEST-ND-CHIR-CAS-012`.

**Règles d'immuabilité.** Un ID n'est **jamais** renuméroté ni réutilisé. On peut corriger une question en gardant son ID : la progression est conservée et le champ `revision` est incrémenté. Une question supprimée reste dans le registre avec `retired: true`.

### 5.2 Schéma (TypeScript, extrait)

```ts
type AnswerStatus =
  | 'official'          // correction officielle (aucune à ce jour)
  | 'proposed'          // réponse en rouge, non contestée
  | 'disputed'          // votes partagés, commentaires contraires, contradiction entre occurrences
  | 'inferred'          // déduite d'un commentaire, à vérifier
  | 'unavailable';      // aucune réponse

type QualityFlag =
  | 'incomplete-options' | 'stem-only' | 'uncertain-wording'
  | 'image-missing' | 'image-reveals-answer' | 'transcription-error-suspected';

interface Provenance {
  file: 'compilation' | 'jan2026' | 'aug2026' | 'jan2025' | 'qcm-nc' | 'qroc-nc';
  page: number;                 // page du PDF
  originalNumber?: string;      // « 21. », « 1254. »…
  section: string;              // « Janvier 2025 / Dewit », « DEWIT – Œsophage »…
}

interface BaseQuestion {
  id: string;
  revision: number;
  session: string;              // '2025-01' | 'ND' …
  discipline: Discipline;
  teacher?: string;             // 'Dewit', 'Kartheuser'…
  formerTeacher?: boolean;      // Bertrand, Sokal
  chapter: ChapterId;           // axe A (organe)
  subchapter?: string;
  tags: string[];               // 'pediatrie', 'radiologie', 'urgence'…
  difficulty: 1 | 2 | 3;        // ESTIMÉE (indiquée comme telle)
  stem: string;                 // formulation ORIGINALE conservée
  stemNote?: string;            // « formulation incertaine selon le retranscripteur »
  media?: { src: string; alt: string }[];
  answerStatus: AnswerStatus;
  quality: QualityFlag[];
  sourceComments: string[];     // débats d'étudiants utiles, anonymisés
  provenance: Provenance[];     // ≥ 1
  duplicateGroup?: string;
  explanation?: Explanation;    // contenu complémentaire, toujours étiqueté
  hints?: [string, string, string];
  lessonLinks?: string[];       // unités de cours liées
  caseId?: string; caseStep?: number;   // cas clinique à étapes
}

interface Option { key: string; text: string; expected?: boolean; justification?: string }

type Question = BaseQuestion & (
  | { type: 'single';   options: Option[] }                    // 1 bonne réponse
  | { type: 'multiple'; options: Option[]; expectedCount?: number }
  | { type: 'count';    statements: Option[]; countOf: 'true' | 'false'; choices: string[]; expectedChoice?: string }
  | { type: 'truefalse'; statements: Option[] }
  | { type: 'matching'; left: string[]; right: string[]; expectedPairs?: [number, number][] }
  | { type: 'qroc';     model?: { essentials: string[]; keywords: string[]; optional: string[]; majorErrors: string[]; exampleAnswer: string } }
);

interface Explanation {
  origin: 'archives' | 'complement';     // archives UCL ou explication ajoutée
  review: 'to-validate' | 'validated';
  text: string;
  sources?: { label: string; url?: string; verified: boolean }[];  // jamais inventées
}
```

L'**intention de la consigne** (« la fausse », « 2 vraies ») est stockée dans `expected`. Pour une consigne « la fausse », `expected` marque l'option fausse **à cocher**. L'interface affiche toujours la consigne d'origine.

---

## 6. Correction et score

| Type | Règle | Si la réponse attendue n'est pas disponible |
|---|---|---|
| Unique | Juste si l'option cochée est celle attendue | Tentative enregistrée comme **« non évaluable »**. L'interface montre les débats et invite à l'auto-évaluation |
| Multiple | Juste seulement si l'ensemble coché est exactement l'ensemble attendu. Score partiel affiché à titre indicatif (bonnes cochées, oublis, erreurs) | idem |
| Combien | Juste si le nombre choisi est le bon. Le détail affirmation par affirmation est montré quand il est connu | idem |
| Vrai / faux | Score par affirmation | idem |
| QROC | **Auto-évaluation guidée** : l'étudiante coche les éléments indispensables qu'elle a cités. Le résultat est « indicatif », jamais une note officielle | Correction indisponible, auto-évaluation libre |
| Cas clinique | Chaque étape est notée selon son type. L'étape suivante se débloque après validation | — |

Pour les statuts `disputed` et `inferred`, le résultat est affiché comme **« selon la réponse proposée (contestée) »**. Le poids d'une erreur sur ces questions est réduit dans le calcul de maîtrise.

---

## 7. Progression, statuts et maîtrise

### 7.1 Données locales (IndexedDB)

| Table | Contenu |
|---|---|
| `attempts` | une ligne par tentative : questionId, revision, réponse donnée, résultat (`correct` / `incorrect` / `partial` / `ungraded`), indices utilisés (0-3), durée, mode (entraînement / examen / révision), date |
| `questionState` | statut dérivé, boîte de révision, prochaine échéance, nombre de tentatives et d'erreurs, dernière erreur |
| `lessonProgress` | unités lues, quiz de compréhension |
| `examSessions` | examens blancs : composition, chrono, réponses, verrouillage, bilan |
| `meta` | version du schéma, date de création, dernière sauvegarde exportée |

### 7.2 Statut d'une question

| Statut | Règle |
|---|---|
| Non commencée | aucune tentative (**l'affichage ne compte pas**) |
| En cours | cas clinique ou examen commencé, pas terminé |
| Échouée | dernière tentative incorrecte |
| Réussie | dernière tentative correcte |
| À revoir | échéance de révision dépassée, ou marquée manuellement |
| Maîtrisée | ≥ 3 réussites, dont les 2 dernières consécutives, espacées d'au moins 3 jours, sans indice niveau 3 |

### 7.3 Répétition espacée (boîtes de Leitner, simple et prévisible)

Les intervalles sont de **1 → 3 → 7 → 14 → 30 jours**. Une bonne réponse fait monter la question d'une boîte. Une erreur la renvoie en boîte 1, donc elle revient le lendemain. Un indice de niveau 3 fait monter d'une boîte au maximum. Les questions « non évaluables » sont planifiées comme des réussites partielles (boîte inchangée).

### 7.4 Maîtrise d'un chapitre

| Niveau | Condition |
|---|---|
| À travailler | couverture < 30 % ou réussite < 50 % |
| En progression | couverture ≥ 30 % et réussite ≥ 50 % |
| À consolider | couverture ≥ 70 % et réussite ≥ 70 % |
| Maîtrisé | couverture ≥ 90 %, réussite ≥ 80 % sur les dernières tentatives, **et** 2 évaluations finales ≥ 80 % passées à au moins 7 jours d'écart |

« Réussite » est calculée sur la **dernière tentative de chaque question**, pour refléter le niveau actuel plutôt que l'historique.

### 7.5 Couverture des archives

On compte les questions distinctes **et** les occurrences, pour le total, les travaillées (≥ 1 tentative), les réussies, les échouées, les à revoir et les restantes. Les emplacements vides sont affichés à part (« 45 questions non retranscrites ») et sont exclus du dénominateur.

---

## 8. Sauvegarde

- **Automatique** : chaque réponse est écrite immédiatement dans IndexedDB. L'application appelle `navigator.storage.persist()` pour limiter l'effacement par le navigateur.
- **Export** : un bouton « Télécharger ma sauvegarde » produit `digest-academy-sauvegarde-AAAA-MM-JJ.json` (version du schéma, date, empreinte de contrôle, toutes les tables).
- **Import** : choix entre **fusionner** (on garde les deux historiques et on recalcule les statuts) ou **remplacer**. Le fichier est validé par Zod avant toute écriture, et une sauvegarde automatique de l'état actuel est faite avant de remplacer.
- **Rappel doux** : si la dernière sauvegarde exportée date de plus de 14 jours, le tableau de bord propose d'en faire une.
- **Limite affichée clairement** : pas de synchronisation automatique entre appareils. Pour passer d'un appareil à l'autre, on exporte puis on importe.

---

## 9. Contenu pédagogique

- **Leçons** : un fichier Markdown par unité courte. Plan type : définition → physiopathologie → clinique → examens → diagnostic différentiel → traitement → complications → à retenir, pièges, erreurs fréquentes → 3 à 5 questions de compréhension.
- **Provenance visible sur chaque bloc** :
  - 🟦 « Archives UCL » : extrait ou résumé des questions d'examen ;
  - 🟨 « Explication complémentaire — à valider » : rédigée, pas encore relue ;
  - 🟩 « Explication complémentaire — validée » : relue par vous ou par l'étudiante.
- **Aucune référence bibliographique inventée.** Une source n'est citée que si elle a été vérifiée (`verified: true`). Sinon, aucune source n'est affichée.
- **Indices (3 niveaux)** : ils sont rédigés pour chaque question d'archive dont la réponse est disponible, et étiquetés « complément ». Un test automatique vérifie qu'un indice ne contient pas le texte de la bonne réponse.

---

## 10. Chapitres (version de travail)

| ID | Chapitre | Sous-chapitres |
|---|---|---|
| `oesophage` | Œsophage | RGO et œsophagites · Troubles moteurs (achalasie, Zenker) · Barrett et cancers · Caustiques · Œsophagite à éosinophiles |
| `estomac` | Estomac et duodénum | Ulcère et Helicobacter pylori · Dyspepsie et gastroparésie · Gastrites et Biermer · Cancer gastrique · Hémorragie digestive haute · Vomissements |
| `grele` | Intestin grêle | Diarrhées et malabsorption · Maladie cœliaque · Intolérance au lactose · Résection iléale · Occlusion et iléus · Meckel et tumeurs · Saignement du grêle |
| `mici` | MICI | Crohn · RCUH · Complications et extra-digestif · Chirurgie des MICI |
| `colon` | Côlon et rectum | Cancer colorectal et dépistage · Polypes et polyposes · Diverticulose et diverticulite · Côlon irritable · Colites (infectieuse, ischémique, microscopique) |
| `procto` | Proctologie | Fissure · Abcès et fistule · Hémorroïdes · IST et ulcérations |
| `biliaire` | Voies biliaires | Lithiase · Cholécystite et angiocholite · CSP et cholangite à IgG4 · Cholangiocarcinome et cancer de la vésicule |
| `pancreas` | Pancréas | Pancréatite aiguë · Pancréatite chronique et auto-immune · Adénocarcinome · Tumeurs kystiques |
| `foie` | Foie | Tests hépatiques · Hépatites virales · Alcool et NAFLD · Surcharges (fer, cuivre) · Auto-immunité et cholestases · Cirrhose et HTP · CHC et tumeurs · Transplantation |
| `urgences` | Abdomen aigu et chirurgie générale | Appendicite · Péritonite · Rate · Réhabilitation post-opératoire |
| `pediatrie` | Pédiatrie digestive | Nourrisson (RGO, coliques, allergie) · Ictère néonatal · Diarrhées de l'enfant · Chirurgie pédiatrique (Reding) |
| `pharmaco` | Pharmacologie digestive | Antisécrétoires · Prokinétiques et antiémétiques · Laxatifs et antidiarrhéiques · Autres |
| `imagerie-anapath` | Imagerie et anatomo-pathologie | transversal (chaque question garde aussi son chapitre d'organe) |

La navigation **par examen** reste disponible en parallèle : par année, puis session, puis discipline et enseignant, puis questions dans l'ordre d'origine.

---

## 11. Workflow GitHub Actions (prêt à être ajouté en phase 3)

```yaml
name: Déploiement GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run typecheck        # tsc --noEmit
      - run: npm run validate:content # schémas + ID uniques + liens
      - run: npm test                 # Vitest
      - run: npm run build            # base = /<nom-du-dépôt>/
        env: { BASE_PATH: "/${{ github.event.repository.name }}/" }
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  e2e:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci && npx playwright install --with-deps chromium
      - run: npm run build && npm run e2e -- --trace off
        env: { BASE_PATH: "/${{ github.event.repository.name }}/" }
  deploy:
    needs: [build, e2e]
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: "${{ steps.d.outputs.page_url }}" }
    steps:
      - id: d
        uses: actions/deploy-pages@v4
```

Si une seule étape échoue (type, contenu invalide, test), **rien n'est publié** : la version en ligne reste la précédente.

**Action unique de votre côté** : dans le dépôt, *Settings → Pages → Source : « GitHub Actions »*. Je ne peux pas modifier ce réglage depuis cette session.

---

## 12. Suite (phase 3, prototype)

Un **chapitre complet** sera développé : je propose **Œsophage**, car il couvre tous les types de question (QCM simple et multiple, « combien », cas clinique de l'homme de 85 ans, QROC, radiologie de Zenker) et il est petit (≈ 60 entrées). Ce prototype comprendra :

- l'accueil et la navigation ;
- 4 à 5 unités de cours ;
- toutes les questions d'archives du chapitre, avec leurs statuts ;
- les indices et les corrections ;
- le suivi de progression, le carnet d'erreurs et l'export / import ;
- le déploiement réel sur GitHub Pages.

---

## 13. Écarts constatés lors de la phase 3

- **Pas d’ESLint** pour l’instant : TypeScript strict + tests suffisent au prototype (ajout possible plus tard).
- **Pas de schémas Mermaid** : les cours utilisent des tableaux comparatifs ; les schémas seront ajoutés en SVG si nécessaire.
- **Indice de niveau 3** : une bonne réponse obtenue après l’indice 3 ne fait **pas** monter la question de boîte (elle n’est pas considérée comme acquise) et ne compte pas pour la maîtrise.
- **« Voir la solution » sans répondre** est enregistré comme une tentative à retravailler (et non comme une question simplement affichée).
- **Statut supplémentaire « Travaillée (sans correction) »** pour les questions tentées dont les archives ne donnent aucune réponse : elles comptent dans la couverture, jamais comme justes ni fausses.
- Versions effectives : React 19, Vite 8, TypeScript 7, Vitest 5, Dexie 4, Zod 4, Playwright 1.63, Node 22 en CI.
