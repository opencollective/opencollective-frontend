import React from 'react';
import PropTypes from 'prop-types';
import { Times } from '@styled-icons/fa-solid/Times';
import propTypes from '@styled-system/prop-types';
import { themeGet } from '@styled-system/theme-get';
import FocusTrap from 'focus-trap-react';
import { createPortal } from 'react-dom';
import { useIntl } from 'react-intl';
import styled, { createGlobalStyle, css } from 'styled-components';
import { background, BackgroundProps, LayoutProps, margin, overflow, space, SpaceProps } from 'styled-system';

import useKeyBoardShortcut, { ESCAPE_KEY } from '../lib/hooks/useKeyboardKey';

import Avatar from './Avatar';
import Container from './Container';
import { Flex } from './Grid';
import { fadeIn } from './StyledKeyframes';
import StyledLinkButton from './StyledLinkButton';
import { P, Span } from './Text';
import WarnIfUnsavedChanges from './WarnIfUnsavedChanges';

type WrapperProps = {
  zindex?: number;
};

const Wrapper = styled(Flex)<WrapperProps>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: ${props => props.zindex || 3000};

  justify-content: center;
  align-items: center;
`;

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
  padding: '20px',
};

const GlobalModalStyle = createGlobalStyle`
  body {
    overflow: hidden;
  }
`;

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  z-index: 2500;
  display: block;
  animation: ${fadeIn} 0.25s;
  will-change: opacity;
`;

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

export const CloseIcon = styled(Times)`
  height: 12px;
  width: 12px;
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
      <Span style={{ alignItems: 'center', display: 'flex' }} ml={2}>
        <StyledLinkButton type="button" onClick={onClose}>
          <CloseIcon />
        </StyledLinkButton>
      </Span>
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
    <Flex alignItems="center">
      <Avatar collective={collective} radius={40} />
      <P fontSize="16px" lineHeight="24px" fontWeight="bold" ml={3}>
        {customText || collective.name}
      </P>
    </Flex>
  </ModalHeader>
);

CollectiveModalHeader.propTypes = {
  collective: PropTypes.shape({
    name: PropTypes.string,
  }),
  customText: PropTypes.string,
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
  dividerMargin: '2rem 0',
  showDivider: true,
};

const DefaultTrapContainer = props => {
  return <FocusTrap focusTrapOptions={{ allowOutsideClick: true }} {...props} />;
};

/**
 * Modal component. Will pass down additional props to `ModalWrapper`, which is
 * a styled `Container`.
 */
const StyledModal = ({
  children,
  onClose,
  usePortal = true,
  hasUnsavedChanges = undefined,
  trapFocus = false,
  ignoreEscapeKey = false,
  ...props
}) => {
  const intl = useIntl();
  const modalRef = React.useRef(null);
  const TrapContainer = trapFocus ? DefaultTrapContainer : React.Fragment;
  const closeHandler = React.useCallback(() => {
    if (
      hasUnsavedChanges &&
      !confirm(intl.formatMessage({ defaultMessage: 'You have unsaved changes. Are you sure you want to close this?' }))
    ) {
      return;
    }

    onClose();
  }, [hasUnsavedChanges, onClose]);

  const onEscape = React.useCallback(() => {
    if (!ignoreEscapeKey) {
      closeHandler();
    }
  }, [closeHandler]);

  // Closes the modal upon the `ESC` key press.
  useKeyBoardShortcut({ callback: onEscape, keyMatch: ESCAPE_KEY });

  if (usePortal === false) {
    return (
      <React.Fragment>
        <GlobalModalStyle />
        {hasUnsavedChanges && <WarnIfUnsavedChanges hasUnsavedChanges />}
        <Wrapper>
          <TrapContainer>
            <Modal ref={modalRef} {...props}>
              {React.Children.map(children, child => {
                if (child?.type?.displayName === 'Header') {
                  return React.cloneElement(child, { onClose: closeHandler });
                }
                return child;
              })}
            </Modal>
          </TrapContainer>
        </Wrapper>
      </React.Fragment>
    );
  }
  if (typeof document !== 'undefined') {
    return createPortal(
      <React.Fragment>
        <GlobalModalStyle />
        {hasUnsavedChanges && <WarnIfUnsavedChanges hasUnsavedChanges />}
        <Wrapper zindex={props.zindex}>
          <TrapContainer>
            <Modal ref={modalRef} {...props}>
              {React.Children.map(children, child => {
                if (child?.type?.displayName === 'Header') {
                  return React.cloneElement(child, { onClose: closeHandler });
                }
                return child;
              })}
            </Modal>
          </TrapContainer>
          <ModalOverlay
            role="button"
            tabIndex={0}
            onClick={closeHandler}
            onKeyDown={event => {
              if (event.key === 'Escape') {
                event.preventDefault();
                onEscape();
              }
            }}
          />
        </Wrapper>
      </React.Fragment>,
      document.body,
    );
  } else {
    return null;
  }
};

StyledModal.propTypes = {
  /** width of the modal component */
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array]),
  /** height of the modal component */
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array]),
  /** width of the modal component */
  maxWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** height of the modal component */
  maxWeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** width of the modal component */
  minWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** height of the modal component */
  minWeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** zindex of the modal component */
  zindex: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** handles how the modal is closed */
  onClose: PropTypes.func.isRequired,
  /** whether to render the modal at the root with a portal */
  usePortal: PropTypes.bool,
  /** if true, a confirmation will be displayed if user tries to close the modal or leave the page */
  hasUnsavedChanges: PropTypes.bool,
  /** set this to true if the modal contains a form or buttons */
  trapFocus: PropTypes.bool,
  /** whether to ignore the escape key */
  ignoreEscapeKey: PropTypes.bool,
  /** children */
  children: PropTypes.node,
};

StyledModal.defaultProps = {
  usePortal: true,
  trapFocus: false,
  hasUnsavedChanges: false,
};

/** @component */
export default StyledModal;
