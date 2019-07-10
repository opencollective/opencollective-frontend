import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { color, border, space, layout } from 'styled-system';
import themeGet from '@styled-system/theme-get';
import { Flex } from '@rebass/grid';

import { getBaseImagesUrl } from '../lib/utils';
import { defaultImage } from '../constants/collectives';

const getInitials = name => name.split(' ').reduce((result, value) => (result += value.slice(0, 1).toUpperCase()), '');

const StyledAvatar = styled(Flex).attrs(props => ({
  style: { backgroundImage: props.src ? `url(${props.src})` : null },
}))`
  align-items: center;
  background-color: ${({ theme, type }) => (type === 'USER' ? themeGet('colors.black.100')({ theme }) : 'none')};
  ${color}
  background-position: center center;
  background-repeat: no-repeat;
  background-size: cover;
  border-radius: ${({ type }) => (type === 'USER' ? '50%' : '25%')};
  ${border}
  color: ${themeGet('colors.black.400')};
  font-weight: bold;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  ${space}
  ${layout}
`;

const Avatar = ({ collective, src, type = 'USER', radius, name, ...styleProps }) => {
  // Use collective object instead of props
  if (collective) {
    type = collective.type;
    name = collective.name;
    if (collective.isAnonymous) {
      src = defaultImage['ANONYMOUS'];
    } else {
      src = `${getBaseImagesUrl()}/${collective.slug}/avatar.png`;
    }
  }
  return (
    <StyledAvatar size={radius} type={type} src={src} {...styleProps}>
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
  isAnonymous: PropTypes.bool,
};

/**
 * Similar to `Avatar`, but builds from a Contributor instead of a collective
 */
export const ContributorAvatar = ({ contributor, radius, ...styleProps }) => {
  return (
    <StyledAvatar
      size={radius}
      type={contributor.type}
      src={getCollectiveImage({ slug: contributor.collectiveSlug })}
      {...styleProps}
    />
  );
};

ContributorAvatar.propTypes = {
  /** Collective object */
  contributor: PropTypes.shape({
    name: PropTypes.string,
    collectiveSlug: PropTypes.string,
    type: PropTypes.oneOf(['USER', 'COLLECTIVE', 'ORGANIZATION', 'CHAPTER', 'ANONYMOUS']),
  }).isRequired,
  radius: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default Avatar;
