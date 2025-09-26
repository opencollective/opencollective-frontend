// @deprecated: Use `NewConfirmationModal` instead

import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Button } from './ui/Button';
import Container from './Container';
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
 * @deprecated: Use `NewConfirmationModal` instead
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
    <StyledModal role="alertdialog" onClose={onClose} {...props}>
      <ModalHeader onClose={onClose}>{header}</ModalHeader>
      <ModalBody pt={2} mb="20px">
        {children || <P>{body}</P>}
      </ModalBody>
      <ModalFooter>
        <Container display="flex" justifyContent={['center', 'flex-end']} flexWrap="Wrap">
          <Button
            className="mx-5 my-1 min-w-[140px]"
            autoFocus
            onClick={cancelHandler}
            disabled={submitting}
            data-cy="confirmation-modal-cancel"
            variant="outline"
          >
            {cancelLabel || formatMessage(messages.cancel)}
          </Button>
          <Button
            className="my-1 min-w-[140px]"
            data-cy="confirmation-modal-continue"
            loading={submitting}
            disabled={disableSubmit}
            variant={isDanger ? 'destructive' : isSuccess ? 'success' : 'default'}
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
          </Button>
        </Container>
      </ModalFooter>
    </StyledModal>
  );
};

/** @component */
export default ConfirmationModal;
