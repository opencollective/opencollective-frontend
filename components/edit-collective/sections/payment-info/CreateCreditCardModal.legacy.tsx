import React from 'react';
import { useMutation } from '@apollo/client';
import { DialogTitle } from '@radix-ui/react-dialog';
import { CardElement, Elements } from '@stripe/react-stripe-js';
import { get, merge, pick } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '@/lib/errors';
import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import { getStripe, stripeTokenToPaymentMethod } from '@/lib/stripe';

import NewCreditCardForm from '@/components/NewCreditCardForm';
import {
  addCreditCardMutation,
  confirmCreditCardMutation,
} from '@/components/recurring-contributions/UpdatePaymentMethodPopUp';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/useToast';

export default function CreateCreditCardModal({ account, open, onOpenChange, onUpdate }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [card, setCard] = React.useState(null);
  const intl = useIntl();
  const { toast } = useToast();

  const [addCreditCard] = useMutation(addCreditCardMutation, {
    context: API_V2_CONTEXT,
    refetchQueries: ['ManagePaymentMethods'],
  });

  const [confirmCreditCard] = useMutation(confirmCreditCardMutation, {
    context: API_V2_CONTEXT,
    refetchQueries: ['ManagePaymentMethods'],
  });

  const submitNewCard = React.useCallback(async () => {
    try {
      setIsSubmitting(true);

      const cardElement = card.stripeElements.getElement(CardElement);
      const { token, error } = await card.stripe.createToken(cardElement);
      if (error) {
        throw error;
      }
      const newStripePaymentMethod = stripeTokenToPaymentMethod(token);
      const newCreditCardInfo = merge(newStripePaymentMethod.data, pick(newStripePaymentMethod, ['token']));
      const res = await addCreditCard({
        variables: {
          creditCardInfo: newCreditCardInfo,
          name: get(newStripePaymentMethod, 'name'),
          account: { legacyId: account.id },
        },
      });

      const { paymentMethod, stripeError } = res.data.addCreditCard;
      if (stripeError) {
        const stripe = await getStripe();
        const result = await stripe.handleCardSetup(stripeError.response.setupIntent.client_secret);
        if (result.error) {
          throw result.error;
        } else {
          await confirmCreditCard({ variables: { paymentMethod: { id: paymentMethod.id } } });
        }
      }
      toast({
        variant: 'success',
        message: <FormattedMessage defaultMessage="Your payment method has been successfully added." id="hqJi3D" />,
      });
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    } finally {
      await onUpdate();
      setIsSubmitting(false);
      onOpenChange(false);
    }
  }, [toast, intl, card, account, addCreditCard, confirmCreditCard]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-2">
        <DialogHeader>
          <DialogTitle className="text-xl">
            <FormattedMessage defaultMessage="Add a new credit card" id="kcY263" />
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 text-sm leading-normal font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Credit card details
            </label>
            <Elements stripe={getStripe()}>
              <NewCreditCardForm
                hasSaveCheckBox={false}
                // onChange={newCreditCardInfo => this.setState({ newCreditCardInfo, error: null })}
                onChange={cardInfo => setCard(state => ({ ...state, cardInfo }))}
                onReady={({ stripe, stripeElements }) => setCard(state => ({ ...state, stripe, stripeElements }))}
              />
            </Elements>
          </div>
          <div className="flex justify-end">
            <Button
              disabled={isSubmitting}
              loading={isSubmitting}
              data-cy="save-credit-card-button"
              data-loading={isSubmitting}
              onClick={submitNewCard}
            >
              <FormattedMessage defaultMessage="Save" id="save" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
