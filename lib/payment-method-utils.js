import React from 'react';
import { Bank } from '@styled-icons/boxicons-solid/Bank';
import { Alipay } from '@styled-icons/fa-brands/Alipay';
import { ApplePay } from '@styled-icons/fa-brands/ApplePay';
import { GooglePay } from '@styled-icons/fa-brands/GooglePay';
import { ExchangeAlt } from '@styled-icons/fa-solid/ExchangeAlt';
import { MoneyCheck } from '@styled-icons/fa-solid/MoneyCheck';
import { isNil } from 'lodash';
import { FormattedDate, FormattedMessage } from 'react-intl';

import Avatar from '../components/Avatar';
import CreditCard from '../components/icons/CreditCard';
import GiftCard from '../components/icons/GiftCard';
import PayPal from '../components/icons/PayPal';
import LinkCollective from '../components/LinkCollective';

import { PAYMENT_METHOD_SERVICE, PAYMENT_METHOD_TYPE } from './constants/payment-methods';
import { formatCurrency } from './currency-utils';
import { paymentMethodExpiration } from './payment_method_label';

/** Minimum usable balance for gift card and collective to collective */
const MIN_GIFT_CARD_BALANCE = 50;

export const getPaymentMethodIcon = (pm, collective, size) => {
  const type = pm.type;
  const service = pm.service;

  if (type === PAYMENT_METHOD_TYPE.CREDITCARD) {
    const walletType = pm?.data?.wallet?.type;
    if (walletType === 'google_pay') {
      return <GooglePay size={size} />;
    } else if (walletType === 'apple_pay') {
      return <ApplePay size={size} />;
    }

    return <CreditCard size={size} />;
  } else if (type === PAYMENT_METHOD_TYPE.GIFTCARD) {
    return <GiftCard size={size} />;
  } else if (service === PAYMENT_METHOD_SERVICE.PAYPAL) {
    return <PayPal size={size} />;
  } else if (type === PAYMENT_METHOD_TYPE.PREPAID) {
    return <MoneyCheck width="26px" height="18px" size={size} />;
  } else if (type === PAYMENT_METHOD_TYPE.COLLECTIVE && collective) {
    return <Avatar collective={collective} size={size || '3.6rem'} />;
  } else if (type === PAYMENT_METHOD_TYPE.MANUAL) {
    return <ExchangeAlt color="#c9ced4" size={size || '1.5em'} />;
  } else if (type === PAYMENT_METHOD_TYPE.ALIPAY) {
    return <Alipay width="26px" height="18px" color="#c9ced4" size={size || '1.5em'} />;
  } else if (
    [
      PAYMENT_METHOD_TYPE.US_BANK_ACCOUNT,
      PAYMENT_METHOD_TYPE.SEPA_DEBIT,
      PAYMENT_METHOD_TYPE.BACS_DEBIT,
      PAYMENT_METHOD_TYPE.BANCONTACT,
    ].includes(type)
  ) {
    return <Bank size={size} />;
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
  return [PAYMENT_METHOD_TYPE.COLLECTIVE, PAYMENT_METHOD_TYPE.GIFTCARD, PAYMENT_METHOD_TYPE.PREPAID].includes(type);
};

export const isPaymentMethodDisabled = (pm, totalAmount) => {
  if (isPaymentMethodExpired(pm)) {
    return true;
  } else if (paymentMethodTypeHasBalance(pm.type)) {
    const balance = getPaymentMethodBalance(pm);
    if (pm.type === PAYMENT_METHOD_TYPE.GIFTCARD && balance < MIN_GIFT_CARD_BALANCE) {
      return true;
    } else if (balance < totalAmount) {
      return true;
    }
  }

  return false;
};

/** Returns payment method's subtitles */
export const getPaymentMethodMetadata = (pm, totalAmount) => {
  // TODO formatCurrency locale
  const balance = getPaymentMethodBalance(pm);
  const currency = pm.currency || pm.balance?.currency;

  const type = pm.type;
  const service = pm.service;

  if (type === PAYMENT_METHOD_TYPE.CREDITCARD) {
    const expiryDate = paymentMethodExpiration(pm);
    return (
      <FormattedMessage
        id="ContributePayment.expiresOn"
        defaultMessage="Expires on {expiryDate}"
        values={{ expiryDate }}
      />
    );
  } else if (type === PAYMENT_METHOD_TYPE.GIFTCARD && balance < MIN_GIFT_CARD_BALANCE) {
    return (
      <FormattedMessage
        id="ContributePayment.unusableBalance"
        defaultMessage="{balance} left, balance less than {minBalance} cannot be used."
        values={{
          balance: formatCurrency(balance, currency),
          minBalance: formatCurrency(MIN_GIFT_CARD_BALANCE, currency),
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
      return type === PAYMENT_METHOD_TYPE.COLLECTIVE ? (
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
  } else if (service === PAYMENT_METHOD_SERVICE.PAYPAL) {
    return pm.name;
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
      if (key && !isNil(values[key])) {
        return values[key];
      } else {
        return match;
      }
    });
  }
};
