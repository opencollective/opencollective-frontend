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
  AlertDialogTrigger,
} from '../../../ui/AlertDialog';
import { Button } from '../../../ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../ui/Tooltip';
import { toast } from '../../../ui/useToast';

export const refundTransactionMutation = gql`
  mutation RefundTransaction($transaction: TransactionReferenceInput!) {
    refundTransaction(transaction: $transaction) {
      id
    }
  }
`;

const TransactionRefundButton = ({ id, onMutationSuccess }: { id: string; onMutationSuccess?: () => void }) => {
  const [refundTransaction, { loading }] = useMutation(refundTransactionMutation, {
    context: API_V2_CONTEXT,
  });
  const [open, setOpen] = React.useState(false);
  const handleRefundTransaction = async () => {
    try {
      await refundTransaction({ variables: { transaction: { id } } });
    } catch (error) {
      toast({ variant: 'error', message: error.message });
      return;
    }
    onMutationSuccess?.();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="xs" className="gap-1">
              <Undo2 size={16} />
              <span>
                <FormattedMessage id="Refund" defaultMessage="Refund" />
              </span>
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>

        <TooltipContent className="max-w-xs">
          <FormattedMessage defaultMessage="Refunding will reimburse the full amount back to your contributor. They can contribute again in the future." />
        </TooltipContent>
      </Tooltip>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <FormattedMessage defaultMessage="Are you sure you want to refund this transaction?" />
          </AlertDialogTitle>
          <AlertDialogDescription>
            <FormattedMessage
              id="transaction.refund.info"
              defaultMessage="The contributor will be refunded the full amount."
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
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TransactionRefundButton;
