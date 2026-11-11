# Méthode de construction de l’arborescence pédagogique

> Ce document décrit **comment DIGEST ACADEMY organise ses contenus** (chapitres, sous-chapitres, leçons, questions) à partir d’archives d’examens.
> Il sert de **référence pour reproduire la même logique** dans d’autres applications de la même famille (ex. **ENDOCRINO ACADEMY**).
>
> Documents liés : `docs/AUDIT-PHASE-1.md` (audit des sources) · `docs/ARCHITECTURE-PHASE-2.md` (technique et modèle de données).

---

## 1. Principe général

Les archives fournies sont des **retranscriptions d’anciens examens**, pas des cours. L’arborescence est donc construite **à partir des questions**, et non à partir d’un plan de cours préexistant :

```
Archives (PDF)
   └─► Audit : inventaire de toutes les questions (année, enseignant, type, fiabilité)
         └─► Regroupement des questions par organe / pathologie   →  CHAPITRES
               └─► Regroupement par thème récurrent dans le chapitre →  SOUS-CHAPITRES
                     └─► Une leçon courte par grand thème            →  LEÇONS
                           └─► Chaque question est rattachée à 1 chapitre, 1 sous-chapitre,
                               1 à 2 leçons, et garde sa provenance (examen d’origine)
```

**Règle d’or : ce que les examens interrogent détermine ce que l’on enseigne.** Une leçon n’existe que si des questions d’archives la justifient. Chaque leçon commence d’ailleurs par l’encadré « Ce que les archives interrogent sur ce thème ».

---

## 2. Deux axes de navigation complémentaires

Chaque question est rangée **simultanément** sur deux axes indépendants :

| Axe | Sert à | Construit à partir de | Exemple DIGEST |
|---|---|---|---|
| **A — Chapitre / sous-chapitre** (organe, pathologie) | apprendre, s’entraîner par thème, mesurer la maîtrise | le **contenu médical** de la question | `oesophage` › `moteur` (dysphagie, achalasie, Zenker) |
| **B — Examen d’origine** (session, discipline, enseignant) | retrouver « l’examen de janvier 2025 », faire un examen blanc | la **provenance** de la question | `2025-01` · Chirurgie · Hubert |

Conséquence : une question de **radiologie** sur le diverticule de Zenker est dans le chapitre **Œsophage** (axe A), avec la discipline **Radiologie** (axe B). Radiologie, pharmacologie et anatomo-pathologie sont donc des **disciplines** (axe B) et, pour l’axe A, des **étiquettes** (`tags`), pas des chapitres d’organe.

---

## 3. Construire les CHAPITRES

### 3.1 Critères

Un chapitre correspond à **un organe ou un grand ensemble physiopathologique** que l’étudiant·e reconnaît, et qui regroupe assez de questions pour un parcours complet (repère : **≥ 30 questions** ; en dessous, fusionner avec un chapitre voisin).

### 3.2 Procédure

1. Partir de l’**inventaire** de l’audit (toutes les questions, toutes années).
2. Classer chaque question par **organe principal concerné** (et non par enseignant).
3. Compter : les ensembles trop gros (> 120 questions) sont scindés, les trop petits fusionnés.
4. Ajouter, si l’examen comporte des parties **transversales** fortes, un chapitre dédié (ex. « Pharmacologie digestive », « Abdomen aigu et chirurgie générale »).
5. Ordonner les chapitres selon la **logique anatomique** (de haut en bas pour le tube digestif), puis les chapitres transversaux.

### 3.3 Chapitres de DIGEST ACADEMY

| Ordre | `id` | Titre | Statut |
|---:|---|---|---|
| 1 | `oesophage` | Œsophage | intégré (70 questions, 4 leçons) |
| 2 | `estomac` | Estomac et duodénum | intégré (51 questions, 5 leçons) |
| 3 | `grele` | Intestin grêle | intégré (49 questions, 5 leçons) |
| 4 | `mici` | MICI | intégré (44 questions, 5 leçons) |
| 5 | `colon` | Côlon et rectum | à intégrer |
| 6 | `procto` | Proctologie | à intégrer |
| 7 | `biliaire` | Voies biliaires | à intégrer |
| 8 | `pancreas` | Pancréas | à intégrer |
| 9 | `foie` | Foie | à intégrer |
| 10 | `urgences` | Abdomen aigu et chirurgie générale | à intégrer |
| 11 | `pediatrie` | Pédiatrie digestive (toutes les questions d’enfant, voir § 6) | à intégrer |
| 12 | `pharmaco` | Pharmacologie digestive | à intégrer |

