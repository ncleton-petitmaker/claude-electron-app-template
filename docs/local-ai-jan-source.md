# Jan source locale pour Bridge

Ce document fixe la source Jan utilisee comme reference locale pour le module
`local_ai`.

## Decision

- Repo upstream : `https://github.com/janhq/jan.git`
- Dossier de reference intact : `/Volumes/Docker/jan-upstream`
- Dossier de travail Bridge : `/Volumes/Docker/jan-yaka-bridge`
- Branche upstream : `main`
- Branche de travail Bridge : `yaka-bridge-integration`
- Commit clone le 2026-06-14 : `5ea1ac3ef8ef60c37d4801a41331b10611d70f55`
- Licence racine lue dans le clone : Apache License, Version 2.0
- Licence GitHub API : `NOASSERTION` / `Other`

## Politique

`jan-upstream` reste une copie de reference. Toute modification necessaire pour
Bridge se fait dans `jan-yaka-bridge`, jamais directement dans la reference
upstream.

Le code Jan ne doit pas etre vendorise dans le repo public `yaka-bridge` avant
audit des licences, dependances, binaires et assets. Le module Yaka expose pour
l'instant Jan comme source externe inspectable et reproductible.

Le module utilise une icone IA locale neutre issue du design system Bridge. Le
logo produit Jan upstream n'est pas copie dans `yaka-bridge` avant revue licence,
marque et distribution.

## Commandes de verification

```bash
git -C /Volumes/Docker/jan-upstream status --short --branch
git -C /Volumes/Docker/jan-upstream rev-parse --abbrev-ref HEAD
git -C /Volumes/Docker/jan-upstream rev-parse HEAD
git -C /Volumes/Docker/jan-yaka-bridge status --short --branch
```

## Commandes Jan utiles

Depuis `/Volumes/Docker/jan-yaka-bridge` :

```bash
yarn install
yarn build
yarn dev
make dev
make test
```

Ces commandes viennent de la documentation racine Jan. Elles ne sont pas lancees
automatiquement par Bridge dans le module v1.
