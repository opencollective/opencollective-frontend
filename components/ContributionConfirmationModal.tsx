import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { ConfirmContributionForm } from './contributions/ConfirmContributionForm';
import { Button } from './ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import Avatar from './Avatar';
import type { BaseModalProps } from './ModalContext';

interface ContributionConfirmationModalProps extends BaseModalProps {
  /** the order that is being confirmed */
  order?: React.ComponentProps<typeof ConfirmContributionForm>['order'];
  /** Called if the action request is successful */
  onSuccess?(...args: unknown[]): unknown;
}

const ContributionConfirmationModal = ({
  order,
  open,
  setOpen,
  onCloseFocusRef,
  onSuccess,
}: ContributionConfirmationModalProps) => {
  const [submitting, setSubmitting] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        onCloseAutoFocus={e => {
          if (onCloseFocusRef?.current) {
            e.preventDefault();
            onCloseFocusRef.current.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Avatar collective={order?.toAccount} radius={32} />
            <FormattedMessage
              defaultMessage="Confirm contribution to {payee}"
              id="nvYvGO"
              values={{ payee: order?.toAccount?.name }}
            />
          </DialogTitle>
        </DialogHeader>
        <ConfirmContributionForm
          order={order}
          onSubmit={() => setSubmitting(true)}
          onFailure={() => setSubmitting(false)}
          onSuccess={() => {
            setOpen(false);
            onSuccess?.();
          }}
          FormBodyContainer={({ children }) => <div className="mt-2">{children}</div>}
          footer={
            <div className="mt-4 flex flex-wrap justify-center border-t border-slate-100 pt-4 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                type="button"
                disabled={submitting}
                className="mr-0 mb-4 min-w-[268px] md:mr-4 md:mb-0 md:min-w-0"
              >
                <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
              </Button>
              <Button
                variant="default"
                loading={submitting}
                type="submit"
                data-cy="order-confirmation-modal-submit"
                className="min-w-[240px]"
              >
                <FormattedMessage defaultMessage="Confirm contribution" id="k/uy+b" />
              </Button>
            </div>
          }
        />
      </DialogContent>
    </Dialog>
  );
};

export default ContributionConfirmationModal;
