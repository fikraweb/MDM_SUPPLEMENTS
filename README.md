# MDM Supplements

Première version d’une boutique de nutrition sportive en français, avec prix en dirhams marocains. Interface responsive, recherche, filtres et panier sauvegardé localement dans le navigateur.

## Développement

Prérequis : Node.js 22.12+ (Node 24 recommandé) et npm.

```sh
npm ci
npm run dev
```

```sh
npm run build
npm run preview
```

Le build statique est généré dans `dist/`. Aucun secret ni service externe n’est nécessaire. Les illustrations de produits sont réalisées en CSS ; les polices système sont utilisées sans requête externe.

## Cloudflare Pages

Connecter le dépôt GitHub `fikraweb/MDM_SUPPLEMENTS` à un projet Cloudflare Pages :

- Branche de production : `main`
- Framework : Vite
- Commande de build : `npm run build`
- Dossier de sortie : `dist`
- Variable de build : `NODE_VERSION=24`
- Racine : racine du dépôt

Après le premier déploiement, ajouter le domaine dans **Custom domains** et suivre les indications DNS de Cloudflare. Le projet n’a pas encore été déployé.

## Avant la mise en vente

Les produits, compositions et prix dans `src/main.js` sont des exemples à remplacer par les références vérifiées du catalogue réel. Les images CSS sont des illustrations fictives. Le logo dans `public/images/mdm-logo.svg` est une reproduction vectorielle dessinée à partir de l’image fournie ; il peut être remplacé par le fichier original de la marque.

Le panier sert de démonstration : aucun paiement, commande, stock, livraison ou espace client n’est connecté. Prévoir les informations de l’entreprise, les conditions de vente, les modalités de livraison et la politique de confidentialité avant le lancement commercial. Ne pas activer le paiement avant d’avoir une gestion des commandes et une validation des montants côté serveur.
