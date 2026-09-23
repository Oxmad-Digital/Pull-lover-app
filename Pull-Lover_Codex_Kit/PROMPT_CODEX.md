# Prompt à donner à Codex

Je veux appliquer une refonte visuelle complète à mon site e-commerce Pull-Lover existant.

Le dossier `design-reference/pull-lover` contient :

- une maquette HTML interactive dans `reference/index.html` ;
- les visuels utilisés dans `reference/assets` ;
- les règles de design dans `DESIGN_SYSTEM.md`.

## Objectif

Reproduis fidèlement la direction visuelle de la maquette dans le site existant : une boutique mono-produit haut de gamme, très épurée, avec de grands visuels, beaucoup d'espace, une typographie éditoriale et une mise en avant claire du système de drop/précommande.

La marque vend pour l'instant un seul vêtement : le pull Mantasoa. Il est fabriqué à Madagascar dans l'atelier familial et photographié autour du lac de Mantasoa. Le positionnement est slow fashion premium.

## Règles impératives

1. Commence par analyser le projet existant : framework, routes, composants, styles, données, panier, paiement, authentification, API et déploiement.
2. Présente-moi un plan court indiquant précisément les fichiers que tu vas modifier avant de commencer les changements importants.
3. Conserve toute la logique métier existante : panier, checkout, paiement, produits, variantes, stock ou précommande, commandes, base de données, emails, authentification, SEO, analytics et intégrations.
4. Ne remplace pas l'application existante par le fichier HTML statique. Utilise la maquette uniquement comme référence visuelle et découpe-la proprement dans l'architecture actuelle.
5. Réutilise les composants existants lorsqu'ils sont sains. Refactorise seulement ce qui est nécessaire pour obtenir le rendu demandé.
6. N'ajoute pas de dépendance lourde sans justification. Privilégie le CSS et les outils déjà présents dans le projet.
7. Ne crée pas de faux produit ou de logique parallèle. Branche l'interface sur les vraies données du produit existant.
8. Ne modifie pas les secrets, variables d'environnement ou paramètres de production.
9. Travaille de manière responsive dès le départ et vérifie au minimum les largeurs 375 px, 768 px, 1440 px et 1920 px.
10. Préserve l'accessibilité : navigation clavier, focus visible, labels, contrastes, textes alternatifs et réduction des animations.

## Ordre d'implémentation

1. Fondations visuelles : couleurs, typographies, espacements, boutons, liens et conteneurs.
2. Header et bandeau du drop.
3. Hero plein écran avec le visuel de Mantasoa.
4. Section manifeste.
5. Bloc produit mono-produit avec variantes réelles, choix de taille et ajout au panier existant.
6. Panier et parcours de précommande, en conservant la logique actuelle.
7. Section atelier familial et explication de la fabrication à la demande.
8. Étapes de précommande et footer.
9. États de chargement, erreurs, produit indisponible et fermeture du drop si ces états existent déjà.
10. Vérification finale desktop/mobile sans régression fonctionnelle.

## Critères d'acceptation

- Le premier écran respire et repose sur un grand visuel, sans accumulation de cartes ou de blocs.
- Le site est clairement mono-produit : aucune grille de quatre produits sur la home.
- L'achat ou la précommande est accessible rapidement.
- La provenance malgache et l'atelier familial sont présents sans tomber dans une esthétique folklorique.
- Le rendu est premium, sobre et contemporain.
- Le panier et le paiement existants fonctionnent toujours.
- Le site ne présente aucun débordement horizontal sur mobile.
- Les images sont optimisées avec le composant image du framework lorsqu'il existe.
- Les performances et le SEO existants ne régressent pas.

Commence maintenant par l'audit du projet et le plan d'intégration. Ne supprime aucune fonctionnalité existante sans me le signaler.
