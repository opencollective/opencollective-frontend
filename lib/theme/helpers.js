/** Convert a number value to PX string */
export function toPx(value) {
  return `${value}px`;
}

/**
 * Convert a value in `em` to pixels
 */
export function emToPx(value) {
  return parseFloat(value) * 16;
}

export function getTopToBottomGradient(startColor, endColor) {
  return `linear-gradient(180deg, ${startColor} 0%, ${endColor} 100%);`;
}
