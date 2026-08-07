# Knowledge AI Dashboard Parity Report

Date: 2026-06-14

## Source active

- Source de vérité UI: `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/App.tsx`
- Composant actif: `DashboardView`
- Surface reprise: header `Connaissances`, toggles `Personnel` / `Entreprise`, toggles `Vue liste` / `Vue graph`, statistiques `total` / `pret` / `en cours`, liste de connaissances, filtres et vue graph.

`/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/pages/DashboardPage.tsx` existe, mais ce n'est pas la surface active retenue pour le port Bridge.

## Cible Bridge

- Service autonome: `/Users/nicolascleton/Documents/Yaka-Bridge/services/connaissance`
- Route: `/dashboard`
- Bridge reste hors produit: launcher, contrat module, actions, scopes, events et service registration.
- Aucune authentification Supabase directe ajoutée côté client.
- Les interactions visibles passent par `callBridgeAction` et les actions `knowledge_ai.*`.

## Captures cible

- Source desktop authentifiee: `/Users/nicolascleton/Documents/Yaka-Bridge/artifacts/knowledge-ai-parity/source-dashboard-authenticated-desktop.png`
- Source mobile authentifiee: `/Users/nicolascleton/Documents/Yaka-Bridge/artifacts/knowledge-ai-parity/source-dashboard-authenticated-mobile.png`
- Cible avant alignement shell: `/Users/nicolascleton/Documents/Yaka-Bridge/artifacts/knowledge-ai-parity/target-dashboard-before-source-shell-desktop.png`
- Cible finale desktop: `/Users/nicolascleton/Documents/Yaka-Bridge/artifacts/knowledge-ai-parity/target-dashboard-source-shell-grid-actions-fixed-desktop.png`
- Cible finale mobile: `/Users/nicolascleton/Documents/Yaka-Bridge/artifacts/knowledge-ai-parity/target-dashboard-source-shell-grid-actions-fixed-mobile.png`

## Adaptations réalisées

- Remplacement du titre cible `Mes connaissances` par `Connaissances`.
- Ajout du scope produit `Personnel` / `Entreprise`, relié à `knowledge_ai.knowledge.scope.set`.
- Ajout de la bascule produit `Vue liste` / `Vue graph`, reliée à `knowledge_ai.knowledge.filter.set`.
- Remplacement de l'ancien rail icones par le shell source `knowledge-source-app`.
- Suppression de la carte produit générique `knowledge-v2-main-card` autour du dashboard.
- Navigation source alignee: `Chat`, `Ajouter`, `Connaissances`, avec `Connaissances` actif.
- Profil utilisateur replacé en bas de la sidebar desktop.
- Vue initiale corrigée en grille, comme le store source `knowledgeStore`.
- Ajout des boutons visibles de carte `Interroger` et `Copier le lien`, reliés aux actions Bridge.
- Conservation des filtres, cartes, menus et modales déjà branchés aux actions Bridge.
- Correction du rendu des cartes `processing` en mode liste compacte.
- Ajustement responsive mobile pour garder les toggles visibles.
- Correction d'une collision CSS entre les cartes de citations chat et les cartes dashboard.

## Écarts assumés

- La vraie visualisation `KnowledgeGraphVisualization` de ConnaissanceNEW n'est pas encore portée. La cible affiche une vue graph locale fidèle à la structure visible, sans appel IA/cloud, en attendant le port du graphe runtime.
- Les données affichées restent des fixtures de service tant que la couche Supabase dédiée + OAuth launch ticket n'alimente pas encore le dashboard.
- La source desktop a ete capturee avec un harness Playwright local qui injecte une session et des réponses Supabase fictives. Ce harness ne modifie pas `connaissanceNEW` et ne doit pas être repris dans le runtime Bridge.
- Le mode mobile cible reste volontairement utilisable. La source mobile authentifiée coupe le contenu horizontalement; la cible garde la navigation et le contenu accessibles sans reproduire ce bug de viewport.

## Vérifications

- `npm run service:connaissance:typecheck`
- `npm run service:connaissance:build`
- Test Playwright direct: shell source présent, ancien rail absent, ancienne main-card absente, grille active, `Interroger` et `Copier le lien` acceptés par Bridge.
- Capture Playwright locale via Chrome installé sur `http://localhost:3200/dashboard`.
