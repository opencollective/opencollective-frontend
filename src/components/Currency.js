import React from 'react';
import { FormattedNumber } from 'react-intl';

const Currency = ({value, currency, precision=0}) => (
  <FormattedNumber
    value={value / 100}
    currency={currency}
    style='currency'
    currencyDisplay='symbol'
    minimumFractionDigits={precision}
    maximumFractionDigits={precision}
    />
);

export default Currency;
