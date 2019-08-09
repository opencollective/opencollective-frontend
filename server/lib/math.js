/** Convert `v` to negative if possitive, don't touch it otherwise. */
export function toNegative(v) {
  return v > 0 ? -v : v;
}

/**
 * Converts a float amount to cents. Also takes care of rounding the number
 * to avoid floating numbers issues like `0.29 * 100 === 28.999999999999996`
 */
export function floatAmountToCents(floatAmount) {
  return Math.round(floatAmount * 100);
}