Un chapitre `pending` est visible dans « Mes cours » (grisé, « Intégration en cours ») mais n’est pas cliquable : aucun bouton factice.

### 3.4 Conventions

- `id` : minuscules, sans accent, un seul mot si possible (`oesophage`, `biliaire`).
- `short` : une ligne qui liste les grands thèmes (sert de sous-titre).
- `icon` : un émoji (décoratif).

---

## 4. Construire les SOUS-CHAPITRES

### 4.1 Critères

Un sous-chapitre = **un thème qui revient plusieurs fois dans les examens** à l’intérieur du chapitre. Repères : **4 à 6 sous-chapitres par chapitre**, chacun avec **au moins 5 questions**. Ils servent au filtre « Sous-chapitre », au bilan « Points forts / à retravailler » et à l’organisation des leçons.

### 4.2 Procédure

1. Lister les questions du chapitre et noter, pour chacune, le **sujet précis** (ex. « Zenker – imagerie », « Barrett – mucosectomie »).
2. Regrouper les sujets voisins jusqu’à obtenir 4 à 6 groupes cohérents, en suivant si possible le découpage clinique classique : **physiologie / fonctionnel → inflammatoire → tumoral → urgences / complications**.
3. Donner à chaque groupe un `id` court et un titre explicite.
4. Vérifier qu’**aucune question ne reste sans sous-chapitre** (le validateur refuse un sous-chapitre inconnu).

### 4.3 Exemples réels

**Œsophage**

| `id` | Titre | Questions types |
|---|---|---|
| `rgo` | RGO et hernie hiatale | pH-métrie vs endoscopie, 45 ans, hernie mixte, Nissen, homme de 85 ans |
| `oesophagites` | Œsophagites (médicamenteuse, à éosinophiles, infectieuses) | blocage alimentaire + asthme, potassium per os, Candida / CMV |
| `moteur` | Dysphagie, troubles moteurs et diverticules | « ne donne pas de dysphagie », achalasie, Heller, Zenker, Rosenbek |
| `cancer` | Barrett et cancers de l’œsophage | terrains « sauf 2 », mucosectomie T1N0, 3 voies, jonction |
| `urgences` | Caustiques et perforation | endoscopie < 24 h, emphysème cervical |

**Estomac et duodénum**

| `id` | Titre |
|---|---|
| `ugd` | Ulcère gastro-duodénal et Helicobacter pylori |
| `dyspepsie` | Dyspepsie, vomissements et indications d’endoscopie |
| `gastrites` | Gastrites, maladie de Biermer et hypergastrinémie |
| `cancer` | Cancer de l’estomac et chirurgie gastrique |
| `hemorragie` | Hémorragie digestive haute |

**Intestin grêle**

| `id` | Titre |
|---|---|
| `diarrhees` | Diarrhées : mécanismes et démarche |
| `malabsorption` | Malabsorption, maladie cœliaque et intolérance au lactose |
| `carences` | Résection iléale, carences et anémies d’origine digestive |
| `occlusion` | Occlusion et iléus |
| `tumeurs` | Tumeurs, syndrome de Koenig et saignement du grêle |
| `parasites` | Parasitoses intestinales (leçon commune avec `diarrhees`) |

**MICI**

| `id` | Titre |
|---|---|
| `crohn` | Maladie de Crohn : clinique, complications et manifestations extra-digestives |
| `rcuh` | RCUH : clinique, poussée et sévérité |
| `diagnostic` | Diagnostic, imagerie, anatomo-pathologie et suivi |
| `traitement` | Traitement médical |
| `chirurgie` | Chirurgie des MICI |

Les questions Crohn de la partie « Intestin grêle » de la section Dewit sont rangées ici (règle : chapitre où la question se résout).

Les `id` de sous-chapitre sont **locaux au chapitre** : `cancer` peut exister dans plusieurs chapitres.

---

## 5. Construire les LEÇONS

### 5.1 Correspondance avec les sous-chapitres

- En règle générale, **une leçon par sous-chapitre**. On peut fusionner deux petits sous-chapitres dans une même leçon (ex. Œsophage : `rgo` + `oesophagites` → leçon `oeso-rgo`).
- **4 à 5 leçons par chapitre**, de **8 à 15 minutes** de lecture chacune.
- `id` de leçon : `<préfixe du chapitre>-<thème>` → `oeso-rgo`, `oeso-dysphagie`, `est-ugd`, `est-hemorragie`.
- Fichier : `content/lessons/<chapitre>/<NN>-<thème>.md` → `content/lessons/estomac/01-ulcere.md`. Le numéro `NN` fixe l’ordre de lecture.

