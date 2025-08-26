import React from 'react';
import { gql, useQuery } from '@apollo/client';
import dayjs from 'dayjs';
import { FormattedDate, FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import type { BillingProjectionQuery, BillingProjectionQueryVariables } from '@/lib/graphql/types/v2/graphql';

import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import MessageBox from '@/components/MessageBox';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

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
  const billedSubscriptions = billing.base.subscriptions;

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
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <FormattedMessage defaultMessage="Item" id="5ujeDa" />
              </TableHead>
              <TableHead>
                <FormattedMessage defaultMessage="Start Date" id="QirE3M" />
              </TableHead>
              <TableHead>
                <FormattedMessage defaultMessage="End Date" id="EndDate" />
              </TableHead>
              <TableHead>
                <FormattedMessage defaultMessage="Additional Units" id="dGWxXw" />
              </TableHead>
              <TableHead>
                <FormattedMessage defaultMessage="Est. Amount" id="BqQikK" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {billedSubscriptions.map(sub => (
              <TableRow key={sub.startDate}>
                <TableCell className="font-medium text-muted-foreground">{sub.title}</TableCell>
                <TableCell>
                  <FormattedDate timeZone="UTC" dateStyle="medium" value={sub.startDate} />
                </TableCell>
                <TableCell>
                  <FormattedDate timeZone="UTC" dateStyle="medium" value={sub.endDate} />
                </TableCell>
                <TableCell>-</TableCell>
                <TableCell>
                  <FormattedMoneyAmount
                    amount={sub.amount.valueInCents}
                    currency={sub.amount.currency}
                    showCurrencyCode={false}
                  />
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-medium text-muted-foreground">
                <FormattedMessage defaultMessage="Additional Collectives" id="rQHbnT" />
              </TableCell>
              <TableCell>
                <FormattedDate timeZone="UTC" dateStyle="medium" value={billing.billingPeriod.startDate} />
              </TableCell>
              <TableCell>
                <FormattedDate timeZone="UTC" dateStyle="medium" value={billing.billingPeriod.endDate} />
              </TableCell>
              <TableCell>{billing.additional.utilization.activeCollectives}</TableCell>
              <TableCell>
                <FormattedMoneyAmount
                  amount={billing.additional.amounts.activeCollectives.valueInCents}
                  currency={billing.additional.amounts.activeCollectives.currency}
                  showCurrencyCode={false}
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-muted-foreground">
                <FormattedMessage defaultMessage="Additional Expenses" id="IbJLYI" />
              </TableCell>
              <TableCell>
                <FormattedDate timeZone="UTC" dateStyle="medium" value={billing.billingPeriod.startDate} />
              </TableCell>
              <TableCell>
                <FormattedDate timeZone="UTC" dateStyle="medium" value={billing.billingPeriod.endDate} />
              </TableCell>
              <TableCell>{billing.additional.utilization.activeCollectives}</TableCell>
              <TableCell>
                <FormattedMoneyAmount
                  amount={billing.additional.amounts.expensesPaid.valueInCents}
                  currency={billing.additional.amounts.expensesPaid.currency}
                  showCurrencyCode={false}
                />
              </TableCell>
            </TableRow>
          </TableBody>
          <TableFooter className="border-t bg-white font-bold text-slate-900">
            <TableRow className="border-b-0">
              <TableCell colSpan={4} align="right">
                <FormattedMessage defaultMessage="Est. Total" id="QNwwvd" />
              </TableCell>
              <TableCell>
                <FormattedMoneyAmount
                  amount={billing.totalAmount.valueInCents}
                  currency={billing.totalAmount.currency}
                  showCurrencyCode={false}
                />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <MessageBox type="info" className="mt-4">
        {billing.subscriptions.length > 1 && (
          <div className="text-sm">
            <FormattedMessage
              defaultMessage="You’re charged on pro-rata basis for the days you have used a particular plan. "
              id="PScvSY"
            />
          </div>
        )}
        <div className="text-sm">
          <FormattedMessage
            defaultMessage=" The additional units are charged based on your active plan and will increase based on your usage."
            id="uuQr+R"
          />
        </div>
      </MessageBox>
    </div>
  );
}
