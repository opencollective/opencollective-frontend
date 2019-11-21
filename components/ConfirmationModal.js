import React from 'react';
import PropTypes from 'prop-types';
import StyledButton from './StyledButton';
import Container from './Container';
import { P } from './Text';
import Modal, { ModalBody, ModalHeader, ModalFooter } from './StyledModal';

/**
 * ConfirmationModal component. Uses `StyledModal` to create a reusable modal mainly for
 * confirmation purpose.
 */
const ConfirmationModal = ({
  show,
  header,
  body,
  onClose,
  cancelLabel,
  continueLabel,
  cancelHandler,
  continueHandler,
}) => (
  <Modal width="570px" show={show} onClose={onClose}>
    <ModalHeader>{header}</ModalHeader>
    <ModalBody>
      <P>{body}</P>
    </ModalBody>
    <ModalFooter>
      <Container display="flex" justifyContent="flex-end">
        <StyledButton mx={20} onClick={() => cancelHandler()} data-cy="confirmation-modal-cancel">
          {cancelLabel}
        </StyledButton>
        <StyledButton buttonStyle="primary" onClick={() => continueHandler()} data-cy="confirmation-modal-continue">
          {continueLabel}
        </StyledButton>
      </Container>
    </ModalFooter>
  </Modal>
);

ConfirmationModal.propTypes = {
  /** a boolean to determin when to show modal */
  show: PropTypes.bool.isRequired,
  /** header of the confirmation modal */
  header: PropTypes.string.isRequired,
  /** body of the confirmation modal */
  body: PropTypes.string.isRequired,
  /** handles how the modal is closed */
  onClose: PropTypes.func.isRequired,
  /** cancel button label of the confirmation modal */
  cancelLabel: PropTypes.string.isRequired,
  /** handles onClick cancel button */
  cancelHandler: PropTypes.func.isRequired,
  /** continue button label of the confirmation modal */
  continueLabel: PropTypes.string.isRequired,
  /** handles onClick continue button */
  continueHandler: PropTypes.func.isRequired,
};

ConfirmationModal.defaultProps = {
  cancelLabel: 'Cancel',
  continueLabel: 'Confirm',
};

/** @component */
export default ConfirmationModal;
