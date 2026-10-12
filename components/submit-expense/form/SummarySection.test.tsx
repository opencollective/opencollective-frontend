import '@testing-library/jest-dom';

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { withRequiredProviders } from '../../../test/providers';

import type { ExpenseForm } from '../useExpenseForm';
import { RecurrenceFrequencyOption } from '../useExpenseForm';

import { RecurrenceOptionBox } from './SummarySection';

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
