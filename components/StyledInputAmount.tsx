import React from 'react';
import PropTypes from 'prop-types';
import { getEmojiByCurrencyCode } from 'country-currency-emoji-flags';
import { clamp, isNil, isUndefined, round } from 'lodash';

import { Currency, ZERO_DECIMAL_CURRENCIES } from '../lib/constants/currency';
import { floatAmountToCents, getCurrencySymbol, getDefaultCurrencyPrecision } from '../lib/currency-utils';
import { cn } from '../lib/utils';

import { Separator } from './ui/Separator';
import { StyledCurrencyPicker } from './StyledCurrencyPicker';
import StyledInput from './StyledInput';

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

const getError = (curVal, minAmount, required) => {
  return Boolean((required && isNil(curVal)) || (minAmount && curVal < minAmount));
};

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

const ConvertedAmountInput = ({ inputId, exchangeRate, onChange, baseAmount, minFxRate, maxFxRate }) => {
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
    <div className="flex flex-auto whitespace-nowrap px-2 text-sm text-neutral-500">
      <span className="mr-1 align-middle">= {exchangeRate.toCurrency} </span>
      <input
        className="w-full flex-auto rounded px-[2px] [appearance:textfield] focus:text-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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

ConvertedAmountInput.propTypes = {
  exchangeRate: PropTypes.object,
  onChange: PropTypes.func,
  baseAmount: PropTypes.number,
  minFxRate: PropTypes.number,
  maxFxRate: PropTypes.number,
};

/** Some custom styles to integrate the currency picker nicely */
const CURRENCY_PICKER_STYLES = {
  control: {
    border: 'none',
    background: '#F7F8FA',
    minHeight: '37px', // 39px - 2px border
  },
  menu: {
    width: '280px',
  },
  valueContainer: {
    padding: '0 0 0 8px',
  },
  input: {
    margin: '0',
  },
  dropdownIndicator: {
    paddingLeft: '0',
    paddingRight: '6px',
  },
};

/**
 * An input for amount inputs. Accepts all props from [StyledInputGroup](/#!/StyledInputGroup).
 */
const StyledInputAmount = ({
  currency,
  currencyDisplay = 'SYMBOL',
  name = 'amount',
  min = 0,
  max = 1000000000,
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
  showErrorIfEmpty = true,
  className = null,
  ...props
}) => {
  const [rawValue, setRawValue] = React.useState(value || defaultValue || '');
  const isControlled = !isUndefined(value);
  const curValue = isControlled ? getValue(value, rawValue, isEmpty) : undefined;
  const minAmount = min / 10 ** precision;
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
    <div
      className={cn(
        'flex flex-wrap items-center overflow-hidden rounded border border-neutral-200 focus-within:border-blue-500 focus-within:bg-blue-100 hover:border-blue-300 ',
        className,
        {
          'border-red-500': props.error,
        },
      )}
    >
      <div className="flex flex-auto basis-1/2">
        {!hasCurrencyPicker ? (
          <div className="flex items-center whitespace-nowrap bg-neutral-50 p-2 text-sm text-neutral-800">
            {formatCurrencyName(currency, currencyDisplay)}
          </div>
        ) : (
          <div className="bg-neutral-50 text-neutral-800">
            <StyledCurrencyPicker
              data-cy={`${props.id}-currency-picker`}
              inputId={`${props.id}-currency-picker`}
              onChange={onCurrencyChange}
              value={currency}
              availableCurrencies={availableCurrencies}
              disabled={disabled}
              minWidth="95px"
              styles={CURRENCY_PICKER_STYLES}
            />
          </div>
        )}
        <StyledInput
          {...props}
          width="100%"
          type="number"
          flex="auto"
          inputMode="decimal"
          step={1 / 10 ** precision}
          alignSelf="stretch"
          style={{ minWidth }}
          name={name}
          min={minAmount}
          max={max / 100}
          error={props.error || (showErrorIfEmpty && getError(curValue, minAmount, props.required))}
          defaultValue={isUndefined(defaultValue) ? undefined : defaultValue / 100}
          value={curValue}
          hideSpinners={canUseExchangeRate}
          borderRadius={null}
          px={null}
          pr={canUseExchangeRate ? 1 : 2}
          pl={2}
          bare
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
      </div>
      {canUseExchangeRate && (
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
      )}
    </div>
  );
};

export default StyledInputAmount;
