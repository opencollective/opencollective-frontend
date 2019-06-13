import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { background, color, border, space, layout } from 'styled-system';
import themeGet from '@styled-system/theme-get';
import { Flex } from '@rebass/grid';

import { getBaseImagesUrl } from '../lib/utils';

const getInitials = name => name.split(' ').reduce((result, value) => (result += value.slice(0, 1).toUpperCase()), '');

export const StyledAvatar = styled(Flex)`
  align-items: center;
  background-color: ${({ theme, type }) => (type === 'USER' ? themeGet('colors.black.100')({ theme }) : 'none')};
  ${color}
  ${background}
  background-position: center center;
  background-repeat: no-repeat;
  background-size: cover;
  border-radius: ${({ type }) => (type === 'USER' ? '100px' : '25%')};
  ${border}
  color: ${themeGet('colors.black.400')};
  font-weight: bold;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  ${space}
  ${layout}
  ${props =>
    props.animationDuration &&
    css`
      transition: width ${props.animationDuration}ms, height ${props.animationDuration}ms;
    `}
`;


export const Avatar = ({ collective, src, type = 'USER', radius, name, ...styleProps }) => {
  // Use collective object instead of props
  if (collective) {
    type = collective.type;
    name = collective.name;
    src = `${getBaseImagesUrl()}/${collective.slug}/avatar.png`;
  }
  // Avoid setting null/undefined background images
  const backgroundImage = src ? `url(${src})` : undefined;
  return (
    <StyledAvatar size={radius} type={type} background={backgroundImage} {...styleProps}>
      {!src && type === 'USER' && name && <span>{getInitials(name)}</span>}
    </StyledAvatar>
  );
};

Avatar.propTypes = {
  /** Collective object */
  collective: PropTypes.object,
  /** Collective name */
  name: PropTypes.string,
  /** Collective image url */
  src: PropTypes.string,
  /** Collective type */
  type: PropTypes.oneOf(['USER', 'COLLECTIVE', 'ORGANIZATION', 'CHAPTER', 'ANONYMOUS']),
  /** Avatar size */
  radius: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Duration to transition size. Disabled if 0, null or undefined */
  animationDuration: PropTypes.number,
};

export default Avatar;
