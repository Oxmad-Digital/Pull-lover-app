// app/lib/password.js
// Règles de mot de passe communes (inscription, réinitialisation, profil).

const COMMON_PASSWORDS = ["password", "123456", "12345678", "qwerty"];

export const PASSWORD_HINT = "8 caractères minimum, avec majuscule, minuscule, chiffre et caractère spécial (!@#$%^&*)";

export function validatePassword(password) {
  const errors = [];
  if (typeof password !== "string") return { isValid: false, errors: ["Mot de passe requis"] };

  if (password.length < 8) errors.push("Min 8 caractères");
  if (!/[A-Z]/.test(password)) errors.push("Min 1 majuscule");
  if (!/[a-z]/.test(password)) errors.push("Min 1 minuscule");
  if (!/[0-9]/.test(password)) errors.push("Min 1 chiffre");
  if (!/[!@#$%^&*]/.test(password)) errors.push("Min 1 caractère spécial (!@#$%^&*)");
  if (COMMON_PASSWORDS.some((common) => password.toLowerCase().includes(common))) {
    errors.push("Mot de passe trop commun");
  }

  return { isValid: errors.length === 0, errors };
}
