import React, { useCallback, useContext, useEffect, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { X } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type {
  PlatformBillingOverviewCardQuery,
  PlatformBillingOverviewCardQueryVariables,
} from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { getDashboardRoute } from '@/lib/url-helpers';

import Link from '@/components/Link';
import MessageBox from '@/components/MessageBox';
import { Button } from '@/components/ui/Button';
import { Collapsible, CollapsibleContent } from '@/components/ui/Collapsible';
import { Skeleton } from '@/components/ui/Skeleton';

import { DashboardContext } from '../../DashboardContext';
import { platformSubscriptionFragment } from '../platform-subscription/fragments';
import { PlatformSubscriptionDetails } from '../platform-subscription/PlatformSubscriptionCard';

import { editAccountSettingMutation } from './queries';

export function PlatformBillingCollapsibleCard() {
  const { account } = useContext(DashboardContext);
  const [showSubscriptionCard, setShowSubscriptionCard] = useState(undefined);
  const { LoggedInUser, refetchLoggedInUser } = useLoggedInUser();
  const [editAccountSetting] = useMutation(editAccountSettingMutation);

  useEffect(() => {
    if (!LoggedInUser || !account) {
      return;
    }

    if (showSubscriptionCard === undefined) {
      const showSubscriptionCardKey = `id${account.legacyId}`;
      const showSubscriptionCardSetting =
        LoggedInUser.settings?.showInitialOverviewSubscriptionCard?.[showSubscriptionCardKey];

      setShowSubscriptionCard(showSubscriptionCardSetting !== false ? true : false);
    }
  }, [LoggedInUser, account, showSubscriptionCard]);

  const handleSubscriptionCardToggle = useCallback(
    async (open: boolean) => {
      setShowSubscriptionCard(open);

      await editAccountSetting({
        variables: {
          account: { legacyId: LoggedInUser.legacyId },
          key: `showInitialOverviewSubscriptionCard.id${account.legacyId}`,
          value: open,
        },
      }).catch(() => {});
      await refetchLoggedInUser();
    },
    [account, LoggedInUser, editAccountSetting, refetchLoggedInUser],
  );

  return (
    <Collapsible open={showSubscriptionCard}>
      <CollapsibleContent>
        <PlatformBillingOverviewCard accountSlug={account.slug} onDismiss={() => handleSubscriptionCardToggle(false)} />
      </CollapsibleContent>
    </Collapsible>
  );
}

type PlatformBillingOverviewCardProps = {
  accountSlug: string;
  onDismiss?: () => void;
};

function PlatformBillingOverviewCard(props: PlatformBillingOverviewCardProps) {
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
