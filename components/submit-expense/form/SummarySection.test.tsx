import '@testing-library/jest-dom';

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ExpenseType } from '../../../lib/graphql/types/v2/graphql';
import { withRequiredProviders } from '../../../test/providers';

import type { ExpenseForm } from '../useExpenseForm';
import { RecurrenceFrequencyOption } from '../useExpenseForm';

import { RecurrenceOptionBox, SummarySectionContent } from './SummarySection';

const mockExchangeRates = { current: [] };
jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useQuery: (query, options) =>
    query.definitions[0].name.value === 'PayoutMethodExchangeRateWarning' && !options?.skip
      ? { data: { currencyExchangeRate: mockExchangeRates.current }, loading: false }
      : { data: undefined, loading: false },
}));

// Replace Radix UI Select with a plain <select> for reliable jsdom interaction
jest.mock('../../ui/Select', () => {
  const Select = ({
    value,
    onValueChange,
    disabled,
    children,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <select
      data-testid="expense-frequency"
      value={value}
      onChange={e => onValueChange(e.target.value)}
      disabled={disabled}
    >
      {children}
    </select>
  );
  const SelectTrigger = () => null;
  const SelectValue = () => null;
  const SelectContent = ({ children }: { children: React.ReactNode }) => <React.Fragment>{children}</React.Fragment>;
  const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  );
  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
});

type RecurrenceValues = Pick<ExpenseForm['values'], 'recurrenceFrequency' | 'recurrenceEndAt'>;

type HarnessProps = {
  initialValues?: RecurrenceValues;
  errors?: Partial<Record<keyof RecurrenceValues, string>>;
  submitCount?: number;
  isSubmitting?: boolean;
  onValuesChange?: (values: RecurrenceValues) => void;
};

/**
 * Minimal stand-in for the expense form: holds the recurrence values in state, like Formik would,
 * so that the tests can assert on what would be submitted.
 */
function Harness(props: HarnessProps) {
  const [values, setValues] = React.useState<RecurrenceValues>(
    props.initialValues ?? { recurrenceFrequency: RecurrenceFrequencyOption.NONE },
  );
  const [touched, setTouched] = React.useState<Partial<Record<keyof RecurrenceValues, boolean>>>({});
  const { onValuesChange } = props;

  React.useEffect(() => {
    onValuesChange?.(values);
  }, [values, onValuesChange]);

  const form = {
    values,
    touched,
    errors: props.errors ?? {},
    submitCount: props.submitCount ?? 0,
    initialLoading: false,
    isSubmitting: props.isSubmitting ?? false,
    setFieldValue: async (field: string, value: unknown) => setValues(prev => ({ ...prev, [field]: value })),
    setFieldTouched: async (field: string, isTouched = true) => setTouched(prev => ({ ...prev, [field]: isTouched })),
  } as unknown as ExpenseForm;

  return <RecurrenceOptionBox form={form} />;
}

const renderBox = (props: HarnessProps = {}) => {
  const onValuesChange = jest.fn();
  render(withRequiredProviders(<Harness onValuesChange={onValuesChange} {...props} />));
  const getFormValues = (): RecurrenceValues => onValuesChange.mock.calls.at(-1)[0];
  return { getFormValues };
};

const ONE_TIME_MESSAGE = /This expense will be submitted as a one-time expense/;
const openEditor = () => userEvent.click(screen.getByRole('button', { name: 'Edit recurrence frequency' }));
const selectFrequency = (frequency: RecurrenceFrequencyOption) =>
  userEvent.selectOptions(screen.getByTestId('expense-frequency'), frequency);
const getEndDateInput = () => screen.getByLabelText('End Date');

