"use client";
import { useState } from "react";
import { MAX_COLORS, MAX_IMAGES_PER_COLOR, mediaUrl } from "@/app/lib/product-colors.mjs";

const move = (list, from, to) => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
};

/**
 * Couleurs du produit : nom FR/EN, code de la pastille et photos (clés R2) dans l'ordre d'affichage.
 * La 1re couleur est celle sélectionnée à l'ouverture de la fiche, la 1re photo de chaque couleur sa photo principale.
 * `onChange` reçoit une fonction (prev => next), comme un setState : un upload qui se termine
 * n'écrase pas les modifications faites pendant qu'il tournait.
 */
export default function ProductColorsField({ colors, onChange, onUploadingChange }) {
  const [uploadingId, setUploadingId] = useState(null);
  const [error, setError] = useState("");

  const update = (id, patch) => onChange((prev) => prev.map((color) => (color.id === id ? { ...color, ...patch(color) } : color)));
  const updateName = (id, lang, value) => update(id, (color) => ({ name: { ...color.name, [lang]: value } }));
  const updateImages = (id, fn) => update(id, (color) => ({ images: fn(color.images) }));

  const addColor = () => onChange((prev) => [
    ...prev,
    { id: crypto.randomUUID(), code: "#cccccc", name: { fr: "", en: "" }, images: [] },
  ]);

  const removeColor = (color) => {
    const label = color.name.fr || "cette couleur";
    if (!window.confirm(`Retirer ${label} et ses ${color.images.length} photo(s) de la fiche ?`)) return;
    onChange((prev) => prev.filter((item) => item.id !== color.id));
  };

  const upload = async (color, files) => {
    const room = MAX_IMAGES_PER_COLOR - color.images.length;
    if (files.length > room) {
      setError(`${MAX_IMAGES_PER_COLOR} photos maximum par couleur.`);
      files = files.slice(0, Math.max(0, room));
    }
    if (files.length === 0) return;

    setUploadingId(color.id);
    onUploadingChange(true);
    setError("");
    const keys = [];
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "product");
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Erreur upload");
        keys.push(data.key);
      }
    } catch (err) {
      setError(`Upload interrompu : ${err.message}`);
    } finally {
      // Les photos déjà envoyées sont gardées, même si une suivante a échoué
      if (keys.length) updateImages(color.id, (images) => [...images, ...keys]);
      setUploadingId(null);
      onUploadingChange(false);
    }
  };

  return (
    <fieldset className="form-colors">
      <legend className="form-label">Couleurs et photos</legend>
      <small className="form-hint">
        Une pastille par couleur sur la fiche. La 1re couleur est affichée à l’ouverture ; la 1re photo de chaque couleur est sa photo principale.
      </small>

      {colors.map((color, index) => (
        <div className="color-card" key={color.id}>
          <div className="color-card-head">
            <input
              type="color"
              value={color.code}
              onChange={(e) => update(color.id, () => ({ code: e.target.value }))}
              aria-label="Couleur de la pastille"
              title="Couleur de la pastille"
            />
            <input
              placeholder="Nom (FR) — ex. Vert forêt"
              value={color.name.fr}
              onChange={(e) => updateName(color.id, "fr", e.target.value)}
              aria-label="Nom de la couleur en français"
              maxLength={60}
              required
            />
            <input
              placeholder="Nom (EN) — ex. Forest green"
              value={color.name.en}
              onChange={(e) => updateName(color.id, "en", e.target.value)}
              aria-label="Nom de la couleur en anglais"
              maxLength={60}
            />
            <div className="color-card-actions">
              <button type="button" onClick={() => onChange((prev) => move(prev, index, index - 1))} disabled={index === 0} aria-label="Monter la couleur">↑</button>
              <button type="button" onClick={() => onChange((prev) => move(prev, index, index + 1))} disabled={index === colors.length - 1} aria-label="Descendre la couleur">↓</button>
              <button type="button" className="color-remove" onClick={() => removeColor(color)} aria-label="Retirer la couleur">✕</button>
            </div>
          </div>

          <div className="image-previews">
            {color.images.map((key, imageIndex) => (
              <div key={key} className="image-preview-item">
                {/* eslint-disable-next-line @next/next/no-img-element -- aperçu admin */}
                <img src={mediaUrl(key)} alt={`${color.name.fr || "Couleur"} — photo ${imageIndex + 1}`} />
                {imageIndex === 0 && <span className="image-main-badge">Principale</span>}
                <div className="image-move">
                  <button type="button" disabled={imageIndex === 0} aria-label="Déplacer la photo vers la gauche"
                    onClick={() => updateImages(color.id, (images) => move(images, imageIndex, imageIndex - 1))}>←</button>
                  <button type="button" disabled={imageIndex === color.images.length - 1} aria-label="Déplacer la photo vers la droite"
                    onClick={() => updateImages(color.id, (images) => move(images, imageIndex, imageIndex + 1))}>→</button>
                </div>
                <button type="button" className="remove-image-btn" aria-label="Retirer la photo"
                  onClick={() => updateImages(color.id, (images) => images.filter((item) => item !== key))}>✕</button>
              </div>
            ))}
          </div>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploadingId !== null || color.images.length >= MAX_IMAGES_PER_COLOR}
            onChange={(e) => { upload(color, Array.from(e.target.files)); e.target.value = ""; }}
            aria-label={`Ajouter des photos à ${color.name.fr || "cette couleur"}`}
          />
          <p className="image-count">
            {uploadingId === color.id ? "⏳ Upload en cours…" : `${color.images.length} photo(s)`}
            {color.images.length === 0 && " — une couleur sans photo n’apparaît pas sur la fiche"}
          </p>
        </div>
      ))}

      {error && <p className="form-message error">{error}</p>}
      {colors.length < MAX_COLORS && (
        <button type="button" className="btn-add-color" onClick={addColor} disabled={uploadingId !== null}>
          + Ajouter une couleur
        </button>
      )}
    </fieldset>
  );
}
