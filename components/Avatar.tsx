import React from 'react';
import { themeGet } from '@styled-system/theme-get';
import { isEmpty } from 'lodash';
import { ArrowUp, Calendar, LoaderCircle, Pencil, TestTube2, UserCog } from 'lucide-react';
import type { FileRejection } from 'react-dropzone';
import { useDropzone } from 'react-dropzone';
import { styled } from 'styled-components';
import type { BorderProps, ColorProps, LayoutProps, SpaceProps } from 'styled-system';
import { border, color, layout, space } from 'styled-system';

import { CollectiveType, defaultImage } from '../lib/constants/collectives';
import { getAvatarBorderRadius, getCollectiveImage } from '../lib/image-utils';
import { UploadedFileKind } from '@/lib/graphql/types/v2/schema';
import { useImageUploader } from '@/lib/hooks/useImageUploader';
import { cn } from '@/lib/utils';

import { DROPZONE_ACCEPT_IMAGES } from './Dropzone';
import type { FlexProps } from './Grid';
import { Flex } from './Grid';

const getInitials = name => name.split(' ').reduce((result, value) => (result += value.slice(0, 1).toUpperCase()), '');

const COLLECTIVE_TYPE_ICON = {
  [CollectiveType.EVENT]: Calendar,
  [CollectiveType.PROJECT]: TestTube2,
  ROOT: UserCog,
};

type StyledAvatarProps = SpaceProps &
  ColorProps &
  BorderProps &
  FlexProps &
  LayoutProps & {
    src?: string;
    type?: string;
    size?: string | number | (string | number)[];
    title?: string;
    backgroundSize?: string;
  };

const BaseAvatar = props => (
  <Flex
    style={{
      ...props.style,
      backgroundImage: props.src ? `url(${props.src})` : null,
      backgroundSize: props.backgroundSize || 'cover',
      backgroundColor: props.backgroundColor,
    }}
    {...props}
  />
);

const StyledAvatar = styled(BaseAvatar)<StyledAvatarProps>`
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
  const isIndividual = type === 'INDIVIDUAL' || type === 'USER';

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
  }
  if (!src && !child) {
    if (isIndividual && !isEmpty(name)) {
      child = <span>{getInitials(name)}</span>;
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

/**
 * Editable Avatar Field following new UI patterns
 */
export const EditAvatar = ({
  value,
  name,
  type,
  size,
  minSize,
  maxSize,
  onSuccess,
  onReject,
}: {
  value?: string;
  name?: string;
  type?: string;
  size: string | number;
  minSize?: number;
  maxSize?: number;
  onSuccess: ({ url }: { url: string }) => void;
  onReject?: ({ message }: { message: string }) => void;
}) => {
  const { uploadFiles, isUploading } = useImageUploader({
    isMulti: false,
    mockImageGenerator: () => `https://loremflickr.com/120/120/logo`,
    onSuccess,
    onReject,
    kind: UploadedFileKind.ACCOUNT_AVATAR,
    accept: DROPZONE_ACCEPT_IMAGES,
  });
  const onDropCallback = React.useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      uploadFiles(acceptedFiles, fileRejections);
    },
    [uploadFiles],
  );
  const isIndividual = type === 'INDIVIDUAL' || type === 'USER';
  const dropzoneParams = { accept: DROPZONE_ACCEPT_IMAGES, minSize, maxSize, multiple: false, onDrop: onDropCallback };
  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneParams);
  const dropProps = getRootProps();
  return (
    <div
      data-cy={`avatar-dropzone`}
      className="group relative cursor-pointer outline-none"
      style={{ height: size, width: size }}
      {...dropProps}
      role="button"
      tabIndex={0}
    >
      <input name={name} {...getInputProps()} />
      <Avatar
        size={size}
        className={cn(
          'relative ring-ring ring-offset-background transition-[color,box-shadow] duration-300 group-hover:ring-2 group-focus:ring-2 after:absolute after:size-[100%] after:bg-white/0 after:transition-colors after:duration-300 group-hover:after:bg-white/30',
          isUploading && 'opacity-30 ring-0!',
          isDragActive && 'ring-2 ring-primary after:bg-white/30',
        )}
        src={isIndividual ? value || '/static/images/sample-avatar.png' : value}
        backgroundSize={value ? undefined : '80%'}
        type={type || 'INDIVIDUAL'}
        name={name}
        displayTitle
      />
      <div
        className={cn(
          'absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full bg-white shadow-md transition-colors duration-300 group-hover:bg-primary group-focus:bg-primary',
          (isUploading || isDragActive) && 'bg-primary',
        )}
      >
        {isUploading ? (
          <LoaderCircle size={16} className="text-white motion-safe:animate-spin" />
        ) : isDragActive ? (
          <ArrowUp size={14} className="text-white" />
        ) : (
          <Pencil size={14} className="text-muted-foreground group-hover:text-white group-focus:text-white" />
        )}
      </div>
    </div>
  );
};
