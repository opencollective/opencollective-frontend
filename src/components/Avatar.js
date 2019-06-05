import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { backgroundImage, backgroundColor, borders, borderColor, size } from 'styled-system';
import themeGet from '@styled-system/theme-get';
import tag from 'clean-tag';
import { Flex } from '@rebass/grid';
import withFallbackImage from '../lib/withFallbackImage';

const getInitials = name => name.split(' ').reduce((result, value) => (result += value.slice(0, 1).toUpperCase()), '');

export const StyledAvatar = styled(Flex)`
  align-items: center;
  background-color: ${({ theme, type }) => (type === 'USER' ? themeGet('colors.black.100')({ theme }) : 'none')};
  ${backgroundColor}
  ${backgroundImage}
  background-position: center center;
  background-repeat: no-repeat;
  background-size: cover;
  border-radius: ${({ type }) => (type === 'USER' ? '100px' : '25%')};
  ${borders}
  ${borderColor}
  color: ${themeGet('colors.black.400')};
  font-weight: bold;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  ${size}
  ${props =>
    props.animationDuration &&
    css`
      transition: width ${props.animationDuration}ms, height ${props.animationDuration}ms;
    `}
`;

StyledAvatar.defaultProps = {
  omitProps: tag.defaultProps.omitProps.concat('backgroundImage'),
};

const Avatar = ({ src, type = 'USER', radius, name, ...styleProps }) => {
  const style = {};
  // Avoid setting null/undefined background images
  if (src) {
    style.backgroundImage = `url(${src})`;
  }
  return (
    <StyledAvatar size={radius} type={type} style={style} {...styleProps}>
      {!src && type === 'USER' && name && <span>{getInitials(name)}</span>}
    </StyledAvatar>
  );
};

Avatar.propTypes = {
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

export default withFallbackImage(Avatar);
