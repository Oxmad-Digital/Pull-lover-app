// app/i18n/orders.mjs
// Libellés côté client d'une commande (espace client et e-mails), par langue.

export const ORDER_STATUS_LABELS = {
  fr: {
    pending: "En attente",
    confirmed: "Confirmée",
    processing: "En préparation",
    paid: "Payée",
    shipped: "Expédiée",
    delivered: "Livrée",
    cancelled: "Annulée",
  },
  en: {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Being prepared",
    paid: "Paid",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  },
};

export const ORDER_STATUS_MESSAGES = {
  fr: {
    pending: "Votre commande est en attente de traitement.",
    confirmed: "Bonne nouvelle ! Votre commande a été confirmée.",
    processing: "Votre commande est en cours de préparation.",
    paid: "Votre paiement a été reçu. Merci !",
    shipped: "Votre commande a été expédiée ! Elle arrivera bientôt.",
    delivered: "Votre commande a été livrée. Merci pour votre achat !",
    cancelled: "Votre commande a été annulée. Contactez-nous pour plus d'informations.",
  },
  en: {
    pending: "Your order is awaiting processing.",
    confirmed: "Good news! Your order has been confirmed.",
    processing: "Your order is being prepared.",
    paid: "Your payment has been received. Thank you!",
    shipped: "Your order has shipped! It will arrive soon.",
    delivered: "Your order has been delivered. Thank you for your purchase!",
    cancelled: "Your order has been cancelled. Contact us for more information.",
  },
};

export const PAYMENT_LABELS = {
  fr: {
    cash: "Espèces à la livraison",
    mobile_money: "Mobile Money",
    card: "Carte bancaire",
    bank_transfer: "Virement bancaire",
  },
  en: {
    cash: "Cash on delivery",
    mobile_money: "Mobile Money",
    card: "Bank card",
    bank_transfer: "Bank transfer",
  },
};

const pick = (table, lang) => table[lang] || table.fr;

export const orderStatusLabel = (status, lang) => pick(ORDER_STATUS_LABELS, lang)[status] || status;
export const orderStatusMessage = (status, lang) => pick(ORDER_STATUS_MESSAGES, lang)[status] || "";
export const paymentLabel = (payment, lang) => pick(PAYMENT_LABELS, lang)[payment] || payment;
