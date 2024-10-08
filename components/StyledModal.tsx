// @deprecated, use `components/ui/Dialog` instead
import React from 'react';
import PropTypes from 'prop-types';
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
export const CollectiveModalHeader = ({ collective, preText = null, customText = undefined, ...props }) => (
  <ModalHeader {...props}>
    <div className="flex items-center gap-2 text-xl font-bold">
      {preText}
      <Avatar collective={collective} radius={32} />
      <p>{customText || collective.name}</p>
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

/**
 * Modal component. Will pass down additional props to `ModalWrapper`, which is
 * a styled `Container`.
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
}) => {
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

/** @component */
export default StyledModal;
