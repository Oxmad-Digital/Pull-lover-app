// Libellés lisibles des modes d'expédition (les noms SendCloud type "Chrono 13" ne parlent à personne).
// Sans dépendance serveur : utilisable côté client, e-mails et admin.

const CARRIER_LABELS = {
  colissimo: "Colissimo",
  chronopost: "Chronopost",
  mondial_relay: "Mondial Relay",
};

const HOME_TEXT = {
  fr: { signature: "Livraison à domicile contre signature", express: "Livraison express à domicile" },
  en: { signature: "Home delivery with signature", express: "Express home delivery" },
};

// `name` : nom SendCloud du service ; `relay` : true pour un point relais
export function shippingLabel({ carrier, carrierLabel, name, relay }, lang = "fr") {
  const label = carrierLabel || CARRIER_LABELS[carrier] || carrier || "";
  if (relay) {
    const service = (name || "").replace(new RegExp(`^${label}\\s*`, "i"), "");
    return service ? `${label} — ${service}` : label;
  }
  const text = HOME_TEXT[lang] || HOME_TEXT.fr;
  return `${label} — ${carrier === "colissimo" ? text.signature : text.express}`;
}

// À partir de `order.delivery` ; renvoie null pour les anciennes commandes sans transporteur
export function deliveryLabel(delivery, lang = "fr") {
  if (!delivery?.carrier) return null;
  return shippingLabel(
    {
      carrier: delivery.carrier,
      name: delivery.methodName,
      relay: Boolean(delivery.servicePoint || delivery.relayId || delivery.method?.endsWith("_relais")),
    },
    lang
  );
}
