// @deprecated, use `components/ui/Dialog` instead
import React from 'react';
import PropTypes from 'prop-types';
import propTypes from '@styled-system/prop-types';
import { themeGet } from '@styled-system/theme-get';
import clsx from 'clsx';
import { isNil, omitBy } from 'lodash';
import { X } from 'lucide-react';
import { useIntl } from 'react-intl';
import styled, { css } from 'styled-components';
import { background, BackgroundProps, LayoutProps, margin, overflow, space, SpaceProps } from 'styled-system';

import { Dialog, DialogContent } from './ui/Dialog';
import Avatar from './Avatar';
import Container from './Container';
import StyledLinkButton from './StyledLinkButton';
import WarnIfUnsavedChanges from './WarnIfUnsavedChanges';

type ModalProps = SpaceProps & LayoutProps & BackgroundProps;

const Modal = styled(Container).attrs((props: ModalProps) => ({
  maxWidth: props.maxWidth || '95%',
  maxHeight: props.maxHeight || '97%',
}))<ModalProps>`
  border: 1px solid rgba(9, 10, 10, 0.12);
  border-radius: 8px;
  overflow-y: auto;
  z-index: 3000;

  ${space};
  ${background};
  ${overflow};

  @media (max-width: ${themeGet('breakpoints.0')}) {
    max-height: 90vh;
  }
`;

Modal.defaultProps = {
  background: 'white',
  padding: '24px',
};

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

export const ModalBody = styled(Container)<ModalBodyProps>``;

ModalBody.defaultProps = {
  mt: '10px',
  mb: '30px',
};

ModalBody.propTypes = {
  /** width of the modal component */
  width: PropTypes.string,
  /** height of the modal component */
  height: PropTypes.string,
  /** children */
  children: PropTypes.node,
  ...propTypes.space,
};

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

export const CloseIcon = styled(X)`
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
};

export const ModalHeader = ({ children, onClose, hideCloseIcon, ...props }: ModalHeaderProps) => (
  <Header {...props}>
    {children || <div />}
    {!hideCloseIcon && (
      <StyledLinkButton className="h-7" type="button" onClick={onClose}>
        <CloseIcon />
      </StyledLinkButton>
    )}
  </Header>
);

ModalHeader.propTypes = {
  /** handles how the modal is closed */
  onClose: PropTypes.func,
  /** children */
  children: PropTypes.node,
  hideCloseIcon: PropTypes.bool,
};

ModalHeader.displayName = 'Header';

/**
 * A special header that displays collective name + avatar in the header.
 */
export const CollectiveModalHeader = ({ collective, customText, ...props }) => (
  <ModalHeader {...props}>
    <div className="flex items-center">
      <Avatar collective={collective} radius={32} />
      <p className="ml-4 text-xl font-bold">{customText || collective.name}</p>
    </div>
  </ModalHeader>
);

CollectiveModalHeader.propTypes = {
  collective: PropTypes.shape({
    name: PropTypes.string,
  }),
  customText: PropTypes.node,
};

CollectiveModalHeader.displayName = 'Header';

type ModalFooterProps = {
  children: React.ReactNode;
  dividerMargin?: string;
  isFullWidth?: boolean;
  showDivider?: boolean;
};

export const ModalFooter = ({ children, isFullWidth, showDivider, dividerMargin, ...props }: ModalFooterProps) => (
  <Container {...props}>
    {showDivider && <Divider margin={dividerMargin} isFullWidth={isFullWidth} />}
    {children}
  </Container>
);

ModalFooter.propTypes = {
  children: PropTypes.node,
  isFullWidth: PropTypes.bool,
  showDivider: PropTypes.bool,
  dividerMargin: PropTypes.string,
};

ModalFooter.defaultProps = {
  dividerMargin: '1.25rem 0',
  showDivider: true,
};

/**
 * Modal component. Will pass down additional props to `ModalWrapper`, which is
 * a styled `Container`.
 */
const StyledModal = ({
  children,
  onClose,
  hasUnsavedChanges = undefined,
  ignoreEscapeKey = false,
  preventClose = false,
  width = undefined,
  height = undefined,
  maxWidth = undefined,
  maxHeight = undefined,
  className = undefined,
  ...props
}) => {
  const intl = useIntl();
  const closeHandler = React.useCallback(() => {
    if (preventClose) {
      return;
    }
    if (
      hasUnsavedChanges &&
      !confirm(intl.formatMessage({ defaultMessage: 'You have unsaved changes. Are you sure you want to close this?' }))
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

StyledModal.propTypes = {
  /** width of the modal component */
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array]),
  /** height of the modal component */
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array]),
  /** width of the modal component */
  maxWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** height of the modal component */
  maxHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** width of the modal component */
  minWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** height of the modal component */
  minWeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** handles how the modal is closed */
  onClose: PropTypes.func.isRequired,
  /** if true, a confirmation will be displayed if user tries to close the modal or leave the page */
  hasUnsavedChanges: PropTypes.bool,
  /** whether to ignore the escape key */
  ignoreEscapeKey: PropTypes.bool,
  /** children */
  children: PropTypes.node,
};

StyledModal.defaultProps = {
  hasUnsavedChanges: false,
};

/** @component */
export default StyledModal;
