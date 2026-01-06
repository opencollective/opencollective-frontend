import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { ChevronDown, Pencil, X } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedDate, FormattedMessage } from 'react-intl';

import type {
  DashboardPlatformSubscriptionQuery,
  DashboardPlatformSubscriptionQueryVariables,
} from '@/lib/graphql/types/v2/graphql';

import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import { getI18nLink } from '@/components/I18nFormatters';
import Link from '@/components/Link';
import MessageBox from '@/components/MessageBox';
import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';
import { useModal } from '@/components/ModalContext';
import { CancelSubscriptionModal } from '@/components/platform-subscriptions/CancelSubscriptionModal';
import type { PlatformSubscriptionFeatures } from '@/components/platform-subscriptions/constants';
import { ManageSubscriptionModal } from '@/components/platform-subscriptions/ManageSubscriptionModal';
import { Button } from '@/components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { Separator } from '@/components/ui/Separator';
import { Skeleton } from '@/components/ui/Skeleton';

import DashboardHeader from '../../DashboardHeader';
import type { DashboardSectionProps } from '../../types';

import { BillingProjection } from './BillingProjection';
import { platformBillingFragment, platformSubscriptionFragment } from './fragments';
import { PlatformPaymentsView } from './PlatformPaymentsView';
import { PlatformSubscriptionCard } from './PlatformSubscriptionCard';

