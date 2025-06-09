import React from 'react';
import PropTypes from 'prop-types';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { round } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { AmountPropTypeShape } from '../lib/prop-types';
import { cn } from '../lib/utils';

import DateTime from './DateTime';
import FormattedMoneyAmount from './FormattedMoneyAmount';
import { Flex } from './Grid';
import StyledTooltip from './StyledTooltip';

const I18N_FX_RATE_SOURCE_LABEL = defineMessages({
  USER: {
    id: 'Tags.USER',
    defaultMessage: 'User',
  },
});

const FX_RATE_SOURCE_LABEL = {
  PAYPAL: 'PayPal',
  OPENCOLLECTIVE: 'Open Collective',
  WISE: 'Wise',
};

export const formatFxRateInfo = (intl, exchangeRate, { approximateCustomMessage, warning, error } = {}) => {
  const { value, date, source, isApproximate, fromCurrency, toCurrency } = exchangeRate;
  return (
    <Flex flexDirection="column" data-cy="exchange-rate-info">
      <FormattedMessage
        defaultMessage="Exchange rate: 1 {fromCurrency} = {rate} {toCurrency}"
        id="PyjGft"
        values={{
          rate: round(value, 7) || <FormattedMessage id="exchangeRate.noneSet" defaultMessage="Not defined yet" />,
          fromCurrency,
          toCurrency,
        }}
      />
      {source && (
        <div>
          <FormattedMessage
            defaultMessage="Source: {source}"
            id="/gUYR+"
            values={{
              source: I18N_FX_RATE_SOURCE_LABEL[source]
                ? intl.formatMessage(I18N_FX_RATE_SOURCE_LABEL[source])
                : FX_RATE_SOURCE_LABEL[source] || source,
            }}
          />
        </div>
      )}
      {/* When source is USER, the date is normally defined by something else (e.g. item incurredAt) */}
      {date && source !== 'USER' && (
        <div>
          <FormattedMessage
            defaultMessage="Acquired on: {date}"
            id="dT6mUk"
            values={{ date: <DateTime value={date} timeStyle="short" /> }}
          />
        </div>
      )}
      {warning && <div className="mt-2 max-w-[300px] whitespace-normal text-yellow-500">{warning}</div>}
      {error && <div className="mt-2 max-w-[300px] whitespace-normal text-red-400">{error}</div>}
      {isApproximate && (
        <div className="mt-2 flex max-w-[300px] gap-1 whitespace-normal">
          <span role="img" aria-label="Warning">
            ⚠️
          </span>
          &nbsp;
          {approximateCustomMessage || <FormattedMessage defaultMessage="This value is an estimate" id="lpal5V" />}
        </div>
      )}
    </Flex>
  );
};

const AmountWithExchangeRateInfo = ({
  amount: { exchangeRate, currency, value, valueInCents },
  amountClassName,
  showCurrencyCode,
  invertIconPosition,
  warning,
  error,
  amountWrapperClassName,
  currencyCodeClassName,
}) => {
  const intl = useIntl();
  return (
    <StyledTooltip
      display="block"
      containerVerticalAlign="middle"
      noTooltip={!exchangeRate}
      content={() => formatFxRateInfo(intl, exchangeRate, { warning, error })}
    >
      <Flex flexWrap="noWrap" alignItems="center" flexDirection={invertIconPosition ? 'row-reverse' : 'row'} gap="4px">
        <div className={cn('flex flex-row gap-1 whitespace-nowrap', amountWrapperClassName)}>
          <FormattedMoneyAmount
            amount={valueInCents ?? Math.round(value * 100)}
            currency={currency}
            precision={2}
            amountClassName={amountClassName || null}
            showCurrencyCode={showCurrencyCode}
            isApproximate={exchangeRate?.isApproximate}
            currencyCodeClassName={currencyCodeClassName}
          />
        </div>
        {exchangeRate && (
          <InfoCircle size="1em" className={cn({ 'text-yellow-600': warning, 'text-red-600': error })} />
        )}
      </Flex>
    </StyledTooltip>
  );
};

AmountWithExchangeRateInfo.propTypes = {
  amount: AmountPropTypeShape,
  showCurrencyCode: PropTypes.bool,
  invertIconPosition: PropTypes.bool,
  amountClassName: PropTypes.object,
  amountWrapperClassName: PropTypes.string,
  currencyCodeClassName: PropTypes.string,
  warning: PropTypes.node,
  error: PropTypes.node,
};

export default AmountWithExchangeRateInfo;
