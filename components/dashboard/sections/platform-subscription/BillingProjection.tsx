import React from 'react';
import { gql, useQuery } from '@apollo/client';
import dayjs from 'dayjs';
import { Info, Receipt, Shapes } from 'lucide-react';
import { FormattedDate, FormattedMessage } from 'react-intl';

import type { BillingProjectionQuery, BillingProjectionQueryVariables } from '@/lib/graphql/types/v2/graphql';
import type { PlatformSubscription, PlatformUtilization } from '@/lib/graphql/types/v2/graphql';

import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import { I18nBold } from '@/components/I18nFormatters';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';

import { platformBillingFragment, platformSubscriptionFragment } from './fragments';

type BillingProjectionProps = {
  accountSlug: string;
};

export function BillingProjection(props: BillingProjectionProps) {
  const query = useQuery<BillingProjectionQuery, BillingProjectionQueryVariables>(
    gql`
      query BillingProjection($accountSlug: String!) {
        account(slug: $accountSlug) {
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
        accountSlug: props.accountSlug,
      },
    },
  );

  if (query.loading) {
    return <Skeleton className="h-24 w-full" />;
  }

  const account = query.data?.account ?? null;

  const billing = account && 'platformBilling' in account ? account.platformBilling : null;
  const subscription = account && 'platformSubscription' in account ? account.platformSubscription : null;
  const currentPlan = subscription?.plan;
  const billedSubscriptions = billing?.base?.subscriptions ?? [];
  const hasHosting = Boolean(account?.['hasHosting']);

  if (!billing || !currentPlan) {
    return null;
  }

  return (
    <div>
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
                  dateFrom: <FormattedDate timeZone="UTC" dateStyle="medium" value={billing.billingPeriod.startDate} />,
                  dateTo: <FormattedDate timeZone="UTC" dateStyle="medium" value={billing.billingPeriod.endDate} />,
                }}
              />
            ),
            days: dayjs.utc(billing.billingPeriod.endDate).diff(dayjs.utc().startOf('day'), 'days'),
          }}
        />
      </div>
      {billing?.utilization && (
        <div className="mb-4 rounded-md border px-6 py-4">
          <CurrentUtilization utilization={billing.utilization} subscription={subscription} hasHosting={hasHosting} />
        </div>
      )}
      <div className="rounded-md border px-6 py-4">
        {billedSubscriptions.map((sub, idx) => (
          <div key={sub.startDate} className="flex items-center justify-between border-b py-4">
            <div>
              <div className="flex gap-2 text-sm leading-5 font-medium">
                <FormattedMessage
                  defaultMessage="{dateFrom} to {dateTo}"
                  id="76YT3Y"
                  values={{
                    dateFrom: <FormattedDate timeZone="UTC" dateStyle="medium" value={sub.startDate} />,
                    dateTo: <FormattedDate timeZone="UTC" dateStyle="medium" value={sub.endDate} />,
                  }}
                />
                {idx === 0 && (
                  <Badge type="info" size="xs" className="px-2">
                    <FormattedMessage defaultMessage="Active Plan" id="EooOYM" />
                  </Badge>
                )}
              </div>
              <div className="text-xs leading-4 text-slate-700">{sub.title}</div>
            </div>
            <div className="flex gap-2 font-bold">
              <FormattedMoneyAmount
                showCurrencyCode={false}
                amount={sub.amount.valueInCents}
                currency={sub.amount.currency}
              />
              <Tooltip>
                <TooltipTrigger>
                  <Info size={16} />
                </TooltipTrigger>
                <TooltipContent>
                  <FormattedMessage
                    defaultMessage="You’re charged on pro-rata basis for the days you have used a particular plan."
                    id="GO2cTz"
                  />
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between border-b py-4">
          <div>
            <div className="text-sm leading-5 font-medium">
              <FormattedMessage
                defaultMessage="{expensesPaid} additional paid {expensesPaid, plural, one {expense} other {expenses}}"
                id="6GrAmA"
                values={{
                  expensesPaid: billing.additional.utilization.expensesPaid ?? 0,
                }}
              />
            </div>
            <div className="text-xs leading-4 text-slate-700">
              <FormattedMessage
                defaultMessage="{pricePerAdditionalExpense} per additional expense"
                id="qyhtiE"
                values={{
                  pricePerAdditionalExpense: (
                    <FormattedMoneyAmount
                      showCurrencyCode={false}
                      amount={billing.subscriptions[0].plan.pricing.pricePerAdditionalExpense.valueInCents}
                      currency={billing.subscriptions[0].plan.pricing.pricePerAdditionalExpense.currency}
                    />
                  ),
                }}
              />
            </div>
          </div>
          <div className="flex gap-2 font-bold">
            <FormattedMoneyAmount
              showCurrencyCode={false}
              amount={billing.additional.amounts.expensesPaid.valueInCents}
              currency={billing.additional.amounts.expensesPaid.currency}
            />
            <Tooltip>
              <TooltipTrigger>
                <Info size={16} />
              </TooltipTrigger>
              <TooltipContent className="max-w-64">
                <FormattedMessage
                  defaultMessage="Your plan covers {includedPaidExpenses} paid {includedPaidExpenses, plural, one {expense} other {expenses}}. You currently have {paidExpenses}, which is {additionalPaidExpenses} over the limit. {pricePerPaidExpense} per extra expense is being charged as per your active plan. Charges will increase if the number of paid expenses grows."
                  id="PrY6y8"
                  values={{
                    includedPaidExpenses: billing.subscriptions[0].plan.pricing.includedExpensesPerMonth,
                    paidExpenses: billing.utilization.expensesPaid,
                    additionalPaidExpenses: billing.additional.utilization.expensesPaid,
                    pricePerPaidExpense: (
                      <FormattedMoneyAmount
                        showCurrencyCode={false}
                        amount={billing.subscriptions[0].plan.pricing.pricePerAdditionalExpense.valueInCents}
                        currency={billing.subscriptions[0].plan.pricing.pricePerAdditionalExpense.currency}
                      />
                    ),
                  }}
                />
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {hasHosting && (
          <div className="flex items-center justify-between border-b py-4">
            <div>
              <div className="text-sm leading-5 font-medium">
                <FormattedMessage
                  defaultMessage="{activeCollectives} additional active {activeCollectives, plural, one {collective} other {collectives}}"
                  id="4RHasz"
                  values={{
                    activeCollectives: billing.additional.utilization.activeCollectives ?? 0,
                  }}
                />
              </div>
              <div className="text-xs leading-4 text-slate-700">
                <FormattedMessage
                  defaultMessage="{pricePerAdditionalCollective} per additional collective"
                  id="C6vbcS"
                  values={{
                    pricePerAdditionalCollective: (
                      <FormattedMoneyAmount
                        showCurrencyCode={false}
                        amount={billing?.subscriptions[0].plan.pricing.pricePerAdditionalCollective.valueInCents}
                        currency={billing?.subscriptions[0].plan.pricing.pricePerAdditionalCollective.currency}
                      />
                    ),
                  }}
                />
              </div>
            </div>
            <div className="flex gap-2 font-bold">
              <FormattedMoneyAmount
                showCurrencyCode={false}
                amount={billing.additional.amounts.activeCollectives.valueInCents}
                currency={billing.additional.amounts.activeCollectives.currency}
              />
              <Tooltip>
                <TooltipTrigger>
                  <Info size={16} />
                </TooltipTrigger>
                <TooltipContent className="max-w-64">
                  <FormattedMessage
                    defaultMessage="Your plan covers {includedCollectives} active {includedCollectives, plural, one {collective} other {collectives}}. You currently have {activeCollectives}, which is {additionalActiveCollectives} over the limit. {pricePerCollective} per extra collective is being charged as per your active plan. Charges will increase if the number of active collective grows."
                    id="A4CAgS"
                    values={{
                      includedCollectives: billing.subscriptions[0].plan.pricing.includedCollectives,
                      activeCollectives: billing.utilization.activeCollectives,
                      additionalActiveCollectives: billing.additional.utilization.activeCollectives,
                      pricePerCollective: (
                        <FormattedMoneyAmount
                          showCurrencyCode={false}
                          amount={billing.subscriptions[0].plan.pricing.pricePerAdditionalCollective.valueInCents}
                          currency={billing.subscriptions[0].plan.pricing.pricePerAdditionalCollective.currency}
                        />
                      ),
                    }}
                  />
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <div className="text-base">
            <FormattedMessage
              defaultMessage="Estimated total: <b>{amount}</b>"
              id="cKkeFO"
              values={{
                b: I18nBold,
                amount: (
                  <FormattedMoneyAmount
                    amount={billing.totalAmount.valueInCents}
                    currency={billing.totalAmount.currency}
                    showCurrencyCode={false}
                  />
                ),
              }}
            />
          </div>
          <Tooltip>
            <TooltipTrigger>
              <Info size={16} />
            </TooltipTrigger>
            <TooltipContent className="max-w-64">
              <FormattedMessage
                defaultMessage="This is an estimated amount. The final total will include charges for additional units and will be calculated on the last day of the month."
                id="xK6dwZ"
              />
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

type CurrentUtilizationProps = {
  utilization: PlatformUtilization;
  subscription: PlatformSubscription;
  hasHosting: boolean;
};

function CurrentUtilization(props: CurrentUtilizationProps) {
  return (
    <div className="flex flex-wrap gap-16">
      {props.hasHosting && (
        <div className="flex items-center gap-3">
          <div>
            <Shapes />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center text-sm">
              <b>
                <FormattedMessage
                  defaultMessage="{usedCount} / {includedCount} Active Collectives"
                  id="billing.currentUtilization.activeCollectives"
                  values={{
                    usedCount: props.utilization.activeCollectives,
                    includedCount: props.subscription.plan.pricing.includedCollectives,
                  }}
                />
              </b>
              &nbsp;
              <Tooltip>
                <TooltipTrigger>
                  <Info size={14} />
                </TooltipTrigger>
                <TooltipContent>
                  <FormattedMessage
                    defaultMessage="Active collectives have at least one ledger transaction in the billing period."
                    id="j0U5jT"
                  />
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div>
          <Receipt />
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center">
            <b>
              <FormattedMessage
                defaultMessage="{usedCount} / {includedCount} Paid Expenses"
                id="billing.currentUtilization.paidExpenses"
                values={{
                  usedCount: props.utilization.expensesPaid,
                  includedCount: props.subscription.plan.pricing.includedExpensesPerMonth,
                }}
              />
            </b>
            &nbsp;
            <Tooltip>
              <TooltipTrigger>
                <Info size={14} />
              </TooltipTrigger>
              <TooltipContent>
                <FormattedMessage defaultMessage="Completed expenses with the 'Paid' status." id="IHdyue" />
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
