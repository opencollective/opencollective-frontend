import React from 'react';
import { ExchangeAlt } from '@styled-icons/fa-solid/ExchangeAlt';
import { MoneyCheck } from '@styled-icons/fa-solid/MoneyCheck';
import { isNil } from 'lodash';
import { FormattedDate, FormattedMessage } from 'react-intl';

import Avatar from '../components/Avatar';
import CreditCard from '../components/icons/CreditCard';
import GiftCard from '../components/icons/GiftCard';
import PayPal from '../components/icons/PayPal';
import LinkCollective from '../components/LinkCollective';

import { PaymentMethodService, PaymentMethodType } from './constants/payment-methods';
import { formatCurrency } from './currency-utils';
import { paymentMethodExpiration } from './payment_method_label';

/** Minimum usable balance for virtual card and collective to collective */
const MIN_VIRTUALCARD_BALANCE = 50;

export const getPaymentMethodIcon = (pm, collective) => {
  if (pm.type === PaymentMethodType.CREDIT_CARD) {
    return <CreditCard />;
  } else if (pm.type === PaymentMethodType.VIRTUAL_CARD) {
    return <GiftCard />;
  } else if (pm.service === PaymentMethodService.PAYPAL) {
    return <PayPal />;
  } else if (pm.type === PaymentMethodType.PREPAID) {
    return <MoneyCheck width="26px" height="18px" />;
  } else if (pm.type === PaymentMethodType.COLLECTIVE && collective) {
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

export const paymentMethodTypeHasBalance = type => {
  return [PaymentMethodType.COLLECTIVE, PaymentMethodType.VIRTUAL_CARD, PaymentMethodType.PREPAID].includes(type);
};

export const isPaymentMethodDisabled = (pm, totalAmount) => {
  if (isPaymentMethodExpired(pm)) {
    return true;
  } else if (paymentMethodTypeHasBalance(pm.type)) {
    const balance = getPaymentMethodBalance(pm);
    if (pm.type === PaymentMethodType.VIRTUAL_CARD && balance < MIN_VIRTUALCARD_BALANCE) {
      return true;
    } else if (balance < totalAmount) {
      return true;
    }
  }

  return false;
};

/** Returns payment method's subtitles */
export const getPaymentMethodMetadata = (pm, totalAmount) => {
  const balance = getPaymentMethodBalance(pm);
  const currency = pm.currency || pm.balance?.currency;
  if (pm.type === PaymentMethodType.CREDIT_CARD) {
    const expiryDate = paymentMethodExpiration(pm);
    return (
      <FormattedMessage
        id="ContributePayment.expiresOn"
        defaultMessage="Expires on {expiryDate}"
        values={{ expiryDate }}
      />
    );
  } else if (pm.type === PaymentMethodType.VIRTUAL_CARD && balance < MIN_VIRTUALCARD_BALANCE) {
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
  } else if (isPaymentMethodExpired(pm)) {
    return (
      <FormattedMessage
        id="PaymentMethodExpiredOn"
        defaultMessage="Expired on {expiryDate}"
        values={{
          expiryDate: <FormattedDate value={pm.expiryDate} day="numeric" month="long" year="numeric" />,
        }}
      />
    );
  } else if (paymentMethodTypeHasBalance(pm.type)) {
    if (balance < totalAmount) {
      return pm.type === PaymentMethodType.COLLECTIVE ? (
        <FormattedMessage
          id="contribute.lowCollectiveBalance"
          defaultMessage="The balance of this collective is too low ({balance}). Add funds to {collective} by making a financial contribution to it first."
          values={{
            collective: <LinkCollective collective={pm.account} />,
            balance: formatCurrency(balance, currency),
          }}
        />
      ) : (
        <FormattedMessage
          id="PaymentMethod.BalanceTooLow"
          defaultMessage="The balance ({balance}) is too low"
          values={{ balance: formatCurrency(balance, currency) }}
        />
      );
    } else if (pm.expiryDate) {
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
          id="ContributePayment.balanceLeft"
          defaultMessage="{balance} left"
          values={{ balance: formatCurrency(balance, currency) }}
        />
      );
    }
  } else {
    return null;
  }
};

export const hasPaypalPreApprovalExpired = paymentMethod => {
  return new Date(paymentMethod.expiryDate) - new Date() <= 0;
};

/**
 * From `api/server/lib/payments.js`
 *
 * @param {string} instructions
 * @param {object} values
 */
export const formatManualInstructions = (instructions, values) => {
  if (!instructions) {
    return '';
  } else {
    return instructions.replace(/{([\s\S]+?)}/g, (match, key) => {
      if (key && values[key]) {
        return values[key];
      } else {
        return match;
      }
    });
  }
};
