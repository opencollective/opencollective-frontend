import PropTypes from 'prop-types';
import { themeGet } from '@styled-system/theme-get';
import styled, { css } from 'styled-components';

import StyledButton from './StyledButton';

/**
 * An action button, as defined in https://www.figma.com/file/N4Xbl652BhzOutXmzhcrLGch/%5BDS%5D-02-Atoms?node-id=3842%3A222.
 * Based on `StyledButton`.
 */
const ActionButton = styled(StyledButton).attrs({
  buttonSize: 'tiny',
  padding: '7px 16px',
  borderRadius: '8px',
})`
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  white-space: nowrap;
  text-transform: uppercase;
  border: none;
  color: ${themeGet('colors.primary.800')};

  &,
  span {
    letter-spacing: 0.01em;
  }

  span {
    vertical-align: middle;
  }

  ${props =>
    props.isSecondary
      ? css`
          &:focus {
            background: ${themeGet('colors.primary.100')};
          }

          &:hover:not(:active) {
            background: ${themeGet('colors.primary.100')};
            box-shadow: 0 0 0 2px ${themeGet('colors.primary.800')};
          }

          &:active {
            background: ${themeGet('colors.primary.200')};
            color: ${themeGet('colors.primary.800')};
            box-shadow: none;
          }
        `
      : css`
          background: ${themeGet('colors.primary.100')};

          &:focus {
            background: ${themeGet('colors.primary.100')};
          }

          &:hover:not(:active) {
            background: ${themeGet('colors.primary.800')};
            color: ${themeGet('colors.white.full')};
          }

          &:active {
            background: ${themeGet('colors.primary.200')};
            color: ${themeGet('colors.primary.800')};
          }
        `}
`;

ActionButton.propTypes = {
  borderRadius: PropTypes.string,
  isSecondary: PropTypes.bool,
};

export default ActionButton;
