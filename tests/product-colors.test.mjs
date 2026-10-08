import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_PRODUCT_COLORS, cleanProductColors, mediaUrl, productColors } from "../app/lib/product-colors.mjs";

test("sans couleur enregistrée, la fiche garde les couleurs d'origine", () => {
  assert.equal(productColors(null), DEFAULT_PRODUCT_COLORS);
  assert.equal(productColors({ variants: [] }), DEFAULT_PRODUCT_COLORS);
  // Une couleur sans photo n'est pas affichée
  assert.equal(productColors({ variants: [{ id: "a", code: "#000000", name: { fr: "Noir" }, images: [] }] }), DEFAULT_PRODUCT_COLORS);
});

test("les couleurs de la base remplacent celles d'origine", () => {
  const variants = [{ id: "noir", code: "#000000", name: { fr: "Noir", en: "Black" }, images: ["products/a.webp"] }];
  assert.deepEqual(productColors({ variants }), variants);
});

test("écarte les couleurs et les clés malformées", () => {
  const cleaned = cleanProductColors([
    { id: "ok", code: "#ABCDEF", name: { fr: " Écru ", en: "" }, images: ["products/x.webp", "avatars/y.png", "products/../z", 3] },
    { id: "ok", code: "#000000", name: { fr: "Doublon" }, images: [] },
    { id: "sans-nom", code: "#000000", name: { fr: "" }, images: [] },
    { id: "code", code: "red", name: { fr: "Rouge" }, images: [] },
    { id: "<script>", code: "#000000", name: { fr: "X" }, images: [] },
  ]);
  assert.deepEqual(cleaned, [{ id: "ok", code: "#abcdef", name: { fr: "Écru", en: "" }, images: ["products/x.webp"] }]);
  assert.deepEqual(cleanProductColors("n'importe quoi"), []);
});

test("URL des photos servies par /api/media", () => {
  assert.equal(mediaUrl("products/cardigan maille/é.webp"), "/api/media/products/cardigan%20maille/%C3%A9.webp");
});
