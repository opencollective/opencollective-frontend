import React from 'react';
import { ApolloError, useApolloClient } from '@apollo/client';
import type { PaymentIntent, Stripe } from '@stripe/stripe-js';

import { API_V2_CONTEXT, gql } from '../graphql/helpers';
import type { AccountReferenceInput, ContributionFrequency, GuestInfoInput } from '../graphql/types/v2/schema';
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
  chargeAttempt: number;
  amount: { valueInCents: number; currency: string };
  fromAccount?: AccountReferenceInput;
  guestInfo?: GuestInfoInput;
  toAccount: AccountReferenceInput;
  skip?: boolean;
  frequency?: ContributionFrequency;
};

type StripePaymentIntent = PaymentIntent & { stripeAccount: string };

export default function usePaymentIntent({
  chargeAttempt,
  amount,
  fromAccount,
  guestInfo,
  toAccount,
  skip,
  frequency,
}: UsePaymentIntentOptions): [StripePaymentIntent, Stripe, boolean, Error] {
  const apolloClient = useApolloClient();
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [stripe, setStripe] = React.useState<Stripe | null>(null);
  const [paymentIntent, setPaymentIntent] = React.useState<StripePaymentIntent | null>(null);

  const abort = React.useRef(new AbortController());

  React.useEffect(() => {
    async function load() {
      if (typeof window.Stripe === 'undefined') {
        await loadScriptAsync('https://js.stripe.com/v3/');
      }

      const abortController = (abort.current = new AbortController());
      try {
        const createPaymentIntentResp = await apolloClient.mutate({
          mutation: createPaymentIntentMutation,
          context: { ...API_V2_CONTEXT, fetchOptions: { signal: abort.current.signal } },
          variables: {
            paymentIntent: {
              amount,
              fromAccount,
              toAccount,
              frequency,
            },
            guestInfo,
          },
          errorPolicy: 'all',
        });

        if (!abortController.signal.aborted && createPaymentIntentResp.errors?.length > 0) {
          setError(new ApolloError({ graphQLErrors: createPaymentIntentResp.errors }));
          setLoading(false);
          return;
        }

        const { paymentIntentClientSecret, stripeAccountPublishableSecret, stripeAccount } =
          createPaymentIntentResp.data?.createPaymentIntent ?? {};

        const stripe = window.Stripe(stripeAccountPublishableSecret, stripeAccount ? { stripeAccount } : {});
        stripe['stripeAccount'] = stripeAccount;
        stripe['stripeAccountPublishableSecret'] = stripeAccountPublishableSecret;

        const paymentIntentResult = await stripe.retrievePaymentIntent(paymentIntentClientSecret);
        if (abortController.signal.aborted) {
          return;
        }
        if (paymentIntentResult.error) {
          setError(new Error('Payment Intent Retrieve error', { cause: paymentIntentResult.error }));
        } else {
          (paymentIntentResult.paymentIntent as StripePaymentIntent).stripeAccount = stripeAccount;
          setPaymentIntent(paymentIntentResult.paymentIntent as StripePaymentIntent);
        }
        setStripe(stripe);
      } catch (e) {
        if (e.networkError?.name !== 'AbortError') {
          setError(e);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (skip) {
      return;
    }

    // If this hook is called again during component rerender and we still have a in-flight payment intent, abort it.
    // Without the abort controller, we can get another payment intent created for a previous render that will be unused
    // and will make the form render again with the setStripe, setPaymentIntent state changes. This also prevents generating
    // too many incomplete payment intents on stripe
    if (!abort.current.signal.aborted) {
      abort.current.abort();
    }

    setLoading(true);
    load();

    return () => {
      setLoading(false);
      setError(null);
      setPaymentIntent(null);
      setStripe(null);
    };
  }, [skip, guestInfo?.captcha?.token, chargeAttempt]);

  return [paymentIntent, stripe, loading, error];
}
