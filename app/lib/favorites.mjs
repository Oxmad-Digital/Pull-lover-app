// Champs d'un produit conservés dans la liste des favoris (API et contexte client).
export const FAVORITE_FIELDS = ["name", "image", "price", "promoPrice", "colors", "isAvailable", "stock"];

/** Version allégée d'une fiche produit, telle que renvoyée par GET /api/favorites. */
export function toFavorite(product) {
  const favorite = { _id: product._id };
  for (const field of FAVORITE_FIELDS) {
    if (product[field] !== undefined) favorite[field] = product[field];
  }
  return favorite;
}
