import React from 'react';
import PropTypes from 'prop-types';
import { FileText } from '@styled-icons/feather/FileText';
import { max } from 'lodash';
import styled from 'styled-components';

import { imagePreview } from '../lib/image-utils';

import PrivateInfoIcon from './icons/PrivateInfoIcon';
import Container from './Container';
import LoadingPlaceholder from './LoadingPlaceholder';
import StyledLink from './StyledLink';

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

const MainContainer = styled(Container)`
  border-radius: 8px;
  padding: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  max-width: 100%;

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

/**
 * To display the preview of a file uploaded on Open Collective.
 * Supports images and PDFs.
 */
const UploadedFilePreview = ({ isPrivate, isLoading, url, size, alt, hasLink, ...props }) => {
  let content = null;

  if (isLoading) {
    content = <LoadingPlaceholder borderRadius={8} />;
  } else if (isPrivate) {
    content = <PrivateInfoIcon color="#dcdee0" size={size / 2} />;
  } else if (!url) {
    content = <FileText color="#dcdee0" size={size / 2} />;
  } else {
    const resizeWidth = Array.isArray(size) ? max(size) : size;
    const img = <img src={imagePreview(url, null, { width: resizeWidth })} alt={alt} />;
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
