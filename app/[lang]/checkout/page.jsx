"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Image from "next/image";
import { useCart } from "@/app/components/CartContext";
import { ButtonPrimary } from "@/app/components/ui/Button";
import { applicablePromo, computeTotals, PROMO_STORAGE_KEY, readStoredPromo } from "@/app/lib/pricing.mjs";
import { useLang } from "@/app/i18n/I18nProvider";
import { localePath } from "@/app/i18n/config.mjs";
import { countryName, formatMoney } from "@/app/i18n/format.mjs";
import { localizeProduct } from "@/app/i18n/product.mjs";
import { shippingLabel } from "@/app/lib/shipping-label";
import "./checkout.css";

const TEXT = {
  fr: {
    relayWidgetError: "Widget points relais indisponible",
    shippingUnavailable: "Modes d'expédition indisponibles",
    noShipping: "Aucun mode d'expédition disponible pour ce pays.",
    requiredFields: "Veuillez remplir tous les champs obligatoires.",
    emptyCart: "Votre panier est vide.",
    chooseShipping: "Veuillez choisir un mode d'expédition.",
    chooseRelay: "Veuillez choisir un point relais.",
    noRate: "Tarif d'expédition indisponible pour ce mode de livraison.",
    stripeLoading: "Stripe n'est pas encore chargé. Réessayez.",
    paymentCreateError: "Erreur lors de la création du paiement.",
    amountChanged: (amount) => `Le montant de votre commande a été mis à jour (${amount}). Vérifiez le récapitulatif puis validez à nouveau.`,
    paymentFailed: "Le paiement n'a pas abouti. Réessayez.",
    orderNetworkError: "Votre paiement a bien été reçu mais la commande n'a pas pu être enregistrée (connexion). Cliquez à nouveau pour finaliser : vous ne serez pas débité une seconde fois.",
    orderSaveError: (reason, reference) => `Votre paiement a bien été reçu mais la commande n'a pas pu être enregistrée : ${reason}. Cliquez à nouveau pour réessayer (sans nouveau débit) ou contactez-nous avec la référence ${reference}.`,
    serverError: "erreur serveur",
    unexpected: "Erreur inattendue. Réessayez.",
    back: "Retour au panier",
    eyebrow: "Finaliser la commande",
    title: <>Votre commande,<br /><span>en toute simplicité.</span></>,
    intro: "Renseignez vos coordonnées puis procédez au paiement sécurisé. Votre pièce sera préparée avec soin.",
    contact: "Contact",
    email: "Adresse e-mail",
    emailPlaceholder: "vous@exemple.com",
    shippingAddress: "Adresse de livraison",
    country: "Pays / région",
    countryLabel: "Pays ou région",
    firstname: "Prénom",
    lastname: "Nom",
    company: "Entreprise",
    optional: "(optionnel)",
    address: "Adresse",
    phone: "Téléphone",
    phonePlaceholder: "Téléphone (pour le transporteur)",
    postalCode: "Code postal",
    city: "Ville",
    shippingMethod: "Mode d'expédition",
    shippingLoading: "Chargement des modes d'expédition…",
    homeDelivery: "Livraison à domicile",
    relay: "Point relais",
    leadTime: (days) => ` (~${days} j)`,
    changeRelay: "Changer de point relais",
    chooseRelayButton: "Choisir un point relais",
    payment: "Paiement",
    cardInfo: "Informations de carte",
    stripeNotice: "Paiement chiffré et sécurisé par Stripe. Vos données bancaires ne transitent jamais par nos serveurs.",
    processing: "Traitement en cours…",
    finalize: "Finaliser la commande (déjà payée)",
    pay: (amount) => `Payer ${amount}`,
    selection: "Votre sélection",
    orderSummary: "Résumé de commande",
    detail: "Détail",
    subtotal: (count) => `Sous-total (${count})`,
    discount: (code) => `Remise (${code})`,
    vat: "TVA (20%)",
    shipping: "Livraison",
    total: "Total",
  },
  en: {
    relayWidgetError: "Pickup point widget unavailable",
    shippingUnavailable: "Shipping methods unavailable",
    noShipping: "No shipping method is available for this country.",
    requiredFields: "Please fill in all required fields.",
    emptyCart: "Your cart is empty.",
    chooseShipping: "Please choose a shipping method.",
    chooseRelay: "Please choose a pickup point.",
    noRate: "No shipping rate is available for this delivery method.",
    stripeLoading: "Stripe hasn't loaded yet. Please try again.",
    paymentCreateError: "Something went wrong while creating the payment.",
    amountChanged: (amount) => `Your order total has been updated (${amount}). Please check the summary and confirm again.`,
    paymentFailed: "The payment didn't go through. Please try again.",
    orderNetworkError: "Your payment was received but the order couldn't be saved (connection issue). Click again to complete it: you won't be charged a second time.",
    orderSaveError: (reason, reference) => `Your payment was received but the order couldn't be saved: ${reason}. Click again to retry (you won't be charged again) or contact us with reference ${reference}.`,
    serverError: "server error",
    unexpected: "Unexpected error. Please try again.",
    back: "Back to cart",
    eyebrow: "Checkout",
    title: <>Your order,<br /><span>made simple.</span></>,
    intro: "Enter your details, then proceed to secure payment. Your piece will be prepared with care.",
    contact: "Contact",
    email: "Email address",
    emailPlaceholder: "you@example.com",
    shippingAddress: "Shipping address",
    country: "Country / region",
    countryLabel: "Country or region",
    firstname: "First name",
    lastname: "Last name",
    company: "Company",
    optional: "(optional)",
    address: "Address",
    phone: "Phone",
    phonePlaceholder: "Phone (for the carrier)",
    postalCode: "Postcode",
    city: "City",
    shippingMethod: "Shipping method",
    shippingLoading: "Loading shipping methods…",
    homeDelivery: "Home delivery",
    relay: "Pickup point",
    leadTime: (days) => ` (~${days} day${days > 1 ? "s" : ""})`,
    changeRelay: "Change pickup point",
    chooseRelayButton: "Choose a pickup point",
    payment: "Payment",
    cardInfo: "Card details",
    stripeNotice: "Encrypted, secure payment by Stripe. Your card details never pass through our servers.",
    processing: "Processing…",
    finalize: "Complete the order (already paid)",
    pay: (amount) => `Pay ${amount}`,
    selection: "Your selection",
    orderSummary: "Order summary",
    detail: "Details",
    subtotal: (count) => `Subtotal (${count})`,
    discount: (code) => `Discount (${code})`,
    vat: "VAT (20%)",
    shipping: "Shipping",
    total: "Total",
  },
};

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

