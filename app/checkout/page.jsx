"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Image from "next/image";
import { useCart } from "@/app/components/CartContext";
import { ButtonPrimary } from "@/app/components/ui/Button";
import "./checkout.css";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const CARD_ELEMENT_OPTIONS = {
  hidePostalCode: true,
  style: {
    base: {
      fontSize: "14px",
      fontFamily: "Arial, Helvetica, sans-serif",
      color: "#243b3b",
      "::placeholder": { color: "#8b8181" },
    },
    invalid: { color: "#ef4444" },
  },
};

const COUNTRIES = [
  { code: "FR", name: "France" },
  { code: "BE", name: "Belgique" },
  { code: "CH", name: "Suisse" },
  { code: "LU", name: "Luxembourg" },
  { code: "DE", name: "Allemagne" },
  { code: "ES", name: "Espagne" },
  { code: "IT", name: "Italie" },
  { code: "NL", name: "Pays-Bas" },
  { code: "PT", name: "Portugal" },
  { code: "GB", name: "Royaume-Uni" },
];

const SERVICE_POINT_SCRIPT = "https://embed.sendcloud.sc/spp/1.0.0/api/v1/service-point-picker.min.js";

function loadServicePointScript() {
  return new Promise((resolve, reject) => {
    if (window.sendcloud) return resolve();
    const existing = document.querySelector(`script[src="${SERVICE_POINT_SCRIPT}"]`);
    const script = existing || document.createElement("script");
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("Widget points relais indisponible")));
    if (!existing) {
      script.src = SERVICE_POINT_SCRIPT;
      document.body.appendChild(script);
    }
  });
}

