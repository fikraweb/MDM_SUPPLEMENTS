# Activer le dashboard et les commandes

Le projet utilise maintenant **Cloudflare Workers + Assets + D1**, avec une application d’administration à `/admin/`. Un déploiement statique Vite seul ne suffit plus pour recevoir les commandes.

La base fournie par le propriétaire est déjà déclarée dans `wrangler.jsonc` :

- binding Worker : `DB`
- nom : `mdm-store`
- Database ID : `1ba0b37f-dfb9-48d4-a62f-38df9c03d561`

Le code et la base locale ont été testés. La base distante n’a pas été migrée depuis cette session : aucun accès Cloudflare authentifié n’est disponible ici. Aucun secret de production n’a été créé par l’agent.

## Depuis Cloudflare Workers Builds

Dans **Workers & Pages → mdm-supplements → Settings → Build**, utiliser :

- Build command : `npm run build`
- Deploy command : `npm run deploy`
- Racine du projet : racine du dépôt.
- Node.js : 24.

`npm run deploy` vérifie la configuration D1, construit les assets, applique les migrations D1 **avant** le déploiement, puis déploie le Worker. Il ne détruit ni ne réinitialise les données existantes. Le jeton de build doit avoir accès au Worker et le droit **D1 Edit** pour cette base ; un refus de migration arrête le déploiement.

Dans **Settings → Variables and Secrets**, ajouter deux variables de type **Secret** :

- `ADMIN_PASSWORD` : mot de passe administrateur unique, au moins 12 caractères (un mot de passe généré long est recommandé).
- `SESSION_SECRET` : valeur aléatoire indépendante d’au moins 32 caractères.

Générer et saisir ces valeurs dans vos outils sécurisés. Ne pas les ajouter au dépôt et ne pas les envoyer dans le chat. Un mot de passe changé invalide les sessions antérieures.

Après sauvegarde des paramètres, relancer un déploiement, vérifier que les migrations réussissent et que le binding `DB` pointe vers la base ci-dessus. La simple présence d’un Database ID ne prouve pas que les migrations, les secrets ou le déploiement sont actifs.

## Depuis un terminal déjà connecté à Cloudflare

```sh
npm ci
npm exec wrangler whoami
npm exec wrangler secret put ADMIN_PASSWORD
npm exec wrangler secret put SESSION_SECRET
npm run deploy
```

`secret put` demande la valeur de manière interactive. Utiliser le compte qui possède le Worker et la base ; ne pas utiliser un compte de prévisualisation temporaire. Aucun identifiant Cloudflare n’est nécessaire dans le code du navigateur.

## Vérifier après déploiement

1. Ouvrir `/api/catalog` : `checkoutEnabled` doit être `true` et le catalogue doit venir de D1.
2. Ouvrir `/admin/`, se connecter avec le mot de passe défini et vérifier les 15 produits importés. Une base distante nouvellement créée ne contient aucune commande de test locale.
3. Vérifier **Paramètres** : livraison gratuite activée, frais à zéro, paiement à la livraison.
4. Envoyer une commande de contrôle depuis le site. La référence ne doit s’afficher qu’après la réponse positive du serveur.
5. La retrouver dans **Commandes**, ouvrir son détail puis son **Ticket** et imprimer ou enregistrer en PDF. La commande n’est pas envoyée sur WhatsApp.
6. Annuler la commande de contrôle depuis le dashboard ; le stock réservé suivi est restitué une seule fois.

Sans D1 disponible, le site affiche encore son catalogue initial mais désactive la commande : aucun succès fictif ni stockage local des coordonnées client. Sans secrets de production valides, la connexion administrateur reste désactivée.

## Fonctionnalités

- Vue d’ensemble : commandes, nouvelles demandes, chiffre d’affaires des commandes livrées, valeur en cours, activité récente, alertes de stock.
- Commandes : recherche, statuts, dates, pagination, détail, historique, ticket individuel imprimable/PDF, export CSV.
- Cycle : nouvelle → confirmée → préparation → expédiée → livrée ; annulation possible avant livraison. Les commandes clôturées et leurs tickets sont conservés.
- Produits : création, nom, marque, catégorie, description, prix et origine, image locale ou URL HTTPS, visibilité, stock facultatif. Les modifications apparaissent sur le catalogue du site après actualisation. Un nouveau fichier image peut être ajouté au dépôt ; aucun hébergement d’uploads externe n’est configuré.
- Clients : regroupement par téléphone, nombre et valeur des commandes, dernière commande.
- Paramètres : nom du magasin, téléphone, Instagram, message de commande et livraison. Livraison offerte par défaut selon la demande du propriétaire.
- Paiement à la livraison uniquement : aucun encaissement en ligne, intégration transporteur ni envoi d’e-mail automatique.

## Développement local

```sh
npm ci
npm run setup:local
npm run dev:worker
```

La préparation crée des secrets aléatoires dans `.dev.vars.local` si le fichier n’existe pas, construit le site et applique les migrations sur D1 **locale**. Elle préserve les données et secrets existants. Le fichier est ignoré par Git ; consulter son champ `ADMIN_PASSWORD` uniquement pour se connecter au dashboard de développement. Ces secrets ne sont jamais déployés comme secrets de production.

Le Worker sert la boutique et `/admin/` sur son port 8787. Pour travailler sur les interfaces avec rechargement Vite, lancer également `npm run dev` : les requêtes `/api/` sont transmises au Worker local.

Avec le Worker local démarré :

```sh
npm run test:integration
```

Ces tests refusent une URL de production et créent uniquement des commandes fictives dans D1 locale. Ils couvrent l’authentification, la protection des données, l’origine des requêtes, les prix calculés au serveur, l’idempotence, les stocks concurrents, les annulations, l’export et la révocation des sessions.

Les processus ne survivent pas à une restauration de machine ; redémarrer le Worker et, si nécessaire, Vite. Les tâches cloud sont déjà isolées : utiliser ce checkout, sans créer de worktree sauf demande explicite.

## Données et limites

Les coordonnées sont conservées dans D1 et ne sont accessibles qu’aux API administrateur authentifiées. Le navigateur du client conserve son panier, jamais son adresse ou son téléphone. Les tickets sont des **bons de commande**, pas des factures fiscales. Les produits et prix sont figés dans chaque commande : une modification ultérieure du catalogue ne réécrit pas l’historique.

Les sessions sont signées, stockées sous forme de condensat en base et expirent après huit heures. Le cookie est HttpOnly, SameSite=Strict et Secure en production. La déconnexion révoque la session. Les écritures vérifient l’origine, et des limites de tentatives s’appliquent au login et aux commandes. Pour les besoins d’une équipe, ajouter ultérieurement des comptes individuels ou Cloudflare Access ; cette version dispose d’un seul accès administrateur.
