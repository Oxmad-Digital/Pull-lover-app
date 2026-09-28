"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { passwordHint, validatePassword } from "@/app/lib/password";
import { useLang } from "@/app/i18n/I18nProvider";

const TEXT = {
  fr: {
    hidePassword: "Masquer le mot de passe",
    showPassword: "Afficher le mot de passe",
    uploadError: "Erreur lors de l'upload",
    avatarUpdated: "Photo de profil mise à jour.",
    saveError: "Erreur lors de la sauvegarde",
    networkError: "Erreur réseau.",
    profileUpdated: "Profil mis à jour.",
    mismatch: "Les mots de passe ne correspondent pas.",
    tooWeak: (hint) => `Mot de passe trop faible : ${hint}.`,
    passwordChanged: "Mot de passe modifié.",
    title: "Mon profil",
    avatar: "Photo de profil",
    uploading: "Upload…",
    chooseImage: "Choisir une image",
    imageHint: "JPG, PNG ou WEBP · max 5 Mo",
    personalInfo: "Informations personnelles",
    fullName: "Nom complet",
    email: "Email",
    emailHint: "L'email ne peut pas être modifié.",
    phone: "Téléphone",
    phonePlaceholder: "ex : +33 6 12 34 56 78",
    saving: "Enregistrement…",
    save: "Enregistrer",
    changePassword: "Changer le mot de passe",
    currentPassword: "Mot de passe actuel",
    newPassword: "Nouveau mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    changing: "Modification…",
    change: "Modifier le mot de passe",
  },
  en: {
    hidePassword: "Hide password",
    showPassword: "Show password",
    uploadError: "Upload failed",
    avatarUpdated: "Profile photo updated.",
    saveError: "Could not save",
    networkError: "Network error.",
    profileUpdated: "Profile updated.",
    mismatch: "Passwords don’t match.",
    tooWeak: (hint) => `Password too weak: ${hint}.`,
    passwordChanged: "Password changed.",
    title: "My profile",
    avatar: "Profile photo",
    uploading: "Uploading…",
    chooseImage: "Choose an image",
    imageHint: "JPG, PNG or WEBP · max 5 MB",
    personalInfo: "Personal information",
    fullName: "Full name",
    email: "Email",
    emailHint: "Your email can’t be changed.",
    phone: "Phone",
    phonePlaceholder: "e.g. +33 6 12 34 56 78",
    saving: "Saving…",
    save: "Save",
    changePassword: "Change password",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    changing: "Updating…",
    change: "Change password",
  },
};

// Formate un numéro en +33 X XX XX XX XX (France) au fil de la saisie.
function formatPhone(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("0033")) d = d.slice(4);
  else if (d.startsWith("33")) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  d = d.slice(0, 9);
  const parts = [d.slice(0, 1), ...(d.slice(1).match(/.{1,2}/g) || [])];
  return "+33 " + parts.join(" ");
}

