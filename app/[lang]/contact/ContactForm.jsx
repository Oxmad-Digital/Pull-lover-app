"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/app/i18n/I18nProvider";
import { localePath } from "@/app/i18n/config.mjs";

const initialForm = { firstName: "", lastName: "", email: "", subject: "", orderNumber: "", message: "", website: "", consent: false };

const TEXT = {
  fr: {
    sending: "Envoi en cours…",
    failed: "L’envoi a échoué.",
    failedRetry: "L’envoi a échoué. Merci de réessayer.",
    head: "Écrivez-nous",
    firstName: "Prénom",
    firstNamePlaceholder: "Votre prénom",
    lastName: "Nom",
    lastNamePlaceholder: "Votre nom",
    email: "Adresse e-mail",
    emailPlaceholder: "vous@exemple.com",
    subject: "Sujet",
    subjectPlaceholder: "Choisissez le sujet de votre message",
    subjects: { product: "Une question sur le cardigan", order: "Ma commande ou ma livraison", sizing: "Choisir ma taille", press: "Presse et collaboration", other: "Autre demande" },
    orderNumber: "Numéro de commande",
    optional: "facultatif",
    orderPlaceholder: "Ex. PL-1024",
    message: "Votre message",
    messagePlaceholder: "Comment pouvons-nous vous aider ?",
    maxLength: "5 000",
    consent: "J’accepte que mes informations soient utilisées pour répondre à ma demande, conformément à la",
    privacy: "politique de confidentialité",
    honeypot: "Ne pas remplir ce champ",
    sendingShort: "Envoi…",
    send: "Envoyer le message",
  },
  en: {
    sending: "Sending…",
    failed: "Sending failed.",
    failedRetry: "Sending failed. Please try again.",
    head: "Write to us",
    firstName: "First name",
    firstNamePlaceholder: "Your first name",
    lastName: "Last name",
    lastNamePlaceholder: "Your last name",
    email: "Email address",
    emailPlaceholder: "you@example.com",
    subject: "Subject",
    subjectPlaceholder: "Choose the subject of your message",
    subjects: { product: "A question about the cardigan", order: "My order or delivery", sizing: "Choosing my size", press: "Press and collaborations", other: "Something else" },
    orderNumber: "Order number",
    optional: "optional",
    orderPlaceholder: "E.g. PL-1024",
    message: "Your message",
    messagePlaceholder: "How can we help?",
    maxLength: "5,000",
    consent: "I agree that my information may be used to respond to my request, in accordance with the",
    privacy: "privacy policy",
    honeypot: "Leave this field empty",
    sendingShort: "Sending…",
    send: "Send message",
  },
};

export default function ContactForm() {
  const lang = useLang();
  const t = TEXT[lang];
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const update = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.type === "checkbox" ? target.checked : target.value }));

  async function submit(event) {
    event.preventDefault();
    if (status.type === "loading") return;
    setStatus({ type: "loading", message: t.sending });
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, locale: lang }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || t.failed);
      setForm(initialForm);
      setStatus({ type: "success", message: result.message });
    } catch (error) {
      setStatus({ type: "error", message: error.message || t.failedRetry });
    }
  }

  return <form className="pl-contact-form" onSubmit={submit}>
    <div className="pl-contact-form-head"><span>{t.head}</span><span aria-hidden="true">01 — 06</span></div>
    <div className="pl-contact-row">
      <label className="pl-contact-field"><span>{t.firstName}</span><input name="firstName" value={form.firstName} onChange={update} autoComplete="given-name" maxLength="80" required placeholder={t.firstNamePlaceholder} /></label>
      <label className="pl-contact-field"><span>{t.lastName}</span><input name="lastName" value={form.lastName} onChange={update} autoComplete="family-name" maxLength="80" required placeholder={t.lastNamePlaceholder} /></label>
    </div>
    <label className="pl-contact-field"><span>{t.email}</span><input name="email" value={form.email} onChange={update} type="email" autoComplete="email" maxLength="254" required placeholder={t.emailPlaceholder} /></label>
    <label className="pl-contact-field"><span>{t.subject}</span><select name="subject" value={form.subject} onChange={update} required><option value="" disabled>{t.subjectPlaceholder}</option>{Object.entries(t.subjects).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label className="pl-contact-field"><span>{t.orderNumber} <small>{t.optional}</small></span><input name="orderNumber" value={form.orderNumber} onChange={update} autoComplete="off" maxLength="80" placeholder={t.orderPlaceholder} /></label>
    <label className="pl-contact-field pl-contact-message"><span>{t.message}</span><textarea name="message" value={form.message} onChange={update} minLength="10" maxLength="5000" required rows="6" placeholder={t.messagePlaceholder} /><small>{form.message.length} / {t.maxLength}</small></label>
    <label className="pl-contact-consent"><input name="consent" type="checkbox" checked={form.consent} onChange={update} required /><span>{t.consent} <Link href={localePath(lang, "/politique-de-confidentialite")}>{t.privacy}</Link>.</span></label>
    <label className="pl-contact-honeypot" aria-hidden="true">{t.honeypot}<input name="website" value={form.website} onChange={update} tabIndex="-1" autoComplete="off" /></label>
    <div className="pl-contact-submit"><button type="submit" disabled={status.type === "loading"}><span>{status.type === "loading" ? t.sendingShort : t.send}</span><span aria-hidden="true">↗</span></button><p className={`pl-contact-status is-${status.type}`} role="status" aria-live="polite">{status.message}</p></div>
  </form>;
}