### 5.2 Gabarit obligatoire d’une leçon

```markdown
:::archives
**Ce que les archives interrogent sur ce thème** (≈ N questions) : liste des notions
réellement posées à l’examen, avec les pièges récurrents.
:::

:::complement
## 1. Définitions
## 2. Physiopathologie / causes          (tableau comparatif si possible)
## 3. Clinique
## 4. Examens complémentaires            (« quelle question → quel examen »)
## 5. Diagnostic différentiel / démarche
## 6. Traitement
## 7. À retenir
### Pièges classiques
### Questions de compréhension          (3 balises <details><summary>…</summary>…</details>)
:::
```

Les sections sans objet peuvent être fusionnées ou omises ; « À retenir » et « Questions de compréhension » sont toujours présentes.

### 5.3 Provenance visible

| Bloc | Affiché comme | Contenu |
|---|---|---|
| `:::archives` | 🟦 « Archives UCL — ce que les examens interrogent » | uniquement ce qui vient des examens |
| `:::complement` | 🟨 « Explication complémentaire — à valider » | explication rédigée, non relue |
| `:::validated` | 🟩 « Explication complémentaire — validée » | après relecture humaine |

**Aucune référence bibliographique inventée.** Une source n’est citée que si elle a été vérifiée.

---

## 6. Rattacher chaque QUESTION

Chaque question d’archives reçoit, dans `content/questions/*.json` :

| Champ | Règle |
|---|---|
| `chapter` | l’organe **principal** de la question (une seule valeur) |
| `subchapter` | le thème dans ce chapitre (doit exister dans `chapters.json`) |
| `lessonLinks` | 1 à 2 leçons qui permettent d’y répondre (affichées après la correction : « Revoir le cours ») |
| `tags` | mots-clés libres : notion (« Zenker »), modalité (« imagerie »), « cas clinique »… |
| `session`, `discipline`, `teacher` | axe B : **provenance**, jamais déduite du contenu |
| `formerTeacher` | `true` pour un enseignant qui n’enseigne plus la matière (« ancien titulaire ») |
| `clinical` | `true` si l’énoncé est une vignette patient |
| `caseId` + `caseStep` | questions enchaînées d’un même cas (étapes 1, 2, 3…) |
| `duplicateGroup` | même question posée plusieurs fois → même groupe (aucune occurrence supprimée) |

**Questions à cheval sur deux chapitres** : on choisit l’organe où la question **se résout** (ex. « hémorragie sur ulcère » → `estomac` › `hemorragie`) et on ajoute l’autre notion en `tags`.

**Questions transversales** (anémies, diarrhées multi-causes) : rattachées au chapitre où se trouve la majorité des causes proposées (ex. carences en fer → `grele`).

### Décision : adulte et pédiatrie (tranchée le 10 novembre 2026)

Les examens séparent une partie **adulte** (« Gastro-entérologie adulte » Dewit, « Hépato adulte » Leclercq, chirurgie adulte) et une partie **pédiatrique** (Smets, Sokal, Reding).

| Point | Décision |
|---|---|
| **Libellés des disciplines** | **inchangés** : « Gastro-entérologie », « Hépatologie », « Chirurgie digestive », « Pédiatrie digestive », « Chirurgie pédiatrique »… |
| **Rangement des questions d’enfant** | **uniquement dans le chapitre `pediatrie`**, même quand elles portent sur un organe couvert ailleurs (atrésie de l’œsophage, blocage alimentaire chez l’enfant, épigastralgies de l’adolescente…). Elles ne sont **pas** dupliquées dans les chapitres d’organe. |
| **Disciplines pédiatriques** | `PEDIA` (Smets, Sokal) et `CHIRPED` (Reding). Le validateur **refuse** une question `PEDIA` ou `CHIRPED` rangée hors du chapitre `pediatrie`. |
| **Public d’une question** | calculé automatiquement : **Pédiatrie** si `chapter = pediatrie` ou discipline `PEDIA` / `CHIRPED`, sinon **Adulte**. Une question d’enfant posée dans une autre discipline (ex. une QCM « clinique » ou de radiologie sur une invagination) est rangée dans `pediatrie` pour être comptée comme pédiatrique. |
| **Filtre** | « Adulte / Pédiatrie » dans Entraînement et Anciens examens (banque complète) |
| **Badge** | « 👶 Pédiatrie » sur chaque question d’enfant (rien n’est ajouté sur les questions adultes, pour ne pas surcharger l’affichage) |

