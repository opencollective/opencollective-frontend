import React from 'react';
import { Paypal } from '@styled-icons/fa-brands/Paypal';
import { StripeS } from '@styled-icons/fa-brands/StripeS';
import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';

import { connectAccount } from '../../../lib/api';
import { createError, ERROR } from '../../../lib/errors';
import { Amount, Host } from '../../../lib/graphql/types/v2/graphql';
import { useAsyncCall } from '../../../lib/hooks/useAsyncCall';
import { getDashboardUrl } from '../../../lib/stripe/dashboard';

import FormattedMoneyAmount from '../../FormattedMoneyAmount';
import TransferwiseIcon from '../../icons/TransferwiseIcon';
import StyledButton from '../../StyledButton';
import StyledCard from '../../StyledCard';
import StyledLink from '../../StyledLink';
import StyledTooltip from '../../StyledTooltip';
import { getPaypalExpiryInfo } from '../PaypalPreApprovalDetailsIcon';
import TransferwiseDetailsIcon from '../TransferwiseDetailsIcon';

import PayExpensesScheduledForPaymentButton from './PayExpensesScheduledForPaymentButton';

type ExpensePipelineOverviewProps = {
  className?: string;
  host: Pick<
    Host,
    'id' | 'legacyId' | 'currency' | 'paypalPreApproval' | 'transferwise' | 'stripe' | 'paypalPreApproval' | 'slug'
  >;
  wise: {
    readyToPayAmount?: Amount;
    readyToPayCount?: number;
    scheduledForPaymentAmount?: Amount;
    scheduledForPaymentCount?: number;
  };
  paypal: {
    readyToPayAmount?: Amount;
    readyToPayCount?: number;
    scheduledForPaymentAmount?: Amount;
    scheduledForPaymentCount?: number;
  };
};

export default function ExpensePipelineOverview(props: ExpensePipelineOverviewProps) {
  return (
    <div className={clsx('flex gap-4', props.className)}>
      <WiseStatus
        className="w-full"
        host={props.host}
        readyToPayAmount={props.wise.readyToPayAmount}
        readyToPayCount={props.wise.readyToPayCount}
        scheduledForPaymentAmount={props.wise.scheduledForPaymentAmount}
        scheduledForPaymentCount={props.wise.scheduledForPaymentCount}
      />
      {props.host?.paypalPreApproval && (
        <PayPalStatus
          className="w-full"
          host={props.host}
          readyToPayAmount={props.paypal.readyToPayAmount}
          readyToPayCount={props.paypal.readyToPayCount}
          scheduledForPaymentAmount={props.paypal.scheduledForPaymentAmount}
          scheduledForPaymentCount={props.paypal.scheduledForPaymentCount}
        />
      )}
      {props.host?.stripe?.issuingBalance && <StripeIssuingStatus className="w-full" host={props.host} />}
    </div>
  );
}

type WiseStatusProps = {
  className: string;
  host: Pick<Host, 'id' | 'transferwise' | 'currency' | 'slug'>;
  readyToPayCount?: number;
  readyToPayAmount?: Amount;
  scheduledForPaymentCount?: number;
  scheduledForPaymentAmount?: Amount;
};

function WiseStatus(props: WiseStatusProps) {
  const mainBalance = React.useMemo(() => {
    return props.host?.transferwise?.balances?.find(b => b.currency === props.host?.currency);
  }, [props.host?.transferwise?.balances, props.host?.currency]);

  const isConnected = props?.host?.transferwise?.balances;

  return (
    <StyledCard className={clsx('flex flex-col p-4', props.className)}>
      <div className="flex items-center justify-between text-xs text-slate-700">
        <div>
          <FormattedMessage
            defaultMessage="{service} balance ({currency})"
            values={{ service: 'Wise', currency: props.host?.currency }}
          />
        </div>
        <TransferwiseIcon size={16} />
      </div>
      <div className="mt-2 flex-grow text-2xl font-bold text-slate-900">
        <FormattedMoneyAmount
          showCurrencyCode={false}
          currency={mainBalance?.currency}
          amount={mainBalance?.valueInCents}
        />

        <TransferwiseDetailsIcon size={16} balances={props.host?.transferwise?.balances} />
      </div>
      <div className="mt-3 flex justify-between text-xs text-slate-700">
        <div>
          <FormattedMessage defaultMessage="Ready to Pay ({count})" values={{ count: props?.readyToPayCount ?? 0 }} />
          <div className="mt-2 text-base text-slate-900">
            <FormattedMoneyAmount
              showCurrencyCode={false}
              currency={props.host?.currency}
              amount={props?.readyToPayAmount?.valueInCents}
              amountStyles={null}
            />
          </div>
        </div>
        <div>
          <FormattedMessage
            defaultMessage="Total Batched ({count})"
            values={{ count: props?.scheduledForPaymentCount ?? 0 }}
          />
          <div className="mt-2 text-base text-slate-900">
            <FormattedMoneyAmount
              showCurrencyCode={false}
              currency={props.host?.currency}
              amount={props?.host?.transferwise?.amountBatched?.valueInCents}
              amountStyles={null}
            />
          </div>
        </div>
      </div>
      <div className="mt-2 flex justify-items-stretch gap-3">
        {props?.scheduledForPaymentAmount?.valueInCents > 0 &&
          mainBalance?.valueInCents >= props?.scheduledForPaymentAmount?.valueInCents && (
            <PayExpensesScheduledForPaymentButton className="w-full" host={props.host} />
          )}

        <StyledLink
          width="100%"
          openInNewTab
          href={
            isConnected
              ? 'https://wise.com/user/account'
              : 'https://docs.opencollective.com/help/fiscal-hosts/payouts/payouts-with-transferwise#connecting-transferwise'
          }
        >
          <StyledButton buttonStyle="secondary" buttonSize="tiny" width="100%">
            {isConnected ? (
              <FormattedMessage defaultMessage="Refill Balance" />
            ) : (
              <FormattedMessage defaultMessage="Connect {service}" values={{ service: 'Wise' }} />
            )}
          </StyledButton>
        </StyledLink>
      </div>
    </StyledCard>
  );
}

