import test from 'node:test';
import assert from 'node:assert/strict';
import { applicablePromo, computeTotals, promoDiscount } from '../app/lib/pricing.mjs';
import { escapeHtml, escapeRegex } from '../app/lib/text.js';
import { validatePassword } from '../app/lib/password.js';

test('the promo discount follows the current cart instead of the cart at validation time', () => {
  const promo = { code: 'MAILLE10', type: 'percentage', value: 10 };
  assert.equal(promoDiscount(promo, 100), 10);
  assert.equal(promoDiscount(promo, 250), 25);
  assert.equal(promoDiscount({ type: 'fixed', value: 30 }, 20), 20);
});

test('totals keep cents instead of rounding VAT to whole euros', () => {
  const totals = computeTotals({ subtotal: 89.9, promo: null, shipping: 6.45 });
  assert.equal(totals.tva, 17.98);
  assert.equal(totals.total, 114.33);
});

test('a promo below its minimum order amount is not applied', () => {
  const promo = { code: 'BIG', type: 'fixed', value: 10, minOrderAmount: 100 };
  assert.equal(applicablePromo(promo, 99), null);
  assert.equal(applicablePromo(promo, 100), promo);
  assert.equal(applicablePromo({ code: 'OLD', discount: 5 }, 100), null);
});

test('user input is neutralised for HTML emails and regex searches', () => {
  assert.equal(escapeHtml('<img src=x onerror="a">'), '&lt;img src=x onerror=&quot;a&quot;&gt;');
  assert.ok(new RegExp(escapeRegex('(a+)+$')).test('x(a+)+$'));
  assert.doesNotThrow(() => new RegExp(escapeRegex('(')));
});

test('password rules are the same everywhere', () => {
  assert.equal(validatePassword('Court1!').isValid, false);
  assert.equal(validatePassword('mailledouce7!').isValid, false);
  assert.equal(validatePassword('Maille!Douce7').isValid, true);
  assert.equal(validatePassword({ $ne: null }).isValid, false);
});
