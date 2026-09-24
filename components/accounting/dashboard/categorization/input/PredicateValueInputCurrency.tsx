import React from 'react';

import { Currency } from '@/lib/constants/currency';

import CurrencyPicker from '@/components/CurrencyPicker';

import type { PredicateInputProps } from './types';

export function PredicateValueInputCurrency({ value, onChange, className, error }: PredicateInputProps) {
  return (
    <CurrencyPicker
      className={className}
      value={value as string}
      onChange={onChange}
      availableCurrencies={Currency}
      error={!!error}
    />
  );
}
