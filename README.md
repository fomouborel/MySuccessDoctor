# DIGEST ACADEMY

Plateforme de préparation aux examens du **secteur digestif** (UCL) : cours par chapitre, entraînement, anciens examens, cas cliniques, examens blancs, carnet d’erreurs, révisions espacées et suivi de progression.

Application **statique** (React + TypeScript + Vite), sans serveur ni compte : la progression est stockée dans le navigateur (IndexedDB), avec export / import de sauvegarde.

## Architecture en 3 couches

| Couche | Outil | Rôle |
|---|---|---|
| Développement | Claude Code + ce dépôt | code, contenu, tests |
| Intégration | GitHub Actions (`.github/workflows/deploy.yml`) | TypeScript → validation du contenu → tests unitaires → build → tests de bout en bout → publication |
| Distribution | GitHub Pages | site HTTPS, installable (PWA), utilisable hors ligne |

Chaque `push` sur `main` déclenche le déploiement. Si une étape échoue, rien n’est publié. Le workflow peut aussi être lancé à la main depuis l’onglet *Actions*.

## Contenu

- `content/questions/*.json` : questions d’archives, une par objet, avec identifiant stable `DIGEST-<SESSION>-<DISCIPLINE>-<TYPE>-<NNN>`, statut de fiabilité de la réponse, provenance (fichier + page).
- `content/lessons/**.md` : cours. Blocs `:::archives` (ce que les examens interrogent) et `:::complement` (explications ajoutées, « à valider »).
- `content/chapters.json`, `content/exams.json` : chapitres et sessions d’examen.
- `npm run validate:content` vérifie schémas, identifiants uniques, cohérence réponse/statut, indices qui ne révèlent pas la réponse, cas cliniques.

**Aucune réponse des archives n’est un corrigé officiel** : ce sont des retranscriptions d’étudiant·e·s (voir `docs/AUDIT-PHASE-1.md`).

Les PDF sources ne sont **jamais** versionnés ici (dépôt public) : ils vivent dans un dépôt privé séparé.

## Commandes

```bash
npm ci
npm run dev               # développement local
npm run typecheck
npm run validate:content
npm test                  # tests unitaires (Vitest)
npm run build
npm run e2e               # tests de bout en bout (Playwright)
```

## Documentation

- `docs/AUDIT-PHASE-1.md` — audit des sources
- `docs/ARCHITECTURE-PHASE-2.md` — choix techniques et modèle de données
- `docs/METHODE-ARBORESCENCE.md` — méthode de construction des chapitres, sous-chapitres, leçons et rattachement des questions (réutilisable pour d’autres applications, ex. ENDOCRINO ACADEMY)
