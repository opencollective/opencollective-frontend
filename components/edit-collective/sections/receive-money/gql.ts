import type { ApolloCache, FetchResult } from '@apollo/client';

import { gql } from '../../../../lib/graphql/helpers';
import type { EditCollectiveCustomPaymentMethodsMutation } from '@/lib/graphql/types/v2/graphql';

export const editCollectiveBankTransferHostQuery = gql`
  query EditCollectiveBankTransferHost($slug: String) {
    host(slug: $slug) {
      id
      slug
      name
      legacyId
      currency
      settings
      connectedAccounts {
        id
        service
      }
      plan {
        id
        hostedCollectives
        manualPayments
        name
      }
      payoutMethods {
        id
        name
        data
        type
      }
    }
  }
`;

export const removePayoutMethodMutation = gql`
  mutation EditCollectiveBankTransferRemovePayoutMethod($payoutMethodId: String!) {
    removePayoutMethod(payoutMethodId: $payoutMethodId) {
      id
    }
  }
`;

export const createPayoutMethodMutation = gql`
  mutation EditCollectiveBankTransferCreatePayoutMethod(
    $payoutMethod: PayoutMethodInput!
    $account: AccountReferenceInput!
  ) {
    createPayoutMethod(payoutMethod: $payoutMethod, account: $account) {
      data
      id
      name
      type
    }
  }
`;

export const editCustomPaymentMethodsMutation = gql`
  mutation EditCollectiveCustomPaymentMethods($account: AccountReferenceInput!, $value: JSON!) {
    editAccountSetting(account: $account, key: "customPaymentProviders", value: $value) {
      id
      legacyId
      settings
    }
  }
`;

export const getCacheUpdaterAfterEditCustomPaymentMethods =
  account => (cache: ApolloCache<any>, result: FetchResult<EditCollectiveCustomPaymentMethodsMutation>) => {
    cache.modify({
      id: cache.identify(account),
      fields: { settings: () => result.data.editAccountSetting.settings },
    });
  };
