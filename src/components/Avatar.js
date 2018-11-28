import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { backgroundImage, borders, borderColor, size, themeGet } from 'styled-system';
import tag from 'clean-tag';
import { Flex } from '@rebass/grid';
import withFallbackImage from '../lib/withFallbackImage';

const getInitials = name => name.split(' ').reduce((result, value) => (result += value.slice(0, 1).toUpperCase()), '');

export const StyledAvatar = styled(Flex)`
  align-items: center;
  background-color: ${({ theme, type }) => (type === 'USER' ? themeGet('colors.black.100')({ theme }) : 'none')};
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
  ${size}
`;

StyledAvatar.defaultProps = {
  blacklist: tag.defaultProps.blacklist.concat('backgroundImage'),
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
  name: PropTypes.string,
  src: PropTypes.string,
  type: PropTypes.oneOf(['USER', 'COLLECTIVE', 'ORGANIZATION', 'CHAPTER', 'ANONYMOUS']),
};

export default withFallbackImage(Avatar);
