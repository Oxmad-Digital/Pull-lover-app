// app/lib/sendcloud.js
// API unifiée SendCloud v2 — Colissimo, Chronopost, Mondial Relay.
// Doc : https://api.sendcloud.dev/docs/sendcloud-public-api/
//
// Clés (Paramètres > Intégrations > API dans le panel SendCloud) :
//   SENDCLOUD_PUBLIC_KEY / SENDCLOUD_SECRET_KEY

const API_URL = "https://panel.sendcloud.sc/api/v2";

export const SENDCLOUD_CONFIGURED =
  Boolean(process.env.SENDCLOUD_PUBLIC_KEY) && Boolean(process.env.SENDCLOUD_SECRET_KEY);

// Transporteurs proposés au checkout (codes SendCloud)
export const ALLOWED_CARRIERS = ["colissimo", "chronopost", "mondial_relay"];

const CARRIER_LABELS = {
  colissimo: "Colissimo",
  chronopost: "Chronopost",
  mondial_relay: "Mondial Relay",
};

// Variantes écartées du checkout (livraison le samedi, codes QR, boîte aux lettres)
const EXCLUDED_NAME = /saturday|\bQR\b|\bBAL\b/i;

export const carrierLabel = (carrier) => CARRIER_LABELS[carrier] || carrier || "Transporteur";

function authHeader() {
  if (!SENDCLOUD_CONFIGURED) throw new Error("SENDCLOUD_NON_CONFIGURE");
  const token = Buffer.from(
    `${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`
  ).toString("base64");
  return `Basic ${token}`;
}

async function sendcloudFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = "";
    try {
      const json = await res.json();
      detail = json?.error?.message || JSON.stringify(json?.error || json);
    } catch {}
    throw new Error(`SendCloud (${res.status}) ${detail}`.trim());
  }
  return res;
}

// Poids retenu pour un article dont la fiche produit n'a pas de poids renseigné (kg)
export const DEFAULT_ITEM_WEIGHT = 0.5;

// SendCloud décline chaque service par tranche de poids ("Colissimo Home 0.25-0.5kg") :
// le client choisit le service, la tranche est choisie automatiquement selon le poids.
const WEIGHT_RANGE_SUFFIX = /\s*\d+(?:[.,]\d+)?\s*-\s*\d+(?:[.,]\d+)?\s*kg\s*$/i;

/**
 * Options d'expédition vers un pays pour un colis d'un poids donné.
 * Une option = un service d'un transporteur ; `methodId` est la tranche de poids adaptée.
 * @returns {Promise<Array<{ key: string, methodId: number, name: string, carrier: string,
 *   carrierLabel: string, servicePoint: boolean, price: number | null, leadTimeDays: number | null }>>}
 */
export async function getShippingOptions({ toCountry = "FR", weight = DEFAULT_ITEM_WEIGHT } = {}) {
  const res = await sendcloudFetch(
    `/shipping_methods?to_country=${encodeURIComponent(toCountry)}&is_return=false`
  );
  const { shipping_methods = [] } = await res.json();

  const options = new Map();
  for (const m of shipping_methods) {
    if (!ALLOWED_CARRIERS.includes(m.carrier) || EXCLUDED_NAME.test(m.name)) continue;
    if (!(Number(m.min_weight) <= weight && weight <= Number(m.max_weight))) continue;

    const country = (m.countries || []).find((c) => c.iso_2 === toCountry);
    if (!country) continue;

    const name = m.name.replace(WEIGHT_RANGE_SUFFIX, "").trim();
    const key = `${m.carrier}:${name}`;
    const option = {
      key,
      methodId: m.id,
      name,
      carrier: m.carrier,
      carrierLabel: carrierLabel(m.carrier),
      servicePoint: m.service_point_input === "required",
      price: country.price != null ? Number(country.price) : null,
      leadTimeDays: country.lead_time_hours ? Math.ceil(country.lead_time_hours / 24) : null,
    };

    const existing = options.get(key);
    if (!existing || (option.price ?? Infinity) < (existing.price ?? Infinity)) options.set(key, option);
  }

  return [...options.values()].sort(
    (a, b) => a.carrier.localeCompare(b.carrier) || (a.price ?? 0) - (b.price ?? 0)
  );
}

/**
 * Crée le colis et demande l'étiquette. Retourne suivi + PDF (base64).
 * @param {{
 *   orderId: string, methodId: number, weight?: number,
 *   addressee: { name: string, email: string, phone?: string, address: string,
 *                city: string, postalCode: string, countryCode: string, company?: string },
 *   servicePointId?: string | number | null,
 * }} params
 */
export async function createParcel({ orderId, methodId, weight = 0.5, addressee, servicePointId }) {
  const parcel = {
    name: addressee.name,
    company_name: addressee.company || "",
    email: addressee.email,
    telephone: addressee.phone || "",
    address: addressee.address,
    city: addressee.city,
    postal_code: addressee.postalCode,
    country: addressee.countryCode || "FR",
    order_number: orderId,
    weight: weight.toFixed(3),
    request_label: true,
    shipment: { id: methodId },
    ...(servicePointId ? { to_service_point: Number(servicePointId) || servicePointId } : {}),
  };

  const res = await sendcloudFetch("/parcels", {
    method: "POST",
    body: JSON.stringify({ parcel }),
  });
  const { parcel: created } = await res.json();

  const trackingNumber = created?.tracking_number;
  if (!trackingNumber) throw new Error("Numéro de suivi absent dans la réponse SendCloud");

  // Le PDF est protégé par l'authentification SendCloud : on le télécharge côté serveur
  let labelBuffer = null;
  const labelUrl = created.label?.normal_printer?.[0] || created.label?.label_printer;
  if (labelUrl) {
    try {
      const pdf = await fetch(labelUrl, { headers: { Authorization: authHeader() } });
      if (pdf.ok) labelBuffer = Buffer.from(await pdf.arrayBuffer());
    } catch {}
  }

  return {
    parcelId: created.id,
    trackingNumber,
    trackingUrl: created.tracking_url || null,
    carrier: created.carrier?.code || null,
    labelBuffer,
  };
}
