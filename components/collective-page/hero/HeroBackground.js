import React from 'react';
import { PropTypes } from 'prop-types';
import { get, has } from 'lodash';
import styled, { css } from 'styled-components';

import HeroBackgroundMask from '../../../public/static/images/collective-page/HeroBackgroundMask.svg';

export const BASE_HERO_WIDTH = 1368;
export const BASE_HERO_HEIGHT = 325;

const generateBackground = theme => {
  const color = theme.colors.primary[300];
  const gradient = `linear-gradient(10deg, ${theme.colors.primary[800]}, ${theme.colors.primary[300]})`;
  return `${gradient}, ${color}`;
};

const BackgroundImage = styled.img.attrs({ alt: '' })``;

export const StyledHeroBackground = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 100%;
  max-width: ${BASE_HERO_WIDTH}px; // Should match SVG's viewbox
  z-index: ${props => (props.isEditing ? 0 : -1)};
  overflow: hidden;

  img {
    margin: 0;
    user-select: none;
  }

  .reactEasyCrop_Image,
  ${BackgroundImage} {
    max-height: none;
    max-width: none;
  }

  ${props =>
    props.isAlignedRight &&
    css`
      .reactEasyCrop_Image,
      ${BackgroundImage} {
        top: 0;
        right: 0;
        min-height: 0;
        min-width: 0;
        left: unset;
        bottom: unset;
        position: absolute;
      }
    `}

  @supports (mask-size: cover) {
    background: ${props => generateBackground(props.theme)};
    background-repeat: no-repeat;
    background-size: 100%;

    mask: url(${HeroBackgroundMask}) no-repeat;
    mask-size: cover;
    mask-position-x: 100%;
    mask-position-y: -150px;

    @media (max-width: 900px) {
      mask-position-x: 20%;
    }
  }
`;

export const DEFAULT_BACKGROUND_CROP = { x: 0, y: 0 };

export const getCrop = collective => {
  return get(collective.settings, 'collectivePage.background.crop') || DEFAULT_BACKGROUND_CROP;
};

export const getZoom = collective => {
  return get(collective.settings, 'collectivePage.background.zoom') || 1;
};

export const getAlignedRight = collective => {
  return get(collective.settings, 'collectivePage.background.isAlignedRight');
};

/**
 * Wraps the logic to display the hero background. Fallsback on a white background if
 * css `mask` is not supported.
 */
const HeroBackground = ({ collective }) => {
  const crop = getCrop(collective);
  const zoom = getZoom(collective);
  const isAlignedRight = getAlignedRight(collective);
  const hasBackgroundSettings = has(collective.settings, 'collectivePage.background');

  return (
    <StyledHeroBackground isAlignedRight={isAlignedRight}>
      {collective.backgroundImageUrl && (
        <BackgroundImage
          src={collective.backgroundImageUrl}
          style={
            hasBackgroundSettings
              ? { transform: `translate(${crop.x}px, ${crop.y}px) scale(${zoom})` }
              : { minWidth: '100%' }
          }
        />
      )}
    </StyledHeroBackground>
  );
};

HeroBackground.propTypes = {
  /** The collective to show the image for */
  collective: PropTypes.shape({
    id: PropTypes.number,
    /** The background image */
    backgroundImage: PropTypes.string,
    backgroundImageUrl: PropTypes.string,
    /** Collective settings */
    settings: PropTypes.shape({
      collectivePage: PropTypes.shape({
        background: PropTypes.shape({
          /** Used to display the background at the right position */
          offset: PropTypes.shape({ y: PropTypes.number.isRequired }),
          /** Only used for the editor */
          crop: PropTypes.shape({ y: PropTypes.number.isRequired }),
        }),
      }),
    }),
  }).isRequired,
};

/** @component */
export default HeroBackground;
