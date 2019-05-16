import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Times } from 'styled-icons/fa-solid/Times';

import Container from './Container';

const ModalWrapper = styled(Container)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  max-width: 95%;
  max-height: 100%;
  z-index: 100;
  border: 1px solid rgba(9, 10, 10, 0.12);
  border-radius: 8px;
  padding: 20px;
  ${props =>
    `
      width: ${props.width};
      height: ${props.height};
    `}
`;

const ModalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  z-index: 90;
  display: block;
`;

const Header = styled(Container)`
  font-size: 20px;
  color: #090a0a;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
`;

const Body = styled(Container)`
  margin-top: 10px;
  margin-bottom: 30px;
  ${props =>
    `
      width: ${props.width};
      height: ${props.height};
    `}
`;

const Divider = styled.div`
  margin: 3rem 0;
  width: 100%;
  height: 1px;
  background-color: #e1e4e6;
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

ModalHeader.displayName = 'Header';

export const ModalBody = ({ children, width, height }) => (
  <Body width={width} height={height}>
    {children}
  </Body>
);

export const ModalFooter = ({ children }) => (
  <Container>
    <Divider />
    {children}
  </Container>
);

/**
 * Modal component
 */
const Modal = ({ children, show, width, height, onClose }) => {
  if (show) {
    return (
      <React.Fragment>
        <ModalWrapper width={width} height={height}>
          {React.Children.map(children, child => {
            if (child.type.displayName === 'Header') {
              return React.cloneElement(child, { onClose });
            }
            return child;
          })}
        </ModalWrapper>
        <ModalOverlay onClick={onClose} />
      </React.Fragment>
    );
  } else {
    return null;
  }
};

Modal.propTypes = {
  /** a boolean to determin when to show modal */
  show: PropTypes.bool.isRequired,
  /** width of the modal component */
  width: PropTypes.string,
  /** height of the modal component */
  height: PropTypes.string,
  /** handles how the modal is closed */
  onClose: PropTypes.func.isRequired,
};

export default Modal;
