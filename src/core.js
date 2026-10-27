/**
 * Core deep-merge implementation.
 *
 * Merges plain objects recursively. The treatment of lists and nulls is
 * controlled by MergeOptions so that callers make the policy decision once
 * rather than at every call site.
 */

/**
 * @typedef {'concat' | 'replace'} ListStrategy
 * - 'concat': when both values are arrays, concatenate source after target.
 * - 'replace': when both values are arrays, the source array wins entirely.
 *
 * @typedef {'overwrite' | 'ignore'} NullStrategy
 * - 'overwrite': a null in source nullifies the corresponding target value.
 * - 'ignore': a null in source leaves the target value untouched.
 */

/**
 * Options bag.
 * @typedef {Object} MergeOptions
 * @property {ListStrategy} [lists='concat']      — how two arrays interact.
 * @property {NullStrategy} [nulls='overwrite']   — how a null in source behaves.
 */

/**
 * Returns true only for ordinary objects created by {} or new Object().
 * Arrays, Dates, RegExps, Maps, Sets, and class instances are excluded so
 * that we never accidentally recurse into something with its own internal
 * structure.
 *
 * @param {*} v
 * @returns {boolean}
 */
function isPlainObject(v) {
  if (v === null || typeof v !== 'object') return false;
  const proto = Object.getPrototypeOf(v);
  // Object.prototype is the only prototype we consider safe to walk into.
  return proto === Object.prototype || proto === null;
}

/**
 * Deep-merge `source` into `target` and return a new value.
 *
 * Neither input is mutated; the returned object shares only the leaves that
 * were not involved in the merge.
 *
 * @param {*} target
 * @param {*} source
 * @param {MergeOptions} [opts]
 * @returns {*}
 */
export function deepMerge(target, source, opts = {}) {
  const listStrategy = opts.lists ?? 'concat';
  const nullStrategy = opts.nulls ?? 'overwrite';

  // A null in source is policy, not data. Whether it wipes the target or is
  // skipped depends entirely on the caller's chosen strategy.
  if (source === null) {
    if (nullStrategy === 'ignore') return target;
    return null; // overwrite
  }

  // If source is not an object (or is an array), it replaces target outright.
  // We do not try to merge a scalar into an object — that would silently
  // destroy structure.
  if (!isPlainObject(source)) {
    if (Array.isArray(source) && Array.isArray(target) && listStrategy === 'concat') {
      return target.concat(source);
    }
    return source;
  }

  // If target is not a plain object but source is, source wins. We cannot
  // merge into a non-object.
  if (!isPlainObject(target)) {
    // Shallow-copy so callers cannot mutate our internal state.
    return { ...source };
  }

  // Both are plain objects: walk keys, recursing.
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const tv = target[key];
    const sv = source[key];
    result[key] = deepMerge(tv, sv, opts);
  }
  return result;
}

// Exported for type-checking / documentation consumers.
export const MergeOptions = {};
