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
