// app/lib/text.js
// Petites fonctions de nettoyage des entrées utilisateur (utilisables client et serveur).

export const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Échappe une saisie pour l'utiliser comme recherche littérale dans une RegExp. */
export const escapeRegex = (value) => String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Filtre insensible à la casse sur l'email d'une commande (anciennes commandes non normalisées). */
export const orderEmailFilter = (email) => ({
  "customer.email": { $regex: `^${escapeRegex(String(email || "").trim())}$`, $options: "i" },
});
