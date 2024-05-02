// TODO: Replace uses of `components/ConfirmationModal.js` with this file

import React from 'react';
import { LucideIcon } from 'lucide-react';
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
import { toast } from './ui/useToast';
import type { BaseModalProps } from './ModalContext';

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

export interface ConfirmationModalProps extends BaseModalProps {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  variant?: 'default' | 'destructive';
  type?: 'confirm' | 'delete' | 'remove';
  onConfirm: () => void | Promise<any>;
  confirmLabel?: React.ReactNode;
  ConfirmIcon?: LucideIcon;
  onCancel?: () => void;
  cancelLabel?: React.ReactNode;
}

const ConfirmationModal = ({
  title,
  description,
  children,
  open,
  setOpen,
  variant = 'default',
  type = 'confirm',
  cancelLabel,
  confirmLabel,
  ConfirmIcon,
  onCancel,
  onConfirm,
  onCloseFocusRef,
  ...props
}: ConfirmationModalProps) => {
  const [submitting, setSubmitting] = React.useState(false);
  const { formatMessage } = useIntl();
  const handleClose = () => setOpen(false);

  const onCloseAutoFocus = e => {
    if (onCloseFocusRef.current) {
      e.preventDefault();
      onCloseFocusRef.current.focus();
    }
  };
  return (
    <AlertDialog open={open} onOpenChange={setOpen} {...props}>
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus} {...props}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        {children && <div className="text-sm text-muted-foreground">{children}</div>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting} onClick={onCancel} autoFocus data-cy="confirmation-modal-cancel">
            {cancelLabel || formatMessage(messages.cancel)}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={variant}
            loading={submitting}
            data-cy="confirmation-modal-continue"
            onClick={async e => {
              e.preventDefault();
              try {
                setSubmitting(true);
                await onConfirm();
                handleClose();
              } catch (error) {
                toast({ variant: 'error', message: error.message });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {ConfirmIcon && <ConfirmIcon size={16} />}
            {confirmLabel || formatMessage(confirmBtnMsgs[type])}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationModal;
