"use client";
import { useState } from "react";
import "./ProductForm.css";

export default function ProductForm({
  categories,
  onSave,
  editingProduct,
  onCancel,
}) {
  const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

  const initStocksBySize = () => {
    const existing = editingProduct?.stocks || {};
    return Object.fromEntries(ALL_SIZES.map((s) => [s, existing[s] ?? 0]));
  };

  const [name, setName] = useState(editingProduct?.name || "Le Mantasoa");
  const [stocksBySize, setStocksBySize] = useState(initStocksBySize);
  const [description, setDescription] = useState(editingProduct?.description || "");
  const [details, setDetails] = useState(editingProduct?.details || "");
  const [careInstructions, setCareInstructions] = useState(editingProduct?.careInstructions || "");
  const [fitInfo, setFitInfo] = useState(editingProduct?.fitInfo || "");
  const [shippingInfo, setShippingInfo] = useState(editingProduct?.shippingInfo || "");
  const [color, setColor] = useState(editingProduct?.color || "");
  const [price, setPrice] = useState(editingProduct?.price || "");
  const [weight, setWeight] = useState(editingProduct?.weight || "");
  const [promoPrice, setPromoPrice] = useState(editingProduct?.promoPrice || "");

  const [uploadedUrls, setUploadedUrls] = useState(
    editingProduct?.images || (editingProduct?.image ? [editingProduct.image] : [])
  );
  const [uploadedKeys, setUploadedKeys] = useState(
    editingProduct?.imageKeys || []
  );
  const [imagePreviews, setImagePreviews] = useState(
    editingProduct?.images || (editingProduct?.image ? [editingProduct.image] : [])
  );

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // ✅ Upload immédiat sur R2
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setMsg("📤 Upload en cours...");

    try {
      for (const file of files) {
        const localPreview = URL.createObjectURL(file);
        setImagePreviews((prev) => [...prev, localPreview]);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "product");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          setMsg("❌ Erreur upload: " + data.message);
          setUploading(false);
          return;
        }

        setImagePreviews((prev) => [...prev.slice(0, -1), data.url]);
        setUploadedUrls((prev) => [...prev, data.url]);
        setUploadedKeys((prev) => [...prev, data.key]);
      }

      setMsg("✅ Images uploadées !");
    } catch (err) {
      setMsg("❌ Erreur: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setUploadedUrls((prev) => prev.filter((_, i) => i !== index));
    setUploadedKeys((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ Envoie du JSON pur
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (uploading) {
      setMsg("⏳ Attendez la fin de l'upload...");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      // ✅ Objet JSON simple
      const stocks = Object.fromEntries(
        ALL_SIZES.map((s) => [s, Number(stocksBySize[s] || 0)])
      );
      const stock = Object.values(stocks).reduce((sum, v) => sum + v, 0);
      const sizes = ALL_SIZES.filter((s) => stocks[s] > 0);

      const body = {
        name,
        brand: editingProduct?.brand || "",
        sizes,
        size: sizes[0] || "",
        stocks,
        stock,
        description,
        details,
        careInstructions,
        fitInfo,
        shippingInfo,
        color,
        price: Number(price),
        promoPrice: promoPrice ? Number(promoPrice) : null,
        weight: weight ? Number(weight) : 0,
        category: editingProduct?.category?._id || null,
        images: uploadedUrls,
        image: uploadedUrls[0] || "",
        imageKeys: uploadedKeys,
      };

      if (editingProduct?._id) body._id = editingProduct._id;

      // ✅ onSave reçoit un objet JSON, pas un FormData
      await onSave(body);
      setMsg("✅ Produit enregistré !");

    } catch (err) {
      setMsg("❌ Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <div className="form-field">
        <label className="form-label">Nom du produit <span className="form-required">*</span></label>
        <input
          placeholder="Le Mantasoa"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <small className="form-hint">Le nom doit contenir « Mantasoa » pour être relié à la fiche produit.</small>
      </div>

      <div className="stocks-field">
        <label className="stocks-label">Stock par taille</label>
        <div className="stocks-grid">
          {ALL_SIZES.map((s) => (
            <div key={s} className="stock-size-item">
              <span className="stock-size-label">{s}</span>
              <input
                type="number"
                min={0}
                value={stocksBySize[s]}
                onChange={(e) =>
                  setStocksBySize((prev) => ({
                    ...prev,
                    [s]: Math.max(0, parseInt(e.target.value) || 0),
                  }))
                }
              />
            </div>
          ))}
        </div>
        <p className="stock-total">
          Total :{" "}
          <strong>
            {ALL_SIZES.reduce((sum, s) => sum + Number(stocksBySize[s] || 0), 0)}
          </strong>{" "}
          article(s)
        </p>
      </div>

      <div className="form-field">
        <label className="form-label">Description</label>
        <textarea
          placeholder="Décrivez le produit…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="form-field">
        <label className="form-label">Détails du produit</label>
        <textarea
          placeholder="Composition, matières, coupe…"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
        />
      </div>

      <div className="form-field">
        <label className="form-label">Entretien et lavage</label>
        <textarea
          placeholder="Lavage à 30°C, ne pas sécher en machine…"
          value={careInstructions}
          onChange={(e) => setCareInstructions(e.target.value)}
          rows={3}
        />
      </div>

      <div className="form-field">
        <label className="form-label">Coupe et taille</label>
        <textarea
          placeholder="Coupe droite, prenez votre taille habituelle…"
          value={fitInfo}
          onChange={(e) => setFitInfo(e.target.value)}
          rows={3}
        />
      </div>

      <div className="form-field">
        <label className="form-label">Livraison et retours</label>
        <textarea
          placeholder="Confection après commande, retours sous 14 jours…"
          value={shippingInfo}
          onChange={(e) => setShippingInfo(e.target.value)}
          rows={3}
        />
      </div>

      <div className="form-field">
        <label className="form-label">Couleur</label>
        <input
          placeholder="Écru naturel"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="form-label">Prix <span className="form-required">*</span></label>
          <input
            type="number"
            placeholder="Ex : 120"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label className="form-label">Prix promo</label>
          <input
            type="number"
            placeholder="Optionnel"
            value={promoPrice}
            onChange={(e) => setPromoPrice(e.target.value)}
          />
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Poids d&apos;expédition (kg)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Ex : 0.45 — emballage inclus"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
      </div>

      {/* Upload images */}
      <div className="image-upload-section">
        <label>Images du produit</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          disabled={uploading}
        />
        {uploading && (
          <p style={{ color: "#C75C5C", marginTop: "8px", fontSize: "13px", fontWeight: "500" }}>
            ⏳ Upload en cours...
          </p>
        )}
        <p className="image-count">
          {uploadedUrls.length} image(s) sur R2 ✅
        </p>
      </div>

      {/* Prévisualisation */}
      {imagePreviews.length > 0 && (
        <div className="image-previews">
          {imagePreviews.map((src, index) => (
            <div key={index} className="image-preview-item">
              <img src={src} alt={`Preview ${index + 1}`} />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="remove-image-btn"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="form-buttons">
        <button
          type="submit"
          disabled={loading || uploading}
          className="btn-submit"
        >
          {loading ? "Enregistrement..." : uploading ? "Upload..." : "Enregistrer"}
        </button>
        <button type="button" onClick={onCancel} className="btn-cancel">
          Annuler
        </button>
      </div>

      {msg && (
        <p className={`form-message ${msg.includes("✅") ? "success" : "error"}`}>
          {msg}
        </p>
      )}
    </form>
  );
}