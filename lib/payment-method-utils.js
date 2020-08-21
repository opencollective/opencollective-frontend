import React from 'react';
import { ExchangeAlt } from '@styled-icons/fa-solid/ExchangeAlt';
import { MoneyCheck } from '@styled-icons/fa-solid/MoneyCheck';
import { isNil } from 'lodash';
import { FormattedDate, FormattedMessage } from 'react-intl';

import Avatar from '../components/Avatar';
import CreditCard from '../components/icons/CreditCard';
import GiftCard from '../components/icons/GiftCard';
import PayPal from '../components/icons/PayPal';

import { formatCurrency } from './currency-utils';
import { paymentMethodExpiration } from './payment_method_label';

/** Minimum usable balance for virtual card and collective to collective */
const MIN_VIRTUALCARD_BALANCE = 50;

export const getPaymentMethodIcon = (pm, collective) => {
  if (pm.type === 'creditcard') {
    return <CreditCard />;
  } else if (pm.type === 'virtualcard') {
    return <GiftCard />;
  } else if (pm.service === 'paypal') {
    return <PayPal />;
  } else if (pm.type === 'prepaid') {
    return <MoneyCheck width="26px" height="18px" />;
  } else if (pm.type === 'collective' && collective) {
    return <Avatar collective={collective} size="3.6rem" />;
  } else if (pm.type === 'manual') {
    return <ExchangeAlt size="1.5em" color="#c9ced4" />;
  }
};

/** An helper that adds compatibility between GQLV1 and V2 */
export const getPaymentMethodBalance = pm => {
  if (typeof pm.balance === 'number') {
    return pm.balance;
  } else if (!isNil(pm.balance?.valueInCents)) {
    return pm.balance.valueInCents;
  } else if (!isNil(pm.balance?.value)) {
    return pm.balance.value * 100;
  } else {
    return NaN;
  }
};

export const isPaymentMethodExpired = pm => {
  return pm.expiryDate && new Date(pm.expiryDate) < new Date();
};

export const isPaymentMethodDisabled = pm => {
  return (
    isPaymentMethodExpired(pm) || (pm.type === 'virtualcard' && getPaymentMethodBalance(pm) < MIN_VIRTUALCARD_BALANCE)
  );
};

/** Returns payment method's subtitles */
export const getPaymentMethodMetadata = pm => {
  const balance = getPaymentMethodBalance(pm);
  const currency = pm.currency || pm.balance?.currency;
  if (pm.type === 'creditcard') {
    const expiryDate = paymentMethodExpiration(pm);
    return (
      <FormattedMessage
        id="ContributePayment.expiresOn"
        defaultMessage="Expires on {expiryDate}"
        values={{ expiryDate }}
      />
    );
  } else if (pm.type === 'virtualcard') {
    if (balance < MIN_VIRTUALCARD_BALANCE) {
      return (
        <FormattedMessage
          id="ContributePayment.unusableBalance"
          defaultMessage="{balance} left, balance less than {minBalance} cannot be used."
          values={{
            balance: formatCurrency(balance, currency),
            minBalance: formatCurrency(MIN_VIRTUALCARD_BALANCE, currency),
          }}
        />
      );
    } else if (pm.expiryDate) {
      if (isPaymentMethodExpired(pm)) {
        return (
          <FormattedMessage
            id="ContributePayment.balanceAndExpiry"
            defaultMessage="{balance} left, expires on {expiryDate}"
            values={{
              expiryDate: <FormattedDate value={pm.expiryDate} day="numeric" month="long" year="numeric" />,
              balance: formatCurrency(balance, currency),
            }}
          />
        );
      } else {
        return (
          <FormattedMessage
            id="PaymentMethodExpiredOn"
            defaultMessage="Expired on {expiryDate}"
            values={{
              expiryDate: <FormattedDate value={pm.expiryDate} day="numeric" month="long" year="numeric" />,
            }}
          />
        );
      }
    } else {
      return (
        <FormattedMessage
          id="ContributePayment.balanceLeft"
          defaultMessage="{balance} left"
          values={{
            balance: formatCurrency(balance, currency),
          }}
        />
      );
    }
  } else if (['prepaid', 'collective'].includes(pm.type)) {
    return (
      <FormattedMessage
        id="ContributePayment.balanceLeft"
        defaultMessage="{balance} left"
        values={{
          balance: formatCurrency(balance, currency),
        }}
      />
    );
  }
};
