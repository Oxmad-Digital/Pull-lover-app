export const CONTACT_SUBJECTS = {
  product: "Une question sur le cardigan",
  order: "Ma commande ou ma livraison",
  sizing: "Choisir ma taille",
  press: "Presse et collaboration",
  other: "Autre demande",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeContactPayload(input = {}) {
  return {
    firstName: typeof input.firstName === "string" ? input.firstName.trim() : "",
    lastName: typeof input.lastName === "string" ? input.lastName.trim() : "",
    email: typeof input.email === "string" ? input.email.trim().toLowerCase() : "",
    subject: typeof input.subject === "string" ? input.subject.trim() : "",
    orderNumber: typeof input.orderNumber === "string" ? input.orderNumber.trim() : "",
    message: typeof input.message === "string" ? input.message.trim() : "",
    website: typeof input.website === "string" ? input.website.trim() : "",
    consent: input.consent === true,
  };
}

export function validateContactPayload(payload) {
  if (!payload.firstName || payload.firstName.length > 80) return "Prénom invalide.";
  if (!payload.lastName || payload.lastName.length > 80) return "Nom invalide.";
  if (!EMAIL_PATTERN.test(payload.email) || payload.email.length > 254) return "Adresse e-mail invalide.";
  if (!Object.hasOwn(CONTACT_SUBJECTS, payload.subject)) return "Veuillez choisir un sujet.";
  if (payload.orderNumber.length > 80) return "Numéro de commande trop long.";
  if (payload.message.length < 10 || payload.message.length > 5000) return "Votre message doit contenir entre 10 et 5 000 caractères.";
  if (!payload.consent) return "Votre accord est requis pour envoyer le message.";
  return null;
}

export function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

