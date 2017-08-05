import { FormattedNumber } from 'react-intl';

export default ({value, currency, precision=0}) => (
  <FormattedNumber
    value={value / 100}
    currency={currency}
    style='currency'
    currencyDisplay='symbol'
    minimumFractionDigits={0}
    maximumFractionDigits={precision}
    />
);