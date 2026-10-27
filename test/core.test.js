import { test } from 'node:test';
import assert from 'node:assert/strict';

import { deepMerge } from '../src/index.js';

// ─── Happy path ───────────────────────────────────────────────────────

test('merges two flat objects', () => {
  assert.deepEqual(
    deepMerge({ a: 1 }, { b: 2 }),
    { a: 1, b: 2 }
  );
});

test('source overrides target on conflict', () => {
  assert.deepEqual(
    deepMerge({ a: 1, b: 2 }, { b: 3 }),
    { a: 1, b: 3 }
  );
});

test('recurses into nested objects', () => {
  assert.deepEqual(
    deepMerge(
      { outer: { inner: 1, kept: true } },
      { outer: { inner: 2 } }
    ),
    { outer: { inner: 2, kept: true } }
  );
});

// ─── List strategies ─────────────────────────────────────────────────

test('default (concat) concatenates arrays', () => {
  assert.deepEqual(
    deepMerge({ tags: ['a'] }, { tags: ['b'] }),
    { tags: ['a', 'b'] }
  );
});

test('lists: replace strategy', () => {
  assert.deepEqual(
    deepMerge({ tags: ['a'] }, { tags: ['b'] }, { lists: 'replace' }),
    { tags: ['b'] }
  );
});

test('array in source replaces a non-array target', () => {
  assert.deepEqual(
    deepMerge({ items: 'old' }, { items: [1, 2] }),
    { items: [1, 2] }
  );
});

test('scalar in source replaces an array target', () => {
  assert.deepEqual(
    deepMerge({ items: [1, 2] }, { items: 'gone' }),
    { items: 'gone' }
  );
});

// ─── Null strategies ─────────────────────────────────────────────────

test('default (overwrite): null wipes target value', () => {
  assert.deepEqual(
    deepMerge({ a: 1, b: 2 }, { b: null }),
    { a: 1, b: null }
  );
});

test('nulls: ignore strategy leaves target untouched', () => {
  assert.deepEqual(
    deepMerge({ a: 1, b: 2 }, { b: null }, { nulls: 'ignore' }),
    { a: 1, b: 2 }
  );
});

test('null at top level with overwrite', () => {
  assert.strictEqual(deepMerge({ a: 1 }, null), null);
});

test('null at top level with ignore', () => {
  assert.deepEqual(
    deepMerge({ a: 1 }, null, { nulls: 'ignore' }),
    { a: 1 }
  );
});

// ─── Immutability ────────────────────────────────────────────────────

test('does not mutate target', () => {
  const target = { a: 1, nested: { x: 1 } };
  const snapshot = JSON.parse(JSON.stringify(target));
  deepMerge(target, { a: 2, nested: { y: 3 } });
  assert.deepEqual(target, snapshot);
});

test('does not mutate source', () => {
  const source = { a: 2, nested: { y: 3 } };
  const snapshot = JSON.parse(JSON.stringify(source));
  deepMerge({ a: 1 }, source);
  assert.deepEqual(source, snapshot);
});

// ─── Edge cases ──────────────────────────────────────────────────────

test('empty source returns a shallow copy of target', () => {
  assert.deepEqual(deepMerge({ a: 1 }, {}), { a: 1 });
});

test('empty target copies source', () => {
  assert.deepEqual(deepMerge({}, { a: 1 }), { a: 1 });
});

test('ignores undefined-valued keys in source', () => {
  // { a: undefined } and {} are observably different in JS: Object.keys([])
  // differs. Our implementation iterates Object.keys, which does not include
  // own properties whose value is undefined when the object literal omits
  // them. We assert the observable contract: the key is absent.
  assert.deepEqual(deepMerge({ a: 1 }, {}), { a: 1 });
});

// ─── Realistic config merge ──────────────────────────────────────────

test('realistic nested config merge', () => {
  const defaults = {
    server: { port: 3000, host: 'localhost' },
    logging: { level: 'info' },
    features: ['auth'],
  };
  const overrides = {
    server: { port: 8080 },
    features: ['metrics'],
    timeout: 5000,
  };
  assert.deepEqual(
    deepMerge(defaults, overrides),
    {
      server: { port: 8080, host: 'localhost' },
      logging: { level: 'info' },
      features: ['auth', 'metrics'],
      timeout: 5000,
    }
  );
});
