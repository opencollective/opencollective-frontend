import React from 'react';
import { gql, useQuery } from '@apollo/client';

import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import type {
  PlatformBillingOverviewCardQuery,
  PlatformBillingOverviewCardQueryVariables,
} from '@/lib/graphql/types/v2/graphql';

import { Skeleton } from '@/components/ui/Skeleton';

import { platformBillingFragment, platformSubscriptionFragment } from '../platform-subscription/fragments';
import { PlatformSubscriptionCard } from '../platform-subscription/PlatformSubscriptionCard';

type PlatformBillingOverviewCardProps = {
  accountSlug: string;
};

export function PlatformBillingOverviewCard(props: PlatformBillingOverviewCardProps) {
  const query = useQuery<PlatformBillingOverviewCardQuery, PlatformBillingOverviewCardQueryVariables>(
    gql`
      query PlatformBillingOverviewCard($slug: String!) {
        host(slug: $slug) {
          platformSubscription {
            ...PlatformSubscriptionFields
          }

          platformBilling {
            ...PlatformBillingFields
          }
        }
      }
      ${platformSubscriptionFragment}
      ${platformBillingFragment}
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        slug: props.accountSlug,
      },
    },
  );

  if (query.loading) {
    return <Skeleton className="h-16 w-full" />;
  }

  if (query.data && !query.data.host.platformSubscription) {
    return 'No Active Subscription';
  }

  return (
    <PlatformSubscriptionCard
      subscription={query.data.host.platformSubscription}
      billing={query.data.host.platformBilling}
    />
  );
}
