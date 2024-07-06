import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { useIntl } from 'react-intl';

import { i18nGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';

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
  const { loading } = useQuery(currencyExchangeRateQuery, {
    skip: !fromCurrency || !toCurrency || fromCurrency === toCurrency,
    context: API_V2_CONTEXT,
    variables: {
      requests: [{ fromCurrency, toCurrency, date }],
    },
    onCompleted: data => {
      props.onExchangeRateChange?.(data?.currencyExchangeRate[0]);
    },
    onError: e => {
      // If the API fails (e.g. network error), we'll ask the user to provide an exchange rate manually
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    },
  });

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
