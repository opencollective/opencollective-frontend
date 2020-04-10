import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { FileText } from '@styled-icons/feather/FileText';
import { imagePreview } from '../lib/image-utils';
import ExternalLink from './ExternalLink';
import PrivateInfoIcon from './icons/PrivateInfoIcon';
import Container from './Container';
import LoadingPlaceholder from './LoadingPlaceholder';

const ImageLink = styled(ExternalLink).attrs({ openInNewTab: true })`
  cursor: pointer;
  overflow: hidden;
  display: block;
  width: 100%;
  height: 100%;
  text-align: center;
`;

const MainContainer = styled(Container)`
  border-radius: 8px;
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    height: 100%;
    max-height: 100%;
    max-width: 100%;
  }
`;

/**
 * To display the preview of a file uploaded on Open Collective.
 * Supports images and PDFs.
 */
const UploadedFilePreview = ({ isPrivate, isLoading, url, size, alt, hasLink, ...props }) => {
  let content = null;

  if (isLoading) {
    content = <LoadingPlaceholder />;
  } else if (isPrivate) {
    content = <PrivateInfoIcon color="#dcdee0" size={size / 2} />;
  } else if (!url) {
    content = <FileText color="#dcdee0" size={size / 2} />;
  } else {
    const img = <img src={imagePreview(url)} alt={alt} />;
    content = !hasLink ? img : <ImageLink href={url}>{img}</ImageLink>;
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
  alt: PropTypes.string,
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** If true, a link to the original file will be added if possible */
  hasLink: PropTypes.bool,
};

UploadedFilePreview.defaultProps = {
  size: 88,
  border: '1px solid #dcdee0',
  hasLink: true,
};

export default UploadedFilePreview;
