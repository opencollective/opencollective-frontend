import React from 'react';
import PropTypes from 'prop-types';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { round } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { AmountPropTypeShape } from '../lib/prop-types';

import DateTime from './DateTime';
import FormattedMoneyAmount from './FormattedMoneyAmount';
import { Box, Flex } from './Grid';
import StyledTooltip from './StyledTooltip';

const FX_RATE_SOURCE_LABEL = {
  PAYPAL: 'PayPal',
  OPENCOLLECTIVE: 'Open Collective',
  WISE: 'Wise',
};

export const formatFxRateInfo = (intl, { value, date, source, isApproximate }) => {
  return (
    <Flex flexDirection="column">
      <FormattedMessage defaultMessage="Exchange rate: {value}%" values={{ value: round(value, 7) }} />
      {source && (
        <div>
          <FormattedMessage
            defaultMessage="Source: {source}"
            values={{ source: FX_RATE_SOURCE_LABEL[source] || source }}
          />
        </div>
      )}
      {date && (
        <div>
          <FormattedMessage
            defaultMessage="Acquired on: {date}"
            values={{ date: <DateTime value={date} timeStyle="short" /> }}
          />
        </div>
      )}
      {isApproximate && (
        <Box>
          <br />
          <span role="img" aria-label="Warning">
            ⚠️
          </span>
          &nbsp;
          <FormattedMessage defaultMessage="This amount is subject to fluctuations" />
        </Box>
      )}
    </Flex>
  );
};

const ContentContainer = styled.div`
  white-space: nowrap;
  margin-right: 4px;
`;

const AmountWithExchangeRateInfo = ({ amount: { exchangeRate, currency, value, valueInCents }, showCurrencyCode }) => {
  const intl = useIntl();
  return (
    <StyledTooltip
      display="block"
      containerVerticalAlign="middle"
      noTooltip={!exchangeRate}
      content={() => formatFxRateInfo(intl, exchangeRate)}
    >
      <Flex flexWrap="noWrap" alignItems="center">
        <ContentContainer>
          {exchangeRate?.isApproximate && `~ `}
          <FormattedMoneyAmount
            amount={valueInCents ?? Math.round(value * 100)}
            currency={currency}
            precision={2}
            amountStyles={null}
            showCurrencyCode={showCurrencyCode}
          />
        </ContentContainer>
        <InfoCircle size="1em" />
      </Flex>
    </StyledTooltip>
  );
};

AmountWithExchangeRateInfo.propTypes = {
  amount: AmountPropTypeShape,
  showCurrencyCode: PropTypes.bool,
};

export default AmountWithExchangeRateInfo;
