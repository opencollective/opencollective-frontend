import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Currency from './Currency';
import { Span } from './Text';

/**
 * A practical component to format amounts and their intervals., with proper
 * internationalization support. Accept all props from `Span`.
 */
const FormattedMoneyAmount = ({
  abbreviate,
  abbreviateInterval,
  currency,
  precision,
  amount,
  interval,
  ...spanProps
}) => {
  if (!interval) {
    return <Currency value={amount} currency={currency} precision={precision} abbreviate={abbreviate} {...spanProps} />;
  }

  return abbreviateInterval ? (
    <Span {...spanProps}>
      <FormattedMessage
        id="AmountInterval"
        defaultMessage="{amount} / {interval, select, month {mo.} year {yr.}}"
        values={{
          amount: <Currency value={amount} currency={currency} precision={precision} abbreviate={abbreviate} />,
          interval: interval,
        }}
      />
    </Span>
  ) : (
    <Span {...spanProps}>
      <FormattedMessage
        id="AmountIntervalLong"
        defaultMessage="{amount} per {interval, select, month {month} year {year}}"
        values={{
          amount: <Currency value={amount} currency={currency} precision={precision} abbreviate={abbreviate} />,
          interval: interval,
        }}
      />
    </Span>
  );
};

FormattedMoneyAmount.propTypes = {
  /** The amount to display, in cents */
  amount: PropTypes.number.isRequired,
  /** The currency (eg. `USD`, `EUR`...etc) */
  currency: PropTypes.string.isRequired,
  /** Abbreviate the name to display 100k instead of 100.000 */
  abbreviate: PropTypes.bool,
  /** Abbreviate the interval (eg. year => yr.) */
  abbreviateInterval: PropTypes.bool,
  /** How many numbers should we display after the comma */
  precision: PropTypes.number,
  /** An interval that goes with the amount */
  interval: PropTypes.oneOf(['month', 'year']),
};

FormattedMoneyAmount.defaultProps = {
  abbreviate: false,
  precision: 0,
  abbreviateInterval: true,
};

export default FormattedMoneyAmount;
