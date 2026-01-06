import { clamp } from 'lodash';

/**
 * Generates a scaling function from transforming a number from one range to another.
 * @param range1 The original range.
 * @param range2 The target range.
 * @returns A function that takes a number from range1 and returns the equivalent in range2.
 *
 * @example
 */
export function scaleValue(
  value: number,
  [initialMin, initialMax]: [number, number],
  [targetMin, targetMax]: [number, number],
  shouldClamp = false,
) {
  const result = ((value - initialMin) * (targetMax - targetMin)) / (initialMax - initialMin) + targetMin;
  return shouldClamp ? clamp(result, targetMin, targetMax) : result;
}

export const toNegative = n => (n > 0 ? -n : n);

/**
 * Generate a pseudo-random number between `min` and `max` using the seed. Providing the same seed will always return the same number.
 * Do NOT use this for security-sensitive purposes.
 */
export const pseudoRandomWithSeed = (seed: number, min: number, max: number) => {
  const x = Math.sin(seed) * 10_000;
  const r = x - Math.floor(x); // fractional part
  return min + r * (max - min);
};
