import styled from 'styled-components';
import { CustomScrollbarCSS } from '../../lib/styled-components-shared-styles';

/** An horizontally scrollable container to display contribute cards cards */
const ContributeCardsContainer = styled.div`
  display: flex;
  padding: 16px 0;
  overflow-x: auto;
  scroll-behavior: smooth;

  ${CustomScrollbarCSS}

  /** Hide scrollbar when not hovered */
  &:not(:hover) {
    &::-webkit-scrollbar-thumb {
      background: white;
    }

    &::-webkit-scrollbar-track {
      background: white;
    }
  }

  /** Respect left margin / center cards on widescreens */
  @media (min-width: 1500px) {
    padding-left: calc((100% - 1500px) / 2);
  }
`;

/** @component */
export default ContributeCardsContainer;
