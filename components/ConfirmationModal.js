import React from 'react';
import PropTypes from 'prop-types';
import StyledButton from './StyledButton';
import Container from './Container';
import { P } from './Text';
import Modal, { ModalBody, ModalHeader, ModalFooter } from './StyledModal';
import { useIntl, defineMessages } from 'react-intl';

const messages = defineMessages({
  cancel: {
    id: 'cancel',
    defaultMessage: 'Cancel',
  },
});

const confirmBtnMsgs = defineMessages({
  confirm: {
    id: 'confirm',
    defaultMessage: 'Confirm',
  },
  delete: {
    id: 'actions.delete',
    defaultMessage: 'Delete',
  },
  remove: {
    id: 'Remove',
    defaultMessage: 'Remove',
  },
});

/**
 * ConfirmationModal component. Uses `StyledModal` to create a reusable modal mainly for
 * confirmation purpose.
 */
const ConfirmationModal = ({
  show,
  header,
  body,
  children,
  onClose,
  type,
  isDanger,
  cancelLabel,
  continueLabel,
  cancelHandler,
  continueHandler,
}) => {
  const [submitting, setSubmitting] = React.useState(false);
  const { formatMessage } = useIntl();

  return (
    <Modal width="570px" show={show} onClose={onClose}>
      <ModalHeader onClose={onClose}>{header}</ModalHeader>
      <ModalBody>{children || <P>{body}</P>}</ModalBody>
      <ModalFooter>
        <Container display="flex" justifyContent={['center', 'flex-end']} flexWrap="Wrap">
          <StyledButton
            mx={20}
            my={1}
            minWidth={140}
            onClick={cancelHandler || onClose}
            disabled={submitting}
            data-cy="confirmation-modal-cancel"
          >
            {cancelLabel || formatMessage(messages.cancel)}
          </StyledButton>
          <StyledButton
            my={1}
            minWidth={140}
            buttonStyle={isDanger ? 'danger' : 'primary'}
            data-cy="confirmation-modal-continue"
            loading={submitting}
            onClick={async () => {
              try {
                setSubmitting(true);
                await continueHandler();
              } catch (e) {
                setSubmitting(false);
                throw e;
              }
            }}
          >
            {continueLabel || formatMessage(confirmBtnMsgs[type])}
          </StyledButton>
        </Container>
      </ModalFooter>
    </Modal>
  );
};

ConfirmationModal.propTypes = {
  /** a boolean to determin when to show modal */
  show: PropTypes.bool.isRequired,
  /** header of the confirmation modal */
  header: PropTypes.node.isRequired,
  /** body of the confirmation modal */
  children: PropTypes.node,
  /** Body of the confirmation modal, used in a paragraph if there's no children */
  body: PropTypes.string,
  /** handles how the modal is closed */
  onClose: PropTypes.func.isRequired,
  /** handles onClick continue button */
  continueHandler: PropTypes.func.isRequired,
  /** You can pass a type here to auto-set labels to remove/delete/confirm...etc */
  type: PropTypes.oneOf(['confirm', 'delete', 'remove']),
  /** If true, a danger style button will be used for the main button */
  isDanger: PropTypes.bool,
  /** handles onClick cancel button. Defaults to `onClose` prop. */
  cancelHandler: PropTypes.func,
  /** continue button label of the confirmation modal. Defaults to `Confirm`. */
  continueLabel: PropTypes.string,
  /** cancel button label of the confirmation modal. Defaults to `Cancel`. */
  cancelLabel: PropTypes.string,
};

ConfirmationModal.defaultProps = {
  type: 'confirm',
};

/** @component */
export default ConfirmationModal;
