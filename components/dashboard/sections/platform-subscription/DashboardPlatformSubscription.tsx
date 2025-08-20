import React from 'react';
import { gql, useQuery } from '@apollo/client';
import dayjs from 'dayjs';
import { ChevronDown, Pencil, X } from 'lucide-react';
import { FormattedDate, FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import type {
  DashboardPlatformSubscriptionQuery,
  DashboardPlatformSubscriptionQueryVariables,
} from '@/lib/graphql/types/v2/graphql';

import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import MessageBox from '@/components/MessageBox';
import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';
import { useModal } from '@/components/ModalContext';
import { CancelSubscriptionModal } from '@/components/platform-subscriptions/CancelSubscriptionModal';
import { ManageSubscriptionModal } from '@/components/platform-subscriptions/ManageSubscriptionModal';
import { Button } from '@/components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { Separator } from '@/components/ui/Separator';
import { Skeleton } from '@/components/ui/Skeleton';

import DashboardHeader from '../../DashboardHeader';
import type { DashboardSectionProps } from '../../types';

import { platformBillingFragment, platformSubscriptionFragment } from './fragments';
import { PlatformBillingUtilizationTable } from './PlatformBillingUtilizationTable';
import { PlatformPaymentsView } from './PlatformPaymentsView';
import { PlatformSubscriptionCard } from './PlatformSubscriptionCard';

export function DashboardPlatformSubscription(props: DashboardSectionProps) {
  const { showModal } = useModal();
  const query = useQuery<DashboardPlatformSubscriptionQuery, DashboardPlatformSubscriptionQueryVariables>(
    gql`
      query DashboardPlatformSubscription($slug: String!) {
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

  const queryError = query.error;
  const activeSubscription = query.data?.host?.platformSubscription;
  const billing = query.data?.host?.platformBilling;
  const isLoading = query.loading;

  return (
    <div>
      <DashboardHeader
        className="mb-8"
        title={<FormattedMessage defaultMessage="Platform Billing" id="beRXFK" />}
        description={
          <FormattedMessage
            defaultMessage="Review your platform billing details, check utilization and pay outstanding invoices."
            id="ajHwTP"
          />
        }
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="xs" variant="outline" className="gap-1">
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
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      {queryError && <MessageBoxGraphqlError error={queryError} />}

      {isLoading ? (
        <Skeleton className="mb-1 h-5 w-full" />
      ) : !activeSubscription ? (
        <MessageBox type="warning">
          <FormattedMessage defaultMessage="No active subscription" id="0imfIK" />
        </MessageBox>
      ) : (
        <div className="mb-4 flex items-center gap-4">
          <div className="font-bold">
            <FormattedMessage
              defaultMessage="Current Plan: {planTitle} at {perMonth} / month"
              id="sl4rVT"
              values={{
                planTitle: activeSubscription.plan.title,
                perMonth: (
                  <FormattedMoneyAmount
                    amount={activeSubscription.plan.pricing.pricePerMonth.valueInCents}
                    currency={activeSubscription.plan.pricing.pricePerMonth.currency}
                  />
                ),
              }}
            />
          </div>
          <Separator className="w-auto grow border-b bg-border" />
        </div>
      )}

      {isLoading ? (
        <Skeleton className="mb-8 h-56 w-full" />
      ) : billing?.subscriptions?.length === 0 ? null : (
        <div className="flex flex-col gap-4">
          {billing?.subscriptions?.length > 0 &&
            billing?.subscriptions.map(subscription => (
              <PlatformSubscriptionCard key={subscription.startDate} subscription={subscription} billing={billing} />
            ))}
        </div>
      )}

      {isLoading ? (
        <React.Fragment>
          <Skeleton className="mb-1 h-5 w-46" />
          <Skeleton className="h-48 w-full" />
        </React.Fragment>
      ) : !activeSubscription ? null : (
        <React.Fragment>
          <div className="mt-8 mb-1 flex items-center gap-4">
            <div className="font-bold">
              <FormattedMessage defaultMessage="Current Plan Utilization" id="vxyyjF" />
            </div>
            <Separator className="w-auto grow border-b bg-border" />
          </div>
          <div className="mb-4 text-muted-foreground">
            <FormattedMessage
              defaultMessage="For period {toFromDate} ({days} {days, plural, one {day} other {days}} left)"
              id="mUwdZN"
              values={{
                toFromDate: (
                  <FormattedMessage
                    defaultMessage="{dateFrom} to {dateTo}"
                    id="76YT3Y"
                    values={{
                      dateFrom: (
                        <FormattedDate timeZone="UTC" dateStyle="medium" value={billing.billingPeriod.startDate} />
                      ),
                      dateTo: <FormattedDate timeZone="UTC" dateStyle="medium" value={billing.billingPeriod.endDate} />,
                    }}
                  />
                ),
                days: dayjs.utc(billing.billingPeriod.endDate).diff(dayjs.utc().startOf('day'), 'days'),
              }}
            />
          </div>
          <PlatformBillingUtilizationTable billing={billing} plan={activeSubscription.plan} />
        </React.Fragment>
      )}

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
          <PlatformPaymentsView expenses={billing.expenses} />
        </React.Fragment>
      )}
    </div>
  );
}
