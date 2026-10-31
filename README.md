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

Après le premier déploiement, ajouter le domaine dans **Custom domains** et suivre les indications DNS de Cloudflare. Le déploiement est géré depuis Cloudflare par le propriétaire du site.

## Avant la mise en vente

Les produits, compositions et prix dans `src/main.js` sont des exemples à remplacer par les références vérifiées du catalogue réel. Les images CSS sont des illustrations fictives. Le logo dans `public/images/mdm-logo.svg` est une reproduction vectorielle dessinée à partir de l’image fournie ; il peut être remplacé par le fichier original de la marque.

Le panier reste basé sur un catalogue de démonstration. Le bouton de confirmation ouvre WhatsApp avec un récapitulatif à envoyer manuellement ; le magasin confirme ensuite disponibilité, tarifs, livraison et commande. Aucun paiement, suivi de commande, stock ou espace client n’est connecté. Prévoir les informations de l’entreprise, les conditions de vente, les modalités de livraison et la politique de confidentialité avant le lancement commercial. Ne pas activer le paiement avant d’avoir une gestion des commandes et une validation des montants côté serveur.

## Visuel du hero

`public/images/hero-products.png` est une image générée à partir de la capture fournie, représentant ISO PRO 100 (MuscleLabs), ISO WHEY ZERO (BioTechUSA) et la créatine monohydrate Applied Nutrition. Il s’agit d’une reconstitution visuelle, pas des photos originales des fabricants. Les mentions figurant sur les emballages générés ne doivent pas servir de source pour les informations produit. Remplacer ce visuel par les photos originales autorisées pour une fidélité exacte avant le lancement commercial. Ces références ne changent pas le catalogue de démonstration.

## WhatsApp et Instagram

- WhatsApp : `+212 618 19 47 07` (`212618194707`), repris du profil fourni.
- Instagram : https://www.instagram.com/mdm_supplements/ (lien du profil sans paramètres de suivi).
- Le panier ouvre un lien `wa.me` avec références, variantes, quantités, prix indicatifs et sous-total. Le client complète ses coordonnées dans WhatsApp et envoie lui-même le message ; ouvrir le lien ne crée ni n’envoie une commande automatiquement et ne vide pas le panier.
- Le bouton est désactivé lorsque le panier est vide.
- Les liens de contact du header, du hero et du footer et le bouton WhatsApp flottant ouvrent un nouvel onglet. Aucune API, clé ni requête externe n’est ajoutée au chargement.
- Description du profil reprise : « Qualité certifiée, confiance garantie », « الجودة والثقة أساسنا », « Livraison partout au Maroc ».
