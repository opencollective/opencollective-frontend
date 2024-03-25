import React from 'react';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { FormikProvider } from 'formik';
import { get } from 'lodash';
import { PlusIcon } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  Currency,
  CurrencyExchangeRateInput,
  CurrencyExchangeRateSourceType,
} from '../../lib/graphql/types/v2/graphql';
import { isValidUrl } from '../../lib/utils';
import { attachmentDropzoneParams } from '../expenses/lib/attachments';
import { FX_RATE_ERROR_THRESHOLD, getExpenseExchangeRateWarningOrError } from '../expenses/lib/utils';

import { ExchangeRate } from '../ExchangeRate';
import StyledDropzone from '../StyledDropzone';
import StyledInput from '../StyledInput';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputFormikField from '../StyledInputFormikField';
import { Button } from '../ui/Button';

import { ExpenseForm } from './useExpenseForm';

export type ExpenseItem = {
  description: string;
  date: string;
  amount: { valueInCents: number; currency: string };
  url?: string;
};

type ExpenseItemsFormProps = {
  className?: string;
  form: ExpenseForm;
};

export function ExpenseItemsForm(props: ExpenseItemsFormProps) {
  return (
    <div className={clsx(props.className)}>
      <div className="my-4 flex items-center justify-between gap-2">
        <div className="text-slate-80 w-fit text-base font-bold leading-6">
          <FormattedMessage id="ExpenseForm.StepExpenseInvoice" defaultMessage="Set invoice details" />
        </div>
        <hr className="flex-grow border-neutral-300" />
        <Button
          className="flex w-fit  gap-1 rounded-full px-3 py-1"
          variant="outline"
          size="icon-xs"
          onClick={() => {
            props.form.setFieldValue('expenseItems', [
              ...(props.form.values.expenseItems ?? []),
              {
                description: '',
                incurredAt: new Date(),
                amount: {
                  valueInCents: 0,
                  currency: props.form.values.expenseCurrency,
                },
              },
            ]);
          }}
        >
          <PlusIcon size={12} />
          <span className="text-xs font-medium">
            <FormattedMessage id="ExpenseForm.AddLineItem" defaultMessage="Add new item" />
          </span>
        </Button>
      </div>
      <div className="flex flex-col gap-4">
        <FormikProvider value={props.form}>
          {(props.form.values.expenseItems ?? []).map((ei, i) => (
            // index is the only stable key for expense items here
            // eslint-disable-next-line react/no-array-index-key
            <div key={`expenseItems[${i}]`}>
              <ExpenseItemForm fieldName={`expenseItems.${i}`} form={props.form} />
              <Button
                disabled={(props.form.values.expenseItems ?? []).length === 1}
                className="text-red-500"
                variant="ghost"
                size="sm"
                onClick={() =>
                  props.form.setFieldValue('expenseItems', [
                    ...props.form.values.expenseItems.slice(0, i),
                    ...props.form.values.expenseItems.slice(i + 1),
                  ])
                }
              >
                <FormattedMessage id="expense.RemoveItem" defaultMessage="Remove item" />
              </Button>
            </div>
          ))}
        </FormikProvider>
      </div>
    </div>
  );
}

type ExpenseItemFormProps = {
  form: ExpenseForm;
  fieldName: `expenseItems.${number}`;
};

