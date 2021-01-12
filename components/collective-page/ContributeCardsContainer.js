import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';

import { CustomScrollbarCSS } from '../../lib/styled-components-shared-styles';

import { Dimensions } from './_constants';

/** An horizontally scrollable container to display contribute cards cards */
const ContributeCardsContainer = styled.div`
  display: flex;
  padding: 16px 0;
  overflow-x: auto;
  position: relative;

  ${props =>
    !props.disableScrollSnapping &&
    css`
      scroll-behavior: smooth;
      /* smartphones, touchscreens */
      @media (hover: none) {
        scroll-snap-type: x mandatory;
      }
    `}

  ${CustomScrollbarCSS}

  /** Hide scrollbar when not hovered */
  &:not(:hover) {
    &::-webkit-scrollbar-thumb {
      background: transparent;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }

  /** Respect left margin / center cards on widescreens */

  @supports (width: fit-content) {
    @media (min-width: ${Dimensions.MAX_SECTION_WIDTH}px) {
      margin: 0 auto;
      min-width: ${Dimensions.MAX_SECTION_WIDTH}px;
      width: fit-content;
      max-width: 100%;
    }
  }

  @supports not (width: fit-content) {
    @media (min-width: ${Dimensions.MAX_SECTION_WIDTH}px) {
      padding-left: calc((100% - ${Dimensions.MAX_SECTION_WIDTH + 10}px) / 2);
    }
  }
`;

ContributeCardsContainer.propTypes = {
  disableScrollSnapping: PropTypes.bool,
};

/** @component */
export default ContributeCardsContainer;
