import React from 'react';
import { ApolloError, useApolloClient } from '@apollo/client';
import type { SetupIntent, Stripe } from '@stripe/stripe-js';

import { API_V2_CONTEXT, gql } from '../graphql/helpers';
import type { AccountReferenceInput, SetupIntent as GraphQLSetupIntent } from '../graphql/types/v2/graphql';
import { loadScriptAsync } from '../utils';

const createSetupIntentMutation = gql`
  mutation CreateSetupIntent($host: AccountReferenceInput!, $account: AccountReferenceInput!) {
    createSetupIntent(host: $host, account: $account) {
      id
      setupIntentClientSecret
      stripeAccount
      stripeAccountPublishableSecret
    }
  }
`;

type UseSetupIntentOptions = {
  account: AccountReferenceInput;
  host: AccountReferenceInput;
  skip?: boolean;
};

export type StripeSetupIntent = SetupIntent & { stripeAccount: string };

export default function useSetupIntent({
  account,
  host,
  skip,
}: UseSetupIntentOptions): [StripeSetupIntent, Stripe, boolean, Error] {
  const apolloClient = useApolloClient();
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [stripe, setStripe] = React.useState<Stripe | null>(null);
  const [setupIntent, setSetupIntent] = React.useState<StripeSetupIntent | null>(null);

  React.useEffect(() => {
    async function load() {
      if (typeof window.Stripe === 'undefined') {
        await loadScriptAsync('https://js.stripe.com/v3/');
      }

      const createSetupIntentResp = await apolloClient.mutate<{ createSetupIntent: GraphQLSetupIntent }>({
        mutation: createSetupIntentMutation,
        context: API_V2_CONTEXT,
        variables: {
          account,
          host,
        },
        errorPolicy: 'all',
      });

      if (createSetupIntentResp.errors?.length > 0) {
        setError(new ApolloError({ graphQLErrors: createSetupIntentResp.errors }));
        setLoading(false);
        return;
      }

      const { setupIntentClientSecret, stripeAccountPublishableSecret, stripeAccount } =
        createSetupIntentResp.data?.createSetupIntent ?? {};
      const stripe = window.Stripe(stripeAccountPublishableSecret, stripeAccount ? { stripeAccount } : {});
      setStripe(stripe);

      try {
        const setupIntentResult = await stripe.retrieveSetupIntent(setupIntentClientSecret);
        if (setupIntentResult.error) {
          setError(new Error('Setup Intent Retrieve error', { cause: setupIntentResult.error }));
        } else {
          (setupIntentResult.setupIntent as StripeSetupIntent).stripeAccount = stripeAccount;
          setSetupIntent(setupIntentResult.setupIntent as StripeSetupIntent);
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
      setSetupIntent(null);
      setStripe(null);
    };
  }, [skip]);

  return [setupIntent, stripe, loading, error];
}
