import React, { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { confirmContributionFieldsFragment, ConfirmContributionForm } from './contributions/ConfirmContributionForm';
import { Button } from './ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { Skeleton } from './ui/Skeleton';
import Avatar from './Avatar';
import MessageBoxGraphqlError from './MessageBoxGraphqlError';
import type { BaseModalProps } from './ModalContext';

/** When editing, we load the current values rather than relying on what the parent had in cache */
const editPaidContributionQuery = gql`
  query EditPaidContributionModal($order: OrderReferenceInput!) {
    order(order: $order) {
      id
      ...ConfirmContributionFields
    }
  }
  ${confirmContributionFieldsFragment}
`;

interface ContributionConfirmationModalProps extends BaseModalProps {
  /** the order that is being confirmed. When editing, only `id` and `toAccount` are required. */
  order?: React.ComponentProps<typeof ConfirmContributionForm>['order'];
  /** Called if the action request is successful */
  onSuccess?(...args: unknown[]): unknown;
  /** To edit a contribution that was already confirmed (marked as paid) */
  isEdit?: boolean;
}

// Defined at module level: an inline component would get a new identity on every render,
// making React remount the form inputs (and lose focus/typed keys) whenever the modal re-renders.
const FormBodyContainer = ({ children }: { children: React.ReactNode }) => <div className="mt-2">{children}</div>;

const ContributionConfirmationModal = ({
  order,
  open,
  setOpen,
  onCloseFocusRef,
  onSuccess,
  isEdit = false,
}: ContributionConfirmationModalProps) => {
  const [submitting, setSubmitting] = useState(false);
  const { data, loading, error } = useQuery(editPaidContributionQuery, {
    variables: { order: { id: order?.id } },
    skip: !isEdit || !order?.id || !open,
    fetchPolicy: 'network-only',
  });
  const formOrder = isEdit ? data?.order : order;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={isEdit ? 'max-h-screen overflow-y-auto' : undefined}
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
            {isEdit ? (
              <FormattedMessage
                defaultMessage="Edit contribution to {payee}"
                id="EditPaidContribution.title"
                values={{ payee: order?.toAccount?.name }}
              />
            ) : (
              <FormattedMessage
                defaultMessage="Confirm contribution to {payee}"
                id="nvYvGO"
                values={{ payee: order?.toAccount?.name }}
              />
            )}
          </DialogTitle>
        </DialogHeader>
        {error ? (
          <MessageBoxGraphqlError error={error} />
        ) : loading || !formOrder ? (
          <div className="mt-2 space-y-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : (
          <ConfirmContributionForm
            order={formOrder}
            isEdit={isEdit}
            onSubmit={() => setSubmitting(true)}
            onFailure={() => setSubmitting(false)}
            onSuccess={() => {
              setOpen(false);
              onSuccess?.();
            }}
            FormBodyContainer={FormBodyContainer}
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
                  {isEdit ? (
                    <FormattedMessage defaultMessage="Edit contribution" id="EditPaidContribution.submit" />
                  ) : (
                    <FormattedMessage defaultMessage="Confirm contribution" id="k/uy+b" />
                  )}
                </Button>
              </div>
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContributionConfirmationModal;
