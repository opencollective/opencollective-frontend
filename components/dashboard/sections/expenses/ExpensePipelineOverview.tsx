import React from 'react';
import { useQuery } from '@apollo/client';
import { Info } from '@styled-icons/feather/Info';
import { clsx } from 'clsx';
import { FormattedMessage } from 'react-intl';

import { gql } from '../../../../lib/graphql/helpers';
import type { Amount, ExpenseCollection, Host } from '../../../../lib/graphql/types/v2/schema';
import { getDashboardUrl } from '../../../../lib/stripe/dashboard';

import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import CcStripe from '../../../icons/Stripe';
import TransferwiseIcon from '../../../icons/TransferwiseIcon';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import StyledButton from '../../../StyledButton';
import StyledCard from '../../../StyledCard';
import StyledLink from '../../../StyledLink';
import StyledTooltip from '../../../StyledTooltip';

import PayExpensesScheduledForPaymentButton from './PayExpensesScheduledForPaymentButton';
import TransferwiseDetailsIcon, { BalancesBreakdown } from './TransferwiseDetailsIcon';

const ExpensePipelineOverviewQuery = gql`
  query ExpensePipelineOverview($hostSlug: String!, $currency: Currency!) {
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
  }
`;

type ExpensePipelineOverviewProps = {
  className?: string;
  host: Pick<Host, 'id' | 'legacyId' | 'currency' | 'transferwise' | 'stripe' | 'slug'>;
};

export default function ExpensePipelineOverview(props: ExpensePipelineOverviewProps) {
  const { data, loading, error } = useQuery<{
    wiseReadyToPay: Pick<ExpenseCollection, 'totalCount' | 'totalAmount'>;
    wiseScheduledForPayment: Pick<ExpenseCollection, 'totalCount' | 'totalAmount'>;
  }>(ExpensePipelineOverviewQuery, {
    variables: {
      hostSlug: props.host.slug,
      currency: props.host.currency,
    },
  });

  if (loading) {
    return <LoadingPlaceholder height={150} />;
  }

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  return (
    <div className={clsx('flex flex-col gap-4 sm:flex-row', props.className)}>
      <WiseStatus
        className="w-full"
        host={props.host}
        readyToPayAmount={data.wiseReadyToPay.totalAmount.amount}
        readyToPayCount={data.wiseReadyToPay.totalCount}
        readyToPayAmountByCurrency={data.wiseReadyToPay.totalAmount.amountsByCurrency}
        scheduledForPaymentAmount={data.wiseScheduledForPayment.totalAmount.amount}
        scheduledForPaymentCount={data.wiseScheduledForPayment.totalCount}
        scheduledForPaymentAmountByCurrency={data.wiseScheduledForPayment.totalAmount.amountsByCurrency}
      />
      {props.host?.stripe?.issuingBalance && <StripeIssuingStatus className="w-full" host={props.host} />}
    </div>
  );
}

type WiseStatusProps = {
  className: string;
  host: Pick<Host, 'id' | 'transferwise' | 'currency' | 'slug'>;
  readyToPayCount?: number;
  readyToPayAmount?: Amount;
  readyToPayAmountByCurrency?: Amount[];
  scheduledForPaymentCount?: number;
  scheduledForPaymentAmount?: Amount;
  scheduledForPaymentAmountByCurrency?: Amount[];
};

function WiseStatus(props: WiseStatusProps) {
  const mainBalance = React.useMemo(() => {
    return props.host?.transferwise?.balances?.find(b => b.currency === props.host?.currency);
  }, [props.host?.transferwise?.balances, props.host?.currency]);

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
              currency={props.host?.currency}
              amount={props.host?.transferwise?.amountBatched?.valueInCents}
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

        {props.scheduledForPaymentAmount?.valueInCents > 0 &&
          mainBalance?.valueInCents >= props.scheduledForPaymentAmount?.valueInCents && (
            <PayExpensesScheduledForPaymentButton className="w-full" host={props.host} />
          )}
      </div>
    </StyledCard>
  );
}

type StripeIssuingStatusProps = {
  className: string;
  host: Pick<Host, 'stripe'>;
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
