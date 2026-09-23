# Pull-Lover — Direction visuelle

## Thèse visuelle

Un catalogue de mode premium réduit à l'essentiel : une seule pièce, de grands plans photographiques, une respiration généreuse et une narration centrée sur le temps, le geste et Mantasoa.

Le site doit paraître éditorial et contemporain, jamais chargé ni décoratif. L'identité malgache vient des paysages, des personnes, du lieu de fabrication et du récit — pas de motifs folkloriques ajoutés artificiellement.

## Palette

| Usage | Couleur |
| --- | --- |
| Primaire — vert profond | `#243B3B` |
| Primaire sombre | `#193030` |
| Secondaire — terre cuite | `#C75C5C` |
| Secondaire au survol | `#AD4646` |
| Fond ivoire | `#FFF9F6` |
| Blanc | `#FFFFFF` |
| Texte principal | `#252323` |
| Texte secondaire | `#706666` |
| Fond brume | `#F3EAE7` |
| Séparateurs | `#E8DAD6` |

Utiliser les couleurs comme tokens globaux. Pas de dégradés colorés décoratifs, d'ombres massives ou de multiples couleurs d'accent.

## Typographie

- Titres éditoriaux : serif élégante à fort contraste, ou la serif déjà présente dans le projet si elle est cohérente.
- Interface et textes : sans-serif neutre et lisible.
- Titres : très grands, interlignage serré autour de `0.9–1.05`, tracking légèrement négatif.
- Corps : 16 px minimum, interlignage autour de `1.6–1.75` pour les textes narratifs.
- Labels : 12–14 px, capitales, tracking généreux.

Éviter les titres génériques en gras lourd. Le contraste serif/sans-serif porte l'identité.

## Espacements

- Sections desktop : 110–190 px de respiration verticale.
- Sections mobile : 72–100 px.
- Marges latérales desktop : environ 5–8 vw.
- Marges latérales mobile : 20–24 px.
- Séparateurs fins de 1 px.

## Composition de la home

### 1. Bandeau du drop

Très fin, fond sombre, texte clair centré : statut du drop et estimation de livraison.

### 2. Navigation

Logo à gauche, trois ancres au centre, panier à droite. Superposée au hero en desktop. Sur mobile : logo, menu et panier.

### 3. Hero

- Hauteur proche de 100 svh.
- Photographie plein cadre du lac de Mantasoa avec le modèle sur la droite.
- Texte placé dans l'espace négatif à gauche.
- Un seul bouton principal.
- Pas de cartes flottantes, badges multiples ou carrousel.

### 4. Manifeste

Grande phrase serif sur fond ivoire. Une partie du texte en gris crée la hiérarchie. Aucun pictogramme nécessaire.

### 5. Produit mono-produit

Deux colonnes sur desktop : grande photographie à gauche, achat à droite. Une colonne sur mobile. Le bloc d'achat comprend :

- nom du produit ;
- prix ;
- description courte ;
- couleur réelle ;
- tailles ou variantes réelles ;
- bouton de précommande connecté au panier existant ;
- estimation de livraison ;
- informations matière, coupe et livraison sous forme d'accordéons.

### 6. Atelier

Image verticale plein cadre et grand titre sur fond anthracite. Le texte doit expliquer concrètement la fabrication dans l'atelier familial à Madagascar.

### 7. Précommande

Quatre étapes simples : commander, tricoter, finir, expédier. Présentation linéaire et légère, sans cartes avec ombres.

### 8. Final et footer

Dernier grand visuel avec rappel de la limite du drop, puis footer sombre minimal.

## Interactions

- Transitions discrètes de 200–400 ms.
- Légère mise à l'échelle des grandes images au survol seulement si les performances le permettent.
- Panier en panneau latéral si cela correspond à l'architecture actuelle.
- Accordéons accessibles au clavier.
- Les animations doivent respecter `prefers-reduced-motion`.

## Responsive

- À moins de 940 px, empiler le produit et la section atelier.
- À moins de 600 px, réduire la navigation et conserver un hero réellement lisible.
- Maintenir le sujet principal dans le cadrage avec `object-position` adapté.
- Les boutons principaux doivent rester faciles à toucher, autour de 52–60 px de hauteur.
- Aucun texte important sous 14 px, sauf micro-métadonnées non essentielles.

## À éviter

- Grilles de produits sur la home tant que la marque reste mono-produit.
- Multiplication de cartes, pastilles, ombres et encadrés.
- Illustrations pseudo-artisanales ou esthétique « affiche IA ».
- Tons pastel partout sans contraste.
- Faux avis clients, compteurs inventés ou promesses non vérifiées.
- Copie directe des données fictives de la maquette lorsque le projet possède déjà ses vraies données.
