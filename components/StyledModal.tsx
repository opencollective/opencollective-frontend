// @deprecated, use `components/ui/Dialog` instead
import React from 'react';
import propTypes from '@styled-system/prop-types';
import clsx from 'clsx';
import { isNil, omitBy } from 'lodash';
import { X } from 'lucide-react';
import { useIntl } from 'react-intl';
import styled, { css } from 'styled-components';
import type { LayoutProps, SpaceProps } from 'styled-system';
import { margin } from 'styled-system';

import { Dialog, DialogContent } from './ui/Dialog';
import Avatar from './Avatar';
import type { ContainerProps } from './Container';
import Container from './Container';
import StyledLinkButton from './StyledLinkButton';
import WarnIfUnsavedChanges from './WarnIfUnsavedChanges';

const Header = styled(Container)`
  font-size: 20px;
  color: #090a0a;
  font-weight: 600;
  display: flex;
  text-shadow: none;
  justify-content: space-between;
  align-items: flex-start;
`;

type ModalBodyProps = LayoutProps & SpaceProps;

export const ModalBody = styled(Container).attrs<ModalBodyProps>(props => ({
  mt: props.mt ?? '10px',
  mb: props.mb ?? '30px',
}))<ModalBodyProps>``;

type DividerProps = SpaceProps & { isFullWidth?: boolean };

const Divider = styled.div<DividerProps>`
  ${margin}
  width: 100%;
  height: 1px;
  background-color: #e1e4e6;
  ${props =>
    props.isFullWidth &&
    css`
      margin-left: -20px;
      width: calc(100% + 40px);
    `}
`;

const CloseIcon = styled(X)`
  height: 20px;
  width: 20px;
  color: #76777a;
  vertical-align: middle;
  cursor: pointer;
`;

type ModalHeaderProps = {
  children?: React.ReactNode;
  onClose?: () => void;
  hideCloseIcon?: boolean;
} & Pick<ContainerProps, 'mb'>;

interface ModalHeaderProps {
  /** handles how the modal is closed */
  onClose?(...args: unknown[]): unknown;
  /** children */
  children?: React.ReactNode;
  hideCloseIcon?: boolean;
}

export const ModalHeader = ({
  children,
  onClose,
  hideCloseIcon,
  ...props
}: ModalHeaderProps) => (
  <Header {...props}>
    {children || <div />}
    {!hideCloseIcon && (
      <StyledLinkButton className="h-7" type="button" onClick={onClose}>
        <CloseIcon />
      </StyledLinkButton>
    )}
  </Header>
);

ModalHeader.displayName = 'Header';

interface CollectiveModalHeaderProps {
  collective?: {
    name?: string;
  };
  customText?: React.ReactNode;
}

/**
 * A special header that displays collective name + avatar in the header.
 */
export const CollectiveModalHeader = ({
  collective,
  preText = null,
  customText = undefined,
  ...props
}: CollectiveModalHeaderProps) => (
  <ModalHeader {...props}>
    <div className="flex items-center gap-2 text-xl font-bold">
      {preText}
      <Avatar collective={collective} radius={32} />
      <p>{customText || collective.name}</p>
    </div>
  </ModalHeader>
);

CollectiveModalHeader.displayName = 'Header';

type ModalFooterProps = {
  children: React.ReactNode;
  dividerMargin?: string;
  isFullWidth?: boolean;
  showDivider?: boolean;
};

export const ModalFooter = ({
  children,
  isFullWidth,
  showDivider = true,
  dividerMargin = '1.25rem 0',
  ...props
}: ModalFooterProps) => (
  <Container {...props}>
    {showDivider && <Divider margin={dividerMargin} isFullWidth={isFullWidth} />}
    {children}
  </Container>
);

interface StyledModalProps {
  /** width of the modal component */
  width?: string | number | unknown[];
  /** height of the modal component */
  height?: string | number | unknown[];
  /** width of the modal component */
  maxWidth?: string | number;
  /** height of the modal component */
  maxHeight?: string | number;
  /** width of the modal component */
  minWidth?: string | number;
  /** height of the modal component */
  minWeight?: string | number;
  /** handles how the modal is closed */
  onClose(...args: unknown[]): unknown;
  /** if true, a confirmation will be displayed if user tries to close the modal or leave the page */
  hasUnsavedChanges?: boolean;
  /** whether to ignore the escape key */
  ignoreEscapeKey?: boolean;
  /** children */
  children?: React.ReactNode;
}

/**
 * Modal component. Will pass down additional props to `ModalWrapper`, which is
 * a styled `Container`.
 *
 * @deprecated Use `ui/Dialog` instead
 */
const StyledModal = ({
  children,
  onClose,
  hasUnsavedChanges = false,
  ignoreEscapeKey = false,
  preventClose = false,
  width = undefined,
  height = undefined,
  maxWidth = undefined,
  maxHeight = undefined,
  className = undefined,
  ...props
}: StyledModalProps) => {
  const intl = useIntl();
  const closeHandler = React.useCallback(() => {
    if (preventClose) {
      return;
    }
    if (
      hasUnsavedChanges &&
      !confirm(
        intl.formatMessage({
          defaultMessage: 'You have unsaved changes. Are you sure you want to close this?',
          id: 'srNsR3',
        }),
      )
    ) {
      return;
    }

    onClose();
  }, [hasUnsavedChanges, onClose, preventClose]);

  return (
    <React.Fragment>
      {hasUnsavedChanges && <WarnIfUnsavedChanges hasUnsavedChanges />}

      <Dialog
        open={true}
        onOpenChange={open => {
          if (!open) {
            closeHandler();
          }
        }}
      >
        <DialogContent
          hideCloseButton
          onEscapeKeyDown={e => {
            if (ignoreEscapeKey) {
              e.preventDefault();
            }
          }}
          style={omitBy({ width, height, maxWidth, maxHeight }, isNil)}
          className={clsx('gap-0', className)}
          {...props}
        >
          {React.Children.map(children, child => {
            if (child?.type?.displayName === 'Header') {
              return React.cloneElement(child, { onClose: closeHandler });
            }
            return child;
          })}
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
};

/** @component */
export default StyledModal;
