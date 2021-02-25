import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import INTERVALS from '../../lib/constants/intervals';
import { formatCurrency } from '../../lib/currency-utils';

import { Flex } from '../Grid';
import StyledInputAmount from '../StyledInputAmount';
import StyledSelect from '../StyledSelect';
import { P, Span } from '../Text';

import illustration from './fees-on-top-illustration.png';

const msg = defineMessages({
  noThankYou: {
    id: 'NoThankYou',
    defaultMessage: 'No thank you',
  },
  other: {
    id: 'platformFee.Other',
    defaultMessage: 'Other',
  },
});

const Illustration = styled.img.attrs({ src: illustration })`
  width: 40px;
  height: 40px;
`;

const DEFAULT_PERCENTAGES = [0.1, 0.15, 0.2];

const getOptionFromPercentage = (amount, currency, percentage) => {
  const feeAmount = isNaN(amount) ? 0 : Math.round(amount * percentage);
  return {
    // Value must be unique, so we set a special key if feeAmount is 0
    value: feeAmount || `${percentage}%`,
    feeAmount,
    percentage,
    currency,
    label: `${feeAmount / 100} ${currency} (${percentage * 100}%)`,
  };
};

const getOptions = (amount, currency, intl) => {
  return [
    ...DEFAULT_PERCENTAGES.map(percentage => {
      return getOptionFromPercentage(amount, currency, percentage);
    }),
    {
      label: intl.formatMessage(msg.noThankYou),
      value: 0,
    },
    {
      label: intl.formatMessage(msg.other),
      value: 'CUSTOM',
    },
  ];
};

const FeesOnTopInput = ({ currency, amount, quantity, fees, onChange }) => {
  const intl = useIntl();
  const orderAmount = amount * quantity;
  const options = React.useMemo(() => getOptions(orderAmount, currency, intl), [orderAmount, currency]);
  const formatOptionLabel = option => {
    if (option.currency) {
      return (
        <span>
          {formatCurrency(option.feeAmount, option.currency)}{' '}
          <Span color="black.500">({option.percentage * 100}%)</Span>
        </span>
      );
    } else {
      return option.label;
    }
  };
  const [selectedOption, setSelectedOption] = React.useState(options[1]);
  const [isReady, setReady] = React.useState(false);

  // Load initial value on mount
  React.useEffect(() => {
    if (!isNil(fees)) {
      const option = options.find(({ value }) => value === fees) || options.find(({ value }) => value === 'CUSTOM');
      setSelectedOption(option);
    }
    setReady(true);
  }, []);

  // Dispatch new fees on top when amount changes
  React.useEffect(() => {
    if (!isReady) {
      return;
    } else if (selectedOption.value === 0 && fees) {
      onChange(0);
    } else if (selectedOption.percentage) {
      const newOption = getOptionFromPercentage(orderAmount, currency, selectedOption.percentage);
      if (newOption.value !== fees) {
        onChange(newOption.value);
        setSelectedOption(newOption);
      }
    }
  }, [selectedOption, orderAmount, isReady]);

  return (
    <div>
      <P fontWeight="400" fontSize="14px" lineHeight="21px" color="black.900" my={32}>
        <FormattedMessage
          id="platformFee.info"
          defaultMessage="The Open Collective Platform is free for charitable initiatives. We rely on the generosity of contributors like you to make this possible!"
        />
      </P>
      <Flex justifyContent="space-between" flexWrap={['wrap', 'nowrap']}>
        <Flex alignItems="center">
          <Illustration />
          <P fontWeight={500} fontSize="12px" lineHeight="18px" color="black.900" mx={10}>
            <FormattedMessage id="platformFee.thankYou" defaultMessage="Thank you for your contribution:" />
          </P>
        </Flex>
        <StyledSelect
          aria-label="Donation percentage"
          width="100%"
          maxWidth={['100%', 190]}
          mt={[2, 0]}
          isSearchable={false}
          fontSize="15px"
          options={options}
          onChange={setSelectedOption}
          formatOptionLabel={formatOptionLabel}
          value={selectedOption}
        />
      </Flex>
      {selectedOption.value === 'CUSTOM' && (
        <Flex justifyContent="flex-end" mt={2}>
          <StyledInputAmount id="feesOnTop" currency={currency} onChange={onChange} value={fees} />
        </Flex>
      )}
    </div>
  );
};

FeesOnTopInput.propTypes = {
  currency: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  amount: PropTypes.number,
  quantity: PropTypes.number,
  fees: PropTypes.number,
  interval: PropTypes.oneOf(Object.values(INTERVALS)),
};

export default FeesOnTopInput;
