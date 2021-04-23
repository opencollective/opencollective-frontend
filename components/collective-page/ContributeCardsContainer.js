import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';

import { CustomScrollbarCSS } from '../../lib/styled-components-shared-styles';

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
`;

ContributeCardsContainer.propTypes = {
  disableScrollSnapping: PropTypes.bool,
};

/** @component */
export default ContributeCardsContainer;
