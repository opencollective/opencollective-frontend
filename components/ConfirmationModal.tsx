import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/AlertDialog';

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
  header,
  title,
  description,
  body,
  children,
  open,
  setOpen,
  variant = 'default',
  type = 'confirm',
  cancelLabel,
  continueLabel,
  cancelHandler,
  continueHandler,
  disableSubmit,
  onCloseAutoFocus,
  ...props
}: {
  header: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  body?: React.ReactNode;
  children?: React.ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
  variant: 'default' | 'destructive';
  type?: 'confirm' | 'delete' | 'remove';
  cancelLabel?: React.ReactNode;
  continueLabel?: React.ReactNode;
  cancelHandler?: () => void;
  continueHandler: () => Promise<any>;
  disableSubmit?: boolean;
}) => {
  const [submitting, setSubmitting] = React.useState(false);
  const { formatMessage } = useIntl();
  return (
    <AlertDialog open={open} onOpenChange={setOpen} {...props}>
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>{header || title}</AlertDialogTitle>
          {(description || body) && <AlertDialogDescription>{description || body}</AlertDialogDescription>}
        </AlertDialogHeader>
        {children && <div className="text-sm text-muted-foreground">{children}</div>}
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={submitting}
            onClick={cancelHandler}
            autoFocus
            data-cy="confirmation-modal-cancel"
          >
            {cancelLabel || formatMessage(messages.cancel)}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={variant}
            disabled={disableSubmit}
            loading={submitting}
            data-cy="confirmation-modal-continue"
            onClick={async e => {
              e.preventDefault();
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
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationModal;
