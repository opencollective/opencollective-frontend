import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import Image from '../Image';
import StyledInputGroup from '../StyledInputGroup';
import StyledLink from '../StyledLink';
import StyledSelect from '../StyledSelect';
import { Label, Span } from '../Text';

import { CRYPTO_CURRENCIES } from './constants';

const messages = defineMessages({
  cryptoCurrency: {
    id: `StepDetailsCrypto.cryptoCurrency`,
    defaultMessage: 'Select your currency',
  },
  donationAmount: {
    id: `StepDetailsCrypto.donationAmount`,
    defaultMessage: 'Enter donation amount',
  },
  invalidAmount: {
    id: `StepDetailsCrypto.invalidAmount`,
    defaultMessage: 'Please select a valid currency amount',
  },
});

/*
 * Calculates the approximate value for 1 unit of a given crypto currency in the collective currency.
 * Uses the Cryptonator API (https://www.cryptonator.com/api/)
 */
const getCryptoExchangeRate = async (cryptoCurrency, collectiveCurrency) => {
  if (!cryptoCurrency || !collectiveCurrency) {
    return null;
  }
  try {
    const response = await fetch(`https://api.cryptonator.com/api/ticker/${cryptoCurrency}-${collectiveCurrency}`);
    const body = await response.json();
    if (!body.success || body.error !== '') {
      throw new Error(`Cryptonator Error: ${body.error}`);
    }
    return body.ticker.price;
  } catch (error) {
    // we don't want the user to see any errors; simply don't show the conversion amount
    // eslint-disable-next-line no-console
    console.error(error);
    return null;
  }
};

const StepDetailsCrypto = ({ onChange, data, collective }) => {
  const intl = useIntl();
  const [selectedCryptoCurrency, setSelectedCryptoCurrency] = useState(data.currency);
  const [amount, setAmount] = useState(data.amount);
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [cryptoExchangeRate, setCryptoExchangeRate] = useState(null);
  const [touched, setTouched] = useState(false);
  const collectiveCurrency = collective.currency;
  const dispatchChange = (field, value) => {
    onChange({ stepDetails: { ...data, [field]: value }, stepSummary: null });
  };

  const storeCryptoExchangeRate = async (cryptoCurrency, collectiveCurrency) => {
    const exchangeRate = await getCryptoExchangeRate(cryptoCurrency, collectiveCurrency);
    setCryptoExchangeRate(exchangeRate);
  };

  useEffect(() => {
    storeCryptoExchangeRate(selectedCryptoCurrency.value, collectiveCurrency);
  }, []);

  useEffect(() => {
    if (cryptoExchangeRate) {
      setConvertedAmount(amount * cryptoExchangeRate);
    }
  }, [amount, cryptoExchangeRate]);

  return (
    <Box width={1}>
      <Label htmlFor="crypto-currency" mb={2}>
        {intl.formatMessage(messages['cryptoCurrency'])}
      </Label>
      <StyledSelect
        inputId="crypto-currency"
        options={CRYPTO_CURRENCIES}
        defaultValue={selectedCryptoCurrency}
        onChange={cryptoCurrency => {
          setSelectedCryptoCurrency(cryptoCurrency);
          storeCryptoExchangeRate(cryptoCurrency.value, collectiveCurrency);
          dispatchChange('currency', cryptoCurrency);
        }}
        isSearchable={false}
        maxWidth={'100%'}
        mb={3}
      />
      <Label htmlFor="donation-amount" mb={2}>
        {intl.formatMessage(messages['donationAmount'])}
      </Label>
      <StyledInputGroup
        prepend={selectedCryptoCurrency.labelWithoutImage}
        type="number"
        inputMode="decimal"
        defaultValue={amount}
        onChange={({ target }) => {
          const amount = parseFloat(target.value);
          setAmount(amount);
          if (amount > 0) {
            dispatchChange('amount', amount);
          }
        }}
        onBlur={() => setTouched(true)}
        autoFocus
        error={touched && amount <= 0 && intl.formatMessage(messages['invalidAmount'])}
      />
      {convertedAmount !== null && convertedAmount > 0 && (
        <Box mt={2}>
          ~
          <FormattedMoneyAmount
            amount={convertedAmount * 100}
            currency={collectiveCurrency}
            amountStyles={{ fontWeight: '400' }}
          />
        </Box>
      )}
      <StyledLink href="https://www.thegivingblock.com/" openInNewTabNoFollow>
        <Flex pt="36px" flexDirection="column" alignItems="center" fontSize="14px" fontWeight={500}>
          <Box>
            <Span pr={1}>In partnership with</Span>
            <Span pt="8px" style={{ verticalAlign: 'middle' }}>
              <Image alt="Giving Block Logo" width={24} height={24} src="/static/images/giving-block-logo.svg" />
            </Span>
            <Span pl={1}>The Giving Block</Span>
          </Box>
        </Flex>
      </StyledLink>
    </Box>
  );
};

StepDetailsCrypto.propTypes = {
  onChange: PropTypes.func,
  /*
   * Crypto amount and Crypto currency type.
   */
  data: PropTypes.shape({
    amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    currency: PropTypes.object,
    convertedAmount: PropTypes.shape({
      amount: PropTypes.number,
      currency: PropTypes.string,
    }),
  }),
  collective: PropTypes.shape({
    currency: PropTypes.object,
  }),
};

export default StepDetailsCrypto;
