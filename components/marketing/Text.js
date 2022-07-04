import { themeGet } from '@styled-system/theme-get';
import styled from 'styled-components';

import { H1, H2, P } from '../Text';

export const MainTitle = styled(H1)`
  font-size: 52px;
  font-weight: 700;
  line-height: 56px;
  letter-spacing: -0.04em;
  color: ${themeGet('colors.primary.900')};

  @media screen and (min-width: 40em) {
    font-size: 64px;
    font-weight: 900;
    line-height: 80px;
    letter-spacing: 0.012em;
  }

  @media screen and (min-width: 64em) {
    font-size: 72px;
    line-height: 88px;
  }
`;

export const MainDescription = styled(P)`
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  color: ${themeGet('colors.black.800')};

  @media screen and (min-width: 40em) {
    font-size: 20px;
    line-height: 28px;
    letter-spacing: -0.008em;
  }
`;

export const SectionTitle = styled(H2)`
  font-weight: 700;
  font-size: 32px;
  line-height: 40px;
  letter-spacing: -0.008em;
  color: ${themeGet('colors.primary.900')};

  @media screen and (min-width: 40em) {
    font-weight: 700;
    font-size: 40px;
    line-height: 48px;
    letter-spacing: -0.04em;
  }

  @media screen and (min-width: 64em) {
    font-size: 52px;
    line-height: 56px;
  }
`;

export const SectionDescription = styled(P)`
  font-weight: 500;
  font-size: 18px;
  line-height: 26px;
  color: ${themeGet('colors.black.800')};

  @media screen and (min-width: 40em) {
    font-size: 20px;
    line-height: 28px;
    letter-spacing: -0.008em;
  }
`;
