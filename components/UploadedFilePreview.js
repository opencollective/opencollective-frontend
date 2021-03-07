import React from 'react';
import PropTypes from 'prop-types';
import { Download } from '@styled-icons/feather/Download';
import { FileText } from '@styled-icons/feather/FileText';
import { endsWith, max } from 'lodash';
import Image from 'next/image';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';

import { imagePreview } from '../lib/image-utils';

import PrivateInfoIcon from './icons/PrivateInfoIcon';
import Container from './Container';
import LoadingPlaceholder from './LoadingPlaceholder';
import { fadeInDown } from './StyledKeyframes';
import StyledLink from './StyledLink';
import StyledSpinner from './StyledSpinner';

const ImageLink = styled(StyledLink)`
  cursor: pointer;
  overflow: hidden;
  display: block;
  width: 100%;
  height: 100%;
  text-align: center;
`;

ImageLink.defaultProps = {
  openInNewTab: true,
};

const FileTextIcon = styled(FileText)`
  opacity: 1;
`;

const DownloadIcon = styled(Download)`
  position: absolute;
  opacity: 0;
`;

const MainContainer = styled(Container)`
  position: relative;
  border-radius: 8px;
  padding: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  max-width: 100%;
  background: white;

  svg {
    transition: opacity 0.3s;
  }

  ${props =>
    props.onClick &&
    css`
      cursor: pointer;
      &:hover {
        ${FileTextIcon} {
          opacity: 0.25;
        }
        ${DownloadIcon} {
          opacity: 1;
          animation: ${fadeInDown} 0.3s;
        }
      }
    `}

  img {
    width: 100%;
    max-height: 100%;
    max-width: 100%;
    border-radius: 8px;
    @media (max-width: 40em) {
      object-fit: cover;
    }
  }
`;

const PrivateIconContainer = styled.div`
  text-align: center;
  svg {
    max-height: 32px;
  }
`;

/**
 * To display the preview of a file uploaded on Open Collective.
 * Supports images and PDFs.
 */
const UploadedFilePreview = ({ isPrivate, isLoading, isDownloading, url, size, alt, hasLink, ...props }) => {
  let content = null;
  const isText = endsWith(url, 'csv') || endsWith(url, 'txt') || endsWith(url, 'pdf');

  if (isLoading) {
    content = <LoadingPlaceholder borderRadius={8} />;
  } else if (isDownloading) {
    content = <StyledSpinner size="50%" />;
  } else if (isPrivate) {
    content = (
      <PrivateInfoIcon color="#dcdee0" size="60%" tooltipProps={{ childrenContainer: PrivateIconContainer }}>
        <FormattedMessage id="Attachment.Private" defaultMessage="This attachment is private" />
      </PrivateInfoIcon>
    );
  } else if (!url && props.onClick) {
    content = (
      <React.Fragment>
        <FileTextIcon color="#dcdee0" size="60%" />
        <DownloadIcon color="#b3b3b3" size="30%" />
      </React.Fragment>
    );
  } else if (!url) {
    content = <FileText color="#dcdee0" size="60%" />;
  } else if (isText) {
    const icon = <FileTextIcon color="#dcdee0" size="60%" />;
    content = url ? (
      <StyledLink href={url} key={url} textAlign="center" openInNewTab>
        {icon}
      </StyledLink>
    ) : (
      icon
    );
  } else {
    const resizeWidth = Array.isArray(size) ? max(size) : size;
    const img = <Image src={imagePreview(url, null, { width: resizeWidth })} alt={alt} layout="fill" />;
    content = !hasLink ? (
      img
    ) : (
      <ImageLink href={url} key={url}>
        {img}
      </ImageLink>
    );
  }

  return (
    <MainContainer size={size} {...props}>
      {content}
    </MainContainer>
  );
};

UploadedFilePreview.propTypes = {
  url: PropTypes.string,
  isPrivate: PropTypes.bool,
  isLoading: PropTypes.bool,
  isDownloading: PropTypes.bool,
  alt: PropTypes.string,
  onClick: PropTypes.func,
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array]),
  maxHeihgt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array]),
  /** If true, a link to the original file will be added if possible */
  hasLink: PropTypes.bool,
};

UploadedFilePreview.defaultProps = {
  size: 88,
  border: '1px solid #dcdee0',
  hasLink: true,
  alt: 'Uploaded file preview',
};

export default UploadedFilePreview;
