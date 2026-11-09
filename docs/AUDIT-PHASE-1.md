# DIGEST ACADEMY — Rapport d'audit documentaire (Phase 1)

> Date : 9 novembre 2026 · Statut : **en attente de validation**
> Source analysée : `Ancien exam de Digest.zip` (dépôt `fomouborel/MySuccessDoctor`, commit `280f846`)

---

## 0. Résumé

1. **Le ZIP contient 6 PDF (179 pages), pas seulement la Compilation.** Deux examens récents (janvier 2026 et août 2026) n'existent que dans des fichiers séparés.
2. **Aucune correction officielle n'existe dans les sources.** Tout est retranscrit de mémoire par des étudiants, après l'examen. Les « réponses » sont des propositions d'étudiants, marquées en rouge, parfois avec des votes (« +1 ») et des débats. Le document le dit lui-même : *« mettre la réponse en rouge et justifier à côté en commentaire »*.
3. **Environ 660 entrées exploitables** (≈ 526 QCM et ≈ 135 QROC), plus ≈ 45 emplacements vides : une question annoncée mais jamais retranscrite, souvent seulement le prénom de l'étudiant qui devait s'en charger.
4. **Beaucoup de doublons.** Une même question revient d'une année à l'autre, dans la section de l'année et dans celle du professeur. On estime **≈ 450 à 500 questions distinctes**.
5. **Environ 180 entrées n'ont aucune réponse proposée**, dont presque tous les QROC de 2026 et des sections « QROC Dewit ». Environ **60 réponses sont contestées ou contradictoires** d'une occurrence à l'autre.
6. **⚠️ Le dépôt GitHub est public.** Le ZIP (examens et ~39 prénoms ou noms d'étudiants) est donc accessible à tous dès maintenant. Voir §9.

Les chiffres ci-dessous sont issus d'une lecture intégrale, assistée par un découpage automatique. Les comptes **par section** ont été vérifiés à la main. Les comptes **par chapitre** sont une estimation (±10 %). Le compte exact sera figé en phase 4, quand chaque question aura un identifiant.

---

## 1. Inventaire des fichiers

| Fichier | Pages | Contenu | Réponses | Rôle proposé |
|---|---:|---|---|---|
| `Compilation DIGEST 2016-2025.pdf` | 122 | Examens de janvier 2022 à 2025, puis sections par professeur, puis anatomo-pathologie 2015-2020, puis QROC par professeur | Oui (rouge, votes, commentaires colorés) | **Source principale** |
| `Retranscrption Secteur Digestif 2026.pdf` | 11 | Examen de **janvier 2026** | Partielles | **Source unique** pour 2026-01 |
| `Retranscription Digest Aout 2026.pdf` | 2 | Examen d'**août 2026** (2e session), 20 points | **Aucune** | **Source unique** pour 2026-08 |
| `01_Retranscription Janvier 2025 - Secteur Digestif.pdf` | 12 | Janvier 2025 | Oui | Doublon de la Compilation, avec quelques variantes (ex. Q50 plus détaillée, Q51 avec un 2e marquage rouge) |
| `QCM-Digest-par-partie-non-corrigés.pdf` | 27 | Mêmes QCM que la Compilation (Dewit, Danse, Horsmans, Hubert 2025), **sans le rouge** | Non | Doublon, mais contient **107 commentaires Word** (débats entre étudiants) absents de la Compilation, à rattacher aux questions |
| `QROC-Digest-par-partie-non-corrigés.pdf` | 5 | QROC Dewit, Smets, Danse, sans réponses | Non | Doublon, avec 4 commentaires |

Note : le titre « 2016-2025 » est inexact. La partie anatomo-pathologie remonte à **2015**, et les sections par professeur ne sont généralement **pas datées**.

---

## 2. Structure réelle de la Compilation

| Bloc (pages) | Contenu | Datation |
|---|---|---|
| p.1–9 | Janvier 2025 (46 questions annoncées) | daté |
| p.9–17 | Janvier 2024 | daté |
| p.18–31 | Janvier 2023 (76 QCM annoncés + ~15 QROC) | daté |
| p.31–41 | Janvier 2022 | daté |
| p.42–44 | « En vrac » | **non daté** |
| p.45–69 | DEWIT, gastro-entérologie adulte, classé par organe (Œsophage, Estomac, Grêle, Côlon, Anus, Voies biliaires, Pancréas, Mix) | **non daté** |
| p.70–74 | LECLERCQ, hépatologie adulte | non daté |
| p.75–80 | BERTRAND, chirurgie hépato-bilio-pancréatique (*« pas notre année »*) | non daté |
| p.81–89 | KARTHEUSER, chirurgie adulte | non daté |
| p.90–93 | REDING, chirurgie pédiatrique | non daté |
| p.94–96 | SOKAL, gastro-entérologie pédiatrique (*« pas notre année »*) | non daté |
| p.97–100 | DANSE / ANNET, radiologie | non daté |
| p.101–103 | HORSMANS, pharmacologie | non daté |
| p.104–110 | Anatomo-pathologie (enseignant non nommé) | 2015 → 2020 |
| p.111–122 | QROC : Dewit, Smets, Leclercq, Radio | non daté |

**La composition change d'une année à l'autre** : on ne peut pas la généraliser.

| Session | Format indiqué dans la source |
|---|---|
| Janv. 2022 | non précisé |
| Janv. 2023 | 76 QCM (dont 8 sur 22 de type « combien… ») + QROC |
| Janv. 2024 | QCM + QROC, sans répartition chiffrée |
| Janv. 2025 | 2 h. Dewit 16 QCM · Leclercq 3 QROC + 1 QCM · Hubert 11 QCM · Smets 3 QROC · Danse 4 QCM · Cliniques 12 QCM · Pharmaco 3 QCM |
| Janv. 2026 | 2 h 30. QCM (dont 1 par clinique, soit 12) pour 38 pts + QROC pour 20 pts. Total 60, ramené sur 100 |
| Août 2026 | 2 h 30, sur 20 pts. Dewit 7 pts (1 page R/V + 2 QCM) · 3 Q chirurgie · 3 Q hépatologie · 3 Q pédiatrie (3 pts) · 3 Q radiologie (1 pt) · 1 QCM pharmaco (1 pt) |

Seules **2025, 2026-01 et 2026-08** ont une composition assez documentée pour reproduire un examen blanc « conforme ». Pour 2022 à 2024, il manque trop de questions.

---

## 3. Nombre de questions par source et par année

| Source / session | QCM | QROC | Total exploitable | Emplacements vides* |
|---|---:|---:|---:|---:|
| Janvier 2026 | 30 | 17 | **47** | 8 |
| Août 2026 | 2 | 16 | **18** | 1 |
| Janvier 2025 | 40 | 6 | **46** (+ 9 affirmations isolées) | 6 |
| Janvier 2024 | 41 | 13 | **54** | 3 |
| Janvier 2023 | 58 | 14 | **72** | ~20 |
| Janvier 2022 | 55 | 9 | **64** | ~7 |
| Anatomo-patho 2015-2020 | 22 | — | **22** (2015 : 4 · 2016 : 6 · 2017 : 5 · 2018 : 4 · 2019 : 1 · 2020 : 2) | — |
| Non daté : « En vrac » | 11 | — | 11 | — |
| Non daté : Dewit | 104 | 14 | 118 | — |
| Non daté : Leclercq | 22 | 18 | 40 | — |
| Non daté : Bertrand | 24 | — | 24 | — |
| Non daté : Kartheuser | 53 | — | 53 | — |
| Non daté : Reding | 17 | — | 17 | — |
| Non daté : Sokal / Smets | 12 | 24 | 36 | — |
| Non daté : Danse / Annet | 20 | 4 | 24 | — |
| Non daté : Horsmans | 15 | — | 15 | — |
| **TOTAL** | **≈ 526** | **≈ 135** | **≈ 661** | **≈ 45** |

\* Un emplacement vide est un numéro sans contenu : « 5. <prénom> », « 13. <prénom> », « 22. », etc. Ces entrées sont **conservées dans la navigation par examen**, pour montrer qu'il manque une question. En revanche, elles ne comptent **pas** dans la couverture.

**Environ 51 % des entrées ne sont pas datées.** Elles viennent des sections par professeur, sans indication d'année.

---

## 4. Nombre de questions par professeur ou discipline

| Discipline | Enseignant(s) cité(s) | Entrées (≈) | Remarque |
|---|---|---:|---|
| Gastro-entérologie adulte | Dewit (Dewitt) | ~200 | Le plus gros bloc. Beaucoup de « combien sont vraies », de QCM à réponses multiples et de QROC |
| Hépatologie adulte | Leclercq, « Delire » (2026) | ~70 | Surtout des QROC |
| Chirurgie digestive adulte | Kartheuser (ancien), Hubert (2025-2026), Léonard (2024), Bertrand (HBP, ancien) | ~140 | Hubert, Léonard et Kartheuser se recoupent fortement |
| Pédiatrie digestive (médicale) | Smets, Sokal (ancien) | ~60 | Surtout des QROC, avec des débats nombreux |
| Chirurgie pédiatrique | Reding | ~30 | Très répétitive (sténose du pylore, atrésie de l'œsophage, invagination, hernie) |
| Radiologie | Danse / Annet | ~40 | Une partie dépend d'images |
| Pharmacologie | Horsmans | ~30 | Très répétitive (*« 100 % tuyau »*) |
| Anatomo-pathologie | non nommé | ~25 | **Dépend d'images.** Absente de 2024 à 2026 |
| « Cliniques » (QCM transversaux) | Philippe, Marique / Deprez… | ~35 | 2025-2026 |

Les sections non datées (Bertrand et Sokal sont marqués *« pas notre année »*) seront conservées, mais **signalées « ancien titulaire »** pour que l'étudiante puisse les filtrer.

---

## 5. Types de questions

| Type | Estimation | Exemples |
|---|---:|---|
| QCM à réponse unique (« la vraie », « la fausse ») | ≈ 380 | majorité |
| QCM à réponses multiples (« 2 vraies », « 3 réponses ») | ≈ 85 | Dewit, Kartheuser |
| « Combien sont vraies / fausses ? » (avec choix A=1, B=2…) | ≈ 25 | Dewit, Leclercq, janvier 2023-2026 |
| Combinaisons (« 1+3 », « 2+4+5 ») | ≈ 10 | dépistage du cancer colorectal, ulcères |
| Appariement (relier cas et diagnostic / examen) | 2 (8 sous-items) | Sokal |
| Vrai / faux (affirmations isolées) | ≈ 15 | 2025 « propositions randoms », 2024 Q1 corrigée item par item |
| QROC | ≈ 135 | Smets, Leclercq, Dewit, 2026 |
| Cas cliniques (énoncé avec vignette patient) | ≈ 180, dont ≈ 25 enchaînés en plusieurs étapes | « Femme de 24 ans, masse FID… → diagnostic → opération → risque » |
| Questions avec image | ≈ 30 (18 images présentes dans le PDF) | Radiologie, anatomo-pathologie |

---

## 6. Classification par chapitre (proposition)

Je propose **deux axes complémentaires**, conformément au cahier des charges.

**Axe A : chapitres par organe.** Ils servent aux parcours de cours. Estimation automatique, à affiner :

| Chapitre | Part estimée | ≈ entrées |
|---|---:|---:|
| 1. Œsophage (RGO, dysphagie, achalasie, Zenker, Barrett, cancers, caustiques, œsophagite à éosinophiles) | 9 % | 60 |
| 2. Estomac et duodénum (ulcère, Helicobacter pylori, dyspepsie, gastrites, Biermer, cancer gastrique, hémorragie haute, vomissements) | 12 % | 80 |
| 3. Intestin grêle (malabsorption, maladie cœliaque, lactose, résection iléale, diarrhées, Meckel, tumeurs, angiodysplasie) | 10 % | 65 |
| 4. MICI (Crohn, RCUH) | 6 % | 40 |
| 5. Côlon et rectum (cancer colorectal, dépistage, polyposes, diverticulose, côlon irritable, colites) | 10 % | 70 |
| 6. Proctologie (fissure, abcès, hémorroïdes, fistule, IST) | 4 % | 28 |
| 7. Voies biliaires (lithiases, cholécystite, angiocholite, CSP, cholangiocarcinome) | 8 % | 55 |
| 8. Pancréas (pancréatite aiguë et chronique, auto-immune, tumeurs solides et kystiques) | 6 % | 40 |
| 9. Foie (tests hépatiques, hépatites, alcool et NAFLD, surcharges, cirrhose et HTP, CHC, tumeurs bénignes, transplantation) | 19 % | 125 |
| 10. Abdomen aigu et chirurgie générale (appendicite, occlusion, péritonite, rate, fast-track) | 4 % | 30 |
| 11. Pédiatrie digestive (transversal : enfant et nouveau-né) | — | ~90 (étiquette en plus de l'organe) |
| Non classé automatiquement | 7 % | 45 (classement manuel en phase 4) |

**Axe B : discipline et enseignant**, pour retrouver « l'examen d'origine » : Gastro (Dewit) · Hépato (Leclercq / Delire) · Chirurgie (Hubert / Kartheuser / Léonard / Bertrand) · Pédiatrie (Smets / Sokal) · Chirurgie pédiatrique (Reding) · Radiologie (Danse / Annet) · Pharmacologie (Horsmans) · Anatomo-pathologie · Cliniques.

Radiologie, pharmacologie et anatomo-pathologie seront **à la fois** une discipline (axe B) et une étiquette rattachée à un organe (axe A). Par exemple, « Zenker → radiographie » appartient au chapitre Œsophage et à la discipline Radiologie.

---

## 7. Fiabilité des corrections

### 7.1 Code couleur observé dans la source

| Marquage | Signification réelle |
|---|---|
| **Rouge** | Réponse *proposée* par un étudiant (consigne du document) |
| Orange | Le plus souvent, une hésitation (« pas sûre ») |
| Bleu, vert, violet | Commentaires ou débats entre étudiants |
| « +1 +1 » | Votes d'étudiants : ce n'est **pas** une validation |
| Texte libre après une proposition (« faux, c'est hypo ») | Justification d'un étudiant, parfois sans marquage rouge |
| Rouge sur un énoncé ou un commentaire | Faux positif (ex. consignes de la p.1 en rouge) : à ignorer |

### 7.2 Statuts proposés et répartition estimée

| Statut | Définition appliquée | ≈ entrées |
|---|---|---:|
| ✅ Correction officielle | Corrigé publié par l'enseignant | **0** |
| 🔴 Réponse proposée (compilation) | Rouge, une seule interprétation, pas de contradiction | ≈ 400 |
| ⚠️ Réponse discutée ou contestée | Votes partagés, commentaire contraire, orange, plusieurs rouges incohérents, ou réponse différente selon l'occurrence | ≈ 60 |
| 🔎 Réponse déduite, à vérifier | Seul un commentaire ou une justification indique la réponse | ≈ 25 |
| ⛔ Réponse non disponible | Aucune indication | ≈ 175 |
| 🧩 Question incomplète ou ambiguë (cumulable avec un autre statut) | Propositions manquantes (« ? », « trou de mémoire »), énoncé seul, image absente, formulation douteuse | ≈ 110 |

Comme il n'y a pas de correction officielle, je propose un 7e statut, **« Réponse vérifiée (explication) »**. Il ne s'appliquerait que lorsqu'une explication pédagogique est ajoutée **avec une source vérifiable**. Il ne remplacerait jamais la mention de l'origine étudiante.

### 7.3 Contradictions et erreurs probables déjà repérées (extraits)

| # | Sujet | Problème |
|---|---|---|
| 1 | Sténose hypertrophique du pylore (2023 Q60) | Le rouge marque « alcalose **hypo**chlorémique » comme fausse. Or c'est vrai. Ailleurs (2022 Q32, Reding Q2/Q5), c'est « **hyper**chlorémique » qui est marquée fausse. Erreur de retranscription probable |
| 2 | Cancer obstructif du côlon gauche avec cæcum de 15 cm et microbulles (Kartheuser Q21 et Q32) | Même cas, deux réponses rouges différentes : colectomie totale + AIR, ou coloproctectomie + AIA |
| 3 | PAF (Kartheuser Q46, « 1 fausse ») | **Trois** propositions en rouge |
| 4 | Cancer de l'œsophage (Kartheuser Q35, « 1 fausse ») | **Quatre** propositions en rouge |
| 5 | Patients à risque de cancer colorectal (Dewit Q62 et « en vrac » Q20) | « 1+3 » et « 1+4 » tous deux en rouge, ou selon l'occurrence |
| 6 | Méléna après AINS (2024 Léonard Q2 et Kartheuser Q43) | Votes partagés : « perforation » ou « cancer colique droit ». Kartheuser marque « ulcère perforé ». Discutable médicalement : un méléna évoque une hémorragie, pas une perforation |
| 7 | IPP, « la fausse » (2023 Q75) | Deux réponses rouges. Les commentaires disent que seule (a) est fausse |
| 8 | Aminosalicylés, toxicité (2024 pharmaco Q2 et 2023 Q73) | « Rénal » (votes et 2023) contre « cutané » (rouge, 2024) |
| 9 | Appendicite et biologie (Danse Q91, 2022 Radio, QROC Radio Q89) | « La biologie doit être faite avant l'écho » contre « l'imagerie prime, on n'attend pas la biologie » |
| 10 | CHC (2023 Q46) | « L'AFP permet de faire le diagnostic » en rouge : douteux, à vérifier |
| 11 | Anatomo-pathologie 2015 Q1 | Herpès en rouge, mais le commentaire conclut CMV |
| 12 | Pancréas (Dewit Q95) | Proposition 3 en rouge comme « vraie », alors que la justification dit qu'elle est fausse |
| 13 | Leclercq Q20 (hépatite aiguë, 65 ans) | Deux réponses rouges pour « 1 réponse » |
| 14 | Bertrand Q1, Q2, Q4 | Rouge et vert mélangés, réponse illisible |
| 15 | Ictère néonatal (Sokal Q2 et Q10) | Valeurs différentes selon l'occurrence (13 ou 11 mg/dL) |

Ces cas seront tous marqués « ⚠️ discutée » ou « 🔎 à vérifier ». **Aucun ne sera tranché sans source.**

### 7.4 Autres problèmes de qualité

- **Énoncés reconstitués de mémoire** : les formulations sont approximatives (« un truc du genre », « je sais plus »). La formulation originale sera conservée telle quelle, avec un indicateur « formulation incertaine ».
- **Images** : ≈ 30 questions renvoient à une image. 18 images sont présentes, mais certaines **montrent la réponse** (étiquettes sur l'image de pancréatite chronique). Environ 12 questions sont **sans image**, donc inexploitables en l'état ou à présenter en lecture seule.
- **Numérotation incohérente** : doublons de numéros (Kartheuser 7, 8 et 10 ; 2023 Q80 deux fois), numéros parasites (« 1254. »), options numérotées comme des questions.
- **Commentaires Word** : 107 bulles de débat existent seulement dans le PDF « QCM non corrigés ». Elles seront rattachées aux questions correspondantes.
- **Contenu hors sujet** : appréciations sur les enseignants (« GOAT », « pas gentille »), émojis, consignes de retranscription. Elles seront retirées de l'affichage, mais les avis utiles sur le format de l'examen seront gardés comme métadonnées.

---

## 8. Doublons (repérés, à conserver)

Aucune occurrence ne sera supprimée. Chacune garde son propre identifiant et ses métadonnées, puis elle sera reliée à un **groupe de doublons**. Les plus fréquents :

| Question | Occurrences (≈) |
|---|---:|
| Métoclopramide (mécanisme ou « la fausse ») | 7 |
| Opération de Hartmann, indication | 7 |
| Exérèse transanale (Buess) d'un cancer du rectum | 5 |
| Zenker et examen radiologique ; Zenker, « la fausse » | 6 |
| Atrésie de l'œsophage, « signe absent » | 5 |
| Sténose hypertrophique du pylore | 4 |
| Fer sérique diminué sauf résection iléale | 5 |
| Anémie micro, normo et macrocytaire, « 1 fausse » | 4 |
| Lithiase pigmentaire (parasitose + hémolyse) | 4 |
| « Quelle situation ne justifie pas d'endoscopie ? » | 4 |
| Homme de 85 ans, BPCO, LA grade B, hernie de 4 cm → IPP à vie | 3 |
| Crohn : « la chirurgie est rare… » | 3 |
| IPP, « la fausse » (demi-vie) | 4 |
| Cholangite sclérosante primitive (diverses) | 8 |
| Masse FID chez une femme de 24 ans → Crohn → résection iléo-cæcale | 4 |

On estime **≈ 450 à 500 questions distinctes** pour ≈ 661 occurrences. Dans l'application, deux compteurs seront affichés : les questions distinctes travaillées, et les occurrences travaillées.

---

## 9. Points bloquants ou à arbitrer avant la phase 2

1. **Dépôt public.** `fomouborel/MySuccessDoctor` est **public**. Le ZIP, qui contient des examens et ≈ 39 prénoms ou noms d'étudiants retranscripteurs, est donc téléchargeable par tous. De plus, **GitHub Pages sur un dépôt privé n'est pas gratuit** : il faut un plan payant. Il faudra donc choisir entre :
   - **(a)** garder le dépôt public, mais **retirer les PDF sources du dépôt** et ne publier que des données extraites et anonymisées ;
   - **(b)** séparer en deux dépôts : un privé pour les sources et l'extraction, un public pour l'application ;
   - **(c)** tout publier tel quel (non recommandé).

   Je recommande **(b)**, ou **(a)** avec réécriture de l'historique. Le compromis Cloudflare Access sera détaillé en phase 2.
2. **Absence de cours.** Toutes les « unités pédagogiques » seront donc des **explications complémentaires**, rédigées à partir de connaissances médicales générales. Elles seront clairement étiquetées « non issues des archives UCL ». Je ne peux pas les sourcer avec des références que je n'ai pas vérifiées. Je propose de les marquer « à valider » jusqu'à relecture par un humain (l'étudiante ou vous).
3. **Anonymisation** : remplacer les prénoms des retranscripteurs par « étudiant·e ».
4. **Sections « pas notre année »** (Bertrand, Sokal) : les inclure avec une étiquette, ou les exclure par défaut ?

---

## 10. Validation demandée

- [ ] Modèle de statuts de fiabilité (§7.2), dont le statut « 0 correction officielle »
- [ ] Classification à deux axes (§6) et liste des chapitres
- [ ] Traitement des emplacements vides et des doublons (§3, §8)
- [ ] Décision sur la confidentialité et le dépôt public (§9.1)
- [ ] Statut des explications pédagogiques complémentaires (§9.2)
- [ ] Inclusion ou non des sections « ancien titulaire » (§9.4)
