import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { Undo2 } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';

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

const refundTransactionMutation = gql`
  mutation RefundTransaction($transaction: TransactionReferenceInput!) {
    refundTransaction(transaction: $transaction) {
      id
    }
  }
`;

export const TransactionRefundModal = ({
  open,
  setOpen,
  id,
  onMutationSuccess,
  onCloseAutoFocus,
}: {
  id: string;
  onMutationSuccess?: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <TransactionRefundModalContent id={id} onMutationSuccess={onMutationSuccess} onClose={() => setOpen(false)} />
      </AlertDialogContent>
    </AlertDialog>
  );
};

const TransactionRefundModalContent = ({ id, onMutationSuccess, onClose }) => {
  const [refundTransaction, { loading }] = useMutation(refundTransactionMutation, {
    context: API_V2_CONTEXT,
  });
  const handleRefundTransaction = async () => {
    try {
      await refundTransaction({ variables: { transaction: { id } } });
    } catch (error) {
      toast({ variant: 'error', message: error.message });
      return;
    }
    onMutationSuccess?.();
    onClose();
  };

  return (
    <React.Fragment>
      <AlertDialogHeader>
        <AlertDialogTitle>
          <FormattedMessage defaultMessage="Are you sure you want to refund this transaction?" id="RL9ufl" />
        </AlertDialogTitle>
        <AlertDialogDescription>
          <FormattedMessage
            defaultMessage="Refunding will reimburse the full amount back to your contributor. They can contribute again in the future."
            id="Ntm6k6"
          />
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>
          <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
        </AlertDialogCancel>
        <Button onClick={handleRefundTransaction} loading={loading} className="gap-1">
          <Undo2 size={16} />
          <FormattedMessage id="Refund" defaultMessage="Refund" />
        </Button>
      </AlertDialogFooter>
    </React.Fragment>
  );
};

export default TransactionRefundModal;
