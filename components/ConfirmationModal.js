import React from 'react';
import PropTypes from 'prop-types';
import StyledButton from './StyledButton';
import Container from './Container';
import { P } from './Text';
import Modal, { ModalBody, ModalHeader, ModalFooter } from './StyledModal';

const ConfirmationModal = ({ show, header, body, onClose, actions }) => (
  <Modal width="570px" show={show} onClose={onClose}>
    <ModalHeader>{header}</ModalHeader>
    <ModalBody>
      <P>{body}</P>
    </ModalBody>
    <ModalFooter>
      <Container display="flex" justifyContent="flex-end">
        <StyledButton mx={20} onClick={() => actions.cancelHandler()}>
          {actions.cancelText}
        </StyledButton>
        <StyledButton data-cy="action" buttonStyle="primary" onClick={() => actions.continueHandler()}>
          {actions.continueText}
        </StyledButton>
      </Container>
    </ModalFooter>
  </Modal>
);

ConfirmationModal.propTypes = {
  show: PropTypes.bool.isRequired,
  header: PropTypes.string.isRequired,
  body: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  actions: PropTypes.shape({
    cancelText: PropTypes.string.isRequired,
    cancelHandler: PropTypes.func.isRequired,
    continueText: PropTypes.string.isRequired,
    continueHandler: PropTypes.func.isRequired,
  }),
};

export default ConfirmationModal;
