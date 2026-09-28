import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOrderBy, buildWhere } from '../app/lib/sql-filter.mjs';
import { escapeRegex, orderEmailFilter } from '../app/lib/text.js';

const ID = '0b6f7c6e-6a55-4d8e-9a3c-2f4f5a6b7c8d';

test('simple equality and date ranges are fully translated', () => {
  const since = new Date('2026-01-01T00:00:00Z');
  const where = buildWhere({ status: 'paid', createdAt: { $gte: since } });
  assert.deepEqual(where.clauses, ["data->>'status' = $1", 'created_at >= $2']);
  assert.deepEqual(where.params, ['paid', since]);
  assert.equal(where.complete, true);
});

test('lower-indexed fields keep an exact comparison next to the indexed one', () => {
  const where = buildWhere({ email: 'a@b.fr' }, { lowerIndexed: ['email'] });
  assert.deepEqual(where.clauses, ["data ? 'email'", "lower(data->>'email') = lower($1)", "data->>'email' = $1"]);
  assert.equal(where.complete, true);
});

test('literal regexes become LIKE / lower() comparisons, with LIKE wildcards escaped', () => {
  const anchored = buildWhere(orderEmailFilter('Alice@Example.com'));
  assert.deepEqual(anchored.clauses, ["lower(data #>> '{customer,email}') = lower($1)"]);
  assert.deepEqual(anchored.params, ['Alice@Example.com']);

  const contains = buildWhere({ name: { $regex: escapeRegex('100%_off'), $options: 'i' } });
  assert.deepEqual(contains.clauses, ["data->>'name' ILIKE $1"]);
  assert.deepEqual(contains.params, ['%100\\%\\_off%']);
  assert.equal(contains.complete, true);
});

test('non-literal regexes and unknown operators are left to the JS filter', () => {
  const where = buildWhere({ name: { $regex: 'pull.*', $options: 'i' }, status: 'paid', lastOrderAt: { $lt: new Date() } });
  assert.deepEqual(where.clauses, ["data->>'status' = $1"]);
  assert.equal(where.complete, false);
});

test('$or is only pushed down when every branch yields a condition', () => {
  const pushed = buildWhere({ $or: [{ status: 'paid' }, { status: 'shipped' }] });
  assert.deepEqual(pushed.clauses, ["((data->>'status' = $1) OR (data->>'status' = $2))"]);
  assert.equal(pushed.complete, true);

  const skipped = buildWhere({ $or: [{ status: 'paid' }, { name: /x/ }] });
  assert.deepEqual(skipped.clauses, []);
  assert.equal(skipped.complete, false);
});

test('ids, numeric ranges and declared array fields', () => {
  assert.deepEqual(buildWhere({ _id: { $in: [ID, 'bad'] } }).params, [[ID]]);
  assert.deepEqual(buildWhere({ _id: 'not-a-uuid' }).clauses, ['FALSE']);
  assert.match(buildWhere({ stock: { $gt: 0 } }).clauses[0], /::numeric END\) > \$1$/);

  const arrays = buildWhere({ 'products.product': ID, favorites: ID }, { defaults: { products: [], favorites: [] } });
  assert.deepEqual(arrays.clauses, []);
  assert.equal(arrays.complete, false);
});

test('identifiers that are not plain field names are never interpolated', () => {
  const where = buildWhere({ "name'; DROP TABLE users; --": 'x' });
  assert.deepEqual(where.clauses, []);
  assert.equal(where.complete, false);
});

test('ORDER BY is only generated for column sorts', () => {
  assert.equal(buildOrderBy({ createdAt: -1 }), 'created_at DESC, id ASC');
  assert.equal(buildOrderBy({ totalSpent: -1 }), null);
  assert.equal(buildOrderBy(null), null);
});
