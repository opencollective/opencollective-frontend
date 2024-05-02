import React from 'react';
import { FileText } from '@styled-icons/feather/FileText';

import { formatFileSize } from '../lib/file-utils';

import { Box, Flex } from './Grid';
import StyledLink from './StyledLink';

type LocalFilePreviewProps = {
  file: File;
  size: number;
  alignItems?: 'flex-start' | 'center';
};

const SUPPORTED_IMAGE_REGEX = /^image\/(jpeg|jpg|png|gif|webp)$/;

const OptionallyLinkable = ({
  isLinkable,
  linkProps,
  children,
}: {
  isLinkable: boolean;
  linkProps: any;
  children: React.ReactNode;
}) => {
  return isLinkable ? <StyledLink {...linkProps}>{children}</StyledLink> : <React.Fragment>{children}</React.Fragment>;
};

export default function LocalFilePreview({ file, size, alignItems = 'flex-start' }: Readonly<LocalFilePreviewProps>) {
  const isImage = SUPPORTED_IMAGE_REGEX.test(file.type);
  const isLinkable = isImage || file.type === 'application/pdf';
  const linkProps = isLinkable ? { href: URL.createObjectURL(file), openInNewTab: true } : null;
  return (
    <Flex flexDirection="column" alignItems={alignItems}>
      <Box maxWidth={size} maxHeight={size}>
        <OptionallyLinkable isLinkable={isLinkable} linkProps={linkProps}>
          {isImage ? (
            <img height="100%" width="100%" src={linkProps.href} alt={file.name} />
          ) : (
            <Box width={size} height={size}>
              <FileText opacity={0.25} />
            </Box>
          )}
        </OptionallyLinkable>
      </Box>

      <p className="mt-2 max-w-full truncate text-center text-xs">
        <OptionallyLinkable
          isLinkable={isLinkable}
          linkProps={{
            ...linkProps,
            fontWeight: 'bold',
            hoverColor: 'black.800',
            color: 'black.800',
            underlineOnHover: true,
          }}
        >
          <span className="font-bold text-gray-800">{file.name}</span>
        </OptionallyLinkable>{' '}
        <span className="text-gray-500">({formatFileSize(file.size)})</span>
      </p>
    </Flex>
  );
}
