"use client";

import { useState } from "react";

const initialForm = { firstName: "", lastName: "", email: "", subject: "", orderNumber: "", message: "", website: "", consent: false };

export default function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const update = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.type === "checkbox" ? target.checked : target.value }));

  async function submit(event) {
    event.preventDefault();
    if (status.type === "loading") return;
    setStatus({ type: "loading", message: "Envoi en cours…" });
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "L’envoi a échoué.");
      setForm(initialForm);
      setStatus({ type: "success", message: result.message });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "L’envoi a échoué. Merci de réessayer." });
    }
  }

  return <form className="pl-contact-form" onSubmit={submit}>
    <div className="pl-contact-form-head"><span>Écrivez-nous</span><span aria-hidden="true">01 — 06</span></div>
    <div className="pl-contact-row">
      <label className="pl-contact-field"><span>Prénom</span><input name="firstName" value={form.firstName} onChange={update} autoComplete="given-name" maxLength="80" required placeholder="Votre prénom" /></label>
      <label className="pl-contact-field"><span>Nom</span><input name="lastName" value={form.lastName} onChange={update} autoComplete="family-name" maxLength="80" required placeholder="Votre nom" /></label>
    </div>
    <label className="pl-contact-field"><span>Adresse e-mail</span><input name="email" value={form.email} onChange={update} type="email" autoComplete="email" maxLength="254" required placeholder="vous@exemple.com" /></label>
    <label className="pl-contact-field"><span>Sujet</span><select name="subject" value={form.subject} onChange={update} required><option value="" disabled>Choisissez le sujet de votre message</option><option value="product">Une question sur le cardigan</option><option value="order">Ma commande ou ma livraison</option><option value="sizing">Choisir ma taille</option><option value="press">Presse et collaboration</option><option value="other">Autre demande</option></select></label>
    <label className="pl-contact-field"><span>Numéro de commande <small>facultatif</small></span><input name="orderNumber" value={form.orderNumber} onChange={update} autoComplete="off" maxLength="80" placeholder="Ex. PL-1024" /></label>
    <label className="pl-contact-field pl-contact-message"><span>Votre message</span><textarea name="message" value={form.message} onChange={update} minLength="10" maxLength="5000" required rows="6" placeholder="Comment pouvons-nous vous aider ?" /><small>{form.message.length} / 5 000</small></label>
    <label className="pl-contact-consent"><input name="consent" type="checkbox" checked={form.consent} onChange={update} required /><span>J’accepte que mes informations soient utilisées pour répondre à ma demande, conformément à la <a href="/politique-de-confidentialite">politique de confidentialité</a>.</span></label>
    <label className="pl-contact-honeypot" aria-hidden="true">Ne pas remplir ce champ<input name="website" value={form.website} onChange={update} tabIndex="-1" autoComplete="off" /></label>
    <div className="pl-contact-submit"><button type="submit" disabled={status.type === "loading"}><span>{status.type === "loading" ? "Envoi…" : "Envoyer le message"}</span><span aria-hidden="true">↗</span></button><p className={`pl-contact-status is-${status.type}`} role="status" aria-live="polite">{status.message}</p></div>
  </form>;
}

