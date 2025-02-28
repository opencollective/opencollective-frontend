import React from 'react';
import { useMutation } from '@apollo/client';
import { compact, flatten, groupBy } from 'lodash';
import { Trash2 } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../../../lib/graphql/helpers';
import type { ConfirmOrderMutation, ManagePaymentMethodsQuery } from '../../../../lib/graphql/types/v2/graphql';
import { getPaymentMethodName } from '../../../../lib/payment_method_label';
import { getPaymentMethodIcon } from '../../../../lib/payment-method-utils';
import { getStripe } from '../../../../lib/stripe';

import { useModal } from '@/components/ModalContext';
import { Button } from '@/components/ui/Button';
import { DataList, DataListItem } from '@/components/ui/DataList';

import { useToast } from '../../../ui/useToast';

import { MethodCard, moreActionsThunk } from './common';

type PaymentMethodCardProps = {
  paymentMethods: ManagePaymentMethodsQuery['account']['paymentMethods'];
  onRemove: () => void;
  onConfirm: () => void;
  moreActions: React.ReactNode;
};

const PaymentMethodCard = ({ paymentMethods, onRemove, onConfirm, moreActions }: PaymentMethodCardProps) => {
  const intl = useIntl();
  const [paymentMethod] = paymentMethods;
  const requiresConfirmation = paymentMethod.recurringContributions.nodes.some(order => order.needsConfirmation);
  const hosts = compact(flatten(paymentMethods.map(pm => pm.limitedToHosts)));
  const showSubContent = hosts.length > 0 || requiresConfirmation;

  return (
    <MethodCard
      subContent={
        <div className="flex flex-col gap-4">
          {hosts.length > 0 && (
            <div className="relative overflow-hidden rounded-xl bg-muted">
              <div className={'space-y-1 p-4'}>
                <DataList className="gap-2">
                  <DataListItem
                    label={<FormattedMessage defaultMessage="Used with" id="npLwc6" />}
                    value={hosts.map(host => host.name).join(', ')}
                  />
                </DataList>
              </div>
            </div>
          )}
          {requiresConfirmation && (
            <div className="flex items-center justify-center gap-1 rounded-lg bg-yellow-100 p-4">
              <FormattedMessage defaultMessage="This payment method requires confirmation:" id="U9HH4V" />
              <Button variant="link" onClick={onConfirm} className="h-4 p-0 text-yellow-700">
                <FormattedMessage id="paymentMethod.confirm" defaultMessage="Confirm" />
              </Button>
            </div>
          )}
        </div>
      }
      showSubcontent={showSubContent}
    >
      <div className="flex w-full justify-between leading-5">
        <div className="flex items-center gap-2">
          {getPaymentMethodIcon(paymentMethod, paymentMethod.account, 16)}
          {getPaymentMethodName(paymentMethod as any)}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onRemove}
            size="icon-xs"
            variant="ghost"
            title={intl.formatMessage({ defaultMessage: 'Remove payment method', id: 'RemovePaymentMethod' })}
          >
            <Trash2 size={16} />
          </Button>
          {moreActions}
        </div>
      </div>
    </MethodCard>
  );
};

