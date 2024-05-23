import type React from 'react';
import styled from 'styled-components';
import type { ColorProps, TypographyProps } from 'styled-system';
import { color, typography, variant } from 'styled-system';

import type { TextDecorationProps } from '../lib/styled-system-custom-properties';
import { textDecoration } from '../lib/styled-system-custom-properties';

type StyledLinkButtonProps = ColorProps &
  TypographyProps &
  TextDecorationProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    hoverColor?: string;
    variant?: 'danger';
    underlineOnHover?: boolean;
  };

/**
 * A button element but with the styles of a anchor element (https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a).
 */
const StyledLinkButton = styled.button<StyledLinkButtonProps>`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;

  ${color}
  ${typography}
  ${textDecoration}

  :hover {
    color: ${props => props.hoverColor};
    text-decoration: ${props => (props.underlineOnHover ? 'underline' : undefined)};
  }

  ${variant({
    prop: 'variant',
    variants: {
      danger: {
        color: 'red.500',
        '&:hover': {
          color: 'red.400',
        },
      },
    },
  })}
`;

StyledLinkButton.defaultProps = {
  color: '#3385FF',
  hoverColor: '#797d80',
};

export default StyledLinkButton;
