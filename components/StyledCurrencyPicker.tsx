import React from 'react';
import { getEmojiByCurrencyCode } from 'country-currency-emoji-flags';
import { truncate } from 'lodash';
import { useIntl } from 'react-intl';

import { Currency } from '../lib/constants/currency';
import { getIntlDisplayNames } from '../lib/i18n';

import { Flex } from './Grid';
import StyledSelect from './StyledSelect';
import { Span } from './Text';

const generateCurrencyOptions = (intl, availableCurrencies) => {
  const currencyDisplayNames = getIntlDisplayNames(intl.locale, 'currency');
  return availableCurrencies.map(currency => {
    const currencyName = currencyDisplayNames.of(currency);
    const emoji = getEmojiByCurrencyCode(currency);
    return {
      value: currency,
      label: (
        <Flex fontSize="14px" lineHeight="20px" fontWeight="500" title={currencyName}>
          {emoji && <Span>{emoji}</Span>}
          &nbsp;
          <Span whiteSpace="nowrap" ml={1}>
            <Span color="black.800">{currency}</Span>
            {` `}
            <Span color="black.500" fontSize="12px" fontWeight="normal">
              ({truncate(currencyName, { length: 30 })})
            </Span>
          </Span>
        </Flex>
      ),
    };
  });
};

const getSelectedCurrencyLabel = value => {
  const emoji = getEmojiByCurrencyCode(value);
  return (
    <div>
      {emoji && <Span>{emoji}</Span>}
      &nbsp;
      <Span color="black.800">{value}</Span>
    </div>
  );
};

export const StyledCurrencyPicker = ({
  availableCurrencies = Currency,
  value,
  onChange,
  ...props
}: {
  /** A list of currencies presented in the currency picker */
  availableCurrencies: string[];
  onChange: (selectedCurrency: string) => void;
  value?: string;
} & React.ComponentProps<typeof StyledSelect>) => {
  const intl = useIntl();
  const currencyOptions = generateCurrencyOptions(intl, availableCurrencies);
  return (
    <StyledSelect
      inputId="currency-picker"
      data-cy="currency-picker"
      placeholder="----"
      error={!value}
      isSearchable={availableCurrencies?.length > 10}
      options={currencyOptions}
      value={!value ? null : { value, label: getSelectedCurrencyLabel(value) }}
      onChange={({ value }) => onChange(value)}
      onInputChange={inputValue => (inputValue.length <= 3 ? inputValue : inputValue.substr(0, 3))} // Limit search length to 3 characters
      {...props}
    />
  );
};