function PasswordInput({ value, onChange, ...props }) {
  const t = TEXT[useLang()];
  const [visible, setVisible] = useState(false);
  return (
    <div className="db-pw-wrap">
      <input
        className="db-form-input db-pw-input"
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        {...props}
      />
      <button
        type="button"
        className="db-pw-toggle"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? t.hidePassword : t.showPassword}
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const lang = useLang();
  const t = TEXT[lang];
  const { data: session, update } = useSession();

  const [form, setForm] = useState({
    name: session?.user?.name || "",
    phone: "",
  });
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [infoMsg, setInfoMsg] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState(null);

  useEffect(() => {
    fetch("/api/user/me")
      .then(r => r.json())
      .then(data => { if (data.avatar) setAvatar(data.avatar);
        if (data.phone) setForm(f => ({ ...f, phone: formatPhone(data.phone) }));
      })
      .catch(() => {});
  }, []);

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    setAvatarMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "avatar");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setAvatarMsg({ type: "error", text: uploadData.message || t.uploadError });
        return;
      }
      const saveRes = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: uploadData.url, avatarKey: uploadData.key }),
      });
      if (saveRes.ok) {
        setAvatar(uploadData.url);
        setAvatarMsg({ type: "success", text: t.avatarUpdated });
      } else {
        const saveData = await saveRes.json();
        setAvatarMsg({ type: "error", text: saveData.message || t.saveError });
      }
    } catch {
      setAvatarMsg({ type: "error", text: t.networkError });
    } finally {
      setAvatarLoading(false);
    }
  }

  async function handleInfoSave(e) {
    e.preventDefault();
    setLoading(true);
    setInfoMsg(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, phone: form.phone }),
      });
      const data = await res.json();
      if (res.ok) {
        await update({ name: form.name });
        setInfoMsg({ type: "success", text: t.profileUpdated });
      } else {
        setInfoMsg({ type: "error", text: data.message });
      }
    } catch {
      setInfoMsg({ type: "error", text: t.networkError });
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: "error", text: t.mismatch });
      return;
    }
    if (!validatePassword(pwForm.newPassword).isValid) {
      setPwMsg({ type: "error", text: t.tooWeak(passwordHint(lang)) });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setPwMsg({ type: "success", text: t.passwordChanged });
      } else {
        setPwMsg({ type: "error", text: data.message });
      }
    } catch {
      setPwMsg({ type: "error", text: t.networkError });
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div>
      <h1 className="db-page-title" data-reveal>{t.title}</h1>
      <div className="db-wrapper" data-reveal-stagger>

        {/* ── Photo de profil (admin uniquement) ── */}
      {session?.user?.role === "admin" && (
        <div className="db-card">
          <p className="db-section-title">{t.avatar}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              overflow: "hidden", background: "#f5f5f4",
              border: "2px solid #e7e5e4", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {avatar ? (
                <img src={avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 32, color: "#a8a29e" }}>
                  {session.user.name?.[0]?.toUpperCase() || "A"}
                </span>
              )}
            </div>
            <div>
              <label style={{
                display: "inline-block", padding: "9px 18px",
                background: "#252323", color: "#fff", borderRadius: 8,
                fontSize: 13, fontWeight: 600,
                cursor: avatarLoading ? "not-allowed" : "pointer",
                opacity: avatarLoading ? 0.6 : 1,
              }}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={handleAvatarUpload}
                  disabled={avatarLoading}
                />
                {avatarLoading ? t.uploading : t.chooseImage}
              </label>
              <p style={{ fontSize: 12, color: "#a8a29e", marginTop: 6 }}>{t.imageHint}</p>
            </div>
          </div>
          {avatarMsg && (
            <p className={avatarMsg.type === "success" ? "db-form-success" : "db-form-error"} style={{ marginTop: 12 }}>
              {avatarMsg.text}
            </p>
          )}
        </div>
      )}

      {/* ── Informations ── */}
        <div className="db-card">
          <p className="db-section-title">{t.personalInfo}</p>
          <form onSubmit={handleInfoSave} className="db-form">

            <div className="db-form-row">
              <label className="db-form-label">{t.fullName}</label>
              <input
                className="db-form-input"
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                minLength={2}
              />
            </div>

            <div className="db-form-row">
              <label className="db-form-label">{t.email}</label>
              <input
                className="db-form-input db-form-input-disabled"
                type="email"
                value={session?.user?.email || ""}
                disabled
              />
              <span className="db-form-hint">{t.emailHint}</span>
            </div>

            <div className="db-form-row">
              <label className="db-form-label">{t.phone}</label>
              <input
                className="db-form-input"
                type="tel"
                placeholder={t.phonePlaceholder}
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))}
              />
            </div>

            {infoMsg && (
              <p className={infoMsg.type === "success" ? "db-form-success" : "db-form-error"}>
                {infoMsg.text}
              </p>
            )}

            <button className="db-form-btn" type="submit" disabled={loading}>
              {loading ? t.saving : t.save}
            </button>
          </form>
        </div>

        {/* ── Mot de passe ── */}
        <div className="db-card">
          <p className="db-section-title">{t.changePassword}</p>
          <form onSubmit={handlePasswordSave} className="db-form">

            <div className="db-form-row">
              <label className="db-form-label">{t.currentPassword}</label>
              <PasswordInput
                value={pwForm.currentPassword}
                onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                required
              />
            </div>

            <div className="db-form-row">
              <label className="db-form-label">{t.newPassword}</label>
              <PasswordInput
                value={pwForm.newPassword}
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                required
                minLength={8}
              />
            </div>

            <div className="db-form-row">
              <label className="db-form-label">{t.confirmPassword}</label>
              <PasswordInput
                value={pwForm.confirmPassword}
                onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                required
              />
            </div>

            {pwMsg && (
              <p className={pwMsg.type === "success" ? "db-form-success" : "db-form-error"}>
                {pwMsg.text}
              </p>
            )}

            <button className="db-form-btn" type="submit" disabled={pwLoading}>
              {pwLoading ? t.changing : t.change}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
