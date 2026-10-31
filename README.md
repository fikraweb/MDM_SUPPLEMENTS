# MDM Supplements

Boutique de nutrition sportive, catalogue de 15 produits/packs et dashboard privé, construits avec Vite, Cloudflare Workers et D1.

Le client confirme sa commande directement dans le site : nom, téléphone, ville, adresse, paiement à la livraison et **livraison offerte**. Le serveur enregistre une commande avec sa référence. L’administration gère les commandes et leur ticket imprimable, le catalogue, les stocks, les clients et les paramètres. WhatsApp reste un lien de contact général et n’est plus utilisé pour transmettre ou confirmer les commandes.

## Développement

Node.js 24 recommandé.

```sh
npm ci
npm run setup:local
npm run dev:worker
```

Le Worker local sert la boutique, l’API et `/admin/`. Les secrets locaux sont dans `.dev.vars.local`, ignoré par Git. Pour le développement des interfaces avec Vite, lancer aussi `npm run dev` ; son proxy `/api/` transmet les requêtes au Worker.

```sh
npm run build
npm run test:integration # Worker local démarré requis
```

## Production Cloudflare

**Lire [docs/dashboard-setup.md](docs/dashboard-setup.md).** Le déploiement est maintenant un Worker avec base D1, et non un hébergement statique seul. L’ID D1 fourni est configuré dans `wrangler.jsonc`. Les secrets `ADMIN_PASSWORD` et `SESSION_SECRET` et le déploiement doivent être activés dans le compte Cloudflare du propriétaire. La première connexion administrateur valide prépare automatiquement les tables manquantes sans remplacer les données.

Commande de déploiement : `npm run deploy` (construction et déploiement). Les migrations D1 sont appliquées à la première connexion administrateur valide ; une migration CLI explicite reste possible. Les secrets restent dans Cloudflare. Ne jamais les écrire dans le code ou les transmettre dans le chat.

Le travail de cette session valide le fonctionnement local ; il ne constitue pas une validation de production. En cas de base non configurée ou indisponible, aucune commande n’est déclarée enregistrée et les coordonnées ne sont pas stockées dans le navigateur.

## Catalogue et visuels

Les prix des huit offres proviennent des captures fournies, les sept autres sont des estimations provisoires signalées. Voir [docs/catalogue-prices.md](docs/catalogue-prices.md). Les prix et les stocks peuvent être modifiés dans le dashboard sans modifier le code. Les éventuels tarifs estimatifs sont à valider par le magasin avant traitement.

Les photos originales du ZIP sont archivées dans `public/images/products/{id}.png`. Les visuels `{id}-cutout.webp` et le hero sont des reconstitutions générées à partir des captures, détourées et optimisées. Les parties cachées ont été reconstituées : ne pas utiliser leurs textes d’emballage comme source pour les dosages ou compositions. Le logo SVG est une reproduction vectorielle du logo fourni.

## Contact

- Téléphone / WhatsApp de renseignements : +212 618 19 47 07
- Instagram : https://www.instagram.com/mdm_supplements/
- Slogan : « La qualité et la confiance, nos fondations. »

Les coordonnées de contact sont modifiables dans les paramètres. Le paiement en ligne, les uploads d’images vers un hébergeur, les e-mails automatiques et les intégrations de transporteur ne sont pas inclus. Les conditions de vente et informations légales du magasin restent à compléter avant le lancement commercial.
