import React from 'react';
import PropTypes from 'prop-types';
import { Times } from '@styled-icons/fa-solid/Times';
import themeGet from '@styled-system/theme-get';
import FocusTrap from 'focus-trap-react';
import { createPortal } from 'react-dom';
import styled, { createGlobalStyle, css } from 'styled-components';
import { background, margin, overflow, space } from 'styled-system';

import useKeyBoardShortcut, { ESCAPE_KEY } from '../lib/hooks/useKeyboardKey';

import Avatar from './Avatar';
import Container from './Container';
import { Flex } from './Grid';
import { fadeIn } from './StyledKeyframes';
import { P } from './Text';

const Wrapper = styled(Flex)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 3000;

  justify-content: center;
  align-items: center;
`;

const Modal = styled(Container).attrs(props => ({
  maxWidth: props.maxWidth || '95%',
  maxHeight: props.maxHeight || '97%',
}))`
  border: 1px solid rgba(9, 10, 10, 0.12);
  border-radius: 8px;
  overflow-y: auto;
  z-index: 3000;

  ${space};
  ${background};
  ${overflow}

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
`;

export const ModalBody = styled(Container)``;

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
};

const Divider = styled.div`
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

const CloseIcon = styled(Times)`
  font-size: 12px;
  width: 15px;
  height: 15px;
  color: #dadada;
  cursor: pointer;
`;

export const ModalHeader = ({ children, onClose, hideCloseIcon, ...props }) => (
  <Header {...props}>
    {children || <div />}
    {!hideCloseIcon && <CloseIcon onClick={onClose} />}
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
export const CollectiveModalHeader = ({ collective, ...props }) => (
  <ModalHeader {...props}>
    <Flex alignItems="center">
      <Avatar collective={collective} radius={40} />
      <P fontSize="16px" lineHeight="24px" fontWeight="bold" ml={3}>
        {collective.name}
      </P>
    </Flex>
  </ModalHeader>
);

CollectiveModalHeader.propTypes = {
  collective: PropTypes.shape({
    name: PropTypes.string,
  }),
};

CollectiveModalHeader.displayName = 'Header';

export const ModalFooter = ({ children, isFullWidth, dividerMargin, ...props }) => (
  <Container {...props}>
    <Divider margin={dividerMargin} isFullWidth={isFullWidth} />
    {children}
  </Container>
);

ModalFooter.propTypes = {
  children: PropTypes.node,
  isFullWidth: PropTypes.bool,
  dividerMargin: PropTypes.string,
};

ModalFooter.defaultProps = {
  dividerMargin: '2rem 0',
};

/**
 * Modal component. Will pass down additional props to `ModalWrapper`, which is
 * a styled `Container`.
 */
const StyledModal = ({ children, show, onClose, usePortal, trapFocus, ...props }) => {
  const TrapContainer = trapFocus ? FocusTrap : React.Fragment;

  // Closes the modal upon the `ESC` key press.
  useKeyBoardShortcut({ callback: () => onClose(), keyMatch: ESCAPE_KEY });

  if (show && usePortal === false) {
    return (
      <React.Fragment>
        <GlobalModalStyle />
        <Wrapper>
          <TrapContainer focusTrapOptions={{ clickOutsideDeactivates: true }}>
            <Modal {...props}>
              {React.Children.map(children, child => {
                if (child.type.displayName === 'Header') {
                  return React.cloneElement(child, { onClose });
                }
                return child;
              })}
            </Modal>
          </TrapContainer>
        </Wrapper>
      </React.Fragment>
    );
  }
  if (show && typeof document !== 'undefined') {
    return createPortal(
      <React.Fragment>
        <GlobalModalStyle />
        <Wrapper>
          <TrapContainer focusTrapOptions={{ clickOutsideDeactivates: true }}>
            <Modal {...props}>
              {React.Children.map(children, child => {
                if (child.type?.displayName === 'Header') {
                  return React.cloneElement(child, { onClose });
                }
                return child;
              })}
            </Modal>
          </TrapContainer>
          <ModalOverlay onClick={onClose} />
        </Wrapper>
      </React.Fragment>,
      document.body,
    );
  } else {
    return null;
  }
};

StyledModal.propTypes = {
  /** a boolean to determin when to show modal */
  show: PropTypes.bool.isRequired,
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
  /** handles how the modal is closed */
  onClose: PropTypes.func.isRequired,
  /** wether to render the modal at the root with a potal */
  usePortal: PropTypes.bool,
  /** set this to true if the modal contains a form or buttons */
  trapFocus: PropTypes.bool,
  /** children */
  children: PropTypes.node,
};

StyledModal.defaultProps = {
  usePortal: true,
};

/** @component */
export default StyledModal;
