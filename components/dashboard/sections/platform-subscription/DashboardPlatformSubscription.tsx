import React from 'react';
import { gql, useQuery } from '@apollo/client';
import dayjs from 'dayjs';
import { FormattedDate, FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import type {
  DashboardPlatformSubscriptionQuery,
  DashboardPlatformSubscriptionQueryVariables,
} from '@/lib/graphql/types/v2/graphql';

import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import MessageBox from '@/components/MessageBox';
import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { Skeleton } from '@/components/ui/Skeleton';

import DashboardHeader from '../../DashboardHeader';
import type { DashboardSectionProps } from '../../types';

import { platformBillingFragment, platformSubscriptionFragment } from './fragments';
import { PlatformBillingUtilizationTable } from './PlatformBillingUtilizationTable';
import { PlatformPaymentsView } from './PlatformPaymentsView';
import { PlatformSubscriptionCard } from './PlatformSubscriptionCard';

export function DashboardPlatformSubscription(props: DashboardSectionProps) {
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
            defaultMessage="Review your platform billing details, pay any outstanding invoices, get clarity on the next billing cycle to ensure your collectives continue to be supported."
            id="bSLWvg"
          />
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
          <div>
            <Button disabled={isLoading} variant="outline" size="xs">
              <FormattedMessage defaultMessage="Change Plan" id="n7blLN" />
            </Button>
          </div>
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