function CheckoutInner() {
  const router = useRouter();
  const { cartItems, cartTotal, clearCart } = useCart();
  const stripe = useStripe();
  const elements = useElements();

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("FR");
  const country = COUNTRIES.find((c) => c.code === countryCode)?.name || countryCode;
  const [shippingMethods, setShippingMethods] = useState([]);
  const [shippingLoading, setShippingLoading] = useState(true);
  const [shippingError, setShippingError] = useState("");
  const [sendcloudKey, setSendcloudKey] = useState("");
  const [shippingId, setShippingId] = useState(null);
  const [servicePoint, setServicePoint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pull-lover-promo");
      if (stored) {
        const parsed = JSON.parse(stored);
        const expired = Date.now() - (parsed.savedAt || 0) > 24 * 60 * 60 * 1000;
        if (expired) {
          localStorage.removeItem("pull-lover-promo");
        } else {
          setAppliedPromo(parsed);
        }
      }
    } catch {}
  }, []);

  // Modes d'expédition SendCloud selon le pays
  useEffect(() => {
    let cancelled = false;
    setShippingLoading(true);
    setShippingError("");
    setShippingId(null);
    setServicePoint(null);
    fetch("/api/shipping-methods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        country: countryCode,
        items: cartItems.map((i) => ({ _id: i._id, quantity: i.quantity })),
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Modes d'expédition indisponibles");
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setShippingMethods(data.options);
        setSendcloudKey(data.publicKey);
        if (data.options.length === 0) setShippingError("Aucun mode d'expédition disponible pour ce pays.");
        else setShippingId(data.options[0].key);
      })
      .catch((err) => {
        if (cancelled) return;
        setShippingMethods([]);
        setShippingError(err.message);
      })
      .finally(() => !cancelled && setShippingLoading(false));
    return () => { cancelled = true; };
  }, [countryCode, cartItems]);

  const selectedMethod = shippingMethods.find((m) => m.key === shippingId) || null;

  const openServicePointPicker = async () => {
    if (!selectedMethod) return;
    try {
      await loadServicePointScript();
      window.sendcloud.servicePoints.open(
        {
          apiKey: sendcloudKey,
          country: countryCode.toLowerCase(),
          language: "fr-fr",
          carriers: selectedMethod.carrier,
          postalCode: postalCode || undefined,
          city: city || undefined,
        },
        (sp) =>
          setServicePoint({
            id: sp.id,
            name: sp.name,
            street: [sp.house_number, sp.street].filter(Boolean).join(" "),
            postalCode: sp.postal_code,
            city: sp.city,
          }),
        (errors) => console.error("SERVICE POINT ERROR:", errors)
      );
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const TVA_RATE = 0.20;
  const promoDiscount = appliedPromo?.discount ?? 0;
  const discountedSubtotal = Math.max(0, cartTotal - promoDiscount);
  const tva = Math.round(discountedSubtotal * TVA_RATE);
  const livraison = 25;
  const total = discountedSubtotal + tva + livraison;
  const totalQty = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!firstname || !lastname || !email || !city || !address) {
      setErrorMsg("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (!cartItems || cartItems.length === 0) {
      setErrorMsg("Votre panier est vide.");
      return;
    }
    if (!selectedMethod) {
      setErrorMsg("Veuillez choisir un mode d'expédition.");
      return;
    }
    if (selectedMethod.servicePoint && !servicePoint) {
      setErrorMsg("Veuillez choisir un point relais.");
      return;
    }
    if (!stripe || !elements) {
      setErrorMsg("Stripe n'est pas encore chargé. Réessayez.");
      return;
    }

    setLoading(true);

    try {
      // 1. Créer le PaymentIntent côté serveur
      const piRes = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, customerEmail: email }),
      });
      const piData = await piRes.json();
      if (!piRes.ok) {
        setErrorMsg(piData.message || "Erreur lors de la création du paiement.");
        return;
      }

      // 2. Confirmer le paiement avec la carte Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(piData.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: `${firstname} ${lastname}`,
            email,
            address: { city, postal_code: postalCode, country: countryCode },
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      if (paymentIntent.status !== "succeeded") {
        setErrorMsg("Le paiement n'a pas abouti. Réessayez.");
        return;
      }

      // 3. Créer la commande en base
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { firstname, lastname, email, company, city, address, postalCode, country },
          cartItems,
          total,
          payment: "card",
          delivery: {
            optionKey: selectedMethod.key,
            countryCode,
            servicePoint: selectedMethod.servicePoint ? servicePoint : null,
          },
          stripePaymentId: paymentIntent.id,
          promoCode: appliedPromo?.code || null,
          discountAmount: promoDiscount || 0,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setErrorMsg(orderData.message || "Commande non enregistrée, contactez le support.");
        return;
      }

      clearCart();
      localStorage.removeItem("pull-lover-promo");
      router.push("/success");

    } catch (err) {
      console.error("CHECKOUT ERROR:", err);
      setErrorMsg("Erreur inattendue. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-inner">

        <header className="checkout-header">
          <button className="checkout-back" type="button" onClick={() => router.back()}>
            <span aria-hidden="true">←</span> Retour au panier
          </button>
          <p className="checkout-eyebrow">Finaliser la commande</p>
          <div className="checkout-heading">
            <h1>Votre commande,<br /><span>en toute simplicité.</span></h1>
            <p>Renseignez vos coordonnées puis procédez au paiement sécurisé. Votre pièce sera préparée avec soin.</p>
          </div>
        </header>

        <div className="checkout-wrapper">

          {/* COLONNE GAUCHE */}
          <form className="checkout-left" onSubmit={handleSubmit}>

            {/* CONTACT */}
            <div className="checkout-section">
              <div className="checkout-section-heading">
                <span>01</span>
                <h2 className="checkout-section-title">Contact</h2>
              </div>
              <label className="checkout-label" htmlFor="checkout-email">Adresse e-mail</label>
              <input
                id="checkout-email"
                type="email"
                placeholder="vous@exemple.com"
                aria-label="Adresse e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="checkout-input"
                required
              />
            </div>

            {/* LIVRAISON */}
            <div className="checkout-section">
              <div className="checkout-section-heading">
                <span>02</span>
                <h2 className="checkout-section-title">Adresse de livraison</h2>
              </div>
              <label className="checkout-label" htmlFor="checkout-country">Pays / région</label>
              <select
                id="checkout-country"
                aria-label="Pays ou région"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="checkout-input"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
              <div className="checkout-row">
                <div className="checkout-field">
                  <label className="checkout-label" htmlFor="checkout-firstname">Prénom</label>
                  <input id="checkout-firstname" type="text" placeholder="Prénom" value={firstname} onChange={(e) => setFirstname(e.target.value)} className="checkout-input" required />
                </div>
                <div className="checkout-field">
                  <label className="checkout-label" htmlFor="checkout-lastname">Nom</label>
                  <input id="checkout-lastname" type="text" placeholder="Nom" value={lastname} onChange={(e) => setLastname(e.target.value)} className="checkout-input" required />
                </div>
              </div>
              <label className="checkout-label" htmlFor="checkout-company">Entreprise <span>(optionnel)</span></label>
              <input
                id="checkout-company"
                type="text"
                placeholder="Entreprise (optionnel)"
                aria-label="Entreprise (optionnel)"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="checkout-input"
              />
              <label className="checkout-label" htmlFor="checkout-address">Adresse</label>
              <input
                id="checkout-address"
                type="text"
                placeholder="Adresse"
                aria-label="Adresse"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="checkout-input"
                required
              />
              <div className="checkout-row">
                <div className="checkout-field">
                  <label className="checkout-label" htmlFor="checkout-postal-code">Code postal</label>
                  <input id="checkout-postal-code" type="text" placeholder="Code postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="checkout-input" />
                </div>
                <div className="checkout-field">
                  <label className="checkout-label" htmlFor="checkout-city">Ville</label>
                  <input id="checkout-city" type="text" placeholder="Ville" value={city} onChange={(e) => setCity(e.target.value)} className="checkout-input" required />
                </div>
              </div>
            </div>

            {/* MODE D'EXPÉDITION */}
            <div className="checkout-section">
              <div className="checkout-section-heading">
                <span>03</span>
                <h2 className="checkout-section-title">Mode d&apos;expédition</h2>
              </div>
              {shippingLoading && <p className="checkout-stripe-notice">Chargement des modes d&apos;expédition…</p>}
              {shippingError && <p className="checkout-error">{shippingError}</p>}
              {shippingMethods.map((m) => (
                <div key={m.key}>
                  <label className="checkout-radio">
                    <input
                      type="radio"
                      name="shipping"
                      value={m.key}
                      checked={shippingId === m.key}
                      onChange={() => { setShippingId(m.key); setServicePoint(null); }}
                    />
                    <span>
                      {m.name.startsWith(m.carrierLabel) ? m.name : `${m.carrierLabel} — ${m.name}`}
                      {m.leadTimeDays ? ` (~${m.leadTimeDays} j)` : ""}
                    </span>
                  </label>
                  {shippingId === m.key && m.servicePoint && (
                    <div style={{ margin: "8px 0 4px 28px" }}>
                      <button type="button" className="checkout-back" onClick={openServicePointPicker}>
                        {servicePoint ? "Changer de point relais" : "Choisir un point relais"}
                      </button>
                      {servicePoint && (
                        <p className="checkout-stripe-notice">
                          {servicePoint.name} — {servicePoint.street}, {servicePoint.postalCode} {servicePoint.city}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* PAIEMENT — Stripe Elements */}
            <div className="checkout-section">
              <div className="checkout-section-heading">
                <span>04</span>
                <h2 className="checkout-section-title">Paiement</h2>
              </div>
              <label className="checkout-label">Informations de carte</label>
              <div className="checkout-stripe-card">
                <CardElement options={CARD_ELEMENT_OPTIONS} />
              </div>
              <p className="checkout-stripe-notice">
                Paiement chiffré et sécurisé par Stripe. Vos données bancaires ne transitent jamais par nos serveurs.
              </p>
            </div>

            {errorMsg && <p className="checkout-error">{errorMsg}</p>}

            <ButtonPrimary
              full
              type="submit"
              disabled={loading || !stripe}
              className="checkout-pay-button"
            >
              {loading ? "Traitement en cours…" : <>Payer {total} € <span aria-hidden="true">→</span></>}
            </ButtonPrimary>

          </form>

          {/* COLONNE DROITE — Résumé */}
          <div className="checkout-right">

            <div className="checkout-order-heading">
              <p className="checkout-eyebrow">Votre sélection</p>
              <h2>Résumé de commande</h2>
            </div>

            <div className="checkout-items">
              {cartItems.map((item) => (
                <div key={item._id} className="checkout-item">
                  <div className="checkout-item-image">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name || ""}
                        fill
                        sizes="(max-width: 390px) 64px, (max-width: 599px) 68px, 76px"
                      />
                    )}
                  </div>
                  <div className="checkout-item-info">
                    <strong>{item.name}</strong>
                    <p>{item.description}</p>
                  </div>
                  <span className="checkout-item-price">
                    {item.promoPrice ?? item.price} €
                  </span>
                </div>
              ))}
            </div>

            <div className="checkout-summary">
              <h3 className="checkout-summary-title">Détail</h3>
              <div className="checkout-summary-row">
                <span>Sous-total ({totalQty})</span>
                <span>{cartTotal} €</span>
              </div>
              {appliedPromo && (
                <div className="checkout-summary-row checkout-summary-discount">
                  <span>Remise ({appliedPromo.code})</span>
                  <span>−{promoDiscount} €</span>
                </div>
              )}
              <div className="checkout-summary-row">
                <span>TVA (20%)</span>
                <span>{tva} €</span>
              </div>
              <div className="checkout-summary-row">
                <span>Livraison</span>
                <span>{livraison} €</span>
              </div>
              <div className="checkout-summary-divider" />
              <div className="checkout-summary-row checkout-summary-total">
                <span>Total</span>
                <span>{total} €</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutInner />
    </Elements>
  );
}
