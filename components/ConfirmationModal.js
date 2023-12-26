import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';

import Container from './Container';
import StyledButton from './StyledButton';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from './StyledModal';
import { P } from './Text';

const messages = defineMessages({
  cancel: {
    id: 'actions.cancel',
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
 * A special value to return from the `continueHandler` to terminate the modal. Its loading state
 * will therefore not be updated to false, which will prevent the "Warning: Can't perform a React state update on an unmounted component"
 * issue.
 */
export const CONFIRMATION_MODAL_TERMINATE = { __CONFIRMATION_MODAL_TERMINATE: true };

/**
 * ConfirmationModal component. Uses `StyledModal` to create a reusable modal mainly for
 * confirmation purpose.
 */
const ConfirmationModal = ({
  header = undefined,
  body = undefined,
  children = undefined,
  onClose,
  type = 'confirm',
  isDanger = undefined,
  isSuccess = undefined,
  cancelLabel = undefined,
  continueLabel = undefined,
  cancelHandler = onClose,
  continueHandler,
  disableSubmit = undefined,
  ...props
}) => {
  const [submitting, setSubmitting] = React.useState(false);
  const { formatMessage } = useIntl();

  return (
    <StyledModal role="alertdialog" width="570px" onClose={onClose} trapFocus {...props}>
      <ModalHeader onClose={onClose}>{header}</ModalHeader>
      <ModalBody pt={2}>{children || <P>{body}</P>}</ModalBody>
      <ModalFooter>
        <Container display="flex" justifyContent={['center', 'flex-end']} flexWrap="Wrap">
          <StyledButton
            mx={20}
            my={1}
            autoFocus
            minWidth={140}
            onClick={cancelHandler}
            disabled={submitting}
            data-cy="confirmation-modal-cancel"
          >
            {cancelLabel || formatMessage(messages.cancel)}
          </StyledButton>
          <StyledButton
            my={1}
            minWidth={140}
            buttonStyle={isDanger ? 'danger' : isSuccess ? 'success' : 'primary'}
            data-cy="confirmation-modal-continue"
            loading={submitting}
            disabled={disableSubmit}
            onClick={async () => {
              let result;
              try {
                setSubmitting(true);
                result = await continueHandler();
              } finally {
                if (result !== CONFIRMATION_MODAL_TERMINATE) {
                  setSubmitting(false);
                }
              }
            }}
          >
            {continueLabel || formatMessage(confirmBtnMsgs[type])}
          </StyledButton>
        </Container>
      </ModalFooter>
    </StyledModal>
  );
};

ConfirmationModal.propTypes = {
  /** header of the confirmation modal */
  header: PropTypes.node.isRequired,
  /** body of the confirmation modal */
  children: PropTypes.node,
  /** Body of the confirmation modal, used in a paragraph if there's no children */
  body: PropTypes.node,
  /** handles how the modal is closed */
  onClose: PropTypes.func.isRequired,
  /** handles onClick continue button */
  continueHandler: PropTypes.func.isRequired,
  /** You can pass a type here to auto-set labels to remove/delete/confirm...etc */
  type: PropTypes.oneOf(['confirm', 'delete', 'remove']),
  /** If true, a danger style button will be used for the main button */
  isDanger: PropTypes.bool,
  isSuccess: PropTypes.bool,
  disableSubmit: PropTypes.bool,
  /** handles onClick cancel button. Defaults to `onClose` prop. */
  cancelHandler: PropTypes.func,
  /** continue button label of the confirmation modal. Defaults to `Confirm`. */
  continueLabel: PropTypes.node,
  /** cancel button label of the confirmation modal. Defaults to `Cancel`. */
  cancelLabel: PropTypes.node,
};

ConfirmationModal.defaultProps = {
  type: 'confirm',
};

/** @component */
export default ConfirmationModal;
