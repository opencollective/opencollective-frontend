import React from 'react';
import { ArrowUpRight, HandCoins, Receipt } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { ORDER_STATUS } from '../../../../lib/constants/order-status';
import { i18nExpenseStatus, i18nExpenseType } from '../../../../lib/i18n/expense';
import { i18nOrderStatus } from '../../../../lib/i18n/order';
import { getDashboardRoute } from '../../../../lib/url-helpers';
import { cn } from '../../../../lib/utils';

import { getExpenseStatusMsgType } from '../../../expenses/ExpenseStatusTag';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import Link from '../../../Link';
import LinkCollective from '../../../LinkCollective';
import { Badge } from '../../../ui/Badge';
import { ALL_SECTIONS } from '../../constants';

type RelatedExpense = {
  legacyId: number;
  type: string;
  status: string;
  description?: string | null;
  amountV2?: { valueInCents: number; currency: string } | null;
  account?: { slug?: string; name?: string } | null;
  payee?: { slug?: string; name?: string } | null;
};

type RelatedOrder = {
  legacyId: number;
  status: string;
  description?: string | null;
  totalAmount?: { valueInCents: number; currency: string } | null;
  fromAccount?: { slug?: string; name?: string } | null;
  toAccount?: { slug?: string; name?: string } | null;
};

const getOrderStatusBadgeType = (status: string) => {
  if (
    [
      ORDER_STATUS.ERROR,
      ORDER_STATUS.EXPIRED,
      ORDER_STATUS.CANCELLED,
      ORDER_STATUS.REJECTED,
      ORDER_STATUS.DISPUTED,
      ORDER_STATUS.IN_REVIEW,
    ].includes(status)
  ) {
    return 'error';
  }
  if ([ORDER_STATUS.ACTIVE, ORDER_STATUS.PAID].includes(status)) {
    return 'success';
  }
  if (status === ORDER_STATUS.PAUSED) {
    return 'warning';
  }
  return 'info';
};

type RelatedRecordCardProps = {
  href: string;
  icon: React.ReactNode;
  iconClassName: string;
  label: React.ReactNode;
  statusBadge: React.ReactNode;
  title: string;
  subtitle: React.ReactNode;
  amount?: { valueInCents: number; currency: string } | null;
};

function RelatedRecordCard({
  href,
  icon,
  iconClassName,
  label,
  statusBadge,
  title,
  subtitle,
  amount,
}: RelatedRecordCardProps) {
  return (
    <Link
      href={href}
      className="group mb-6 block rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:bg-muted/30 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
            {statusBadge}
          </div>
          <p className="truncate font-medium text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 self-stretch">
          {amount && (
            <FormattedMoneyAmount
              amount={amount.valueInCents}
              currency={amount.currency}
              amountClassName="font-semibold whitespace-nowrap"
            />
          )}
          <ArrowUpRight className="mt-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
        </div>
      </div>
    </Link>
  );
}

export function PaymentIntentRelatedExpense({
  expense,
  dashboardAccount,
}: {
  expense: RelatedExpense;
  dashboardAccount: { slug: string };
}) {
  const intl = useIntl();

  return (
    <RelatedRecordCard
      href={getDashboardRoute(dashboardAccount, `${ALL_SECTIONS.HOST_PAYMENT_REQUESTS}/${expense.legacyId}`)}
      icon={<Receipt className="size-5" aria-hidden="true" />}
      iconClassName="bg-blue-50 text-blue-600 ring-blue-100"
      label={
        <React.Fragment>
          {i18nExpenseType(intl, expense.type)} #{expense.legacyId}
        </React.Fragment>
      }
      statusBadge={
        <Badge type={getExpenseStatusMsgType(expense.status)} size="sm">
          {i18nExpenseStatus(intl, expense.status)}
        </Badge>
      }
      title={expense.description || `#${expense.legacyId}`}
      subtitle={
        expense.payee && expense.account ? (
          <FormattedMessage
            defaultMessage="from {payee} to {account}"
            id="B5z1AU"
            values={{
              payee: (
                <LinkCollective
                  noTitle
                  collective={expense.payee}
                  className="font-medium text-foreground hover:text-primary hover:underline"
                  onClick={e => e.stopPropagation()}
                />
              ),
              account: (
                <LinkCollective
                  noTitle
                  collective={expense.account}
                  className="font-medium text-foreground hover:text-primary hover:underline"
                  onClick={e => e.stopPropagation()}
                />
              ),
            }}
          />
        ) : (
          <FormattedMessage defaultMessage="Related Expense" id="PaymentIntent.RelatedExpense" />
        )
      }
      amount={expense.amountV2}
    />
  );
}

export function PaymentIntentRelatedOrder({
  order,
  dashboardAccount,
}: {
  order: RelatedOrder;
  dashboardAccount: { slug: string };
}) {
  const intl = useIntl();

  return (
    <RelatedRecordCard
      href={getDashboardRoute(dashboardAccount, `${ALL_SECTIONS.INCOMING_CONTRIBUTIONS}?orderId=${order.legacyId}`)}
      icon={<HandCoins className="size-5" aria-hidden="true" />}
      iconClassName="bg-emerald-50 text-emerald-600 ring-emerald-100"
      label={
        <React.Fragment>
          <FormattedMessage defaultMessage="Contribution" id="0LK5eg" /> #{order.legacyId}
        </React.Fragment>
      }
      statusBadge={
        <Badge type={getOrderStatusBadgeType(order.status)} size="sm">
          {i18nOrderStatus(intl, order.status)}
        </Badge>
      }
      title={order.description || `#${order.legacyId}`}
      subtitle={
        order.fromAccount && order.toAccount ? (
          <FormattedMessage
            id="Order.fromTo"
            defaultMessage="for {account} from {contributor}"
            values={{
              contributor: (
                <LinkCollective
                  noTitle
                  collective={order.fromAccount}
                  className="font-medium text-foreground hover:text-primary hover:underline"
                  onClick={e => e.stopPropagation()}
                />
              ),
              account: (
                <LinkCollective
                  noTitle
                  collective={order.toAccount}
                  className="font-medium text-foreground hover:text-primary hover:underline"
                  onClick={e => e.stopPropagation()}
                />
              ),
            }}
          />
        ) : (
          <FormattedMessage defaultMessage="Related Contribution" id="PaymentIntent.RelatedContribution" />
        )
      }
      amount={order.totalAmount}
    />
  );
}
