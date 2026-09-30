import assert from "node:assert/strict";
import test from "node:test";
import { countryLabel, formatDuration, referrerHost, trackedPath } from "../app/lib/analytics.mjs";

test("ne suit que les pages publiques connues, langue comprise", () => {
  assert.equal(trackedPath("/"), "/");
  assert.equal(trackedPath("/en"), "/en");
  assert.equal(trackedPath("/en/panier"), "/en/panier");
  assert.equal(trackedPath("/contact/"), "/contact");
  assert.equal(trackedPath("/products/pull-mantasoa-ecru"), "/products/pull-mantasoa-ecru");
  assert.equal(trackedPath("/admin/stats"), null);
  assert.equal(trackedPath("/en/dashboard/orders"), null);
  assert.equal(trackedPath("/auth/login"), null);
  assert.equal(trackedPath("/page-inconnue"), null);
  assert.equal(trackedPath("/products/a/b"), null);
  assert.equal(trackedPath("https://evil.example/"), null);
  assert.equal(trackedPath(42), null);
});

test("garde le domaine d'origine sauf pour les visites internes", () => {
  assert.equal(referrerHost("https://www.google.com/search?q=pull", "pull-lover.com"), "www.google.com");
  assert.equal(referrerHost("https://pull-lover.com/panier", "pull-lover.com"), "");
  assert.equal(referrerHost("android-app://com.google.android.googlequicksearchbox/", "pull-lover.com"), "com.google.android.googlequicksearchbox");
  assert.equal(referrerHost("javascript:alert(1)", "pull-lover.com"), "");
  assert.equal(referrerHost("", "pull-lover.com"), "");
  assert.equal(referrerHost("pas une url", "pull-lover.com"), "");
});

test("formate durées et pays", () => {
  assert.equal(formatDuration(61_000), "1 min 01");
  assert.equal(formatDuration(42_000), "42 s");
  assert.equal(formatDuration(null), "—");
  assert.equal(countryLabel("MG"), "Madagascar");
});
