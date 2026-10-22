import React, { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { themeGet } from '@styled-system/theme-get';
import { clsx } from 'clsx';
import { unescape } from 'lodash-es';
import { ChevronLeft, ChevronRight, Download, ExternalLink, FileSpreadsheet, FileText, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { FormattedMessage, useIntl } from 'react-intl';
import { css, styled } from 'styled-components';

import useKeyBoardShortcut, { ARROW_LEFT_KEY, ARROW_RIGHT_KEY } from '../lib/hooks/useKeyboardKey';
import { generateDownloadUrlForFileUrl } from '../lib/image-utils';
import { getFileExtensionFromUrl } from '../lib/url-helpers';

import { Button as UIButton } from './ui/Button';
import { Dialog, DialogOverlay } from './ui/Dialog';
import { Box, Flex } from './Grid';
import Loading from './LoadingPlaceholder';
import StyledTooltip from './StyledTooltip';
import { Span } from './Text';

const PDFViewer = dynamic(() => import('./PDFViewer'), {
  ssr: false,
  loading: () => <Loading />,
});

const CSVPreview = dynamic(() => import('./CSVPreview'), {
  ssr: false,
  loading: () => <Loading />,
});

const NON_IMAGE_EXTENSIONS = ['csv', 'txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'odt', 'ods', 'zip', 'json', 'xml'];

type ViewerFile = {
  url: string;
  name?: string;
  info?: { width: number; type: string };
  type?: string;
};

/**
 * Files attached by the platform (e.g. settlement CSV exports) are plain links without file info,
 * so we fall back on the URL extension to know how to render them.
 */
const getFileKind = (file: ViewerFile): 'csv' | 'pdf' | 'image' | 'other' => {
  const contentType = file.info?.type || file.type;
  const extension = getFileExtensionFromUrl(file.url);
  if (contentType === 'text/csv' || extension === 'csv') {
    return 'csv';
  } else if (contentType === 'application/pdf' || extension === 'pdf') {
    return 'pdf';
  } else if (contentType?.startsWith('image/') || (!contentType && !NON_IMAGE_EXTENSIONS.includes(extension))) {
    return 'image';
  } else {
    return 'other';
  }
};

const FilePreviewUnavailable = ({
  file,
  canDownload,
  canOpenInNewWindow,
}: {
  file: ViewerFile;
  canDownload: boolean;
  canOpenInNewWindow: boolean;
}) => {
  const Icon = getFileKind(file) === 'csv' ? FileSpreadsheet : FileText;
  return (
    <div
      className="flex w-80 max-w-full flex-col items-center gap-3 rounded-xl bg-white p-6 text-center shadow-lg"
      data-cy="file-preview-unavailable"
    >
      <Icon size={48} strokeWidth={1.5} className="text-slate-400" />
      {file.name && <p className="font-medium break-all text-slate-900">{unescape(file.name)}</p>}
      <p className="text-sm text-muted-foreground">
        <FormattedMessage defaultMessage="Preview is not available for this file." id="K/1jV7" />
      </p>
      {(canDownload || canOpenInNewWindow) && (
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          {canDownload && (
            <UIButton variant="outline" size="sm" asChild>
              <a href={generateDownloadUrlForFileUrl(file.url)} download target="_blank" rel="noopener noreferrer">
                <Download size={16} />
                <FormattedMessage id="Download" defaultMessage="Download" />
              </a>
            </UIButton>
          )}
          {canOpenInNewWindow && (
            <UIButton variant="outline" size="sm" asChild>
              <a href={file.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={16} />
                <FormattedMessage defaultMessage="Open in new window" id="b2Wfwm" />
              </a>
            </UIButton>
          )}
        </div>
      )}
    </div>
  );
};

const Header = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 3500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: white;
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0.8) 0%, transparent 100%);
  height: 74px;
  padding: 16px;
`;

const Content = styled.div`
  max-width: 100%;
  z-index: 3000;
`;

const StyledArrowButton = styled.button<{
  disabled?: boolean;
  direction?: 'left' | 'right';
}>`
  outline: none;
  color: white;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  position: absolute;
  z-index: 3002;
  border-radius: 999px;
  height: 40px;
  width: 40px;
  margin: 16px;
  cursor: pointer;

  justify-content: center;
  align-items: center;
  display: ${props => (props.disabled ? 'none' : 'flex')};
  ${props =>
    props.direction &&
    css`
      position: absolute;

      ${props.direction === 'left' ? 'left: 0' : 'right: 0'};
    `}
  &:hover {
    background: ${themeGet('colors.primary.700')};
  }
  &:focus {
    background: ${themeGet('colors.primary.700')};
  }
`;

const Button = styled.button`
  color: white;
  border: none;
  outline: none;
  background: transparent;
  z-index: 3000;
  padding: 8px;
  border-radius: 99px;
  &:hover {
    background: black;
    color: white;
  }
  &:focus-visible {
    background: black;
    color: white;
  }
  cursor: pointer;
`;

const ButtonLink = styled.a`
  display: block;
  color: white;
  border: none;
  outline: none;
  background: transparent;
  z-index: 3000;
  padding: 8px;
  border-radius: 99px;

  &:hover {
    background: black;
    color: white;
  }

  &:focus-visible {
    background: black;
    color: white;
  }
  cursor: pointer;
`;

type FilesViewerModalProps = {
  onClose: () => void;
  parentTitle?: string;
  files?: ViewerFile[];
  openFileUrl?: string;
  allowOutsideInteraction?: boolean;
  canDownload?: boolean;
  canOpenInNewWindow?: boolean;
  hideCloseButton?: boolean;
  setOpenFileUrl?: (url: string) => void;
};

export default function FilesViewerModal({
  allowOutsideInteraction,
  onClose,
  parentTitle,
  files,
  openFileUrl,
  canDownload = true,
  canOpenInNewWindow = true,
  hideCloseButton = false,
  setOpenFileUrl,
}: FilesViewerModalProps) {
  const intl = useIntl();
  const initialIndex = openFileUrl ? files?.findIndex(f => f.url === openFileUrl) : 0;
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  React.useEffect(() => {
    if (openFileUrl) {
      const idx = files?.findIndex(f => f.url === openFileUrl) ?? 0;
      setSelectedIndex(idx);
    }
  }, [openFileUrl, files]);

  const onArrowLeft = React.useCallback(
    () =>
      setSelectedIndex(selectedIndex => {
        const newIndex = Math.max(selectedIndex - 1, 0);
        setOpenFileUrl?.(files?.[newIndex]?.url || '');
        return newIndex;
      }),
    [files, setOpenFileUrl],
  );

  const onArrowRight = React.useCallback(
    () =>
      setSelectedIndex(selectedIndex => {
        const newIndex = Math.min(selectedIndex + 1, (files?.length || 1) - 1);
        setOpenFileUrl?.(files?.[newIndex]?.url || '');
        return newIndex;
      }),
    [files, setOpenFileUrl],
  );

  useKeyBoardShortcut({ callback: onArrowRight, keyMatch: ARROW_RIGHT_KEY });
  useKeyBoardShortcut({ callback: onArrowLeft, keyMatch: ARROW_LEFT_KEY });

  const selectedItem = files?.length ? files?.[selectedIndex] : null;
  const [failedImageUrl, setFailedImageUrl] = useState<string>(null);

  const nbFiles = files?.length || 0;
  const hasMultipleFiles = nbFiles > 1;
  const contentWrapperRef = React.useRef(null);

  const renderFile = (file: ViewerFile, contentWrapperRef) => {
    const { url, name } = file;
    const fileKind = getFileKind(file);
    const renderUnavailable = () => (
      <FilePreviewUnavailable file={file} canDownload={canDownload} canOpenInNewWindow={canOpenInNewWindow} />
    );

    let content: React.ReactNode;
    if (fileKind === 'csv') {
      content = <CSVPreview key={url} url={url} renderFallback={renderUnavailable} />;
    } else if (fileKind === 'pdf') {
      content = <PDFViewer pdfUrl={url} contentWrapperRef={contentWrapperRef} />;
    } else if (fileKind === 'image' && failedImageUrl !== url) {
      content = (
        <img
          src={url}
          alt={name}
          className="h-auto max-h-[calc(100dvh-74px-10rem)] w-auto max-w-full object-contain"
          onError={() => setFailedImageUrl(url)}
        />
      );
    } else {
      content = renderUnavailable();
    }

    return <Content className={clsx(fileKind === 'csv' && 'w-full max-w-6xl')}>{content}</Content>;
  };

  return (
    <Dialog
      modal={!allowOutsideInteraction}
      open={true}
      onOpenChange={open => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogPrimitive.Content
        className="fixed top-0 left-0 z-3000 flex h-screen w-screen items-center justify-center xl:w-[calc(100vw-var(--drawer-width,0px))]"
        onInteractOutside={e => {
          if (allowOutsideInteraction) {
            e.preventDefault();
          }
        }}
      >
        {/* This is used when FilesViewerModal is opened from a Drawer, to enable interacting with the Drawer while it is open */}
        {allowOutsideInteraction ? (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
          <div
            className={clsx(
              'absolute inset-0 z-1500 backdrop-blur-xs',
              open ? 'animate-in fade-in-0' : 'animate-out fade-out-0',
            )}
            onClick={onClose}
          />
        ) : (
          <DialogOverlay onClick={onClose} className="absolute z-1500 backdrop-blur-xs" />
        )}

        <Header>
          <Box px={2}>
            <Span>
              {parentTitle ? (
                <Span letterSpacing="0" opacity="70%">
                  {parentTitle}{' '}
                  {hasMultipleFiles && (
                    <Span letterSpacing="0">
                      <FormattedMessage
                        id="CountOfTotalCount"
                        defaultMessage="{count} of {totalCount}"
                        values={{ count: selectedIndex + 1, totalCount: nbFiles }}
                      />
                    </Span>
                  )}{' '}
                  /{' '}
                </Span>
              ) : null}

              {/* Items descriptions can contain HTML entities from the rich text editor, we need to decode them */}
              <Span>{selectedItem?.name ? unescape(selectedItem.name) : ''}</Span>
            </Span>
          </Box>
          <Flex alignItems="center" gridGap={2}>
            {canDownload && (
              <StyledTooltip
                containerCursor="pointer"
                noArrow
                content={intl.formatMessage({ id: 'Download', defaultMessage: 'Download' })}
                delayHide={0}
              >
                <ButtonLink href={generateDownloadUrlForFileUrl(selectedItem?.url)} download target="_blank">
                  <Download size={24} />
                </ButtonLink>
              </StyledTooltip>
            )}
            {canOpenInNewWindow && (
              <StyledTooltip
                containerCursor="pointer"
                noArrow
                content={intl.formatMessage({ defaultMessage: 'Open in new window', id: 'b2Wfwm' })}
                delayHide={0}
              >
                <ButtonLink href={selectedItem?.url} target="_blank">
                  <ExternalLink size={24} />
                </ButtonLink>
              </StyledTooltip>
            )}
            {!hideCloseButton && (
              <StyledTooltip
                containerCursor="pointer"
                noArrow
                content={intl.formatMessage({ id: 'Close', defaultMessage: 'Close' })}
                delayHide={0}
              >
                <Button onClick={onClose}>
                  <X size="24" aria-hidden="true" />
                </Button>
              </StyledTooltip>
            )}
          </Flex>
        </Header>
        {hasMultipleFiles && (
          <React.Fragment>
            <StyledArrowButton direction="left" onClick={onArrowLeft} disabled={!selectedIndex}>
              <ChevronLeft size={24} />
            </StyledArrowButton>

            <StyledArrowButton
              direction="right"
              onClick={onArrowRight}
              disabled={!nbFiles || selectedIndex === nbFiles - 1}
            >
              <ChevronRight size={24} />
            </StyledArrowButton>
          </React.Fragment>
        )}

        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div
          className="z-3000 flex max-h-screen w-full justify-center overflow-y-auto px-4 py-16"
          onClick={e => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          {/*  eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            className="flex w-full max-w-full justify-center"
            ref={contentWrapperRef}
            onClick={e => {
              if (e.target === e.currentTarget) {
                onClose();
              }
            }}
          >
            {selectedItem && renderFile(selectedItem, contentWrapperRef)}
          </div>
        </div>
      </DialogPrimitive.Content>
    </Dialog>
  );
}
