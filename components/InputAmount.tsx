import React from 'react';
import { getEmojiByCurrencyCode } from 'country-currency-emoji-flags';
import { clamp, isNil, isUndefined, round } from 'lodash';

import { Currency, ZERO_DECIMAL_CURRENCIES } from '@/lib/constants/currency';
import { floatAmountToCents, getCurrencySymbol, getDefaultCurrencyPrecision } from '@/lib/currency-utils';
import { cn } from '@/lib/utils';

import StyledSpinner from '@/components/StyledSpinner';
import { InputGroup } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';

import CurrencyPicker from './CurrencyPicker';
import { CurrencyExchangeRate } from '@/lib/graphql/types/v2/schema';

const formatCurrencyName = (currency, currencyDisplay) => {
  if (currencyDisplay === 'SYMBOL') {
    return getCurrencySymbol(currency);
  } else if (currencyDisplay === 'CODE') {
    return currency;
  } else {
    return `${getCurrencySymbol(currency)} ${currency}`;
  }
};

const parseValueFromEvent = (e, precision, ignoreComma = false) => {
  if (e.target.value === '') {
    return null;
  } else {
    const parsedNumber = parseFloat(ignoreComma ? e.target.value.replace(',', '') : e.target.value);
    return isNaN(parsedNumber) ? NaN : parsedNumber.toFixed(precision);
  }
};

/** Formats value is valid, fallbacks on rawValue otherwise */
const getValue = (value, rawValue, isEmpty) => {
  if (isEmpty) {
    return '';
  }

  return isNaN(value) || value === null ? rawValue : value / 100;
};

// const getError = (curVal, minAmount, required) => {
//   return Boolean((required && isNil(curVal)) || (minAmount && curVal < minAmount));
// };

/** Prevent changing the value when scrolling on the input */
const ignoreOnWheel = e => {
  e.preventDefault();
  e.target.blur();
};

/** Returns the minimum width for an amount input, auto-adjusting to the number of digits */
const useAmountInputMinWidth = (value, max = 1000000000) => {
  const prevValue = React.useRef(value);

  // Do not change size if value becomes invalid (to prevent jumping)
  if (typeof value?.toFixed !== 'function') {
    return prevValue.current || '0.7em';
  }

  const maxLength = max.toString().length;
  const valueLength = clamp(value.toFixed(2).length, 1, maxLength);
  const result = `${valueLength * 0.7}em`;
  prevValue.current = result;
  return result;
};

interface ConvertedAmountInputProps {
  exchangeRate?: CurrencyExchangeRate;
  onChange?(...args: unknown[]): unknown;
  baseAmount?: number;
  minFxRate?: number;
  maxFxRate?: number;
  inputId: string;
}

const ConvertedAmountInput = ({
  inputId,
  exchangeRate,
  onChange,
  baseAmount,
  minFxRate,
  maxFxRate,
}: ConvertedAmountInputProps) => {
  const precision = getDefaultCurrencyPrecision(exchangeRate.toCurrency);
  const targetAmount = round((baseAmount || 0) * exchangeRate.value, precision);
  const [isEditing, setEditing] = React.useState(false);
  const [rawValue, setRawValue] = React.useState(targetAmount / 100 || '');
  const minWidth = useAmountInputMinWidth(targetAmount / 100);
  const value = getValue(targetAmount, rawValue, false);
  const isBaseAmountInvalid = isNaN(baseAmount) || isNil(baseAmount);

  const getLimitAmountFromFxRate = fxRate => {
    return round(((baseAmount || 0) * fxRate) / 100.0, precision);
  };

  return (
    <div className="flex flex-auto px-2 text-sm whitespace-nowrap text-muted-foreground">
      <span className="mr-1 align-middle">= {exchangeRate.toCurrency} </span>
      <input
        className="w-full flex-auto [appearance:textfield] rounded px-[2px] focus:text-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        style={{ minWidth }}
        name={inputId}
        id={inputId}
        type="number"
        inputMode="decimal"
        step={1 / 10 ** precision} // Precision=2 -> 0.01, Precision=0 -> 1
        min={minFxRate ? getLimitAmountFromFxRate(minFxRate) : 1 / 10 ** precision}
        max={maxFxRate ? getLimitAmountFromFxRate(maxFxRate) : undefined}
        value={isBaseAmountInvalid ? '' : isEditing ? value : value.toFixed(precision)}
        onWheel={ignoreOnWheel}
        required
        placeholder={!precision ? '--' : `--.${'-'.repeat(precision)}`}
        disabled={isBaseAmountInvalid}
        onChange={e => {
          setEditing(true);
          setRawValue(e.target.value);
          const convertedAmount = parseFloat(e.target.value);
          if (!convertedAmount) {
            onChange({ ...exchangeRate, value: null });
          } else {
            const newFxRate = round((convertedAmount * 100) / (baseAmount || 1), 8);
            onChange({
              ...exchangeRate,
              value: newFxRate,
              source: 'USER',
              isApproximate: false,
              date: null,
            });
          }
        }}
        onBlur={() => {
          setEditing(false);
        }}
      />
      <span className="ml-1">{getEmojiByCurrencyCode(exchangeRate.toCurrency)}</span>
    </div>
  );
};

