import isPropValid from '@emotion/is-prop-valid';
import { isStyledComponent } from 'styled-components';

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

/**
 * Same as `defaultShouldForwardProp`, but also excludes `filteredProps`. Styled components passed
 * with `as` still receive them: they need the style props and do their own filtering.
 */
export function shouldForwardPropExcept(filteredProps) {
  return (propName, target) =>
    defaultShouldForwardProp(propName, target) && (!filteredProps.has(propName) || isStyledComponent(target));
}
