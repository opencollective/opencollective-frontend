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
    expect(input).toHaveValue('');
    expect(input).toHaveDisplayValue('');

    await userEvent.type(input, '12[Tab]');

    expect(onBlur).toHaveBeenCalled();
    expect(onChange).toHaveBeenNthCalledWith(1, 100, expect.anything());
    expect(onChange).toHaveBeenNthCalledWith(2, 1200, expect.anything());
    resetMocks();

    expect(input).toHaveValue('12.00');
    expect(input).toHaveDisplayValue('12.00');

    await userEvent.type(input, '[Backspace][Backspace]99');
    expect(onChange).toHaveBeenNthCalledWith(1, 1200, expect.anything());
    expect(onChange).toHaveBeenNthCalledWith(2, 1200, expect.anything());
    expect(onChange).toHaveBeenNthCalledWith(3, 1290, expect.anything());
    expect(onChange).toHaveBeenNthCalledWith(4, 1299, expect.anything());

    expect(input).toHaveValue('12.99');
    expect(input).toHaveDisplayValue('12.99');
    resetMocks();

    await userEvent.clear(input);

    expect(onChange).toHaveBeenNthCalledWith(1, null, expect.anything());
    expect(onBlur).toHaveBeenCalledTimes(0);
    resetMocks();

    expect(input).toHaveValue('');
    expect(input).toHaveDisplayValue('');

    renderResult.rerender(<InputAmountView {...mocks} id="test" value={5851} currency="USD" hasCurrencyPicker />);
    await userEvent.type(input, '[Tab]');
    expect(input).toHaveValue('58.51');
    expect(input).toHaveDisplayValue('58.51');

    const picker = screen.getByTestId('test-currency-picker');
    expect(picker).toHaveTextContent('USD');
    await userEvent.click(picker);
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
    expect(convertedAmountInput).toHaveValue('64.36');
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

    expect(convertedAmountInput).toHaveValue('');
    expect(convertedAmountInput).toHaveDisplayValue('');

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

    await userEvent.type(convertedAmountInput, '[Tab]');

    expect(convertedAmountInput).toHaveValue('117.02');
    expect(convertedAmountInput).toHaveDisplayValue('117.02');
  });

  describe('types', () => {
    [
      {
        description: 'Types a decimal with dot',
        currency: 'USD',
        initialValue: '100',
        type: '[Backspace]1.25',
        inputValue: '1.25',
        displayValue: '1.25',
        lastOnChange: 125,
      },
      {
        description: 'Types a decimal with comma',
        currency: 'USD',
        initialValue: '100',
        type: '[Backspace]1,25',
        inputValue: '1,25',
        displayValue: '1,25',
        lastOnChange: 125,
      },
      {
        description: 'Types a decimal with multiple commas',
        currency: 'USD',
        initialValue: '100',
        type: '[Backspace]1,25,6',
        inputValue: '1,25,6',
        displayValue: '1,25,6',
        lastOnChange: NaN,
      },
      {
        description: 'Types a decimal with multiple dots',
        currency: 'USD',
        initialValue: '100',
        type: '[Backspace]1.25.6',
        inputValue: '1.25.6',
        displayValue: '1.25.6',
        lastOnChange: NaN,
      },
      {
        description: 'Mixing dots and commas',
        currency: 'USD',
        initialValue: '100',
        type: '[Backspace]1.25,6',
        inputValue: '1.25,6',
        displayValue: '1.25,6',
        lastOnChange: NaN,
      },
      {
        description: 'Non numeric input',
        currency: 'USD',
        initialValue: '100',
        type: '[Backspace]1.25ef10',
        inputValue: '1.25ef10',
        displayValue: '1.25ef10',
        lastOnChange: NaN,
      },
      {
        description: 'Scientific notation',
        currency: 'USD',
        initialValue: '100',
        type: '[Backspace]1.25e+10',
        inputValue: '1.25e+10',
        displayValue: '1.25e+10',
        lastOnChange: null,
      },
      {
        description: 'Types a decimal with comma without trailing zero',
        currency: 'USD',
        initialValue: '100',
        type: '[Backspace]1,',
        inputValue: '1,',
        displayValue: '1,',
        lastOnChange: 100,
      },
      {
        description: 'Types a decimal with dot without trailing zero',
        currency: 'USD',
        initialValue: '100',
        type: '[Backspace]1.',
        inputValue: '1.',
        displayValue: '1.',
        lastOnChange: 100,
      },
      {
        description: 'Types a decimal with dot without integer part',
        currency: 'USD',
        initialValue: 1,
        type: '[Backspace].5',
        inputValue: '.5',
        displayValue: '.5',
        lastOnChange: 50,
      },
      {
        description: 'Types a decimal with comma without integer part',
        currency: 'USD',
        initialValue: '100',
        type: '[Backspace].5',
        inputValue: '.5',
        displayValue: '.5',
        lastOnChange: 50,
      },
    ].forEach(t => {
      const {
        skip,
        only = false,
        description,
        initialValue = null,
        displayValue,
        inputValue,
        locale = 'en',
        currency = 'USD',
        lastOnChange,
        type,
        ...props
      } = t as typeof t & { skip?: boolean; only?: boolean; locale?: string };

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
            value={undefined}
            defaultValue={initialValue}
            currency={currency}
            {...props}
          />,
        );
        const input = screen.getByTestId('test-input-amount');
        await userEvent.clear(input);
        await userEvent.type(input, type);

        expect(input).toHaveValue(inputValue);
        expect(input).toHaveDisplayValue(displayValue);

        expect(onChange).toHaveBeenLastCalledWith(lastOnChange, expect.anything());
      });
    });
  });

  describe('renders correctly for values', () => {
    [
      {
        skip: true, // blur logic fails in this test suite, needs fix
        blur: true,
        description: 'renders 0 value after blur',
        value: 0,
        displayValue: '0.00',
        inputValue: '0',
      },
      {
        skip: true, // blur logic fails in this test suite, needs fix
        blur: true,
        description: 'renders integer 100 value after blur',
        value: 10000,
        displayValue: '100.00',
        inputValue: `100`,
      },
      {
        description: 'renders 0.15 value',
        value: 15,
        displayValue: '0.15',
        inputValue: `0.15`,
      },
      {
        description: 'renders 1 JPY value',
        value: 100,
        currency: 'JPY',
        displayValue: '1',
        inputValue: `1`,
        inputStep: '1',
      },
      {
        description: 'renders currency picker value',
        value: 15,
        displayValue: '0.15',
        inputValue: `0.15`,
        hasCurrencyPicker: true,
      },
      {
        description: 'renders default exchange rate value',
        value: 15,
        displayValue: '0.15',
        inputValue: `0.15`,
        exchangeRateInputValue: `0.17`,
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
