import { css } from 'styled-components';

/**
 * A custom scrollbar for Chrome, more prettier than the system one.
 */
export const CustomScrollbarCSS = css`
  @media (pointer: fine) {
    &::-webkit-scrollbar {
      height: 8px;
      margin: 0 16px;
    }

    &::-webkit-scrollbar-thumb {
      background: #d1d1d3;
      border-radius: 16px;
      &:hover {
        background: #aaa;
      }
    }

    &::-webkit-scrollbar-track {
      background: #f2f3f4;
      border-radius: 20px;
    }

    &::-webkit-scrollbar-button {
      color: white;
    }
  }
`;
