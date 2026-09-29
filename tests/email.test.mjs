import assert from "node:assert/strict";
import test from "node:test";
import {
  getAdminNewOrderEmailTemplate,
  getContactEmailTemplate,
  getOrderConfirmationEmailTemplate,
  getOrderStatusUpdateEmailTemplate,
  getPaymentAlertEmailTemplate,
  getResetPasswordEmailTemplate,
  getVerificationEmailTemplate,
  orderItemsHtml,
} from "../app/lib/emailTemplates.js";

const items = [{ name: "Cardigan <b>", size: "M", quantity: 1, unitPrice: 120 }];
const order = {
  firstname: "Aina", orderNumber: "AB12CD34", orderDate: "1 mai", address: "1 rue X", city: "Paris",
  deliveryLabel: "Colissimo", paymentLabel: "Carte", total: 120,
};
const status = { label: "Expédiée", icon: "🚚", color: "#06b6d4" };

const all = {
  verification: getVerificationEmailTemplate("Aina", "https://x.test/v", "en"),
  reset: getResetPasswordEmailTemplate("Aina", "https://x.test/r", "en"),
  confirmation: getOrderConfirmationEmailTemplate({ ...order, productListHtml: orderItemsHtml(items, "en"), orderUrl: "https://x.test/o", lang: "en" }),
  admin: getAdminNewOrderEmailTemplate({ ...order, lastname: "R", email: "a@b.co", productListHtml: orderItemsHtml(items) }),
  status: getOrderStatusUpdateEmailTemplate({ ...order, statusInfo: status, statusMessage: "Expédiée <strong>!</strong>", lang: "en" }),
  contact: getContactEmailTemplate({ firstName: "A", lastName: "R", email: "a@b.co", subjectLabel: "Autre", message: "Salut\nla <i>team</i>" }),
  alert: getPaymentAlertEmailTemplate({ amount: 50, customerEmail: "a@b.co", paymentIntentId: "pi_1" }),
};

test("tous les templates utilisent la charte du site", () => {
  for (const [name, html] of Object.entries(all)) {
    assert.match(html, /#243b3b/, `${name}: vert de marque`);
    assert.match(html, /#fff9f6/, `${name}: fond papier`);
    assert.doesNotMatch(html, /#0f172a|#f1f5f9|#C95D5D|#e2e8f0|#fffbeb/i, `${name}: ancienne palette`);
  }
});

test("le lien de secours est traduit", () => {
  assert.match(all.verification, /Or copy this link/);
  assert.doesNotMatch(all.reset, /Ou copiez/);
});

test("le bouton « voir ma commande » apparaît quand orderUrl est fourni", () => {
  assert.match(all.confirmation, /View my order/);
  assert.doesNotMatch(all.status, /View my order/);
});

test("les saisies utilisateur sont échappées", () => {
  assert.match(all.confirmation, /Cardigan &lt;b&gt;/);
  assert.doesNotMatch(all.contact, /<i>team/);
});

test("le préheader ne contient pas de HTML", () => {
  const preheader = all.status.match(/font-size:1px[^>]*>([^<]*)/)[1];
  assert.doesNotMatch(preheader, /<|&lt;/);
});

test("l'alerte de stock s'affiche dans la carte du mail admin", () => {
  const html = getAdminNewOrderEmailTemplate({ ...order, lastname: "R", email: "a@b.co", productListHtml: "", notice: "Rupture" });
  assert.ok(html.indexOf("Rupture") > html.indexOf("Nouvelle commande reçue"));
});

test("l'en-tête affiche le logo cœur en URL absolue", () => {
  for (const [name, html] of Object.entries(all)) {
    assert.match(html, /<img src="https?:\/\/[^"]+\/email\/logo-coeur\.png"/, `${name}: logo`);
  }
});
