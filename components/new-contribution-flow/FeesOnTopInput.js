import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import INTERVALS from '../../lib/constants/intervals';
import { formatCurrency } from '../../lib/currency-utils';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Flex } from '../Grid';
import StyledInputAmount from '../StyledInputAmount';
import StyledSelect from '../StyledSelect';
import { P, Span } from '../Text';

import illustration from './fees-on-top-illustration.png';

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
    percentage,
    label: (
      <span>
        {formatCurrency(feeAmount, currency)} <Span color="black.500">({percentage * 100}%)</Span>
      </span>
    ),
  };
};

const getOptions = (amount, currency) => {
  return [
    ...DEFAULT_PERCENTAGES.map(percentage => {
      return getOptionFromPercentage(amount, currency, percentage);
    }),
    {
      label: <FormattedMessage id="platformFee.noContribution" defaultMessage="I don't want to contribute" />,
      value: 0,
    },
    {
      label: <FormattedMessage id="platformFee.Other" defaultMessage="Other" />,
      value: 'CUSTOM',
    },
  ];
};

const FeesOnTopInput = ({ currency, amount, fees, interval, onChange }) => {
  const options = React.useMemo(() => getOptions(amount, currency), [amount, currency]);
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
      const newOption = getOptionFromPercentage(amount, currency, selectedOption.percentage);
      if (newOption.value !== fees) {
        onChange(newOption.value);
        setSelectedOption(newOption);
      }
    }
  }, [selectedOption, amount, isReady]);

  return (
    <div>
      <P fontSize="14px" lineHeight="21px" color="black.900" mb={3}>
        <FormattedMessage
          id="platformFee.info"
          defaultMessage="Open Collective Platform is free for charitable initiatives. We rely on the generosity of contributors like you to keep this possible!"
        />
      </P>
      <Flex justifyContent="space-between" flexWrap={['wrap', 'nowrap']}>
        <Flex alignItems="center">
          <Illustration />
          <P fontWeight={500} fontSize="12px" lineHeight="18px" color="black.900" mx={10}>
            <FormattedMessage
              id="platformFee.support"
              defaultMessage="Thank you for supporting us with a contribution:"
            />
          </P>
        </Flex>
        <StyledSelect
          width="100%"
          maxWidth={['100%', 190]}
          mt={[2, 0]}
          isSearchable={false}
          fontSize="15px"
          options={options}
          onChange={setSelectedOption}
          value={selectedOption}
        />
      </Flex>
      {selectedOption.value === 'CUSTOM' && (
        <Flex justifyContent="flex-end" mt={2}>
          <StyledInputAmount id="feesOnTop" currency={currency} onChange={onChange} value={fees} />
        </Flex>
      )}
      <P fontSize="12px" lineHeight="18px" color="black.500" fontWeight="500" mt={2} textAlign={['left', 'right']}>
        <FormattedMessage
          defaultMessage="Total contribution: {amount}"
          id="TotalContribution"
          values={{
            amount: (
              <FormattedMoneyAmount
                amount={amount + fees}
                currency={currency}
                interval={interval}
                amountStyles={null}
              />
            ),
          }}
        />
      </P>
    </div>
  );
};

FeesOnTopInput.propTypes = {
  currency: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  amount: PropTypes.number,
  fees: PropTypes.number,
  interval: PropTypes.oneOf(Object.values(INTERVALS)),
};

export default FeesOnTopInput;
