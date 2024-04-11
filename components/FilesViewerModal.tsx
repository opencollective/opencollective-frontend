import React, { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { themeGet } from '@styled-system/theme-get';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Download, ExternalLink, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import useKeyBoardShortcut, { ARROW_LEFT_KEY, ARROW_RIGHT_KEY } from '../lib/hooks/useKeyboardKey';
import { imagePreview } from '../lib/image-utils';
import { getFileExtensionFromUrl } from '../lib/url-helpers';

import { Dialog, DialogOverlay } from './ui/Dialog';
import { Box, Flex } from './Grid';
import Loading from './LoadingPlaceholder';
import StyledTooltip from './StyledTooltip';
import { Span } from './Text';
import UploadedFilePreview from './UploadedFilePreview';

const PDFViewer = dynamic(() => import('./PDFViewer'), {
  ssr: false,
  loading: () => <Loading />,
});

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

const StyledImg = styled.img`
  width: 100%;
`;

type FilesViewerModalProps = {
  onClose: () => void;
  parentTitle?: string;
  files?: {
    url: string;
    name?: string;
    info?: { width: number };
  }[];
  openFileUrl?: string;
  allowOutsideInteraction?: boolean;
};

export default function FilesViewerModal({
  allowOutsideInteraction,
  onClose,
  parentTitle,
  files,
  openFileUrl,
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

  const onArrowLeft = React.useCallback(() => setSelectedIndex(selectedIndex => Math.max(selectedIndex - 1, 0)), []);
  const onArrowRight = React.useCallback(
    () => setSelectedIndex(selectedIndex => Math.min(selectedIndex + 1, (files?.length || 1) - 1)),
    [files],
  );
  useKeyBoardShortcut({ callback: onArrowRight, keyMatch: ARROW_RIGHT_KEY });
  useKeyBoardShortcut({ callback: onArrowLeft, keyMatch: ARROW_LEFT_KEY });

  const selectedItem = files?.length ? files?.[selectedIndex] : null;

  const nbFiles = files?.length || 0;
  const hasMultipleFiles = nbFiles > 1;
  const contentWrapperRef = React.useRef(null);

  const renderFile = (
    { url, info, name }: { url: string; name?: string; info?: { width: number } },
    contentWrapperRef,
  ) => {
    let content = null;
    const fileExtension = getFileExtensionFromUrl(url);

    const isText = ['csv', 'txt'].includes(fileExtension);
    const isPdf = fileExtension === 'pdf';

    if (isText) {
      content = <UploadedFilePreview size={288} url={url} alt={name} showFileName fileName={name} color="black.200" />;
    } else if (isPdf) {
      content = <PDFViewer pdfUrl={url} contentWrapperRef={contentWrapperRef} />;
    } else {
      const { width: imageWidth } = info || {};
      const maxWidth = 1200;
      const resizeWidth = Math.min(maxWidth, imageWidth ?? maxWidth);
      content = <StyledImg src={imagePreview(url, null, { width: resizeWidth })} alt={name} />;
    }

    return <Content>{content}</Content>;
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
        className="fixed left-0 top-0 z-[3000] flex h-screen w-screen items-center justify-center xl:w-[calc(100vw-var(--drawer-width,0px))]"
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
              'absolute inset-0 z-[1500] bg-foreground/25 backdrop-blur-sm',
              open ? 'animate-in fade-in-0' : 'animate-out fade-out-0',
            )}
            onClick={onClose}
          />
        ) : (
          <DialogOverlay onClick={onClose} className="absolute z-[1500] backdrop-blur-sm" />
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

              <Span>{selectedItem?.name}</Span>
            </Span>
          </Box>
          <Flex alignItems="center" gridGap={2}>
            <StyledTooltip
              containerCursor="pointer"
              noArrow
              content={intl.formatMessage({ id: 'Download', defaultMessage: 'Download' })}
              delayHide={0}
            >
              <ButtonLink
                /* To enable downloading files from S3 directly we're using a /api/download-file endpoint
                  to stream the file and set the correct headers. */
                href={`/api/download-file?url=${encodeURIComponent(selectedItem?.url)}`}
                download
                target="_blank"
              >
                <Download size={24} />
              </ButtonLink>
            </StyledTooltip>
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
          className="z-[3000] flex max-h-screen w-full justify-center overflow-y-auto px-4 py-16"
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