export function DashboardPlatformSubscription(props: DashboardSectionProps) {
  const { showModal } = useModal();
  const query = useQuery<DashboardPlatformSubscriptionQuery, DashboardPlatformSubscriptionQueryVariables>(
    gql`
      query DashboardPlatformSubscription($slug: String!) {
        account(slug: $slug) {
          type
          isHost
          settings
          ... on Organization {
            hasHosting
          }
          ... on AccountWithPlatformSubscription {
            platformSubscription {
              ...PlatformSubscriptionFields
            }
            platformBilling {
              ...PlatformBillingFields
            }
          }
        }
      }
      ${platformSubscriptionFragment}
      ${platformBillingFragment}
    `,
    {
      variables: {
        slug: props.accountSlug,
      },
    },
  );

  const router = useRouter();
  const desiredFeature = router.query?.feature as unknown as (typeof PlatformSubscriptionFeatures)[number];

  const queryError = query.error;
  const activeSubscription =
    query.data?.account && 'platformSubscription' in query.data.account
      ? query.data.account.platformSubscription
      : null;
  const billing =
    query.data?.account && 'platformBilling' in query.data.account ? query.data.account.platformBilling : null;
  const isLoading = query.loading;

  const isFreeTier = activeSubscription?.plan?.pricing?.pricePerMonth?.valueInCents === 0;

  const hasHosting = Boolean(query.data?.account?.['hasHosting']);

  React.useEffect(() => {
    if (!desiredFeature || !activeSubscription?.plan || !billing) {
      return;
    }

    if (activeSubscription.plan.features[desiredFeature]) {
      return;
    }

    showModal(ManageSubscriptionModal, {
      currentPlan: activeSubscription.plan,
      accountSlug: props.accountSlug,
      billing: billing,
      desiredFeature,
    });
  }, [desiredFeature, activeSubscription?.plan, billing, props.accountSlug, showModal]);

  return (
    <div>
      <DashboardHeader
        className="mb-8"
        title={<FormattedMessage defaultMessage="Platform Billing" id="beRXFK" />}
        description={
          isLoading ? (
            <Skeleton className="h-6 w-full" />
          ) : (
            activeSubscription && (
              <FormattedMessage
                defaultMessage="Review your platform billing details, check utilization and pay outstanding invoices."
                id="ajHwTP"
              />
            )
          )
        }
        actions={
          activeSubscription && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={isLoading || !activeSubscription} size="xs" variant="outline" className="gap-1">
                  <FormattedMessage defaultMessage="Manage Subscription" id="9vk07U" />
                  <ChevronDown className="text-muted-foreground" size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Button
                    disabled={isLoading}
                    onClick={() =>
                      showModal(ManageSubscriptionModal, {
                        currentPlan: activeSubscription.plan,
                        accountSlug: props.accountSlug,
                        billing: billing,
                      })
                    }
                    variant="ghost"
                    size="xs"
                  >
                    <Pencil size={14} />
                    <FormattedMessage defaultMessage="Modify Subscription" id="VICsET" />
                  </Button>
                </DropdownMenuItem>
                {!isFreeTier && (
                  <DropdownMenuItem asChild>
                    <Button
                      disabled={isLoading}
                      onClick={() => showModal(CancelSubscriptionModal)}
                      variant="ghost"
                      size="xs"
                    >
                      <X size={14} />
                      <FormattedMessage defaultMessage="Cancel Subscription" id="SKFWE+" />
                    </Button>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      />
      {queryError && <MessageBoxGraphqlError error={queryError} />}

      {isLoading ? (
        <Skeleton className="mb-1 h-5 w-full" />
      ) : !activeSubscription ? (
        <MessageBox type="info">
          <FormattedMessage
            defaultMessage="You are on our <LegacyPricingLink>legacy pricing</LegacyPricingLink>. Please <ContactLink>contact our support team</ContactLink> to upgrade to our <NewPricingLink>new pricing</NewPricingLink>."
            id="S3DC9x"
            values={{
              LegacyPricingLink: getI18nLink({
                as: Link,
                href: '/pricing',
              }),
              ContactLink: getI18nLink({
                as: Link,
                href: '/contact',
              }),
              NewPricingLink: getI18nLink({
                as: Link,
                href: '/organizations/pricing',
              }),
            }}
          />
        </MessageBox>
      ) : (
        <div>
          <div className="mb-2 flex items-center gap-4">
            <div className="font-bold">
              <FormattedMessage
                defaultMessage="Current Plan: {planTitle}"
                id="ZV0wTF"
                values={{
                  planTitle: activeSubscription.plan.title,
                }}
              />
            </div>
            <Separator className="w-auto grow border-b bg-border" />
            <div className="font-bold">
              {!isFreeTier && (
                <FormattedMessage
                  defaultMessage="{perMonth} / Month"
                  id="+2hntI"
                  values={{
                    perMonth: (
                      <FormattedMoneyAmount
                        amount={activeSubscription.plan.pricing.pricePerMonth.valueInCents}
                        currency={activeSubscription.plan.pricing.pricePerMonth.currency}
                        showCurrencyCode={false}
                      />
                    ),
                  }}
                />
              )}
            </div>
          </div>
          {!isFreeTier && (
            <div className="mb-4 text-muted-foreground">
              <FormattedMessage
                defaultMessage="Subscription will renew on {dueDate}"
                id="28oT0p"
                values={{
                  dueDate: <FormattedDate dateStyle="medium" timeZone="UTC" value={billing.dueDate} />,
                }}
              />
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <Skeleton className="mb-8 h-56 w-full" />
      ) : billing?.subscriptions?.length === 0 ? null : (
        <div className="flex flex-col gap-4">
          {billing?.subscriptions?.length > 0 &&
            billing?.subscriptions.map(subscription => (
              <PlatformSubscriptionCard
                key={subscription.startDate}
                subscription={subscription}
                hasHosting={hasHosting}
              />
            ))}
        </div>
      )}

      {billing?.subscriptions?.length !== 0 && (
        <div className="mt-8 mb-1 flex items-center gap-4">
          <div className="font-bold">
            <FormattedMessage defaultMessage="Current Plan Utilization" id="vxyyjF" />
          </div>
          <Separator className="w-auto grow border-b bg-border" />
        </div>
      )}

      {isLoading ? <Skeleton className="h-48 w-full" /> : <BillingProjection accountSlug={props.accountSlug} />}

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : billing?.expenses?.length === 0 ? null : (
        <React.Fragment>
          <div className="mt-8 mb-4 flex items-center gap-4">
            <div className="font-bold">
              <FormattedMessage defaultMessage="Payments" id="iYc3Ld" />
            </div>
            <Separator className="w-auto grow border-b bg-border" />
          </div>
          <PlatformPaymentsView expenses={billing.expenses} accountSlug={props.accountSlug} />
        </React.Fragment>
      )}
    </div>
  );
}
