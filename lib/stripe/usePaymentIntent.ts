import React from 'react';
import { ApolloError, useApolloClient } from '@apollo/client';
import type { PaymentIntent, Stripe } from '@stripe/stripe-js';

import { API_V2_CONTEXT, gql } from '../graphql/helpers';
import type { AccountReferenceInput, GuestInfoInput } from '../graphql/types/v2/graphql';
import { loadScriptAsync } from '../utils';

const createPaymentIntentMutation = gql`
  mutation CreatePaymentIntent($paymentIntent: PaymentIntentInput!, $guestInfo: GuestInfoInput) {
    createPaymentIntent(paymentIntent: $paymentIntent, guestInfo: $guestInfo) {
      id
      paymentIntentClientSecret
      stripeAccount
      stripeAccountPublishableSecret
    }
  }
`;

type UsePaymentIntentOptions = {
  amount: { valueInCents: number; currency: string };
  fromAccount?: AccountReferenceInput;
  guestInfo?: GuestInfoInput;
  toAccount: AccountReferenceInput;
  skip?: boolean;
};

type StripePaymentIntent = PaymentIntent & { stripeAccount: string };

export default function usePaymentIntent({
  amount,
  fromAccount,
  guestInfo,
  toAccount,
  skip,
}: UsePaymentIntentOptions): [StripePaymentIntent, Stripe, boolean, Error] {
  const apolloClient = useApolloClient();
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [stripe, setStripe] = React.useState<Stripe | null>(null);
  const [paymentIntent, setPaymentIntent] = React.useState<StripePaymentIntent | null>(null);

  React.useEffect(() => {
    async function load() {
      if (typeof window.Stripe === 'undefined') {
        await loadScriptAsync('https://js.stripe.com/v3/');
      }

      const createPaymentIntentResp = await apolloClient.mutate({
        mutation: createPaymentIntentMutation,
        context: API_V2_CONTEXT,
        variables: {
          paymentIntent: {
            amount,
            fromAccount,
            toAccount,
          },
          guestInfo,
        },
        errorPolicy: 'all',
      });

      if (createPaymentIntentResp.errors?.length > 0) {
        setError(new ApolloError({ graphQLErrors: createPaymentIntentResp.errors }));
        setLoading(false);
        return;
      }

      const { paymentIntentClientSecret, stripeAccountPublishableSecret, stripeAccount } =
        createPaymentIntentResp.data?.createPaymentIntent ?? {};

      const stripe = window.Stripe(stripeAccountPublishableSecret, stripeAccount ? { stripeAccount } : {});
      setStripe(stripe);

      try {
        const paymentIntentResult = await stripe.retrievePaymentIntent(paymentIntentClientSecret);
        if (paymentIntentResult.error) {
          setError(new Error('Payment Intent Retrieve error', { cause: paymentIntentResult.error }));
        } else {
          (paymentIntentResult.paymentIntent as StripePaymentIntent).stripeAccount = stripeAccount;
          setPaymentIntent(paymentIntentResult.paymentIntent as StripePaymentIntent);
        }
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    }

    if (skip) {
      return;
    }

    setLoading(true);
    load();

    return () => {
      setLoading(false);
      setError(null);
      setPaymentIntent(null);
      setStripe(null);
    };
  }, [skip, guestInfo?.captcha?.token]);

  return [paymentIntent, stripe, loading, error];
}
