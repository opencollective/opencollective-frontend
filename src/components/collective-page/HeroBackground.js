import React from 'react';
import { PropTypes } from 'prop-types';
import styled from 'styled-components';
import { backgroundImage } from 'styled-system';
import { fadeIn } from '../../constants/animations.js';
import themeGet from '@styled-system/theme-get';

import HeroBackgroundMask from './HeroBackgroundMask.svg';

const BackgroundContainer = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  animation: ${fadeIn} 0.25s cubic-bezier(0, 1, 0.5, 1);
  animation-fill-mode: both;
  max-width: 1368px; // Should match SVG's viewbox

  @supports (mask-size: cover) {
    background-color: ${themeGet('colors.primary.300')};
    background: linear-gradient(
      10deg,
      ${props => `${props.theme.colors.primary[700]}, ${props.theme.colors.primary[500]}`}
    );
    ${backgroundImage}
    background-repeat: no-repeat;
    background-size: cover;

    mask: url(${HeroBackgroundMask}) no-repeat;
    mask-size: cover;
    mask-position-x: 100%;
    mask-position-y: -150px;

    @media (max-width: 900px) {
      mask-position-x: 20%;
    }
  }
`;

/**
 * Wraps the logic to display the hero background. Fallsback on a white background if
 * css `mask` is not supported.
 */
const HeroBackground = ({ backgroundImage }) => {
  return <BackgroundContainer backgroundImage={backgroundImage ? `url(${backgroundImage})` : undefined} />;
};

HeroBackground.propTypes = {
  /** The background image to crop */
  backgroundImage: PropTypes.string,
};

export default HeroBackground;