export default function PaymentMethodsTable({ paymentMethods, account, loading }) {
  const { toast } = useToast();
  const { showConfirmationModal } = useModal();
  const intl = useIntl();

  const groupedPaymentMethod = React.useMemo(() => {
    if (!paymentMethods) {
      return [];
    }

    const ordered = paymentMethods.toSorted((a, b) => {
      const aNeedsConfirmation = a.recurringContributions.nodes.some(a => a.needsConfirmation);
      const bNeedsConfirmation = b.recurringContributions.nodes.some(b => b.needsConfirmation);

      if (aNeedsConfirmation && !bNeedsConfirmation) {
        return -1;
      } else if (!aNeedsConfirmation && bNeedsConfirmation) {
        return 1;
      }

      return a.legacyId - b.legacyId;
    });

    const grouped = groupBy(ordered, pm => pm.data?.fingerprint || pm.id);
    return grouped;
  }, [paymentMethods]);

  const [removePaymentMethod] = useMutation(
    gql`
      mutation RemovePaymentMethod($paymentMethod: PaymentMethodReferenceInput!) {
        removePaymentMethod(paymentMethod: $paymentMethod, cancelActiveSubscriptions: false) {
          id
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      refetchQueries: ['ManagePaymentMethods'],
    },
  );

  const [confirmOrder] = useMutation<ConfirmOrderMutation>(
    gql`
      mutation ConfirmOrder($order: OrderReferenceInput!) {
        confirmOrder(order: $order) {
          order {
            id
            status
            transactions {
              id
            }
            fromAccount {
              id
              slug
            }
          }
          stripeError {
            message
            account
            response
          }
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      refetchQueries: ['ManagePaymentMethods'],
    },
  );

  const confirmHandler = async (paymentMethods: ManagePaymentMethodsQuery['account']['paymentMethods']) => {
    try {
      const order = paymentMethods
        .map(pm => pm.recurringContributions.nodes.filter(order => order.needsConfirmation))
        .flat()[0];
      const response = await confirmOrder({ variables: { order: { id: order.id } } });
      const stripeError = response.data?.confirmOrder?.stripeError;
      if (stripeError) {
        const stripeResponse = stripeError.response;
        const stripe = await getStripe(null, stripeError.account);
        const confirmationResult = await stripe.handleCardAction(stripeResponse.paymentIntent.client_secret);
        if (confirmationResult.paymentIntent && confirmationResult.paymentIntent.status === 'requires_confirmation') {
          await confirmOrder({ variables: { order: { id: order.id } } });
        } else if (confirmationResult.error) {
          throw new Error(confirmationResult.error.message);
        }
      }

      toast({
        variant: 'success',
        message: (
          <FormattedMessage
            id="Order.Confirm.Success"
            defaultMessage="Your payment method has now been confirmed and the payment successfully went through."
          />
        ),
      });
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  };

  const removeHandler = async (paymentMethods: ManagePaymentMethodsQuery['account']['paymentMethods']) => {
    const activeContributions = paymentMethods
      .map(paymentMethod => paymentMethod.recurringContributions.nodes.map(order => order.toAccount).flat())
      .flat();

    const paymentMethod = paymentMethods[0];
    showConfirmationModal({
      title: <FormattedMessage defaultMessage="Delete Payment Method?" id="tAJKFb" />,
      description: (
        <div className="flex flex-col gap-2">
          <p>
            <FormattedMessage defaultMessage="Are you sure you want to delete this payment method?" id="lCYRnz" />
          </p>
          <p className="flex items-center gap-2">
            {getPaymentMethodIcon(paymentMethod, paymentMethod.account, 16)}
            {getPaymentMethodName(paymentMethod as any)}
          </p>
          {activeContributions.length > 0 && (
            <p className="mt-4">
              <FormattedMessage
                defaultMessage="By removing this payment method you're also canceling recurring contributions to: {collectivesNames}"
                id="scJ3mG"
                values={{
                  collectivesNames: activeContributions.map(c => c.name).join(', '),
                }}
              />
            </p>
          )}
        </div>
      ),
      type: 'remove',
      variant: 'destructive',
      async onConfirm() {
        try {
          await Promise.all(
            paymentMethods.map(pm => removePaymentMethod({ variables: { paymentMethod: { id: pm.id } } })),
          );
        } catch (e) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
        }
      },
    });
  };

  const generateMoreActions = moreActionsThunk(account);

  return !loading && !paymentMethods?.length ? (
    <div className="flex flex-col items-center gap-6 py-6 text-center text-sm sm:p-12">
      <FormattedMessage
        defaultMessage="After your first contribution, you'll find your saved payment method(s) here."
        id="bzY+Hg"
      />
    </div>
  ) : (
    Object.keys(groupedPaymentMethod).map(groupKey => (
      <PaymentMethodCard
        key={groupKey}
        paymentMethods={groupedPaymentMethod[groupKey]}
        onRemove={() => removeHandler(groupedPaymentMethod[groupKey])}
        onConfirm={() => confirmHandler(groupedPaymentMethod[groupKey])}
        moreActions={generateMoreActions(groupedPaymentMethod[groupKey])}
      />
    ))
  );
}
