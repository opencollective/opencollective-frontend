import React from 'react';
import type { ApolloClient } from '@apollo/client';
import { useQuery } from '@apollo/client';
import { Info } from '@styled-icons/feather/Info';
import { clsx } from 'clsx';
import { FormattedMessage } from 'react-intl';

import { gql } from '../../../../lib/graphql/helpers';
import type { ExpensePipelineOverviewQuery, Host } from '../../../../lib/graphql/types/v2/graphql';
import { getDashboardUrl } from '../../../../lib/stripe/dashboard';

import { Skeleton } from '@/components/ui/Skeleton';

import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import CcStripe from '../../../icons/Stripe';
import TransferwiseIcon from '../../../icons/TransferwiseIcon';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import StyledButton from '../../../StyledButton';
import StyledCard from '../../../StyledCard';
import StyledLink from '../../../StyledLink';
import StyledTooltip from '../../../StyledTooltip';

import PayExpensesScheduledForPaymentButton from './PayExpensesScheduledForPaymentButton';
import TransferwiseDetailsIcon, { BalancesBreakdown } from './TransferwiseDetailsIcon';

const expensePipelineOverviewQuery = gql`
  query ExpensePipelineOverview($hostSlug: String!, $currency: Currency!) {
    host(slug: $hostSlug) {
      id
      slug
      currency
      transferwise {
        id
        amountBatched {
          valueInCents
          currency
        }
        balances {
          valueInCents
          currency
        }
      }
      stripe {
        issuingBalance {
          valueInCents
          currency
        }
        username
      }
    }
    wiseReadyToPay: expenses(
      host: { slug: $hostSlug }
      limit: 0
      status: READY_TO_PAY
      payoutMethodType: BANK_ACCOUNT
    ) {
      totalCount
      totalAmount {
        amount(currency: $currency) {
          valueInCents
          currency
        }
        amountsByCurrency {
          valueInCents
          currency
        }
      }
    }
    wiseScheduledForPayment: expenses(
      host: { slug: $hostSlug }
      limit: 0
      status: SCHEDULED_FOR_PAYMENT
      payoutMethodType: BANK_ACCOUNT
    ) {
      totalCount
      totalAmount {
        amountsByCurrency {
          valueInCents
          currency
        }
      }
    }
  }
`;

/** Expense process actions that change Wise pipeline aggregates or batched amounts. */
const EXPENSE_PIPELINE_REFETCH_ACTIONS = new Set([
  'APPROVE',
  'UNAPPROVE',
  'REQUEST_RE_APPROVAL',
  'REJECT',
  'SCHEDULE_FOR_PAYMENT',
  'UNSCHEDULE_PAYMENT',
  'PAY',
  'MARK_AS_PAID',
  'MARK_AS_PAID_WITH_STRIPE',
]);

export function shouldRefetchExpensePipeline(action?: string | null): boolean {
  return Boolean(action && EXPENSE_PIPELINE_REFETCH_ACTIONS.has(action));
}

type ExpensePipelineOverviewRefetchHost = Pick<Host, 'slug' | 'currency'>;

export function getExpensePipelineOverviewRefetchQueries(host?: ExpensePipelineOverviewRefetchHost | null) {
  if (!host?.slug || !host?.currency) {
    return [];
  }

  return [{ query: expensePipelineOverviewQuery, variables: { hostSlug: host.slug, currency: host.currency } }];
}

export function refetchExpensePipelineOverview(
  client: ApolloClient<object>,
  host?: ExpensePipelineOverviewRefetchHost | null,
) {
  if (!host?.slug || !host?.currency) {
    return;
  }

  void client.query({
    query: expensePipelineOverviewQuery,
    variables: { hostSlug: host.slug, currency: host.currency },
    fetchPolicy: 'network-only',
  });
}

type ExpensePipelineOverviewHost = NonNullable<ExpensePipelineOverviewQuery['host']>;

type ExpensePipelineOverviewProps = {
  className?: string;
  host: Pick<Host, 'id' | 'currency' | 'slug'>;
  onBatchPaySuccess?: () => void;
};

export default function ExpensePipelineOverview(props: ExpensePipelineOverviewProps) {
  const { data, loading, error, refetch } = useQuery<ExpensePipelineOverviewQuery>(expensePipelineOverviewQuery, {
    variables: {
      hostSlug: props.host.slug,
      currency: props.host.currency,
    },
  });

  if (loading) {
    return <Skeleton className="h-[183.5px]" />;
  }

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  if (!data) {
    return null;
  }

  return (
    <div className={clsx('flex flex-col gap-4 sm:flex-row', props.className)}>
      <WiseStatus
        className="w-full"
        host={data.host}
        readyToPayAmount={data.wiseReadyToPay.totalAmount.amount}
        readyToPayCount={data.wiseReadyToPay.totalCount}
        readyToPayAmountByCurrency={data.wiseReadyToPay.totalAmount.amountsByCurrency}
        scheduledForPaymentCount={data.wiseScheduledForPayment.totalCount}
        scheduledForPaymentAmountByCurrency={data.wiseScheduledForPayment.totalAmount.amountsByCurrency}
        onBatchPaySuccess={props.onBatchPaySuccess ?? refetch}
      />
      {data.host?.stripe?.issuingBalance && <StripeIssuingStatus className="w-full" host={data.host} />}
    </div>
  );
}

