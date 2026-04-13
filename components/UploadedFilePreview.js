import React from 'react';
import { Download } from '@styled-icons/feather/Download';
import { FileText } from '@styled-icons/feather/FileText';
import { max } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { styled } from 'styled-components';

import { imagePreview, isFrontendStaticImage, isProtectedUploadedFileUrl } from '../lib/image-utils';
import { getFileExtensionFromUrl } from '../lib/url-helpers';
import { formatFileSize } from '@/lib/file-utils';

import PrivateInfoIcon from './icons/PrivateInfoIcon';
import Container from './Container';
import Link from './Link';
import LoadingPlaceholder from './LoadingPlaceholder';
import Spinner from './Spinner';
import { fadeInDown } from './StyledKeyframes';
import StyledLink from './StyledLink';
import { P } from './Text';
const FileTextIcon = styled(FileText)`
  opacity: 1;
`;

const DownloadIcon = styled(Download)`
  position: absolute;
  opacity: 0;
`;

const CardContainer = styled(Container)`
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

const MainContainer = styled(Container)`
  text-align: center;
  cursor: pointer;
  &:hover ${CardContainer} {
    ${FileTextIcon} {
      opacity: 0.25;
    }
    ${DownloadIcon} {
      opacity: 1;
      animation: ${fadeInDown} 0.3s;
    }
  }
`;

const FileName = styled(P)`
  overflow: hidden;
  text-overflow: ellipsis;
`;

/**
 * To display the preview of a file uploaded on Open Collective.
 * Supports images and PDFs.
 */
const UploadedFilePreview = ({
  isPrivate = false,
  isLoading = false,
  isDownloading = false,
  url,
  size = 88,
  maxHeight = undefined,
  alt = 'Uploaded file preview',
  fileName = undefined,
  fileSize = undefined,
  showFileName = undefined,
  border = '1px solid #dcdee0',
  openFileViewer = undefined,
  ...props
}) => {
  let content = null;
  const fileExtension = getFileExtensionFromUrl(url);
  const isText = ['csv', 'txt'].includes(fileExtension);

  if (isLoading) {
    content = <LoadingPlaceholder borderRadius={8} />;
  } else if (isDownloading) {
    content = <Spinner size="50%" />;
  } else if (isPrivate) {
    content = (
      <PrivateInfoIcon size="60%" className="mx-auto text-slate-200">
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
    content = <FileTextIcon color="#dcdee0" size="60%" />;
  } else {
    if (isProtectedUploadedFileUrl(url)) {
      content = <ThumbnailAwareImagePreview url={url} alt={alt || fileName} />;
    } else {
      const resizeWidth = Array.isArray(size) ? max(size) : size;
      content = <img src={imagePreview(url, null, { width: resizeWidth })} alt={alt || fileName} />;
    }
  }

  const getContainerAttributes = () => {
    if (isPrivate || !url) {
      return { as: 'div' };
    } else if (isText || !openFileViewer) {
      return { href: url, target: '_blank', rel: 'noopener noreferrer', as: url.startsWith('/') ? Link : StyledLink };
    } else {
      return {
        as: 'div',
        onClick: e => {
          e.stopPropagation();
          openFileViewer(url);
        },
      };
    }
  };

  return (
    <MainContainer color="black.700" {...props} maxWidth={size} {...getContainerAttributes()}>
      <CardContainer size={size} maxHeight={maxHeight} title={fileName} border={border}>
        {content}
      </CardContainer>
      {showFileName && (
        <Container mt="4px" maxWidth={size || 100} textAlign="left" px={1}>
          {isLoading ? (
            <LoadingPlaceholder height={12} />
          ) : fileName ? (
            <FileName fontSize="13px" fontWeight="700">
              {fileName}
            </FileName>
          ) : (
            <P fontStyle="italic" fontSize="13px">
              <FormattedMessage id="File.NoFilename" defaultMessage="No filename" />
            </P>
          )}
          {fileSize && (
            <P mt="2px" fontSize="11px" lineHeight="16px" color="black.600" fontWeight="400">
              {formatFileSize(fileSize)}
            </P>
          )}
        </Container>
      )}
    </MainContainer>
  );
};

export default UploadedFilePreview;

function ThumbnailAwareImagePreview({ url, alt }) {
  const [isLoadingThumbnail, setIsLoadingThumbnail] = React.useState(true);
  const [thumbnailUrl, setThumbnailUrl] = React.useState(() => {
    const imgUrl = new URL(url);
    imgUrl.searchParams.set('thumbnail', '');
    return imgUrl.toString();
  });
  const [retryCount, setRetry] = React.useState(0);
  const maxRetries = 5;

  React.useEffect(() => {
    async function checkThumbnail() {
      try {
        const res = await fetch(`${url}?thumbnail`, {
          method: 'HEAD',
        });

        const imgUrl = new URL(url);
        imgUrl.searchParams.set('thumbnail', '');

        if (res.redirected && !isFrontendStaticImage(res.url)) {
          imgUrl.searchParams.set('t', new Date().getTime());
          setThumbnailUrl(imgUrl.toString());
          setIsLoadingThumbnail(false);
        } else {
          setThumbnailUrl(imgUrl.toString());
        }

        if (retryCount >= maxRetries) {
          setIsLoadingThumbnail(false);
        }
      } finally {
        setRetry(retry => retry + 1);
      }
    }

    let interval;
    if (isLoadingThumbnail) {
      interval = setInterval(checkThumbnail, 1500);
    }

    return () => interval && clearInterval(interval);
  }, [url, retryCount, isLoadingThumbnail]);

  return <img src={thumbnailUrl} alt={alt} />;
}

ThumbnailAwareImagePreview.propTypes = {
  url: PropTypes.string,
  alt: PropTypes.string,
};
