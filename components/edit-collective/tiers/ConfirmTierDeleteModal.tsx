import React from 'react';
import { Trash } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { Button } from '../../ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/Dialog';
import { Switch } from '../../ui/Switch';

export default function ConfirmTierDeleteModal({ isDeleting, onClose, onConfirmDelete, tier }) {
  const [keepRecurringContributions, setKeepRecurringContributions] = React.useState(true);
  const action = (
    <FormattedMessage
      defaultMessage="Delete {type, select, TICKET {Ticket} other {Tier}}"
      id="FZQER9"
      values={{ type: tier.type }}
    />
  );

  return (
    <Dialog open={true} onOpenChange={open => !open && onClose()}>
      <DialogContent hideCloseButton>
        <DialogHeader>
          <DialogTitle>{action}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <FormattedMessage defaultMessage="The tier will be deleted forever and can't be retrieved." id="xxi1Y+" />
        </DialogDescription>
        <hr className="mb-5" />
        <div className="mb-8 flex items-center justify-between gap-8">
          <div className="flex flex-col">
            <p className="font-bold">
              <FormattedMessage defaultMessage="Do you want to continue recurring contributions?" id="iG8QUh" />
            </p>
            <p className="mt-1 text-muted-foreground">
              <FormattedMessage
                defaultMessage="If yes, you will still receive existing recurring contributions for this deleted tier."
                id="FR8IoI"
              />
            </p>
          </div>
          <Switch
            checked={keepRecurringContributions}
            onCheckedChange={checked => setKeepRecurringContributions(checked)}
          />
        </div>
        <DialogFooter className="flex-col-reverse gap-4 sm:flex-row sm:justify-between">
          <Button
            type="button"
            data-cy="cancel-delete-btn"
            disabled={isDeleting}
            variant="secondary"
            className="order-1 min-w-[100px] flex-1 sm:order-none"
            onClick={onClose}
          >
            <FormattedMessage defaultMessage="Don't Delete" id="yHvRF3" />
          </Button>
          <Button
            type="button"
            data-cy="confirm-delete-btn"
            disabled={isDeleting}
            variant="destructive"
            className="order-0 min-w-[100px] flex-1 sm:order-none"
            onClick={() => onConfirmDelete(keepRecurringContributions)}
          >
            <span className="flex items-center justify-center gap-1">
              <Trash size={16} />
              {action}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