function ExpenseItemForm(props: ExpenseItemFormProps) {
  const intl = useIntl();

  const expenseItem = get(props.form.values, props.fieldName);

  const { setFieldValue, setFieldTouched } = props.form;
  const onCurrencyChange = React.useCallback(
    currency => {
      setFieldValue(`${props.fieldName}.amount.currency`, currency);
      setFieldTouched(`${props.fieldName}.amount.currency`, true);
    },
    [props.fieldName, setFieldValue, setFieldTouched],
  );

  const onAmountBlur = React.useCallback(() => {
    setFieldTouched(`${props.fieldName}.amount.currency`, true);
    setFieldTouched(`${props.fieldName}.amount.valueInCents`, true);
    setFieldTouched(`${props.fieldName}.url`, true);
  }, [props.fieldName, setFieldTouched]);

  const onAmountExchangeRateChange = React.useCallback(
    exchangeRate => {
      setFieldValue(`${props.fieldName}.amount.exchangeRate`, exchangeRate);
    },
    [setFieldValue, props.fieldName],
  );

  const onAmountChange = React.useCallback(
    e => setFieldValue(`${props.fieldName}.amount.valueInCents`, e),
    [setFieldValue, props.fieldName],
  );

  return (
    <FormikProvider value={props.form}>
      <div className="flex gap-4">
        {props.form.options.allowExpenseItemAttachment && (
          <div className="flex flex-col">
            <StyledInputFormikField
              name={`${props.fieldName}.url`}
              labelFontWeight="bold"
              labelColor="slate.800"
              labelFontSize="16px"
              labelProps={{ my: 2, letterSpacing: 0 }}
              label={<FormattedMessage id="Expense.Attachment" defaultMessage="Attachment" />}
              isPrivate
            >
              {({ field }) => {
                const hasValidUrl = field.value && isValidUrl(field.value);
                return (
                  <div className="h-[112px] w-[112px]">
                    <StyledDropzone
                      {...attachmentDropzoneParams}
                      kind="EXPENSE_ITEM"
                      data-cy={`${field.name}-dropzone`}
                      name={field.name}
                      isMulti={false}
                      size={112}
                      onSuccess={({ url }) => {
                        props.form.setFieldValue(field.name, url);
                      }}
                      mockImageGenerator={() => `https://loremflickr.com/120/120/invoice`}
                      fontSize="13px"
                      value={hasValidUrl && field.value}
                    />
                  </div>
                );
              }}
            </StyledInputFormikField>
          </div>
        )}
        <div className="flex flex-grow flex-col gap-4">
          <StyledInputFormikField
            name={`${props.fieldName}.description`}
            labelFontWeight="bold"
            labelColor="slate.800"
            labelFontSize="16px"
            labelProps={{ my: 2, letterSpacing: 0 }}
            label={<FormattedMessage id="Fields.description" defaultMessage="Description" />}
            hint={
              <FormattedMessage
                defaultMessage={`Specify item or activity and timeframe, e.g. "Volunteer Training, April 2023"`}
              />
            }
          >
            {({ field }) => (
              <StyledInput
                {...field}
                onBlur={e => {
                  field.onBlur(e);
                  props.form.setFieldTouched(`${props.fieldName}.url`, true);
                }}
                className="w-full"
              />
            )}
          </StyledInputFormikField>
          <div className="flex gap-4">
            <StyledInputFormikField
              flexGrow={1}
              name={`${props.fieldName}.incurredAt`}
              labelFontWeight="bold"
              labelColor="slate.800"
              labelFontSize="16px"
              labelProps={{ my: 2, letterSpacing: 0 }}
              label={<FormattedMessage id="expense.incurredAt" defaultMessage="Date" />}
            >
              {({ field }) => (
                <StyledInput
                  {...field}
                  onChange={e => {
                    props.form.setFieldTouched(field.name);
                    props.form.setFieldValue(field.name, dayjs(e.target.value).utc().toDate());
                    e.target.value;
                  }}
                  value={field.value ? dayjs.utc(field.value).toDate().toISOString().substring(0, 10) : null}
                  type="date"
                  className="w-full"
                />
              )}
            </StyledInputFormikField>

            <StyledInputFormikField
              flexGrow={1}
              name={`${props.fieldName}.amount.valueInCents`}
              labelFontWeight="bold"
              labelColor="slate.800"
              labelFontSize="16px"
              labelProps={{ my: 2, letterSpacing: 0 }}
              label={<FormattedMessage id="Fields.amount" defaultMessage="Amount" />}
            >
              {({ field }) => (
                <StyledInputAmount
                  {...field}
                  error={field.error || props.form.getFieldMeta(`${props.fieldName}.amount.currency`).error}
                  hasCurrencyPicker={props.form.options.allowExpenseItemCurrencyChange}
                  onCurrencyChange={onCurrencyChange}
                  value={field.value}
                  currency={get(props.form.values, `${props.fieldName}.amount.currency`, null)}
                  currencyDisplay="CODE"
                  maxWidth="100%"
                  placeholder="0.00"
                  onBlur={onAmountBlur}
                  onChange={onAmountChange}
                  exchangeRate={get(props.form.values, `${props.fieldName}.amount.exchangeRate`, 0)}
                  minFxRate={
                    get(props.form.values, `${props.fieldName}.amount.referenceExchangeRate.value`, 0) *
                      (1 - FX_RATE_ERROR_THRESHOLD) || undefined
                  }
                  maxFxRate={
                    get(props.form.values, `${props.fieldName}.amount.referenceExchangeRate.value`, 0) *
                      (1 + FX_RATE_ERROR_THRESHOLD) || undefined
                  }
                  showErrorIfEmpty={false} // Validation is already done in `ExpenseForm`
                  onExchangeRateChange={onAmountExchangeRateChange}
                />
              )}
            </StyledInputFormikField>
          </div>
          <div className="self-end">
            {Boolean(
              expenseItem.amount?.currency && props.form.values.expenseCurrency !== expenseItem.amount?.currency,
            ) && (
              <ExchangeRate
                data-cy={`${props.fieldName}.amount.exchangeRate`}
                className="mt-2 text-neutral-600"
                {...getExpenseExchangeRateWarningOrError(
                  intl,
                  expenseItem.amount.exchangeRate,
                  expenseItem.amount.referenceExchangeRate,
                )}
                exchangeRate={
                  (expenseItem.amount.exchangeRate || {
                    source: CurrencyExchangeRateSourceType.USER,
                    fromCurrency: expenseItem.amount.currency as Currency,
                    toCurrency: props.form.values.expenseCurrency as Currency,
                  }) as CurrencyExchangeRateInput
                }
                approximateCustomMessage={intl.formatMessage({
                  defaultMessage: 'This value is an estimate. Please set the exact amount received if known.',
                })}
              />
            )}
          </div>
        </div>
      </div>
    </FormikProvider>
  );
}
