import assert from "node:assert/strict";
import test from "node:test";
import { localePath, splitLocale, toLocale } from "../app/i18n/config.mjs";
import { cleanProductTranslations, localizeProduct } from "../app/i18n/product.mjs";

test("construit les URLs de chaque langue (français sans préfixe)", () => {
  assert.equal(localePath("fr", "/panier"), "/panier");
  assert.equal(localePath("en", "/panier"), "/en/panier");
  assert.equal(localePath("en", "/"), "/en");
  assert.equal(localePath("en", "/#piece"), "/en#piece");
  assert.equal(localePath("de", "/panier"), "/panier");
});

test("sépare la langue du chemin", () => {
  assert.deepEqual(splitLocale("/en/panier"), { lang: "en", path: "/panier", prefixed: true });
  assert.deepEqual(splitLocale("/en"), { lang: "en", path: "/", prefixed: true });
  assert.deepEqual(splitLocale("/fr/contact"), { lang: "fr", path: "/contact", prefixed: true });
  assert.deepEqual(splitLocale("/english-page"), { lang: "fr", path: "/english-page", prefixed: false });
  assert.equal(toLocale("de"), "fr");
});

test("traduit un produit en retombant sur le français pour les champs vides", () => {
  const product = { name: "Cardigan en maille", color: "Écru naturel", translations: { en: { name: "Knit cardigan", color: " " } } };
  assert.deepEqual(localizeProduct(product, "en"), { ...product, name: "Knit cardigan" });
  assert.equal(localizeProduct(product, "fr"), product);
  assert.equal(localizeProduct(null, "en"), null);
});

test("ne garde que les champs traduisibles du formulaire admin", () => {
  const { en } = cleanProductTranslations({ en: { name: "  Cardigan ", price: 10, description: 3 } });
  assert.equal(en.name, "Cardigan");
  assert.equal(en.description, "");
  assert.equal("price" in en, false);
});
