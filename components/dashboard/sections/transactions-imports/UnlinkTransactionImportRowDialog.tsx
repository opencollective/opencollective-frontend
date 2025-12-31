import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { TransactionsImportRow } from '../../../../lib/graphql/types/v2/schema';

import type { BaseModalProps } from '../../../ModalContext';
import { Button } from '../../../ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../ui/Dialog';

type UnlinkTransactionImportRowDialogProps = BaseModalProps & {
  row: TransactionsImportRow;
  onConfirm: () => Promise<void>;
};

export const UnlinkTransactionImportRowDialog = ({
  row,
  open,
  setOpen,
  onConfirm,
}: UnlinkTransactionImportRowDialogProps) => {
  const entityType = row.expense ? 'expense' : 'contribution';
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Revert transaction import" id="RevertTransactionImport" />
          </DialogTitle>
          <DialogDescription>
            <FormattedMessage
              defaultMessage="This will unlink the transaction row from the associated {entityType,select,expense{expense} contribution{contribution} other{entity}} #{id}. The row will be set back to Pending."
              id="RevertTransactionImportDescription"
              values={{ entityType, id: entityType === 'expense' ? row.expense.legacyId : row.order.legacyId }}
            />{' '}
            <FormattedMessage
              defaultMessage="The {entityType, select, expense{expense} contribution{contribution} other{entity}} itself will NOT be deleted or modified."
              id="uagR7O"
              values={{ entityType }}
            />
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
          </Button>
          <Button
            variant="destructive"
            loading={isSubmitting}
            onClick={async () => {
              setIsSubmitting(true);
              try {
                await onConfirm();
                setOpen(false);
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <FormattedMessage defaultMessage="Revert" id="amT0Gh" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