type PayPalStatusProps = {
  className: string;
  host: Pick<Host, 'legacyId' | 'paypalPreApproval' | 'currency'>;
  readyToPayCount?: number;
  readyToPayAmount?: Amount;
  scheduledForPaymentCount?: number;
  scheduledForPaymentAmount?: Amount;
};

function PayPalStatus(props: PayPalStatusProps) {
  const { message, icon } = getPaypalExpiryInfo(props.host.paypalPreApproval);

  const { loading, call: connect } = useAsyncCall(
    async () => {
      const urlParams = { redirect: window.location.href, useNewFlow: true };
      try {
        const json = await connectAccount(props.host?.legacyId, 'paypal', urlParams);
        window.location.replace(json.redirectUrl);
      } catch (err) {
        throw createError(ERROR.UNKNOWN, { message: err.message });
      }
      // Give some time (60s) for redirect
      return new Promise(resolve => setTimeout(resolve, 60000));
    },
    { useErrorToast: true },
  );

  return (
    <StyledCard className={clsx('flex flex-col p-4', props.className)}>
      <div className="flex items-center justify-between text-xs text-slate-700">
        <FormattedMessage
          defaultMessage="{service} balance ({currency})"
          values={{ service: 'PayPal', currency: props?.host?.paypalPreApproval?.balance?.currency }}
        />
        <Paypal size={16} />
      </div>
      <div className="mt-2 flex-grow text-2xl font-bold  text-slate-900">
        <FormattedMoneyAmount
          showCurrencyCode={false}
          currency={props?.host?.paypalPreApproval?.balance?.currency}
          amount={props?.host?.paypalPreApproval?.balance?.valueInCents}
        />
        <StyledTooltip content={message}>{icon}</StyledTooltip>
      </div>
      <div className="mt-3 flex justify-between text-xs text-slate-700">
        <div>
          <FormattedMessage defaultMessage="Ready to Pay ({count})" values={{ count: props?.readyToPayCount ?? 0 }} />
          <div className="mt-2 text-base text-slate-900">
            <FormattedMoneyAmount
              showCurrencyCode={false}
              currency={props.host?.currency}
              amount={props?.readyToPayAmount?.valueInCents}
              amountStyles={null}
            />
          </div>
        </div>
        <div>
          <FormattedMessage
            defaultMessage="Total Batched ({count})"
            values={{ count: props?.scheduledForPaymentCount ?? 0 }}
          />
          <div className="mt-2 text-base text-slate-900">
            <FormattedMoneyAmount
              showCurrencyCode={false}
              currency={props.host?.currency}
              amount={props?.scheduledForPaymentAmount?.valueInCents}
              amountStyles={null}
            />
          </div>
        </div>
      </div>
      <div className="mt-2 flex justify-items-stretch gap-3">
        <StyledButton loading={loading} onClick={connect} width="100%" buttonStyle="secondary" buttonSize="tiny">
          <FormattedMessage defaultMessage="Refill Balance" />
        </StyledButton>
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
          values={{ service: 'Stripe Issuing', currency: props?.host?.stripe?.issuingBalance?.currency }}
        />
        <StripeS size={16} />
      </div>
      <div className="mt-2 flex-grow text-2xl font-bold text-slate-900">
        <FormattedMoneyAmount
          showCurrencyCode={false}
          currency={props?.host?.stripe?.issuingBalance?.currency}
          amount={props?.host?.stripe?.issuingBalance?.valueInCents}
        />
      </div>
      <div className="mt-2 flex justify-items-stretch gap-3">
        <StyledLink width="100%" openInNewTab href={getDashboardUrl('topups', props.host.stripe.username)}>
          <StyledButton buttonStyle="secondary" buttonSize="tiny" width="100%">
            <FormattedMessage defaultMessage="Refill Balance" />
          </StyledButton>
        </StyledLink>
      </div>
    </StyledCard>
  );
}