type WiseStatusProps = {
  className: string;
  host?: ExpensePipelineOverviewHost | null;
  readyToPayCount?: number;
  readyToPayAmount?: NonNullable<ExpensePipelineOverviewQuery['wiseReadyToPay']['totalAmount']>['amount'];
  readyToPayAmountByCurrency?: NonNullable<
    NonNullable<ExpensePipelineOverviewQuery['wiseReadyToPay']['totalAmount']>['amountsByCurrency']
  >;
  scheduledForPaymentCount?: number;
  scheduledForPaymentAmountByCurrency?: NonNullable<
    NonNullable<ExpensePipelineOverviewQuery['wiseScheduledForPayment']['totalAmount']>['amountsByCurrency']
  >;
  onBatchPaySuccess?: () => void;
};

function WiseStatus(props: WiseStatusProps) {
  const amountBatched = props.host?.transferwise?.amountBatched;

  const mainBalance = React.useMemo(() => {
    return props.host?.transferwise?.balances?.find(b => b.currency === props.host?.currency);
  }, [props.host?.transferwise?.balances, props.host?.currency]);

  const canPayBatch = amountBatched?.valueInCents > 0 && mainBalance?.valueInCents >= amountBatched?.valueInCents;

  const isConnected = props.host?.transferwise?.balances;

  return (
    <StyledCard className={clsx('flex flex-col p-4', props.className)}>
      <div className="flex items-center justify-between text-xs text-slate-700">
        <div>
          <FormattedMessage
            defaultMessage="{service} balance ({currency})"
            id="ArU2Ih"
            values={{ service: 'Wise', currency: props.host?.currency }}
          />
        </div>
        <TransferwiseIcon size={16} />
      </div>
      <div className="mt-2 grow text-2xl font-bold text-slate-900">
        <FormattedMoneyAmount
          showCurrencyCode={false}
          currency={mainBalance?.currency}
          amount={mainBalance?.valueInCents}
        />

        <TransferwiseDetailsIcon size={16} balances={props.host?.transferwise?.balances} />
      </div>
      <div className="mt-3 flex justify-between text-xs text-slate-700">
        <div>
          <FormattedMessage
            defaultMessage="Ready to Pay ({count})"
            id="xiSbsL"
            values={{ count: props.readyToPayCount ?? 0 }}
          />
          <div className="mt-2 flex gap-2 text-base text-slate-900">
            <FormattedMoneyAmount
              showCurrencyCode={false}
              currency={props.host?.currency}
              amount={props.readyToPayAmount?.valueInCents}
            />

            {props.readyToPayAmountByCurrency?.length > 0 && (
              <StyledTooltip content={() => <BalancesBreakdown balances={props.readyToPayAmountByCurrency} />}>
                <Info size={16} color="#76777A" />
              </StyledTooltip>
            )}
          </div>
        </div>
        <div>
          <FormattedMessage
            defaultMessage="Total Batched ({count})"
            id="Ey7Kn+"
            values={{ count: props.scheduledForPaymentCount ?? 0 }}
          />
          <div className="mt-2 flex gap-2 text-base text-slate-900">
            <FormattedMoneyAmount
              showCurrencyCode={false}
              currency={amountBatched?.currency}
              amount={amountBatched?.valueInCents}
            />

            {props.scheduledForPaymentAmountByCurrency?.length > 0 && (
              <StyledTooltip content={() => <BalancesBreakdown balances={props.scheduledForPaymentAmountByCurrency} />}>
                <Info size={16} color="#76777A" />
              </StyledTooltip>
            )}
          </div>
        </div>
      </div>
      <div className="mt-2 flex justify-items-stretch gap-3">
        <StyledLink
          width="100%"
          openInNewTab
          href={
            isConnected
              ? 'https://wise.com/user/account'
              : 'https://documentation.opencollective.com/fiscal-hosts/expense-payment/paying-expenses-with-wise#connecting-transferwise'
          }
        >
          <StyledButton buttonSize="tiny" width="100%">
            {isConnected ? (
              <FormattedMessage defaultMessage="Refill Balance" id="dqYT8G" />
            ) : (
              <FormattedMessage defaultMessage="Connect {service}" id="C9HmCs" values={{ service: 'Wise' }} />
            )}
          </StyledButton>
        </StyledLink>

        {canPayBatch && (
          <PayExpensesScheduledForPaymentButton
            className="w-full"
            host={props.host}
            onSubmit={props.onBatchPaySuccess}
          />
        )}
      </div>
    </StyledCard>
  );
}

type StripeIssuingStatusProps = {
  className: string;
  host: ExpensePipelineOverviewHost;
};

function StripeIssuingStatus(props: StripeIssuingStatusProps) {
  return (
    <StyledCard className={clsx('flex flex-col p-4', props.className)}>
      <div className="flex items-center justify-between text-xs text-slate-700">
        <FormattedMessage
          defaultMessage="{service} balance ({currency})"
          id="ArU2Ih"
          values={{ service: 'Stripe Issuing', currency: props.host?.stripe?.issuingBalance?.currency }}
        />
        <CcStripe />
      </div>
      <div className="mt-2 grow text-2xl font-bold text-slate-900">
        <FormattedMoneyAmount
          showCurrencyCode={false}
          currency={props.host?.stripe?.issuingBalance?.currency}
          amount={props.host?.stripe?.issuingBalance?.valueInCents}
        />
      </div>
      <div className="mt-2 flex justify-items-stretch gap-3">
        <StyledLink width="100%" openInNewTab href={getDashboardUrl('topups', props.host?.stripe?.username)}>
          <StyledButton buttonSize="tiny" width="100%">
            <FormattedMessage defaultMessage="Refill Balance" id="dqYT8G" />
          </StyledButton>
        </StyledLink>
      </div>
    </StyledCard>
  );
}
