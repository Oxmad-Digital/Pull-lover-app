// app/lib/password.js
// Règles de mot de passe communes (inscription, réinitialisation, profil).

const COMMON_PASSWORDS = ["password", "123456", "12345678", "qwerty"];

const MESSAGES = {
  fr: {
    hint: "8 caractères minimum, avec majuscule, minuscule, chiffre et caractère spécial (!@#$%^&*)",
    required: "Mot de passe requis",
    length: "Min 8 caractères",
    upper: "Min 1 majuscule",
    lower: "Min 1 minuscule",
    digit: "Min 1 chiffre",
    special: "Min 1 caractère spécial (!@#$%^&*)",
    common: "Mot de passe trop commun",
  },
  en: {
    hint: "at least 8 characters, with an uppercase letter, a lowercase letter, a number and a special character (!@#$%^&*)",
    required: "Password required",
    length: "At least 8 characters",
    upper: "At least 1 uppercase letter",
    lower: "At least 1 lowercase letter",
    digit: "At least 1 number",
    special: "At least 1 special character (!@#$%^&*)",
    common: "Password is too common",
  },
};

const messagesFor = (lang) => MESSAGES[lang] || MESSAGES.fr;

export const passwordHint = (lang = "fr") => messagesFor(lang).hint;

export const PASSWORD_HINT = passwordHint("fr");

export function validatePassword(password, lang = "fr") {
  const m = messagesFor(lang);
  const errors = [];
  if (typeof password !== "string") return { isValid: false, errors: [m.required] };

  if (password.length < 8) errors.push(m.length);
  if (!/[A-Z]/.test(password)) errors.push(m.upper);
  if (!/[a-z]/.test(password)) errors.push(m.lower);
  if (!/[0-9]/.test(password)) errors.push(m.digit);
  if (!/[!@#$%^&*]/.test(password)) errors.push(m.special);
  if (COMMON_PASSWORDS.some((common) => password.toLowerCase().includes(common))) {
    errors.push(m.common);
  }

  return { isValid: errors.length === 0, errors };
}
