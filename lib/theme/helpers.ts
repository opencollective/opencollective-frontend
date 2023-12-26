/** Convert a number value to PX string */
export function toPx(value: number) {
  return `${value}px`;
}

/**
 * Convert a value in `em` to pixels
 */
export function emToPx(value: string) {
  return parseFloat(value) * 16;
}

export function getTopToBottomGradient(startColor: string, endColor: string) {
  return `linear-gradient(180deg, ${startColor} 0%, ${endColor} 100%);`;
}
