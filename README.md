# deep-merge-ts

Deep-merges plain objects. Arrays and nulls follow rules you set at call time, so policy lives in one place instead of scattered across merge sites.

```js
import { deepMerge } from 'deep-merge-ts';

const defaults = { server: { port: 3000 }, tags: ['a'] };
const overrides = { server: { port: 8080 }, tags: ['b'], timeout: 5000 };

// Default: arrays concat, nulls overwrite.
deepMerge(defaults, overrides);
// → { server: { port: 8080 }, tags: ['a', 'b'], timeout: 5000 }

// Replace arrays instead of concatenating, and ignore nulls in source.
deepMerge(defaults, { tags: ['x'], port: null }, {
  lists: 'replace',
  nulls: 'ignore',
});
```

## Why this exists

Most deep-merge libraries bake in a single array policy. In practice config layers often need arrays concatenated (feature flags accumulating) while data patches need them replaced wholesale. Rather than guess, this library takes two options — `lists` (`'concat'` | `'replace'`) and `nulls` (`'overwrite'` | `'ignore'`) — and applies them consistently at every recursion depth.

The trade-off: only plain objects (`{}` / `Object.create(null)`) are recursed into. Dates, class instances, Maps, and RegExps are treated as opaque values and replaced, not merged. This keeps the surface small and avoids the category errors that come from trying to merge two `Date` objects or two `RegExp`s.

## Edge you will hit

`null` is treated as a signal, not data. With the default `nulls: 'overwrite'`, a `null` in the source wipes the corresponding target key — useful for config resets, surprising if you expected `null` to mean "leave it alone." Switch to `nulls: 'ignore'` for that behaviour. `undefined`-valued keys are never iterated (they do not appear in `Object.keys`), so they cannot be used to clear a value.

## API

**`deepMerge(target, source, opts?)`** → merged value (new object; inputs untouched).

- `opts.lists` — `'concat'` (default) or `'replace'`
- `opts.nulls` — `'overwrite'` (default) or `'ignore'`

Both defaults apply recursively.
