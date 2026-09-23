# Refonte de l’accueil Pull-Lover

La home reprend `Pull-Lover_Codex_Kit` : visuel plein écran, manifeste, Mantasoa, atelier, étapes de précommande et footer. Les visuels sont servis en WebP et redimensionnés par `next/image`. Les tokens `--pl-*` isolent cette direction graphique des pages qui seront refondues ensuite.

## Données et panier

`MantasoaProduct` interroge l’API existante avec `search=Mantasoa`. La sélection préfère un produit nommé « Mantasoa » ou « Le Mantasoa », puis un unique résultat contenant ce nom. Une sélection ambiguë n’affiche aucun produit de substitution.

Le prix, la promotion, les tailles, les couleurs, les détails et la disponibilité viennent de ce produit. Les quantités déjà au panier sont déduites pour empêcher un nouvel ajout au-delà du stock total ou du stock par taille. Le composant appelle le `CartContext` existant et conserve le parcours `/panier` puis le paiement.

Aucun prix, quota réservé, délai de livraison ou date de fermeture n’est repris des données fictives de la maquette. Le bandeau utilise `bandeauText` des réglages quand il est renseigné. Le modèle existant n’a pas de calendrier de clôture des précommandes ni de délai d’expédition structuré : ils ne sont pas inventés. Le compteur historique `dropDate` n’est pas interprété comme une règle de disponibilité.

Le panier existant ajoute la TVA au sous-total : le prix de la home est donc présenté hors taxes, conformément à ce parcours.

## Boutique masquée temporairement

`next.config.ts` redirige `/boutique`, `/nos-mailles` et leurs sous-routes vers `/#piece` en **307**. Les pages catalogue et l’administration des produits sont conservées. Les liens visibles conduisent désormais au bloc mono-produit.

Pour réactiver le catalogue, retirer ces redirections temporaires et réintroduire ses liens de navigation.

## Vérifications

- `node --test tests/featured-product.test.mjs` : sélection du Mantasoa, variantes, stock total et stock par taille, quantités déjà au panier.
- ESLint sur les composants ajoutés/refondus et TypeScript sans émission.
- Build de production Next.js/Turbopack réussie avec la configuration locale chargée en mémoire, sans modification du fichier d’environnement.
- Chromium : 375, 768, 1440 et 1920 px, sans débordement horizontal.
- Données API interceptées uniquement dans le navigateur de test : sélection obligatoire, tailles épuisées, ajout au vrai contexte panier, persistance après rechargement, page panier, menu mobile, clavier, redirections 307, erreur API et réessai, produit absent et indisponible.
- Les tests n’effectuent aucune commande ni aucun paiement.

La configuration locale utilise désormais Neon PostgreSQL. Le rendu conserve l’accès à la fiche dédiée du Mantasoa et au contact de l’atelier même lorsque les disponibilités ne peuvent pas être chargées. La présentation synthétique de l’accueil ne contient pas d’accordéons.
