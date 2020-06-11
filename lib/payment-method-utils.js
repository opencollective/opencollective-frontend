import React from 'react';
import { ExchangeAlt } from '@styled-icons/fa-solid/ExchangeAlt';
import { MoneyCheck } from '@styled-icons/fa-solid/MoneyCheck';
import { FormattedDate, FormattedMessage } from 'react-intl';

import Avatar from '../components/Avatar';
import CreditCard from '../components/icons/CreditCard';
import GiftCard from '../components/icons/GiftCard';
import PayPal from '../components/icons/PayPal';

import { formatCurrency } from './currency-utils';
import { paymentMethodExpiration } from './payment_method_label';

const minBalance = 50; // Minimum usable balance for virtual card

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

/** Returns payment method's subtitles */
export const getPaymentMethodMetadata = pm => {
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
    if (pm.balance < minBalance || pm.balance.value * 100 < minBalance) {
      return (
        <FormattedMessage
          id="ContributePayment.unusableBalance"
          defaultMessage="{balance} left, balance less than {minBalance} cannot be used."
          values={{
            balance:
              pm.balance.value * 100
                ? formatCurrency(pm.balance.value * 100, pm.balance.currency)
                : formatCurrency(pm.balance, pm.currency),
            minBalance: formatCurrency(minBalance, pm.currency || pm.balance.currency),
          }}
        />
      );
    } else if (pm.expiryDate) {
      return (
        <FormattedMessage
          id="ContributePayment.balanceAndExpiry"
          defaultMessage="{balance} left, expires on {expiryDate}"
          values={{
            expiryDate: <FormattedDate value={pm.expiryDate} day="numeric" month="long" year="numeric" />,
            balance:
              pm.balance.value * 100
                ? formatCurrency(pm.balance.value * 100, pm.balance.currency)
                : formatCurrency(pm.balance, pm.currency),
          }}
        />
      );
    } else {
      return (
        <FormattedMessage
          id="ContributePayment.balanceLeft"
          defaultMessage="{balance} left"
          values={{
            balance:
              pm.balance.value * 100
                ? formatCurrency(pm.balance.value * 100, pm.balance.currency)
                : formatCurrency(pm.balance, pm.currency),
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
          balance:
            pm.balance.value * 100
              ? formatCurrency(pm.balance.value * 100, pm.balance.currency)
              : formatCurrency(pm.balance, pm.currency),
        }}
      />
    );
  }
};