/**
 * An input for amount inputs.
 */
const InputAmount = ({
  currency,
  currencyDisplay = 'SYMBOL',
  name = 'amount',
  min = 0,
  max = 100000000000,
  precision = ZERO_DECIMAL_CURRENCIES.includes(currency) ? 0 : 2,
  defaultValue = undefined,
  value,
  onBlur = undefined,
  onChange,
  isEmpty = false,
  hasCurrencyPicker = false,
  onCurrencyChange = undefined,
  availableCurrencies = Currency,
  exchangeRate = undefined,
  loadingExchangeRate = false,
  onExchangeRateChange = undefined,
  minFxRate = undefined,
  maxFxRate = undefined,
  className = null,
  ...props
}) => {
  const [rawValue, setRawValue] = React.useState(value || defaultValue || '');
  const isControlled = !isUndefined(value);
  const curValue = isControlled ? getValue(value, rawValue, isEmpty) : undefined;
  const minAmount = precision !== 0 ? min / 10 ** precision : min / 100;
  const disabled = props.disabled || loadingExchangeRate;
  const canUseExchangeRate = Boolean(!loadingExchangeRate && exchangeRate && exchangeRate.fromCurrency === currency);
  const minWidth = useAmountInputMinWidth(curValue, max);

  const dispatchValue = (e, parsedValue) => {
    if (isControlled) {
      setRawValue(e.target.value);
    }
    if (onChange) {
      const valueWithIgnoredComma = parseValueFromEvent(e, precision, true);
      if (parsedValue === null || isNaN(parsedValue)) {
        onChange(parsedValue, e);
      } else if (!e.target.checkValidity() || parsedValue !== valueWithIgnoredComma) {
        onChange(isNaN(e.target.value) ? NaN : null, e);
      } else {
        onChange(floatAmountToCents(parsedValue), e);
      }
    }
  };

  return (
    <InputGroup
      {...props}
      className={cn('w-full overflow-hidden', className)}
      disabled={disabled}
      prepend={
        !hasCurrencyPicker ? (
          <div className="flex items-center p-2 text-sm whitespace-nowrap">
            {formatCurrencyName(currency, currencyDisplay)}
          </div>
        ) : (
          <CurrencyPicker
            data-cy={`${props.id}-currency-picker`}
            id={`${props.id}-currency-picker`}
            onChange={onCurrencyChange}
            value={currency}
            availableCurrencies={availableCurrencies}
            disabled={disabled}
            className="w-24 rounded-none border-0 bg-muted px-2 focus-visible:bg-primary/20 focus-visible:ring-0"
          />
        )
      }
      prependClassName="px-0 py-0"
      append={
        loadingExchangeRate ? (
          <div className="px-3 py-2">
            <StyledSpinner size={16} color="black.700" className="" />
          </div>
        ) : canUseExchangeRate ? (
          <div className="flex h-[38px] flex-auto basis-1/2 items-center" data-cy={`${props.id}-converted`}>
            <Separator orientation="vertical" className="h-6" />
            <ConvertedAmountInput
              inputId={`${props.id}-converted-input`}
              exchangeRate={exchangeRate}
              onChange={onExchangeRateChange}
              baseAmount={value}
              minFxRate={minFxRate}
              maxFxRate={maxFxRate}
            />
          </div>
        ) : undefined
      }
      appendClassName="px-0 py-0 bg-background"
      width="100%"
      type="number"
      inputMode="decimal"
      step={1 / 10 ** precision}
      style={{ minWidth }}
      name={name}
      min={minAmount}
      max={max / 100}
      defaultValue={isUndefined(defaultValue) ? undefined : defaultValue / 100}
      value={curValue}
      onWheel={ignoreOnWheel}
      onChange={e => {
        e.stopPropagation();
        dispatchValue(e, parseValueFromEvent(e, precision));
      }}
      onBlur={e => {
        // Clean number if valid (ie. 41.1 -> 41.10)
        const parsedNumber = parseValueFromEvent(e, precision);
        const valueWithIgnoredComma = parseValueFromEvent(e, precision, true);
        if (
          e.target.checkValidity() &&
          !(typeof parsedNumber === 'number' && isNaN(parsedNumber)) &&
          parsedNumber !== null &&
          valueWithIgnoredComma === parsedNumber
        ) {
          e.target.value = parsedNumber.toString();
          dispatchValue(e, parsedNumber);
        }

        if (onBlur) {
          onBlur(e);
        }
      }}
    />
  );
};

export default InputAmount;
