/** Convert `v` to negative if possitive, don't touch it otherwise. */
export function toNegative(v) {
  return v > 0 ? -v : v;
}
