// app/lib/product-colors.mjs
// Couleurs de la fiche cardigan : nom FR/EN, code de la pastille et photos (clés R2), gérées dans l'admin
// et stockées sous product.variants. Tant qu'aucune couleur n'est enregistrée, la fiche affiche les couleurs
// d'origine ci-dessous ; l'admin s'en sert pour pré-remplir la section « Couleurs ».

const FOLDER = "products/cardigan-maille-milano";

export const DEFAULT_PRODUCT_COLORS = [
  {
    id: "vert-foret",
    code: "#284a37",
    name: { fr: "Vert forêt", en: "Forest green" },
    images: [
      `${FOLDER}/cardigan-vert-mannequin-broderie-v4.webp`,
      `${FOLDER}/cardigan-vert-face-broderie-v4.webp`,
      `${FOLDER}/cardigan-vert-dos-broderie-v4.webp`,
      `${FOLDER}/cardigan-vert-coeur-broderie-v4.webp`,
    ],
  },
  {
    id: "bleu-ciel",
    code: "#a9c7e8",
    name: { fr: "Bleu ciel", en: "Sky blue" },
    images: [
      `${FOLDER}/cardigan-bleu-mannequin-harmonise-v5.webp`,
      `${FOLDER}/cardigan-bleu-face-broderie-v4.webp`,
      `${FOLDER}/cardigan-bleu-dos-broderie-v4.webp`,
      `${FOLDER}/cardigan-bleu-coeur-broderie-v4.webp`,
    ],
  },
  {
    id: "gris-anthracite",
    code: "#3d3d3f",
    name: { fr: "Gris anthracite", en: "Anthracite grey" },
    images: [
      `${FOLDER}/cardigan-anthracite-mannequin-broderie-v4.webp`,
      `${FOLDER}/cardigan-anthracite-face-broderie-v4.webp`,
      `${FOLDER}/cardigan-anthracite-dos-broderie-v4.webp`,
      `${FOLDER}/cardigan-anthracite-coeur-broderie-v4.webp`,
    ],
  },
];

/** Photos d'origine : utilisées par la fiche en secours, elles ne sont jamais supprimées de R2. */
export const DEFAULT_IMAGE_KEYS = new Set(DEFAULT_PRODUCT_COLORS.flatMap((color) => color.images));

export const MAX_COLORS = 10;
export const MAX_IMAGES_PER_COLOR = 12;

/** URL servie par /api/media pour une clé R2 (même encodage que r2Url). */
export function mediaUrl(key) {
  return `/api/media/${key.split("/").map(encodeURIComponent).join("/")}`;
}

const text = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/** Valide les couleurs envoyées par le formulaire admin ; écarte tout ce qui est malformé. */
export function cleanProductColors(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  return input
    .map((color) => ({
      id: text(color?.id, 64),
      code: /^#[0-9a-f]{6}$/i.test(color?.code) ? color.code.toLowerCase() : "",
      name: { fr: text(color?.name?.fr, 60), en: text(color?.name?.en, 60) },
      images: (Array.isArray(color?.images) ? color.images : [])
        .filter((key) => typeof key === "string" && /^products\/[\w./-]+$/.test(key) && !key.includes(".."))
        .slice(0, MAX_IMAGES_PER_COLOR),
    }))
    .filter((color) => {
      if (!/^[\w-]+$/.test(color.id) || seen.has(color.id) || !color.code || !color.name.fr) return false;
      seen.add(color.id);
      return true;
    })
    .slice(0, MAX_COLORS);
}

/** Couleurs affichées par la fiche : celles de la base qui ont au moins une photo, sinon celles d'origine. */
export function productColors(product) {
  const colors = cleanProductColors(product?.variants).filter((color) => color.images.length > 0);
  return colors.length > 0 ? colors : DEFAULT_PRODUCT_COLORS;
}
