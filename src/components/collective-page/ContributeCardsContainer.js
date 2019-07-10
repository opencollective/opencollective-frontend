import styled from 'styled-components';
import { CustomScrollbarCSS } from '../../lib/styled-components-shared-styles';
import { Dimensions } from './_constants';

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
  @media (min-width: ${Dimensions.MAX_SECTION_WIDTH}px) {
    padding-left: calc((100% - ${Dimensions.MAX_SECTION_WIDTH + 10}px) / 2);
  }
`;

/** @component */
export default ContributeCardsContainer;
