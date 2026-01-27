import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { useIntl } from 'react-intl';

import { i18nGraphqlException } from '../lib/errors';

import { useToast } from './ui/useToast';
import StyledInputAmount from './StyledInputAmount';

const currencyExchangeRateQuery = gql`
  query HostExpenseModalCurrencyExchangeRate($requests: [CurrencyExchangeRateRequest!]!) {
    currencyExchangeRate(requests: $requests) {
      value
      source
      fromCurrency
      toCurrency
      date
      isApproximate
    }
  }
`;

export const StyledInputAmountWithDynamicFxRate = ({
  fromCurrency,
  toCurrency,
  date,
  value,
  onChange,
  ...props
}: Omit<React.ComponentProps<typeof StyledInputAmount>, 'currency' | 'loadingExchangeRate' | 'hasCurrencyPicker'>) => {
  const intl = useIntl();
  const { toast } = useToast();
  const { loading, data, error } = useQuery(currencyExchangeRateQuery, {
    skip: !fromCurrency || !toCurrency || fromCurrency === toCurrency,
    variables: {
      requests: [{ fromCurrency, toCurrency, date }],
    },
  });

  // Handle successful data fetch
  React.useEffect(() => {
    if (data?.currencyExchangeRate) {
      props.onExchangeRateChange?.(data.currencyExchangeRate[0]);
    }
  }, [data]);

  // Handle error
  React.useEffect(() => {
    if (error) {
      // If the API fails (e.g. network error), we'll ask the user to provide an exchange rate manually
      toast({ variant: 'error', message: i18nGraphqlException(intl, error) });
    }
  }, [error, intl, toast]);

  // Reset FX rate when currencies are the same
  React.useEffect(() => {
    if (fromCurrency === toCurrency) {
      props.onExchangeRateChange?.(null);
    }
  }, [fromCurrency, toCurrency, date]);

  return (
    <StyledInputAmount
      value={value}
      onChange={onChange}
      hasCurrencyPicker
      loadingExchangeRate={loading}
      currency={fromCurrency}
      {...props}
    />
  );
};
