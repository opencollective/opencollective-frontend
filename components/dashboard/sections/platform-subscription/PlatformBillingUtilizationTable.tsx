import React from 'react';
import clsx from 'clsx';
import { FormattedDate, FormattedMessage } from 'react-intl';

import type { PlatformBillingFieldsFragment, PlatformSubscriptionFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import { I18nBold } from '@/components/I18nFormatters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

type PlatformBillingUtilizationTableProps = {
  billing: PlatformBillingFieldsFragment;
  plan: PlatformSubscriptionFieldsFragment['plan'];
};

export function PlatformBillingUtilizationTable(props: PlatformBillingUtilizationTableProps) {
  return (
    <div>
      <Table
        className={clsx({
          'rounded-b-none border-b-0': props.billing.additional.total.valueInCents > 0,
        })}
      >
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>
              <FormattedMessage defaultMessage="In plan" id="gX3Un1" />
            </TableHead>
            <TableHead>
              <FormattedMessage defaultMessage="Usage" id="wbsq7O" />
            </TableHead>
            <TableHead>
              <FormattedMessage defaultMessage="Additional" id="4fUKUt" />
            </TableHead>
            <TableHead>
              <FormattedMessage defaultMessage="Cost per additional unit" id="IJ76Gs" />
            </TableHead>
            <TableHead>
              <FormattedMessage defaultMessage="Additional charge" id="E8IrzC" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium text-muted-foreground">
              <FormattedMessage defaultMessage="Collectives" id="Collectives" />
            </TableCell>
            <TableCell>{props.plan.pricing.includedCollectives ?? 0}</TableCell>
            <TableCell>{props.billing.utilization.activeCollectives}</TableCell>
            <TableCell>{props.billing.additional.utilization.activeCollectives}</TableCell>
            <TableCell>
              <FormattedMoneyAmount
                amount={props.plan.pricing.pricePerAdditionalCollective.valueInCents}
                currency={props.plan.pricing.pricePerAdditionalCollective.currency}
                showCurrencyCode={false}
              />
            </TableCell>
            <TableCell>
              <FormattedMoneyAmount
                amount={props.billing.additional.amounts.activeCollectives.valueInCents}
                currency={props.billing.additional.amounts.activeCollectives.currency}
                showCurrencyCode={false}
              />
            </TableCell>
          </TableRow>
          <TableRow className="border-b-0">
            <TableCell className="font-medium text-muted-foreground">
              <FormattedMessage defaultMessage="Expenses" id="Expenses" />
            </TableCell>
            <TableCell>{props.plan.pricing.includedExpensesPerMonth ?? 0}</TableCell>
            <TableCell>{props.billing.utilization.expensesPaid}</TableCell>
            <TableCell>{props.billing.additional.utilization.activeCollectives}</TableCell>
            <TableCell>
              <FormattedMoneyAmount
                amount={props.plan.pricing.pricePerAdditionalExpense.valueInCents}
                currency={props.plan.pricing.pricePerAdditionalExpense.currency}
                showCurrencyCode={false}
              />
            </TableCell>
            <TableCell>
              <FormattedMoneyAmount
                amount={props.billing.additional.amounts.expensesPaid.valueInCents}
                currency={props.billing.additional.amounts.expensesPaid.currency}
                showCurrencyCode={false}
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      {props.billing.additional.total.valueInCents > 0 && (
        <div className="w-full rounded-xl rounded-t-none border-b bg-red-100 py-2 text-center text-sm text-oc-blue-tints-900">
          <FormattedMessage
            defaultMessage="You will be charged an additional <b>{additionalAmount} on {dueDate}</b> for usage beyond your base plan."
            id="GCs9yX"
            values={{
              b: I18nBold,
              dueDate: <FormattedDate dateStyle="medium" timeZone="UTC" value={props.billing.dueDate} />,
              additionalAmount: (
                <FormattedMoneyAmount
                  amount={props.billing.additional.total.valueInCents}
                  currency={props.billing.additional.total.currency}
                />
              ),
            }}
          />
        </div>
      )}
    </div>
  );
}
