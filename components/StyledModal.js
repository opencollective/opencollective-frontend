import React from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import styled, { createGlobalStyle } from 'styled-components';
import { Times } from '@styled-icons/fa-solid/Times';

import Container from './Container';

const ModalWrapper = styled(Container).attrs(props => ({
  maxWidth: props.maxWidth || '95%',
  maxHeight: props.maxHeight || '100%',
}))`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  z-index: 3000;
  border: 1px solid rgba(9, 10, 10, 0.12);
  border-radius: 8px;
  padding: 20px;
`;

const GlobalModalStyle = createGlobalStyle`
  body {
    overflow: hidden;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  z-index: 2500;
  display: block;
`;

const Header = styled(Container)`
  font-size: 20px;
  color: #090a0a;
  font-weight: 600;
  display: flex;
  text-shadow: none;
  justify-content: space-between;
`;

const Body = styled(Container)`
  margin-top: 10px;
  margin-bottom: 30px;
`;

const Divider = styled.div`
  margin: 2rem 0;
  width: 100%;
  height: 1px;
  background-color: #e1e4e6;

  @media (min-width: 52em) {
    margin: 3rem 0;
  }
`;

const CloseIcon = styled(Times)`
  font-size: 12px;
  width: 15px;
  height: 15px;
  color: #dadada;
  cursor: pointer;
`;

export const ModalHeader = ({ children, onClose }) => (
  <Header>
    {children}
    <CloseIcon onClick={onClose} />
  </Header>
);

ModalHeader.propTypes = {
  /** handles how the modal is closed */
  onClose: PropTypes.func.isRequired,
  /** children */
  children: PropTypes.node,
};

ModalHeader.displayName = 'Header';

export const ModalBody = ({ children, width, height }) => (
  <Body width={width} height={height}>
    {children}
  </Body>
);

ModalBody.propTypes = {
  /** width of the modal component */
  width: PropTypes.string,
  /** height of the modal component */
  height: PropTypes.string,
  /** children */
  children: PropTypes.node,
};

export const ModalFooter = ({ children }) => (
  <Container>
    <Divider />
    {children}
  </Container>
);

ModalFooter.propTypes = {
  children: PropTypes.node,
};

/**
 * Modal component. Will pass down additional props to `ModalWrapper`, which is
 * a styled `Container`.
 */
const StyledModal = ({ children, show, onClose, ...props }) => {
  if (show && typeof document !== 'undefined') {
    return createPortal(
      <React.Fragment>
        <GlobalModalStyle />
        <ModalWrapper {...props}>
          {React.Children.map(children, child => {
            if (child.type.displayName === 'Header') {
              return React.cloneElement(child, { onClose });
            }
            return child;
          })}
        </ModalWrapper>
        <ModalOverlay onClick={onClose} />
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
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** height of the modal component */
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
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
  /** children */
  children: PropTypes.node,
};

/** @component */
export default StyledModal;
