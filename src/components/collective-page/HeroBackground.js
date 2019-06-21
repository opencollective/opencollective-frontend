import React from 'react';
import { PropTypes } from 'prop-types';
import styled from 'styled-components';
import { backgroundImage } from 'styled-system';
import { fadeIn } from '../../constants/animations.js';

import HeroBackgroundMask from './HeroBackgroundMask.svg';

const BackgroundContainer = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: #145ecc;
  z-index: -1;
  animation: ${fadeIn};
  animation-duration: 0.3s;
  animation-fill-mode: both;

  @supports (mask-size: contain) {
    ${backgroundImage}
    background-repeat: no-repeat;
    background-size: cover;

    mask-image: url(${HeroBackgroundMask});
    mask-size: contain;
    mask-repeat: no-repeat;
    mask-position: top right;

    @media (min-width: 1440px) {
      mask-size: 75% 100%;
    }
  }
`;

/**
 * Wraps the logic to display the hero background. Fallsback on a white background if
 * css `mask` is not supported.
 */
const HeroBackground = ({ backgroundImage }) => {
  return <BackgroundContainer backgroundImage={`url(${backgroundImage})`} />;
};

HeroBackground.propTypes = {
  /** The background image to crop */
  backgroundImage: PropTypes.string,
};

export default HeroBackground;