describe('RecurrenceOptionBox', () => {
  it('describes a one-time expense by default and hides the fields behind a link', () => {
    renderBox();

    expect(screen.getByText(ONE_TIME_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit recurrence frequency' })).toBeInTheDocument();
    expect(screen.queryByTestId('expense-frequency')).not.toBeInTheDocument();
  });

  it('describes a one-time expense when the frequency is not set', () => {
    renderBox({ initialValues: {} });

    expect(screen.getByText(ONE_TIME_MESSAGE)).toBeInTheDocument();
  });

  it('reveals the frequency without any save or cancel button', async () => {
    renderBox();
    await openEditor();

    expect(screen.getByTestId('expense-frequency')).toHaveValue(RecurrenceFrequencyOption.NONE);
    expect(screen.queryByLabelText('End Date')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit recurrence frequency' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('applies the selected frequency to the form right away', async () => {
    // Regression test for https://github.com/opencollective/opencollective/issues/8971: the frequency
    // used to be kept in a local draft that was lost unless "Save changes" was clicked before submitting.
    const { getFormValues } = renderBox();
    await openEditor();
    await selectFrequency(RecurrenceFrequencyOption.MONTH);

    expect(getFormValues().recurrenceFrequency).toBe(RecurrenceFrequencyOption.MONTH);
    expect(screen.getByText(/submit a copy of this expense every month\./)).toBeInTheDocument();
    expect(screen.queryByText(ONE_TIME_MESSAGE)).not.toBeInTheDocument();
    expect(screen.queryByText(/The prompts will stop on/)).not.toBeInTheDocument();
    expect(getEndDateInput()).toHaveValue('');
  });

  it('applies the end date to the form right away', async () => {
    const { getFormValues } = renderBox();
    await openEditor();
    await selectFrequency(RecurrenceFrequencyOption.QUARTER);
    fireEvent.change(getEndDateInput(), { target: { value: '2125-09-29' } });

    expect(getFormValues()).toEqual({
      recurrenceFrequency: RecurrenceFrequencyOption.QUARTER,
      recurrenceEndAt: '2125-09-29',
    });
    expect(screen.getByText(/submit a copy of this expense every quarter\./)).toBeInTheDocument();
    expect(screen.getByText(/The prompts will stop on Sep 29, 2125\./)).toBeInTheDocument();
  });

  it('goes back to a one-time expense when the frequency is set to none', async () => {
    const { getFormValues } = renderBox({
      initialValues: { recurrenceFrequency: RecurrenceFrequencyOption.YEAR, recurrenceEndAt: '2125-09-29' },
    });
    expect(screen.getByText(/submit a copy of this expense every year\./)).toBeInTheDocument();

    await openEditor();
    expect(getEndDateInput()).toHaveValue('2125-09-29');
    await selectFrequency(RecurrenceFrequencyOption.NONE);

    expect(getFormValues().recurrenceFrequency).toBe(RecurrenceFrequencyOption.NONE);
    expect(screen.getByText(ONE_TIME_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByLabelText('End Date')).not.toBeInTheDocument();
  });

  describe('end date error', () => {
    const errors = { recurrenceEndAt: 'End date must be in the future' };
    const initialValues = { recurrenceFrequency: RecurrenceFrequencyOption.MONTH, recurrenceEndAt: '2020-01-01' };

    it('is not displayed before the field is edited or the form submitted', async () => {
      renderBox({ initialValues, errors });
      await openEditor();

      expect(screen.queryByText(errors.recurrenceEndAt)).not.toBeInTheDocument();
      expect(getEndDateInput()).toHaveAttribute('aria-invalid', 'false');
    });

    it('is displayed once the end date is edited', async () => {
      renderBox({ initialValues, errors });
      await openEditor();
      fireEvent.change(getEndDateInput(), { target: { value: '2020-01-02' } });

      expect(screen.getByText(errors.recurrenceEndAt)).toBeInTheDocument();
      expect(getEndDateInput()).toHaveAttribute('aria-invalid', 'true');
      expect(getEndDateInput()).toHaveAccessibleDescription(errors.recurrenceEndAt);
    });

    it('reveals the fields when the form is submitted with an invalid end date', () => {
      renderBox({ initialValues, errors, submitCount: 1 });

      expect(screen.getByText(errors.recurrenceEndAt)).toBeInTheDocument();
      expect(getEndDateInput()).toHaveValue('2020-01-01');
      expect(screen.queryByRole('button', { name: 'Edit recurrence frequency' })).not.toBeInTheDocument();
    });
  });

  it('disables the controls while the form is submitting', () => {
    renderBox({ isSubmitting: true });

    expect(screen.getByRole('button', { name: 'Edit recurrence frequency' })).toBeDisabled();
  });
});

const makeSummaryForm = (values: Record<string, unknown> = {}, options: Record<string, unknown> = {}) =>
  ({
    values: {
      expenseTypeOption: ExpenseType.INVOICE,
      expenseItems: [],
      tags: [],
      title: 'Test',
      ...values,
    },
    options: {
      expenseCurrency: 'EUR',
      totalInvoicedInExpenseCurrency: 0,
      payoutMethod: { data: { currency: 'EUR' }, type: 'BANK_ACCOUNT' },
      ...options,
    },
    touched: {},
    errors: {},
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
  }) as unknown as ExpenseForm;

describe('SummarySectionContent', () => {
  describe('item dates', () => {
    // `npm test` forces TZ=UTC and changing process.env.TZ at runtime does not reach Intl in jest, so default
    // Intl.DateTimeFormat to a timezone west of UTC, where a YYYY-MM-DD date (parsed as UTC midnight) falls on
    // the previous local day.
    const OriginalDateTimeFormat = Intl.DateTimeFormat;
    beforeAll(() => {
      const DateTimeFormatWestOfUTC = function (locales, options) {
        return new OriginalDateTimeFormat(locales, {
          ...options,
          timeZone: options?.timeZone ?? 'America/Los_Angeles',
        });
      };
      Object.assign(DateTimeFormatWestOfUTC, OriginalDateTimeFormat);
      DateTimeFormatWestOfUTC.supportedLocalesOf = OriginalDateTimeFormat.supportedLocalesOf;
      Intl.DateTimeFormat = DateTimeFormatWestOfUTC as unknown as typeof Intl.DateTimeFormat;
    });
    afterAll(() => {
      Intl.DateTimeFormat = OriginalDateTimeFormat;
    });

    it('shows the item date as entered, whatever the local timezone', () => {
      const form = makeSummaryForm(
        {
          expenseItems: [
            { description: 'Item', amount: { valueInCents: 10000, currency: 'EUR' }, incurredAt: '2026-11-27' },
          ],
        },
        { totalInvoicedInExpenseCurrency: 10000 },
      );

      render(withRequiredProviders(<SummarySectionContent form={form} />));

      const item = screen.getByRole('listitem');
      expect(item).toHaveTextContent('Nov 27, 2026');
      expect(item).not.toHaveTextContent('Nov 26, 2026');
    });
  });

  describe('payout method currency estimate', () => {
    afterEach(() => {
      mockExchangeRates.current = [];
    });

    it('includes the tax in the estimate', () => {
      mockExchangeRates.current = [
        {
          value: 0.9,
          source: 'OPENCOLLECTIVE',
          fromCurrency: 'EUR',
          toCurrency: 'USD',
          date: new Date().toISOString(),
        },
      ];
      const form = makeSummaryForm(
        {
          hasTax: true,
          tax: { rate: 0.2 },
          expenseItems: [
            { description: 'Item', amount: { valueInCents: 10000, currency: 'EUR' }, incurredAt: '2026-11-01' },
          ],
        },
        {
          totalInvoicedInExpenseCurrency: 10000, // Subtotal before tax
          taxType: 'VAT',
          payoutMethod: { data: { currency: 'USD' }, type: 'BANK_ACCOUNT' },
        },
      );

      render(withRequiredProviders(<SummarySectionContent form={form} />));

      const warning = screen.getByText(/Amount in your payout method currency/);
      // 100 EUR + 20% VAT = 120 EUR, at 0.9 = 108 USD
      expect(warning.closest('[class*="mt-4"]').textContent).toContain('$108.00');
    });
  });
});
