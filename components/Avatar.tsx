import React from 'react';
import { themeGet } from '@styled-system/theme-get';
import { Calendar, TestTube2, UserCog } from 'lucide-react';
import styled from 'styled-components';
import type { BorderProps } from 'styled-system';
import { border, color, layout, space } from 'styled-system';

import { CollectiveType, defaultImage } from '../lib/constants/collectives';
import { getAvatarBorderRadius, getCollectiveImage } from '../lib/image-utils';

import type { FlexProps } from './Grid';
import { Flex } from './Grid';

const getInitials = name => name.split(' ').reduce((result, value) => (result += value.slice(0, 1).toUpperCase()), '');

const COLLECTIVE_TYPE_ICON = {
  [CollectiveType.EVENT]: Calendar,
  [CollectiveType.PROJECT]: TestTube2,
  ROOT: UserCog,
};

type StyledAvatarProps = FlexProps &
  BorderProps & {
    src?: string;
    type?: string;
    size?: string | number | (string | number)[];
    title?: string;
    backgroundSize?: string;
  };

const StyledAvatar = styled(Flex).attrs<StyledAvatarProps>(props => ({
  style: {
    backgroundImage: props.src ? `url(${props.src})` : null,
    backgroundSize: props.backgroundSize || 'cover',
    backgroundColor: props.backgroundColor,
  },
}))<StyledAvatarProps>`
  align-items: center;
  background-color: ${({ theme, type }) =>
    type === 'USER' || type === 'INDIVIDUAL' ? themeGet('colors.black.100')({ theme }) : 'none'};
  color: ${themeGet('colors.black.400')};
  background-position: center center;
  background-repeat: no-repeat;
  border-radius: ${({ type }) => getAvatarBorderRadius(type)};
  ${border}
  font-weight: 600;
  justify-content: center;
  overflow: hidden;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  ${color}
  ${space}
  ${layout}
`;

/**
 * Returns the max avatar height multiplied by 2 (for retina screens)
 */
const getImageHeightFromRadius = (radius: string | number | (string | number)[]): number | undefined => {
  const normalizeValue = (value: string | number) => (typeof value === 'string' ? parseInt(value, 10) : value);
  if (Array.isArray(radius)) {
    return !radius.length ? undefined : Math.max(...radius.map(normalizeValue)) * 2;
  } else {
    return normalizeValue(radius) * 2;
  }
};

const Avatar = ({
  collective = null,
  src = undefined,
  type = 'USER',
  radius = 42,
  name = undefined,
  useIcon = false,
  children = null,
  displayTitle = true,
  ...styleProps
}: {
  collective?: {
    type?: string;
    name?: string;
    slug?: string;
    image?: string;
    isIncognito?: boolean;
    isGuest?: boolean;
  };
  src?: string;
  type?: string;
  radius?: string | number | (string | number)[];
  name?: string;
  useIcon?: boolean;
  children?: React.ReactNode;
  displayTitle?: boolean;
  backgroundColor?: string;
  backgroundSize?: string;
  animationDuration?: number;
  className?: string;
  style?: React.CSSProperties;
} & React.ComponentProps<typeof StyledAvatar>) => {
  let child = children;
  if (collective?.type === 'ROOT') {
    useIcon = true;
  }
  // Use collective object instead of props
  if (collective) {
    type = collective.type;
    name = collective.name;
    if (collective.isIncognito) {
      src = defaultImage.ANONYMOUS;
    } else if (collective.isGuest && shouldUseDefaultGuestAvatar(collective.name)) {
      src = defaultImage.GUEST;
    } else if (useIcon) {
      const Icon = COLLECTIVE_TYPE_ICON[type];
      if (Icon) {
        child = <Icon size={radius} />;
      }
    } else {
      src = getCollectiveImage(collective, { height: getImageHeightFromRadius(radius) });
    }

    if (!src && !child) {
      if ((type === 'USER' || type === 'INDIVIDUAL') && name) {
        child = <span>{getInitials(name)}</span>;
      }
    }
  }
  return (
    <StyledAvatar size={radius} type={type} src={src} title={displayTitle ? name : undefined} {...styleProps}>
      {child}
    </StyledAvatar>
  );
};

const shouldUseDefaultGuestAvatar = name => {
  return !name || name === 'Guest';
};

/**
 * Similar to `Avatar`, but builds from a Contributor instead of a collective
 */
export const ContributorAvatar = ({
  contributor,
  radius,
  ...styleProps
}: {
  contributor: {
    name: string;
    image: string;
    collectiveSlug: string;
    isIncognito: boolean;
    isGuest: boolean;
    type: string;
  };
  radius: string | number | (string | number)[];
}) => {
  let image = null;
  if (contributor.isIncognito) {
    image = defaultImage.ANONYMOUS;
  } else if (contributor.isGuest && shouldUseDefaultGuestAvatar(contributor.name)) {
    image = defaultImage.GUEST;
  } else {
    image = getCollectiveImage({ slug: contributor.collectiveSlug, imageUrl: contributor.image });
  }

  return <StyledAvatar size={radius} type={contributor.type} src={image} title={contributor.name} {...styleProps} />;
};

/** A simple avatar for incognito users */
export const IncognitoAvatar = avatarProps => {
  return <StyledAvatar {...avatarProps} type={CollectiveType.USER} src={defaultImage.ANONYMOUS} />;
};

/** A simple avatar for guest users */
export const GuestAvatar = avatarProps => {
  return <StyledAvatar {...avatarProps} type={CollectiveType.USER} src={defaultImage.GUEST} />;
};

/** @component */
export default Avatar;
