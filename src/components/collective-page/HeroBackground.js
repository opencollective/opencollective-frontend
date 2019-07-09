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
  background-color: ${themeGet('colors.primary.300')};
  background: linear-gradient(
    to top right,
    ${props => `${props.theme.colors.primary[500]}, ${props.theme.colors.primary[100]}`}
  );
  z-index: -1;
  animation: ${fadeIn};
  animation-duration: 0.3s;
  animation-fill-mode: both;

  @supports (mask-size: contain) {
    ${backgroundImage}
    background-repeat: no-repeat;
    background-size: cover;

    mask-image: url(${HeroBackgroundMask});
    mask-size: 100% 35%;
    mask-repeat: no-repeat;
    mask-position: top right;

    @media (min-width: 30em) {
      mask-size: 100% 50%;
    }

    @media (min-width: 52em) {
      mask-size: 100% 60%;
    }

    @media (min-width: 64em) {
      mask-size: 100% 75%;
    }

    @media (min-width: 88em) {
      mask-size: 100% 100%;
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
