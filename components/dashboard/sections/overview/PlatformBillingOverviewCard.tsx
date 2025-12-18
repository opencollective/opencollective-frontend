import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { X } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type {
  PlatformBillingOverviewCardQuery,
  PlatformBillingOverviewCardQueryVariables,
} from '@/lib/graphql/types/v2/graphql';
import { getDashboardRoute } from '@/lib/url-helpers';

import Link from '@/components/Link';
import MessageBox from '@/components/MessageBox';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

import { platformSubscriptionFragment } from '../platform-subscription/fragments';
import { PlatformSubscriptionDetails } from '../platform-subscription/PlatformSubscriptionCard';

type PlatformBillingOverviewCardProps = {
  accountSlug: string;
  onDismiss?: () => void;
};

export function PlatformBillingOverviewCard(props: PlatformBillingOverviewCardProps) {
  const query = useQuery<PlatformBillingOverviewCardQuery, PlatformBillingOverviewCardQueryVariables>(
    gql`
      query PlatformBillingOverviewCard($slug: String!) {
        account(slug: $slug) {
          isHost
          type
          settings
          ... on Organization {
            hasHosting
          }
          ... on AccountWithPlatformSubscription {
            platformSubscription {
              ...PlatformSubscriptionFields
            }
          }
        }
      }
      ${platformSubscriptionFragment}
    `,
    {
      variables: {
        slug: props.accountSlug,
      },
    },
  );

  if (query.loading) {
    return <Skeleton className="h-16 w-full" />;
  }

  if (!query.data?.account || !('platformSubscription' in query.data.account)) {
    return null;
  }

  const hasHosting = Boolean(query.data.account?.['hasHosting']);
  return (
    <MessageBox className="relative" type="info">
      <Button onClick={props.onDismiss ?? (() => {})} className="absolute top-0 right-0" variant="ghost" size="icon">
        <X size={16} />
      </Button>
      <div className="mb-2 text-base font-bold">
        <FormattedMessage
          defaultMessage={`You're on the "{planTitle}" plan`}
          id="Fw/mF9"
          values={{
            planTitle: query.data.account.platformSubscription.plan.title,
          }}
        />
      </div>
      <div className="text-sm">
        <FormattedMessage
          defaultMessage={`The "{planTitle}" plan gives you access with limited usage mentioned below. Any usage exceeding the plan limits will incur additional charges.`}
          id="j/a0gE"
          values={{
            planTitle: query.data.account.platformSubscription.plan.title,
          }}
        />
      </div>
      <div className="my-4 py-4">
        <PlatformSubscriptionDetails subscription={query.data.account.platformSubscription} hasHosting={hasHosting} />
      </div>
      <Button asChild variant="outline">
        <Link className="!no-underline" href={getDashboardRoute({ slug: props.accountSlug }, 'platform-subscription')}>
          <FormattedMessage defaultMessage="Manage Subscription" id="9vk07U" />
        </Link>
      </Button>
    </MessageBox>
  );
}
