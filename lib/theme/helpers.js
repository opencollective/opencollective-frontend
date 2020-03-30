/** Convert a number value to PX string */
export function toPx(value) {
  return `${value}px`;
}

export function getTopToBottomGradient(startColor, endColor) {
  return `linear-gradient(180deg, ${startColor} 0%, ${endColor} 100%);`;
}
