import { createGlobalStyle } from 'styled-components';

export const HideGlobalScroll = createGlobalStyle`
  @media(max-width: 40em) {
    body {
      overflow: hidden;
    }
  }
`;
