import test from 'node:test';
import assert from 'node:assert/strict';
import { productSizes, remainingStock, selectFeaturedProduct } from '../app/lib/featured-product.mjs';

const product = { _id: 'mantasoa', name: 'Cardigan en maille de Madagascar', stock: 6, stocks: { S: 2, M: 4, L: 0 }, sizes: ['S', 'M'], isAvailable: true };

test('the home selects the single product without falling back to ambiguous matches', () => {
  assert.equal(selectFeaturedProduct([product]), product);
  assert.equal(selectFeaturedProduct([]), null);
  assert.equal(selectFeaturedProduct([{ name: 'Autre pull' }, product]), null);
});

test('sizes include sold-out variants without inventing sizes', () => {
  assert.deepEqual(productSizes(product), ['S', 'M', 'L']);
  assert.deepEqual(productSizes({ size: 'Unique' }), ['Unique']);
  assert.deepEqual(productSizes({}), []);
});

test('availability respects product and size stock across colours in the cart', () => {
  assert.equal(remainingStock(product, 'L'), 0);
  assert.equal(remainingStock(product, 'XL'), 0);
  assert.equal(remainingStock({ ...product, isAvailable: false }, 'M'), 0);
  assert.equal(remainingStock({ ...product, stock: 0 }, 'M'), 0);
  const cart = [
    { _id: product._id, size: 'S', color: 'Écru', quantity: 1 },
    { _id: product._id, size: 'S', color: 'Bleu', quantity: 1 },
    { _id: 'other', size: 'M', quantity: 10 },
  ];
  assert.equal(remainingStock(product, 'S', cart), 0);
  assert.equal(remainingStock(product, 'M', cart), 4);
  assert.equal(remainingStock({ ...product, stock: 3 }, 'M', cart), 1);
});

test('legacy products without per-size stock use total stock', () => {
  assert.equal(remainingStock({ _id: 'legacy', stock: 2 }, 'M', [{ _id: 'legacy', size: 'M', quantity: 1 }]), 1);
});
