import '@testing-library/jest-dom';

import React from 'react';
import { queryHelpers, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from 'styled-components';

import theme from '../lib/theme';

import InputAmount from './InputAmount';

const InputAmountView = (props: Partial<React.ComponentProps<typeof InputAmount>> & { locale?: string } = {}) => {
  return (
    <IntlProvider locale={props.locale ?? 'en'}>
      <ThemeProvider theme={theme}>
        <InputAmount currency="USD" onChange={() => {}} value={props.value} {...props} />
      </ThemeProvider>
    </IntlProvider>
  );
};

describe('InputAmount', () => {
  it('renders and calls on change', async () => {
    const onChange = jest.fn();
    const onBlur = jest.fn();
    const onCurrencyChange = jest.fn();
    const onExchangeRateChange = jest.fn();
    const resetMocks = () => {
      onChange.mockClear();
      onBlur.mockClear();
      onCurrencyChange.mockClear();
      onExchangeRateChange.mockClear();
    };
    const mocks = { onChange, onBlur, onCurrencyChange, onExchangeRateChange };
    const renderResult = render(<InputAmountView {...mocks} id="test" value={null} currency="USD" />);

    const input = screen.getByTestId('test-input-amount');
    expect(input).toHaveValue(null);
    expect(input).toHaveDisplayValue('');

    await userEvent.type(input, '12[Tab]');

    expect(onBlur).toHaveBeenCalled();
    expect(onChange).toHaveBeenNthCalledWith(1, 100, expect.anything());
    expect(onChange).toHaveBeenNthCalledWith(2, 1200, expect.anything());
    resetMocks();

    expect(input).toHaveValue(12);
    expect(input).toHaveDisplayValue('12');

    await userEvent.type(input, '.99');
    expect(onChange).toHaveBeenNthCalledWith(1, 1290, expect.anything());
    expect(onChange).toHaveBeenNthCalledWith(2, 1299, expect.anything());

    expect(input).toHaveValue(12.99);
    expect(input).toHaveDisplayValue('12.99');
    resetMocks();

    await userEvent.clear(input);

    expect(onChange).toHaveBeenNthCalledWith(1, null, expect.anything());
    expect(onBlur).toHaveBeenCalledTimes(0);
    resetMocks();

    expect(input).toHaveValue(null);
    expect(input).toHaveDisplayValue('');

    renderResult.rerender(<InputAmountView {...mocks} id="test" value={5851} currency="USD" hasCurrencyPicker />);
    expect(input).toHaveValue(58.51);
    expect(input).toHaveDisplayValue('58.51');

    const picker = screen.getByTestId('test-currency-picker');
    expect(picker).toHaveTextContent('USD');
    await userEvent.click(picker);
    expect(onChange).toHaveBeenCalledWith(5851, expect.anything()); // due to on blur
    resetMocks();

    const option = queryHelpers.queryByAttribute('data-value', renderResult.baseElement, 'EUR');
    await userEvent.click(option);

    expect(onCurrencyChange).toHaveBeenNthCalledWith(1, 'EUR');
    expect(onChange).toHaveBeenCalledTimes(0);
    expect(onBlur).toHaveBeenCalledTimes(0);
    resetMocks();

    renderResult.rerender(
      <InputAmountView
        {...mocks}
        id="test"
        value={5851}
        currency="USD"
        hasCurrencyPicker
        exchangeRate={{
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          value: 1.1,
        }}
      />,
    );

    const convertedAmountInput = screen.getByTestId('test-converted-input');
    expect(convertedAmountInput).toHaveValue(64.36);
    expect(convertedAmountInput).toHaveDisplayValue('64.36');

    await userEvent.clear(convertedAmountInput);
    expect(onExchangeRateChange).toHaveBeenLastCalledWith({
      value: null,
      fromCurrency: 'USD',
      toCurrency: 'EUR',
    });

    renderResult.rerender(
      <InputAmountView
        {...mocks}
        id="test"
        value={5851}
        currency="USD"
        hasCurrencyPicker
        exchangeRate={{
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          value: null,
        }}
      />,
    );

    expect(convertedAmountInput).toHaveValue(0);
    expect(convertedAmountInput).toHaveDisplayValue('0');

    resetMocks();

    renderResult.rerender(
      <InputAmountView
        {...mocks}
        id="test"
        value={5851}
        currency="USD"
        hasCurrencyPicker
        exchangeRate={{
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          value: 2,
        }}
      />,
    );

    expect(convertedAmountInput).toHaveValue(117.02);
    expect(convertedAmountInput).toHaveDisplayValue('117.02');
  });

  describe('renders correctly for values', () => {
    [
      {
        skip: true, // blur logic fails in this test suite, needs fix
        blur: true,
        description: 'renders 0 value after blur',
        value: 0,
        displayValue: '0.00',
        inputValue: 0,
      },
      {
        skip: true, // blur logic fails in this test suite, needs fix
        blur: true,
        description: 'renders integer 100 value after blur',
        value: 10000,
        displayValue: '100.00',
        inputValue: 100,
      },
      {
        description: 'renders 0.15 value',
        value: 15,
        displayValue: '0.15',
        inputValue: 0.15,
      },
      {
        description: 'renders 1 JPY value',
        value: 100,
        currency: 'JPY',
        displayValue: '1',
        inputValue: 1,
        inputStep: '1',
      },
      {
        description: 'renders currency picker value',
        value: 15,
        displayValue: '0.15',
        inputValue: 0.15,
        hasCurrencyPicker: true,
      },
      {
        description: 'renders default exchange rate value',
        value: 15,
        displayValue: '0.15',
        inputValue: 0.15,
        exchangeRateInputValue: 0.17,
        exchangeRateDisplayValue: '0.17',
        currency: 'USD',
        exchangeRate: {
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          value: 1.1,
        },
        hasCurrencyPicker: true,
      },
    ].forEach(t => {
      const {
        skip,
        only = false,
        description,
        value,
        displayValue,
        inputValue,
        locale = 'en',
        exchangeRateInputValue,
        exchangeRateDisplayValue,
        blur,
        inputStep = '0.01',
        currency = 'USD',
        ...props
      } = t as typeof t & { only?: boolean; locale?: string };

      // eslint-disable-next-line no-restricted-properties
      (skip ? it.skip : only ? it.only : it)(description, async () => {
        const onChange = jest.fn();
        const onBlur = jest.fn();
        render(
          <InputAmountView
            locale={locale}
            onChange={onChange}
            onBlur={onBlur}
            id="test"
            value={value}
            currency={currency}
            {...props}
          />,
        );
        const input = screen.getByTestId('test-input-amount');
        if (blur) {
          await userEvent.type(input, '[Tab]');
          expect(onBlur).toHaveBeenCalled();
        }
        expect(input).toHaveValue(inputValue);
        expect(input).toHaveDisplayValue(displayValue);

        if (inputStep) {
          expect(input).toHaveAttribute('step', inputStep);
        }

        if (t.hasCurrencyPicker) {
          const picker = screen.getByTestId('test-currency-picker');
          expect(picker).toHaveTextContent(currency);
        }

        if (t.exchangeRate) {
          const exchangeRateInput = screen.getByTestId('test-converted-input');
          expect(exchangeRateInput).toHaveValue(exchangeRateInputValue);
          expect(exchangeRateInput).toHaveDisplayValue(exchangeRateDisplayValue);
        }
      });
    });
  });
});
