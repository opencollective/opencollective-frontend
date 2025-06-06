import isPropValid from '@emotion/is-prop-valid';

/**
 * Return the correct border color index depending on `error` and `success`.
 *
 * ## Examples
 *
 *    > getInputBorderColor(true)
 *    'red.500'
 */
export const getInputBorderColor = (error, success) => {
  if (error) {
    return 'red.500';
  }

  if (success) {
    return 'green.300';
  }

  return 'black.300';
};

/**
 * This implements the default behavior from styled-components v5
 * @deprecated
 */
export function defaultShouldForwardProp(propName, target) {
  if (typeof target === 'string') {
    // For HTML elements, forward the prop if it is a valid HTML attribute
    return isPropValid(propName);
  }

  // For other elements, forward all props
  return true;
}
