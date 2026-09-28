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

const VALIDATION_MESSAGES = {
  fr: {
    firstName: "Prénom invalide.",
    lastName: "Nom invalide.",
    email: "Adresse e-mail invalide.",
    subject: "Veuillez choisir un sujet.",
    orderNumber: "Numéro de commande trop long.",
    message: "Votre message doit contenir entre 10 et 5 000 caractères.",
    consent: "Votre accord est requis pour envoyer le message.",
  },
  en: {
    firstName: "Invalid first name.",
    lastName: "Invalid last name.",
    email: "Invalid email address.",
    subject: "Please choose a subject.",
    orderNumber: "Order number is too long.",
    message: "Your message must be between 10 and 5,000 characters.",
    consent: "Your consent is required to send the message.",
  },
};

export function validateContactPayload(payload, lang = "fr") {
  const messages = VALIDATION_MESSAGES[lang] || VALIDATION_MESSAGES.fr;
  if (!payload.firstName || payload.firstName.length > 80) return messages.firstName;
  if (!payload.lastName || payload.lastName.length > 80) return messages.lastName;
  if (!EMAIL_PATTERN.test(payload.email) || payload.email.length > 254) return messages.email;
  if (!Object.hasOwn(CONTACT_SUBJECTS, payload.subject)) return messages.subject;
  if (payload.orderNumber.length > 80) return messages.orderNumber;
  if (payload.message.length < 10 || payload.message.length > 5000) return messages.message;
  if (!payload.consent) return messages.consent;
  return null;
}

export function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

