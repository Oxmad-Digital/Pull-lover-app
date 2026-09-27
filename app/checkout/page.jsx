"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Image from "next/image";
import { useCart } from "@/app/components/CartContext";
import { ButtonPrimary } from "@/app/components/ui/Button";
import { applicablePromo, computeTotals, formatEuro, PROMO_STORAGE_KEY, readStoredPromo } from "@/app/lib/pricing.mjs";
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

const SERVICE_POINT_SCRIPT = "https://embed.sendcloud.sc/spp/1.0.0/api.min.js";

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

function PinIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

// Libellés lisibles pour le client (les noms Sendcloud type "Chrono 13" ne lui parlent pas)
function shippingLabel(m) {
  if (m.servicePoint) return `${m.carrierLabel} — ${m.name.replace(new RegExp(`^${m.carrierLabel}\\s*`, "i"), "")}`;
  return m.carrier === "colissimo"
    ? "Colissimo — Livraison à domicile contre signature"
    : `${m.carrierLabel} — Livraison express à domicile`;
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
  const [phone, setPhone] = useState("");
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
  // PaymentIntent déjà débité dont la commande n'a pas pu être enregistrée :
  // une nouvelle tentative ne doit relancer que l'enregistrement, jamais un second paiement.
  const [paidIntentId, setPaidIntentId] = useState(null);

  useEffect(() => {
    const stored = readStoredPromo();
    if (stored) setAppliedPromo(stored);
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
        (errors) => {
          // "Closed" = le client a simplement fermé le widget, ce n'est pas une erreur
          if (Array.isArray(errors) && errors.every((e) => e === "Closed")) return;
          console.error("SERVICE POINT ERROR:", errors);
        }
      );
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const livraison = selectedMethod?.price ?? null; // tarif réel Sendcloud, recalculé côté serveur au paiement
  // Même calcul que le serveur : le montant affiché est celui qui sera débité
  const activePromo = applicablePromo(appliedPromo, cartTotal);
  const { discount: promoDiscount, tva, total } = computeTotals({ subtotal: cartTotal, promo: activePromo, shipping: livraison ?? 0 });
  const fmt = formatEuro;
  const totalQty = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!firstname || !lastname || !email || !city || !address || !postalCode || !phone) {
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
    if (selectedMethod.price == null) {
      setErrorMsg("Tarif d'expédition indisponible pour ce mode de livraison.");
      return;
    }
    if (!stripe || !elements) {
      setErrorMsg("Stripe n'est pas encore chargé. Réessayez.");
      return;
    }

    setLoading(true);

    const orderPayload = () => ({
      customer: { firstname, lastname, email, phone, company, city, address, postalCode, country },
      cartItems: cartItems.map((i) => ({ _id: i._id, quantity: i.quantity, size: i.size, color: i.color })),
      delivery: {
        optionKey: selectedMethod.key,
        countryCode,
        servicePoint: selectedMethod.servicePoint ? servicePoint : null,
      },
      promoCode: activePromo?.code || null,
    });

    try {
      let paymentIntentId = paidIntentId;

      if (!paymentIntentId) {
        // 1. Créer le PaymentIntent côté serveur
        const piRes = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cartItems: cartItems.map((i) => ({ _id: i._id, quantity: i.quantity, size: i.size, color: i.color })),
            promoCode: activePromo?.code || null,
            customerEmail: email,
            delivery: {
              optionKey: selectedMethod.key,
              countryCode,
              servicePoint: selectedMethod.servicePoint ? servicePoint : null,
            },
          }),
        });
        const piData = await piRes.json();
        if (!piRes.ok) {
          setErrorMsg(piData.message || "Erreur lors de la création du paiement.");
          return;
        }
        // Garde-fou : ne jamais débiter un montant différent de celui affiché
        if (Math.abs(Number(piData.total) - total) > 0.005) {
          setErrorMsg(`Le montant de votre commande a été mis à jour (${fmt(Number(piData.total))} €). Vérifiez le récapitulatif puis validez à nouveau.`);
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
        paymentIntentId = paymentIntent.id;
        setPaidIntentId(paymentIntentId);
      }

      // 3. Créer la commande en base (idempotent côté serveur pour un même paiement)
      let orderRes;
      try {
        orderRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...orderPayload(), stripePaymentId: paymentIntentId }),
        });
      } catch {
        setErrorMsg("Votre paiement a bien été reçu mais la commande n'a pas pu être enregistrée (connexion). Cliquez à nouveau pour finaliser : vous ne serez pas débité une seconde fois.");
        return;
      }
      const orderData = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok) {
        setErrorMsg(`Votre paiement a bien été reçu mais la commande n'a pas pu être enregistrée : ${orderData.message || "erreur serveur"}. Cliquez à nouveau pour réessayer (sans nouveau débit) ou contactez-nous avec la référence ${paymentIntentId}.`);
        return;
      }

      setPaidIntentId(null);
      clearCart();
      localStorage.removeItem(PROMO_STORAGE_KEY);
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

        <header className="checkout-header" data-reveal-stagger>
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
          <form className="checkout-left" onSubmit={handleSubmit} data-reveal-stagger>

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
              <label className="checkout-label" htmlFor="checkout-phone">Téléphone</label>
              <input id="checkout-phone" type="tel" placeholder="Téléphone (pour le transporteur)" aria-label="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} className="checkout-input" required />
              <div className="checkout-row">
                <div className="checkout-field">
                  <label className="checkout-label" htmlFor="checkout-postal-code">Code postal</label>
                  <input id="checkout-postal-code" type="text" placeholder="Code postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="checkout-input" required />
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
              {[
                { mode: "home", title: "Livraison à domicile", methods: shippingMethods.filter((m) => !m.servicePoint) },
                { mode: "relay", title: "Point relais", methods: shippingMethods.filter((m) => m.servicePoint) },
              ].filter((g) => g.methods.length > 0).map((g) => (
                <div key={g.mode} className="checkout-shipping-group">
                  <p className="checkout-shipping-group-title">
                    {g.mode === "relay" && <PinIcon />}
                    {g.title}
                  </p>
                  {g.methods.map((m) => (
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
                          {shippingLabel(m)}
                          {m.leadTimeDays ? ` (~${m.leadTimeDays} j)` : ""}
                          {m.price != null ? ` — ${fmt(m.price)} €` : ""}
                        </span>
                      </label>
                      {shippingId === m.key && m.servicePoint && (
                        <div style={{ margin: "8px 0 4px" }}>
                          <button type="button" className="checkout-relay-btn" onClick={openServicePointPicker}>
                            <PinIcon />
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
              {loading
                ? "Traitement en cours…"
                : paidIntentId
                  ? <>Finaliser la commande (déjà payée) <span aria-hidden="true">→</span></>
                  : <>Payer {fmt(total)} € <span aria-hidden="true">→</span></>}
            </ButtonPrimary>

          </form>

          {/* COLONNE DROITE — Résumé */}
          <div className="checkout-right" data-reveal-stagger>

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
                <span>{fmt(cartTotal)} €</span>
              </div>
              {activePromo && (
                <div className="checkout-summary-row checkout-summary-discount">
                  <span>Remise ({activePromo.code})</span>
                  <span>−{fmt(promoDiscount)} €</span>
                </div>
              )}
              <div className="checkout-summary-row">
                <span>TVA (20%)</span>
                <span>{fmt(tva)} €</span>
              </div>
              <div className="checkout-summary-row">
                <span>Livraison</span>
                <span>{livraison == null ? "—" : `${fmt(livraison)} €`}</span>
              </div>
              <div className="checkout-summary-divider" />
              <div className="checkout-summary-row checkout-summary-total">
                <span>Total</span>
                <span>{fmt(total)} €</span>
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
