import styled from 'styled-components';
import themeGet from '@styled-system/theme-get';
import { background, color, border, typography, space } from 'styled-system';
import StyledLink from '../StyledLink';

export const HomePrimaryLink = styled(StyledLink)`
  text-align: center;
  padding: 15px 24px;
  font-weight: 500;
  font-size: ${props => props.theme.fontSizes.Paragraph}px;
  line-height: ${props => props.theme.lineHeights.Caption};
  min-width: 175px;
  ${background}
  ${color}
  ${border}

  &:hover {
    background: linear-gradient(180deg, #4E5052 0%, #313233 100%);
  }

  &:visited {
    color: #fff;
    outline: none;
    border: none;
  }

  @media screen and (min-width: 88em) {
    min-width: 232px;
  }
`;

HomePrimaryLink.defaultProps = {
  buttonStyle: 'primary',
  background: 'linear-gradient(180deg, #313233 0%, #141414 100%)',
};

export const HomeStandardLink = styled(StyledLink)`
  font-weight: 500;
  padding: 10px 20px;
  border-color: ${themeGet('colors.black.400')};
  ${typography};
  ${space};

  &:hover {
    color: ${themeGet('colors.black.700')};
  }
`;

HomeStandardLink.defaultProps = {
  buttonStyle: 'standard',
  fontSize: '13px',
  lineHeight: '16px',
};
