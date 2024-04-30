import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { MinusCircle } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';

import { BaseModalProps } from '../../../ModalContext';
import TransactionRejectMessageForm from '../../../transactions/TransactionRejectMessageForm';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../ui/AlertDialog';
import { Button } from '../../../ui/Button';
import { toast } from '../../../ui/useToast';

const rejectTransactionMutation = gql`
  mutation RejectTransaction($transaction: TransactionReferenceInput!, $message: String) {
    rejectTransaction(transaction: $transaction, message: $message) {
      id
    }
  }
`;

interface TransactionRejectModalProps extends BaseModalProps {
  id: string;
  onMutationSuccess?: () => void;
  canRefund?: boolean;
}
const TransactionRejectModal = ({
  id,
  onMutationSuccess,
  canRefund,
  open,
  setOpen,
  onCloseFocusRef,
}: TransactionRejectModalProps) => {
  const [rejectTransaction, { loading }] = useMutation(rejectTransactionMutation, {
    context: API_V2_CONTEXT,
  });
  const [message, setMessage] = React.useState('');

  const handleRejectTransaction = async () => {
    try {
      await rejectTransaction({
        variables: {
          transaction: { id },
          message,
        },
      });
    } catch (error) {
      toast({ variant: 'error', message: error.message });
      return;
    }
    onMutationSuccess?.();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent
        onCloseAutoFocus={e => {
          if (onCloseFocusRef?.current) {
            e.preventDefault();
            onCloseFocusRef.current.focus();
          }
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            <FormattedMessage defaultMessage="Are you sure you want to reject this transaction?" id="fbcrkY" />
          </AlertDialogTitle>
          <AlertDialogDescription>
            <FormattedMessage
              id="transaction.reject.info"
              defaultMessage="Only reject if you want to remove the contributor from your Collective. This will refund their transaction, remove them from your Collective, and display the contribution as 'rejected'."
            />
            <br />
            <br />
            {canRefund ? (
              <FormattedMessage
                id="transaction.reject.info.canRefund"
                defaultMessage="If you are only trying to refund a mistaken transaction, please use the 'Refund' button instead."
              />
            ) : (
              <FormattedMessage
                id="transaction.reject.info.cannotRefund"
                defaultMessage="Please only use this option if you do not wish for this contributor to be a part of your Collective. This will remove them from your Collective."
              />
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <TransactionRejectMessageForm message={message} onChange={message => setMessage(message)} />

        <AlertDialogFooter>
          <AlertDialogCancel>
            <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
          </AlertDialogCancel>
          <Button onClick={handleRejectTransaction} loading={loading} variant="destructive" className="gap-1">
            <MinusCircle size={16} />
            <FormattedMessage id="transaction.reject.yes.btn" defaultMessage="Yes, reject" />
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TransactionRejectModal;
