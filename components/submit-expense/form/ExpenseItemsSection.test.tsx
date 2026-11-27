import '@testing-library/jest-dom';

import React from 'react';
import { TaxType } from '@opencollective/taxes';
import { fireEvent, render, screen } from '@testing-library/react';
import { Formik, FormikContext, useFormikContext } from 'formik';

import { withRequiredProviders } from '../../../test/providers';

import { ExpenseItemsForm } from './ExpenseItemsSection';

jest.mock('../../Dropzone', () => ({ MemoizedDropzone: () => null }));
jest.mock('../../RichTextEditor', () => () => null);

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('ExpenseItemsForm', () => {
  describe('GST', () => {
    it('sets the GST rate as a fraction when ticking "Apply GST"', () => {
      const setFieldValue = jest.fn();
      render(
        withRequiredProviders(
          <Formik initialValues={{ hasTax: false, tax: null, expenseItems: [] }} onSubmit={jest.fn()}>
            <ExpenseItemsForm
              {...({
                setFieldValue,
                initialLoading: false,
                isSubmitting: false,
                expenseCurrency: 'NZD',
                totalInvoicedInExpenseCurrency: 10000,
                taxType: TaxType.GST,
                lockedFields: [],
                availableReferenceCurrencies: [],
                tax: null,
                hasTax: false,
                expenseItems: [],
                referenceCurrency: 'NZD',
                expenseItemCount: 0,
              } as any)}
            />
          </Formik>,
        ),
      );
      fireEvent.click(screen.getByRole('checkbox'));
      const taxCall = setFieldValue.mock.calls.find(([name]) => name === 'tax');
      // The form schema only accepts 0 and 0.15 for GST
      expect(taxCall[1].rate).toBe(0.15);
    });

    it('shows the current GST rate as the selected option', () => {
      render(
        withRequiredProviders(
          <Formik initialValues={{ hasTax: true, tax: { rate: 0.15 }, expenseItems: [] }} onSubmit={jest.fn()}>
            <ExpenseItemsForm
              {...({
                setFieldValue: jest.fn(),
                initialLoading: false,
                isSubmitting: false,
                expenseCurrency: 'NZD',
                totalInvoicedInExpenseCurrency: 10000,
                taxType: TaxType.GST,
                lockedFields: [],
                availableReferenceCurrencies: [],
                tax: { rate: 0.15 },
                hasTax: true,
                expenseItems: [],
                referenceCurrency: 'NZD',
                expenseItemCount: 0,
              } as any)}
            />
          </Formik>,
        ),
      );
      fireEvent.keyDown(screen.getByLabelText('GST rate'), { key: 'ArrowDown' });
      const selected = screen.getAllByRole('option').filter(option => option.getAttribute('aria-selected') === 'true');
      expect(selected).toHaveLength(1);
      expect(selected[0]).toHaveTextContent('15%');
    });
  });

  describe('Add item', () => {
    const FormWithItemDates = () => {
      const bag = useFormikContext<any>();
      const form = {
        ...bag,
        initialLoading: false,
        isSubmitting: false,
        setItemCurrency: jest.fn(),
        options: {
          hasExpenseItemDate: true,
          expenseCurrency: 'USD',
          availableReferenceCurrencies: ['USD'],
          account: { currency: 'USD' },
          isAdminOfPayee: true,
        },
      };
      return (
        <FormikContext.Provider value={form as any}>
          <ExpenseItemsForm {...ExpenseItemsForm.getFormProps(form as any)} />
        </FormikContext.Provider>
      );
    };

    beforeAll(() => {
      jest.useFakeTimers({ now: new Date('2026-11-28T04:00:00.000Z'), doNotFake: ['nextTick', 'setImmediate'] });
    });
    afterAll(() => jest.useRealTimers());

    it('dates the new item with the local date, shown in the Date field', () => {
      const now = new Date();
      const localDate = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
        .map(n => String(n).padStart(2, '0'))
        .join('-');
      let values;
      render(
        withRequiredProviders(
          <Formik
            initialValues={{
              expenseItems: [{ key: 'initial', description: '', amount: { valueInCents: 0, currency: 'USD' } }],
            }}
            onSubmit={jest.fn()}
          >
            {formik => {
              values = formik.values;
              return <FormWithItemDates />;
            }}
          </Formik>,
        ),
      );
      fireEvent.click(screen.getByText('Add item'));
      expect(values.expenseItems[1].incurredAt).toBe(localDate);
      const input = document.getElementById('input-expenseItems.1.incurredAt') as HTMLInputElement;
      expect(input.value).toBe(localDate);
    });
  });
});
