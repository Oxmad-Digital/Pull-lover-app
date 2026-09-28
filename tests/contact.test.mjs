import assert from "node:assert/strict";
import test from "node:test";
import { CONTACT_SUBJECTS, escapeHtml, normalizeContactPayload, validateContactPayload } from "../app/lib/contact.mjs";

test("normalise et valide un message de contact complet", () => {
  const payload = normalizeContactPayload({ firstName: "  Aina ", lastName: " Raoelina ", email: " AINA@EXAMPLE.COM ", subject: "product", message: " Bonjour, ceci est mon message. ", consent: true });
  assert.equal(payload.email, "aina@example.com");
  assert.equal(validateContactPayload(payload), null);
});

test("refuse les champs invalides", () => {
  const payload = normalizeContactPayload({ firstName: "Aina", lastName: "R.", email: "non", subject: "inconnu", message: "court", consent: false });
  assert.equal(validateContactPayload(payload), "Adresse e-mail invalide.");
  assert.equal(Object.hasOwn(CONTACT_SUBJECTS, "inconnu"), false);
});

test("échappe le HTML injecté dans l’e-mail", () => {
  assert.equal(escapeHtml('<script>alert("x")</script>'), "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
});

