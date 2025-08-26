import React from 'react';
import { gql, useQuery } from '@apollo/client';
import dayjs from 'dayjs';
import { Info } from 'lucide-react';
import { FormattedDate, FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import type { BillingProjectionQuery, BillingProjectionQueryVariables } from '@/lib/graphql/types/v2/graphql';

import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import { I18nBold } from '@/components/I18nFormatters';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';

import { platformBillingFragment } from './fragments';

type BillingProjectionProps = {
  accountSlug: string;
};

export function BillingProjection(props: BillingProjectionProps) {
  const query = useQuery<BillingProjectionQuery, BillingProjectionQueryVariables>(
    gql`
      query BillingProjection($accountSlug: String!) {
        account(slug: $accountSlug) {
          ... on AccountWithPlatformSubscription {
            platformBilling {
              ...PlatformBillingFields
            }
          }
        }
      }
      ${platformBillingFragment}
    `,
    {
      context: API_V2_CONTEXT,
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
  const currentPlan = billing?.subscriptions?.[0]?.plan;
  const billedSubscriptions = billing?.base?.subscriptions ?? [];

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
      <div className="rounded-md border px-6 py-4">
        {billedSubscriptions.map((sub, idx) => (
          <div key={sub.startDate} className="flex items-center justify-between border-b py-2">
            <div>
              <div className="flex gap-2 font-medium text-slate-800">
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
              <div className="text-muted-foreground">{sub.title}</div>
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
        <div className="flex items-center justify-between border-b py-2">
          <div>
            <div className="font-medium text-slate-800">
              <FormattedMessage
                defaultMessage="{expensesPaid} additional {expensesPaid, plural, one {expense} other {expenses}} paid"
                id="6GrAmA"
                values={{
                  expensesPaid: billing?.additional?.utilization.expensesPaid ?? 0,
                }}
              />
            </div>
            <div className="text-muted-foreground">
              <FormattedMessage
                defaultMessage="{pricePerAdditionalExpense} per additional expense"
                id="qyhtiE"
                values={{
                  pricePerAdditionalExpense: (
                    <FormattedMoneyAmount
                      showCurrencyCode={false}
                      amount={billing?.subscriptions[0].plan.pricing.pricePerAdditionalExpense.valueInCents}
                      currency={billing?.subscriptions[0].plan.pricing.pricePerAdditionalExpense.currency}
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
                  defaultMessage="Based on the active plan of the current billing cycle, your plan covers {includedCollectives} active {includedCollectives, plural, one {collective} other {collectives}}. You have {activeCollectives} active {activeCollectives, plural, one {collective} other {collectives}}. You’re being charged for the {additionalActiveCollectives} additional active {additionalActiveCollectives, plural, one {collective} other {collectives}} at {pricePerCollective} per collective. Charges will increase based on usage of additional units."
                  id="hlyH4q"
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
        <div className="flex items-center justify-between border-b py-2">
          <div>
            <div className="font-medium text-slate-800">
              <FormattedMessage
                defaultMessage="{activeCollectives} additional active {activeCollectives, plural, one {collective} other {collectives}}"
                id="4RHasz"
                values={{
                  activeCollectives: billing?.additional?.utilization?.activeCollectives ?? 0,
                }}
              />
            </div>
            <div className="text-muted-foreground">
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
                  defaultMessage="Based on the active plan of the current billing cycle, your plan covers {includedPaidExpenses} paid {includedPaidExpenses, plural, one {expense} other {expenses}}. You have {paidExpenses} paid {paidExpenses, plural, one {expense} other {expenses}}. You’re being charged for the {additionalPaidExpenses} additional paid {additionalPaidExpenses, plural, one {expense} other {expenses}} at {pricePerPaidExpense} per expense. Charges will increase based on usage of additional units."
                  id="iTvgcF"
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
        <div className="mt-4 flex items-center justify-end">
          <div className="text-base">
            <FormattedMessage
              defaultMessage="Estimated total: <b>{amount}</b> "
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
        </div>
      </div>
    </div>
  );
}