**Pour ENDOCRINO ACADEMY** : appliquer la même règle si les examens comportent une partie pédiatrique (endocrinologie pédiatrique dans son propre chapitre, filtre et badge identiques). Adapter la fonction `audienceOf` si la partie pédiatrique y porte un autre nom.

---

## 7. Le parcours d’un chapitre (identique pour tous les chapitres)

| Étape | Contenu | Construit automatiquement à partir de |
|---|---|---|
| 1. Apprendre | les leçons du chapitre, dans l’ordre | `chapters.json › lessons` |
| 2. Vérifier ma compréhension | questions faciles avec réponse disponible | `difficulty = 1` |
| 3. M’entraîner | difficulté progressive, avec indices | `difficulty ≤ 2`, triées |
| 4. Niveau examen | toutes les questions d’archives, sans indice | toutes les questions du chapitre |
| 5. Évaluation finale | 15 questions mélangées, sans indice | tirage aléatoire |
| 6. Bilan | réussite par sous-chapitre, erreurs, non maîtrisé | `subchapter` + progression |

Il n’y a **rien à coder** pour un nouveau chapitre : il suffit de fournir `chapters.json`, les leçons et les questions.

---

## 8. Fichiers et identifiants

```
content/
  chapters.json                 chapitres → sous-chapitres → leçons
  exams.json                    sessions d’examen (composition connue ou non, questions non retranscrites)
  questions/<source>.json       questions groupées par SOURCE (2025-01.json, nd-dewit.json, …)
  lessons/<chapitre>/NN-<thème>.md
public/media/                   images extraites des archives
```

Identifiant de question : `<APP>-<SESSION>-<DISCIPLINE>-<TYPE>-<NNN>`

- DIGEST : `DIGEST-2025-01-GASTRO-QCMM-002`
- `SESSION` : `AAAA-MM`, `AP<année>` (série spéciale), `ND` (non datée)
- `TYPE` : `QCM` (1 réponse), `QCMM` (plusieurs), `COMB` (« combien »), `VF`, `QROC`
- `NNN` : attribué une fois pour toutes, **jamais réutilisé ni renuméroté** (la progression des étudiant·e·s en dépend).

---

## 9. Procédure pour intégrer un chapitre (checklist)

1. **Repérer** dans les sources extraites toutes les questions du chapitre (examens datés + sections par enseignant + QROC).
2. **Définir les sous-chapitres** (§ 4) et les leçons (§ 5) dans `chapters.json`, passer `status` à `available`.
3. **Saisir les questions** dans le fichier de leur source, avec : formulation originale, page, statut de fiabilité, `answerNote` si la réponse est discutée ou déduite, 3 indices, explication `complement / to-validate`.
4. **Regrouper les doublons** (`duplicateGroup`) et signaler les contradictions entre occurrences.
5. **Rédiger les leçons** avec le gabarit (§ 5.2).
6. Lancer `npm run validate:content` : identifiants, cohérence réponse ↔ statut, indices qui ne révèlent pas la réponse, liens vers des leçons existantes, étapes des cas cliniques.
7. Lancer `npm test` et `npm run e2e`, puis pousser sur `main` : le déploiement est automatique.

---

## 10. Transposer à ENDOCRINO ACADEMY

Ce qui **se reprend tel quel** :

- le code de l’application (aucune logique propre à la digestion) ;
- les deux axes (organe / provenance) ;
- le gabarit de leçon, les statuts de fiabilité, les identifiants, le parcours en 6 étapes, les validations ;
- la checklist du § 9.

Ce qui **change** :

| Élément | DIGEST | ENDOCRINO (à définir après l’audit des sources) |
|---|---|---|
| Préfixe des identifiants | `DIGEST-` | `ENDO-` (par exemple) |
| Chapitres | organes du tube digestif | à construire à partir des questions réelles (par exemple : glandes ou grands ensembles physiopathologiques) |
| Disciplines (axe B) | GASTRO, HEPATO, CHIR, PEDIA, RADIO, PHARMA, ANAPATH, CLIN | celles qui figurent réellement dans les examens d’endocrinologie |
| Préfixes de leçon | `oeso-`, `est-` | un préfixe par chapitre |
| Nom, couleurs, icône | DIGEST ACADEMY | ENDOCRINO ACADEMY |

**Ordre de travail recommandé pour la nouvelle application** : phase 1 (audit des sources et inventaire) → définition des chapitres et sous-chapitres à partir de l’inventaire (§ 3–4) → validation → intégration chapitre par chapitre (§ 9). On ne fixe **jamais** la liste des chapitres avant d’avoir vu les questions.
