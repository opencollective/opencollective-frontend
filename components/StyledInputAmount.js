import React from 'react';
import PropTypes from 'prop-types';
import { getEmojiByCurrencyCode } from 'country-currency-emoji-flags';
import { isNil, isUndefined } from 'lodash';
import { useIntl } from 'react-intl';

import { Currency } from '../lib/constants/currency';
import { floatAmountToCents, getCurrencySymbol } from '../lib/currency-utils';
import { getIntlDisplayNames } from '../lib/i18n';

import Container from './Container';
import { Box, Flex } from './Grid';
import StyledInputGroup from './StyledInputGroup';
import StyledSelect from './StyledSelect';
import { Span } from './Text';

const formatCurrencyName = (currency, currencyDisplay) => {
  if (currencyDisplay === 'SYMBOL') {
    return getCurrencySymbol(currency);
  } else if (currencyDisplay === 'CODE') {
    return currency;
  } else {
    return `${getCurrencySymbol(currency)} ${currency}`;
  }
};

const parseValueFromEvent = (e, precision, ignoreComma) => {
  if (e.target.value === '') {
    return null;
  } else {
    const parsedNumber = parseFloat(ignoreComma ? e.target.value.replace(',', '') : e.target.value);
    return isNaN(parsedNumber) ? NaN : parsedNumber.toFixed(precision);
  }
};

/** Formats value is valid, fallsback on rawValue otherwise */
const getValue = (value, rawValue, isEmpty) => {
  if (isEmpty) {
    return '';
  }

  return isNaN(value) || value === null ? rawValue : value / 100;
};

const getError = (curVal, minAmount, required) => {
  return Boolean((required && isNil(curVal)) || (minAmount && curVal < minAmount));
};

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
            <Span color="black.500">({currencyName})</Span>
          </Span>
        </Flex>
      ),
    };
  });
};

const getSelectedCurrency = value => {
  const emoji = getEmojiByCurrencyCode(value);
  return (
    <Box>
      {emoji && <Span>{emoji}</Span>}
      &nbsp;
      <Span color="black.800">{value}</Span>
    </Box>
  );
};

const CurrencyPicker = ({ availableCurrencies, value, onChange }) => {
  const intl = useIntl();
  const currencyOptions = generateCurrencyOptions(intl, availableCurrencies);
  const selectedCurrency = getSelectedCurrency(value);
  return (
    <StyledSelect
      inputId="currency-picker"
      data-cy="currency-picker"
      placeholder="----"
      error={!value}
      isSearchable={availableCurrencies?.length > 10}
      options={currencyOptions}
      value={!value ? null : { value, label: <Box minWidth={200}>{selectedCurrency}</Box> }}
      width={102}
      onChange={({ value }) => onChange(value)}
      onInputChange={inputValue => (inputValue.length <= 3 ? inputValue : inputValue.substr(0, 3))} // Limit search length to 3 characters
      styles={{
        control: {
          border: !value ? '' : 'none',
          background: '#F7F8FA',
        },
        menu: {
          width: '260px',
        },
      }}
    />
  );
};

CurrencyPicker.propTypes = {
  /** A list of currencies presented in the currency picker */
  availableCurrencies: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
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
  precision = 2,
  defaultValue = undefined,
  value,
  onBlur = undefined,
  onChange,
  isEmpty = false,
  hasCurrencyPicker = false,
  onCurrencyChange = undefined,
  availableCurrencies = Currency,
  ...props
}) => {
  const [rawValue, setRawValue] = React.useState(value || defaultValue || '');
  const isControlled = !isUndefined(value);
  const hasMin = !isUndefined(min);
  const curValue = isControlled ? getValue(value, rawValue, isEmpty) : undefined;
  const minAmount = hasMin ? min / 100 : min;
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
    <StyledInputGroup
      maxWidth="10em"
      step="0.01"
      {...props}
      name={name}
      min={minAmount}
      max={isUndefined(max) ? max : max / 100}
      type="number"
      inputMode="decimal"
      error={props.error || getError(curValue, minAmount, props.required)}
      defaultValue={isUndefined(defaultValue) ? undefined : defaultValue / 100}
      value={curValue}
      prependProps={!hasCurrencyPicker ? { color: props.disabled ? 'black.400' : 'black.800' } : { p: 0 }}
      prepend={
        !hasCurrencyPicker ? (
          formatCurrencyName(currency, currencyDisplay)
        ) : (
          <Container bgColor="black.50">
            <CurrencyPicker onChange={onCurrencyChange} value={currency} availableCurrencies={availableCurrencies} />
          </Container>
        )
      }
      onWheel={e => {
        // Prevent changing the value when scrolling on the input
        e.preventDefault();
        e.target.blur();
      }}
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
          !isNaN(parsedNumber) &&
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

StyledInputAmount.propTypes = {
  /** The currency (eg. `USD`, `EUR`...) */
  currency: PropTypes.string,
  /** Gets passed the new currency. Only when hasCurrencyPicker is true */
  onCurrencyChange: PropTypes.func,
  /** Gets passed the amount in cents as first param, and the event as second param. */
  onChange: PropTypes.func,
  /** OnChange function */
  onBlur: PropTypes.func,
  /** Minimum amount (in CENTS) */
  min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Maximum amount (in CENTS) */
  max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Value */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Currency style. If hasCurrencyPicker is true, `CODE` will be enforced. */
  currencyDisplay: PropTypes.oneOf(['SYMBOL', 'CODE', 'FULL']),
  /** Number of decimals */
  precision: PropTypes.number,
  /** A special prop to force the empty state */
  isEmpty: PropTypes.bool,
  /** To enable the currency picker */
  hasCurrencyPicker: PropTypes.bool,
  /** A list of currencies presented in the currency picker */
  availableCurrencies: PropTypes.arrayOf(PropTypes.string),
  /** Accept all PropTypes from `StyledInputGroup` */
  ...StyledInputGroup.propTypes,
};

export default StyledInputAmount;
