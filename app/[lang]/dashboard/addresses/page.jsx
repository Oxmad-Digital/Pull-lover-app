"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/app/i18n/I18nProvider";

const TEXT = {
  fr: {
    networkError: "Erreur réseau.",
    title: "Mon adresse",
    section: "Adresse de livraison",
    street: "Rue et numéro",
    streetPlaceholder: "ex : 12 rue de la Paix",
    postalCode: "Code postal",
    postalPlaceholder: "ex : 75001",
    city: "Ville",
    cityPlaceholder: "ex : Paris",
    country: "Pays",
    countryPlaceholder: "ex : France",
    saving: "Enregistrement…",
    save: "Enregistrer l'adresse",
  },
  en: {
    networkError: "Network error.",
    title: "My address",
    section: "Shipping address",
    street: "Street and number",
    streetPlaceholder: "e.g. 12 Baker Street",
    postalCode: "Postcode",
    postalPlaceholder: "e.g. NW1 6XE",
    city: "City",
    cityPlaceholder: "e.g. London",
    country: "Country",
    countryPlaceholder: "e.g. United Kingdom",
    saving: "Saving…",
    save: "Save address",
  },
};

export default function AddressesPage() {
  const t = TEXT[useLang()];
  const [form, setForm] = useState({
    street: "",
    city: "",
    postalCode: "",
    country: "France",
  });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch("/api/user/me")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.address?.street) {
          setForm({
            street: data.address.street || "",
            city: data.address.city || "",
            postalCode: data.address.postalCode || "",
            country: data.address.country || "France",
          });
        }
      })
      .finally(() => setFetching(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/user/address", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setMsg({ type: res.ok ? "success" : "error", text: data.message });
    } catch {
      setMsg({ type: "error", text: t.networkError });
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div>
        <h1 className="db-page-title" data-reveal>{t.title}</h1>
        <div className="db-wrapper" data-reveal-stagger>
          <div className="db-loading"><div className="db-spinner" /></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="db-page-title" data-reveal>{t.title}</h1>
      <div className="db-wrapper" data-reveal-stagger>
        <div className="db-card">
          <p className="db-section-title">{t.section}</p>
          <form onSubmit={handleSave} className="db-form">

            <div className="db-form-row">
              <label className="db-form-label">{t.street}</label>
              <input
                className="db-form-input"
                type="text"
                placeholder={t.streetPlaceholder}
                value={form.street}
                onChange={e => setForm(f => ({ ...f, street: e.target.value }))}
                required
              />
            </div>

            <div className="db-form-grid">
              <div className="db-form-row">
                <label className="db-form-label">{t.postalCode}</label>
                <input
                  className="db-form-input"
                  type="text"
                  placeholder={t.postalPlaceholder}
                  value={form.postalCode}
                  onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))}
                  required
                />
              </div>
              <div className="db-form-row">
                <label className="db-form-label">{t.city}</label>
                <input
                  className="db-form-input"
                  type="text"
                  placeholder={t.cityPlaceholder}
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="db-form-row">
              <label className="db-form-label">{t.country}</label>
              <input
                className="db-form-input"
                type="text"
                placeholder={t.countryPlaceholder}
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
              />
            </div>

            {msg && (
              <p className={msg.type === "success" ? "db-form-success" : "db-form-error"}>
                {msg.text}
              </p>
            )}

            <button className="db-form-btn" type="submit" disabled={loading}>
              {loading ? t.saving : t.save}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
