import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Currency } from '../../../../lib/graphql/types/v2/graphql';

import FormattedMoneyAmount from '../../../FormattedMoneyAmount';

import { AmountFilterType, AmountFilterValueType } from './schema';

const Amount = ({ amount, currency }: { amount: number; currency: Currency }) => {
  return (
    <FormattedMoneyAmount
      amount={amount}
      currency={currency}
      precision="auto"
      amountStyles={{ fontWeight: 'normal' }}
      showCurrencyCode={false}
    />
  );
};

const getMessage = ({ filterValue, currency }: { filterValue: AmountFilterValueType; currency: Currency }) => {
  switch (filterValue.type) {
    case AmountFilterType.IS_EQUAL_TO:
      return (
        <FormattedMessage
          defaultMessage="Exactly {amount}"
          id="ZNBeE4"
          values={{
            amount: <Amount amount={filterValue.gte} currency={currency} />,
          }}
        />
      );
    case AmountFilterType.IS_BETWEEN:
      return (
        <FormattedMessage
          defaultMessage="{amountFrom} to {amountTo}"
          id="MOgYVM"
          values={{
            amountFrom: <Amount amount={filterValue.gte} currency={currency} />,
            amountTo: <Amount amount={filterValue.lte} currency={currency} />,
          }}
        />
      );
    case AmountFilterType.IS_GREATER_THAN:
      return (
        <FormattedMessage
          defaultMessage="More than {amount}"
          id="B+fVMt"
          values={{
            amount: <Amount amount={filterValue.gte} currency={currency} />,
          }}
        />
      );
    case AmountFilterType.IS_LESS_THAN:
      return (
        <FormattedMessage
          defaultMessage="Less than {amount}"
          id="QRythI"
          values={{
            amount: <Amount amount={filterValue.lte} currency={currency} />,
          }}
        />
      );
  }
};

export const AmountFilterValue = ({ value, currency }: { value: AmountFilterValueType; currency: Currency }) => {
  const message = getMessage({ filterValue: value, currency });
  return <div>{message}</div>;
};
