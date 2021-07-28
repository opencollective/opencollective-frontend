import React, {useState} from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';

import { TierTypes } from '../../lib/constants/tiers-types';

import { Box } from '../Grid';

import { Label } from '../Text';

import StyledSelect from '../StyledSelect';
import StyledInputGroup from "../StyledInputGroup";

const messages = defineMessages({
  cryptoCurrency: {
    id: `CryptoStepDetails.cryptoCurrency`,
    defaultMessage: 'Select your currency',
  },
  donationAmount: {
    id: `CryptoStepDetails.donationAmount`,
    defaultMessage: 'Enter donation amount',
  },
});

const options = [
  {
    label: 'BTC',
    value: 'BTC',
  },
  {
    label: 'ETH',
    value: 'ETH',
  },
  {
    label: 'BCH',
    value: 'BCH',
  },
  {
    label: 'LTC',
    value: 'LTC',
  },
  {
    label: 'ZEC',
    value: 'ZEC',
  },
  {
    label: 'LINK',
    value: 'LINK',
  },
  {
    label: 'BAT',
    value: 'BAT',
  },
  {
    label: 'DAI',
    value: 'DAI',
  },
  {
    label: 'OXT',
    value: 'OXT',
  },
  {
    label: 'STORJ',
    value: 'STORJ',
  },
  {
    label: 'AMP',
    value: 'AMP',
  },
  {
    label: 'ZRX',
    value: 'ZRX',
  },
];

const CryptoStepDetails = ({ data, collective, tier }) => {
  const intl = useIntl();
  const [currency, setCurrency] = useState(options[0].label);
  const [amount, setAmount] = useState(0);
  return (
    <Box width={1}>
      <Label htmlFor="crypto-currency" mb={2}>
        {intl.formatMessage(messages['cryptoCurrency'])}
      </Label>
      <StyledSelect
        inputId="crypto-currency"
        options={options}
        defaultValue={options[0]}
        onChange={({value}) => setCurrency(value)}
        isSearchable={false}
        maxWidth={"100%"}
        mb={3}
      />
      <Label htmlFor="donation-amount" mb={2}>
        {intl.formatMessage(messages['donationAmount'])}
      </Label>
      <StyledInputGroup
        prepend={currency}
        type="number"
        inputMode="decimal"
        onChange={({value}) => setAmount(value)}
        error={amount < 0}
      />
    </Box>
  );
};

CryptoStepDetails.propTypes = {
  onChange: PropTypes.func,
  showFeesOnTop: PropTypes.bool,
  LoggedInUser: PropTypes.object,
  data: PropTypes.shape({
    amount: PropTypes.number,
    platformContribution: PropTypes.number,
    quantity: PropTypes.number,
    interval: PropTypes.string,
    customData: PropTypes.object,
  }),
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    type: PropTypes.string,
    host: PropTypes.object,
  }).isRequired,
  tier: PropTypes.shape({
    amountType: PropTypes.string,
    interval: PropTypes.string,
    name: PropTypes.string,
    maxQuantity: PropTypes.number,
    availableQuantity: PropTypes.number,
    type: PropTypes.oneOf(Object.values(TierTypes)),
    customFields: PropTypes.array,
    amount: PropTypes.shape({
      currency: PropTypes.string,
      valueInCents: PropTypes.number,
    }),
    minAmount: PropTypes.shape({
      valueInCents: PropTypes.number,
    }),
  }),
  router: PropTypes.object,
};

export default withRouter(CryptoStepDetails);
