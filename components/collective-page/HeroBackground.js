import { PropTypes } from 'prop-types';
import styled from 'styled-components';

import HeroBackgroundMask from './HeroBackgroundMask.svg';

const generateBackground = (theme, backgroundImage) => {
  const color = theme.colors.primary[300];
  const gradient = `linear-gradient(10deg, ${theme.colors.primary[700]}, ${theme.colors.primary[200]})`;
  const defaultBackground = `${gradient}, ${color}`;
  return backgroundImage ? `url(${backgroundImage}), ${defaultBackground}` : defaultBackground;
};

/**
 * Wraps the logic to display the hero background. Fallsback on a white background if
 * css `mask` is not supported.
 */
const HeroBackground = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 100%;
  max-width: 1368px; // Should match SVG's viewbox
  z-index: -1;

  @supports (mask-size: cover) {
    background: ${props => generateBackground(props.theme, props.backgroundImage)};
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

HeroBackground.propTypes = {
  /** The background image to crop */
  backgroundImage: PropTypes.string,
};

/** @component */
export default HeroBackground;