// `name` (français) est enregistré avec la commande ; l'affichage suit la langue de la page
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

function loadServicePointScript(errorMessage) {
  return new Promise((resolve, reject) => {
    if (window.sendcloud) return resolve();
    const existing = document.querySelector(`script[src="${SERVICE_POINT_SCRIPT}"]`);
    const script = existing || document.createElement("script");
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error(errorMessage)));
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

function CheckoutInner() {
  const lang = useLang();
  const t = TEXT[lang];
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
        if (!res.ok) throw new Error(data.message || t.shippingUnavailable);
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setShippingMethods(data.options);
        setSendcloudKey(data.publicKey);
        if (data.options.length === 0) setShippingError(t.noShipping);
        else setShippingId(data.options[0].key);
      })
      .catch((err) => {
        if (cancelled) return;
        setShippingMethods([]);
        setShippingError(err.message);
      })
      .finally(() => !cancelled && setShippingLoading(false));
    return () => { cancelled = true; };
  }, [countryCode, cartItems, t]);

  const selectedMethod = shippingMethods.find((m) => m.key === shippingId) || null;

  const openServicePointPicker = async () => {
    if (!selectedMethod) return;
    try {
      await loadServicePointScript(t.relayWidgetError);
      window.sendcloud.servicePoints.open(
        {
          apiKey: sendcloudKey,
          country: countryCode.toLowerCase(),
          language: lang === "en" ? "en-us" : "fr-fr",
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
  const money = (value) => formatMoney(value, lang);
  const totalQty = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!firstname || !lastname || !email || !city || !address || !postalCode || !phone) {
      setErrorMsg(t.requiredFields);
      return;
    }
    if (!cartItems || cartItems.length === 0) {
      setErrorMsg(t.emptyCart);
      return;
    }
    if (!selectedMethod) {
      setErrorMsg(t.chooseShipping);
      return;
    }
    if (selectedMethod.servicePoint && !servicePoint) {
      setErrorMsg(t.chooseRelay);
      return;
    }
    if (selectedMethod.price == null) {
      setErrorMsg(t.noRate);
      return;
    }
    if (!stripe || !elements) {
      setErrorMsg(t.stripeLoading);
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
      // Langue des e-mails de confirmation et de suivi
      locale: lang,
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
          setErrorMsg(piData.message || t.paymentCreateError);
          return;
        }
        // Garde-fou : ne jamais débiter un montant différent de celui affiché
        if (Math.abs(Number(piData.total) - total) > 0.005) {
          setErrorMsg(t.amountChanged(money(Number(piData.total))));
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
          setErrorMsg(t.paymentFailed);
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
        setErrorMsg(t.orderNetworkError);
        return;
      }
      const orderData = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok) {
        setErrorMsg(t.orderSaveError(orderData.message || t.serverError, paymentIntentId));
        return;
      }

      setPaidIntentId(null);
      clearCart();
      localStorage.removeItem(PROMO_STORAGE_KEY);
      router.push(localePath(lang, "/success"));

    } catch (err) {
      console.error("CHECKOUT ERROR:", err);
      setErrorMsg(t.unexpected);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-inner">

        <header className="checkout-header" data-reveal-stagger>
          <button className="checkout-back" type="button" onClick={() => router.back()}>
            <span aria-hidden="true">←</span> {t.back}
          </button>
          <p className="checkout-eyebrow">{t.eyebrow}</p>
          <div className="checkout-heading">
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
          </div>
        </header>

        <div className="checkout-wrapper">

          {/* COLONNE GAUCHE */}
          <form className="checkout-left" onSubmit={handleSubmit} data-reveal-stagger>

            {/* CONTACT */}
            <div className="checkout-section">
              <div className="checkout-section-heading">
                <span>01</span>
                <h2 className="checkout-section-title">{t.contact}</h2>
              </div>
              <label className="checkout-label" htmlFor="checkout-email">{t.email}</label>
              <input
                id="checkout-email"
                type="email"
                placeholder={t.emailPlaceholder}
                aria-label={t.email}
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
                <h2 className="checkout-section-title">{t.shippingAddress}</h2>
              </div>
              <label className="checkout-label" htmlFor="checkout-country">{t.country}</label>
              <select
                id="checkout-country"
                aria-label={t.countryLabel}
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="checkout-input"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{lang === "fr" ? c.name : countryName(c.code, lang)}</option>
                ))}
              </select>
              <div className="checkout-row">
                <div className="checkout-field">
                  <label className="checkout-label" htmlFor="checkout-firstname">{t.firstname}</label>
                  <input id="checkout-firstname" type="text" placeholder={t.firstname} value={firstname} onChange={(e) => setFirstname(e.target.value)} className="checkout-input" required />
                </div>
                <div className="checkout-field">
                  <label className="checkout-label" htmlFor="checkout-lastname">{t.lastname}</label>
                  <input id="checkout-lastname" type="text" placeholder={t.lastname} value={lastname} onChange={(e) => setLastname(e.target.value)} className="checkout-input" required />
                </div>
              </div>
              <label className="checkout-label" htmlFor="checkout-company">{t.company} <span>{t.optional}</span></label>
              <input
                id="checkout-company"
                type="text"
                placeholder={`${t.company} ${t.optional}`}
                aria-label={`${t.company} ${t.optional}`}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="checkout-input"
              />
              <label className="checkout-label" htmlFor="checkout-address">{t.address}</label>
              <input
                id="checkout-address"
                type="text"
                placeholder={t.address}
                aria-label={t.address}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="checkout-input"
                required
              />
              <label className="checkout-label" htmlFor="checkout-phone">{t.phone}</label>
              <input id="checkout-phone" type="tel" placeholder={t.phonePlaceholder} aria-label={t.phone} value={phone} onChange={(e) => setPhone(e.target.value)} className="checkout-input" required />
              <div className="checkout-row">
                <div className="checkout-field">
                  <label className="checkout-label" htmlFor="checkout-postal-code">{t.postalCode}</label>
                  <input id="checkout-postal-code" type="text" placeholder={t.postalCode} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="checkout-input" required />
                </div>
                <div className="checkout-field">
                  <label className="checkout-label" htmlFor="checkout-city">{t.city}</label>
                  <input id="checkout-city" type="text" placeholder={t.city} value={city} onChange={(e) => setCity(e.target.value)} className="checkout-input" required />
                </div>
              </div>
            </div>

            {/* MODE D'EXPÉDITION */}
            <div className="checkout-section">
              <div className="checkout-section-heading">
                <span>03</span>
                <h2 className="checkout-section-title">{t.shippingMethod}</h2>
              </div>
              {shippingLoading && <p className="checkout-stripe-notice">{t.shippingLoading}</p>}
              {shippingError && <p className="checkout-error">{shippingError}</p>}
              {[
                { mode: "home", title: t.homeDelivery, methods: shippingMethods.filter((m) => !m.servicePoint) },
                { mode: "relay", title: t.relay, methods: shippingMethods.filter((m) => m.servicePoint) },
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
                          {shippingLabel({ ...m, relay: Boolean(m.servicePoint) }, lang)}
                          {m.leadTimeDays ? t.leadTime(m.leadTimeDays) : ""}
                          {m.price != null ? ` — ${money(m.price)}` : ""}
                        </span>
                      </label>
                      {shippingId === m.key && m.servicePoint && (
                        <div style={{ margin: "8px 0 4px" }}>
                          <button type="button" className="checkout-relay-btn" onClick={openServicePointPicker}>
                            <PinIcon />
                            {servicePoint ? t.changeRelay : t.chooseRelayButton}
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
                <h2 className="checkout-section-title">{t.payment}</h2>
              </div>
              <label className="checkout-label">{t.cardInfo}</label>
              <div className="checkout-stripe-card">
                <CardElement options={CARD_ELEMENT_OPTIONS} />
              </div>
              <p className="checkout-stripe-notice">
                {t.stripeNotice}
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
                ? t.processing
                : paidIntentId
                  ? <>{t.finalize} <span aria-hidden="true">→</span></>
                  : <>{t.pay(money(total))} <span aria-hidden="true">→</span></>}
            </ButtonPrimary>

          </form>

          {/* COLONNE DROITE — Résumé */}
          <div className="checkout-right" data-reveal-stagger>

            <div className="checkout-order-heading">
              <p className="checkout-eyebrow">{t.selection}</p>
              <h2>{t.orderSummary}</h2>
            </div>

            <div className="checkout-items">
              {cartItems.map((cartItem) => localizeProduct(cartItem, lang)).map((item) => (
                <div key={item.cartKey || item._id} className="checkout-item">
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
                    {money(item.promoPrice ?? item.price)}
                  </span>
                </div>
              ))}
            </div>

            <div className="checkout-summary">
              <h3 className="checkout-summary-title">{t.detail}</h3>
              <div className="checkout-summary-row">
                <span>{t.subtotal(totalQty)}</span>
                <span>{money(cartTotal)}</span>
              </div>
              {activePromo && (
                <div className="checkout-summary-row checkout-summary-discount">
                  <span>{t.discount(activePromo.code)}</span>
                  <span>−{money(promoDiscount)}</span>
                </div>
              )}
              <div className="checkout-summary-row">
                <span>{t.vat}</span>
                <span>{money(tva)}</span>
              </div>
              <div className="checkout-summary-row">
                <span>{t.shipping}</span>
                <span>{livraison == null ? "—" : money(livraison)}</span>
              </div>
              <div className="checkout-summary-divider" />
              <div className="checkout-summary-row checkout-summary-total">
                <span>{t.total}</span>
                <span>{money(total)}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const lang = useLang();
  return (
    <Elements stripe={stripePromise} options={{ locale: lang }}>
      <CheckoutInner />
    </Elements>
  );
}
