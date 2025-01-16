import React, { useId } from 'react';
import { TaxType } from '@opencollective/taxes';
import type { CheckedState } from '@radix-ui/react-checkbox';
import dayjs from 'dayjs';
import { get, isNumber, round } from 'lodash';
import { Lock, Trash2 } from 'lucide-react';
import type { IntlShape } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';

import type { Currency, CurrencyExchangeRateInput } from '../../../lib/graphql/types/v2/schema';
import { CurrencyExchangeRateSourceType } from '../../../lib/graphql/types/v2/schema';
import { i18nTaxType } from '../../../lib/i18n/taxes';
import { attachmentDropzoneParams } from '../../expenses/lib/attachments';
import {
  FX_RATE_ERROR_THRESHOLD,
  getExpenseExchangeRateWarningOrError,
  getTaxAmount,
  isTaxRateValid,
} from '../../expenses/lib/utils';

import { FormField } from '@/components/FormField';
import { Checkbox } from '@/components/ui/Checkbox';

import { ExchangeRate } from '../../ExchangeRate';
import FormattedMoneyAmount from '../../FormattedMoneyAmount';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import StyledCheckbox from '../../StyledCheckbox';
import StyledDropzone from '../../StyledDropzone';
import StyledInputAmount from '../../StyledInputAmount';
import StyledInputFormikField from '../../StyledInputFormikField';
import StyledInputGroup from '../../StyledInputGroup';
import StyledSelect from '../../StyledSelect';
import { Button } from '../../ui/Button';
import { Input, InputGroup } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { useToast } from '../../ui/useToast';
import { Step } from '../SubmitExpenseFlowSteps';
import { type ExpenseForm } from '../useExpenseForm';

import { FormSectionContainer } from './FormSectionContainer';
import InputAmount from '@/components/InputAmount';

type ExpenseItemsSectionProps = {
  form: ExpenseForm;
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
};

export function ExpenseItemsSection(props: ExpenseItemsSectionProps) {
  return (
    <FormSectionContainer
      step={Step.EXPENSE_ITEMS}
      inViewChange={props.inViewChange}
      form={props.form}
      subtitle={
        <div className="flex items-center gap-2">
          <FormattedMessage defaultMessage="Add the expense items that you’d like to be paid for" id="ox+mWM" />
          <Lock size={14} />
        </div>
      }
    >
      <React.Fragment>
        <ExpenseItemsForm form={props.form} />

        <div className="my-4 border-t border-gray-200" />
        <AdditionalAttachments form={props.form} />
      </React.Fragment>
    </FormSectionContainer>
  );
}

export function ExpenseItemsForm(props: { form: ExpenseForm }) {
  const intl = useIntl();
  const expenseItems = props.form.values.expenseItems;
  const { setFieldValue } = props.form;

  return (
    <React.Fragment>
      {!props.form.initialLoading &&
        expenseItems?.map((ei, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={i} className="flex gap-4">
            <div className="flex-grow">
              <ExpenseItem form={props.form} index={i} />
            </div>
            <div>
              <Button
                onClick={() => {
                  setFieldValue('expenseItems', [...expenseItems.slice(0, i), ...expenseItems.slice(i + 1)]);
                }}
                disabled={expenseItems.length === 1}
                variant="outline"
                size="icon-sm"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}

      {props.form.initialLoading && (
        <div className="mb-4">
          <LoadingPlaceholder width={1} height={120} />
        </div>
      )}
      <div className="flex justify-between pr-12">
        <Button
          variant="outline"
          disabled={props.form.initialLoading}
          onClick={() =>
            setFieldValue('expenseItems', [
              ...expenseItems,
              {
                amount: { valueInCents: 0, currency: props.form.options.expenseCurrency },
                description: '',
                incurredAt: new Date().toISOString(),
                attachment: null,
              },
            ])
          }
        >
          Add invoice item
        </Button>
        <div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-right">
            {props.form.values.hasTax && props.form.values.tax && (
              <React.Fragment>
                <div>Subtotal:</div>
                <div>
                  <FormattedMoneyAmount
                    amount={props.form.options?.totalInvoicedInExpenseCurrency}
                    precision={2}
                    currency={props.form.options?.expenseCurrency}
                    showCurrencyCode
                  />
                </div>
              </React.Fragment>
            )}
            {props.form.values.hasTax && props.form.values.tax && (
              <React.Fragment>
                <span className="captilize">
                  {i18nTaxType(intl, props.form.options.taxType, 'short')}
                  {isTaxRateValid(props.form.values.tax.rate) && ` (${round(props.form.values.tax.rate * 100, 2)}%)`}:
                </span>
                <div>
                  <FormattedMoneyAmount
                    amount={
                      !isTaxRateValid(props.form.values.tax.rate)
                        ? null
                        : getTaxAmount(props.form.options.totalInvoicedInExpenseCurrency, props.form.values.tax)
                    }
                    precision={2}
                    currency={props.form.options.expenseCurrency}
                    showCurrencyCode
                  />
                </div>
              </React.Fragment>
            )}

            <div className="col-span-2 text-right">
              <FormattedMoneyAmount
                amount={
                  props.form.values.hasTax && props.form.values.tax && isTaxRateValid(props.form.values.tax.rate)
                    ? getTaxAmount(props.form.options.totalInvoicedInExpenseCurrency, props.form.values.tax) +
                      props.form.options.totalInvoicedInExpenseCurrency
                    : props.form.options.totalInvoicedInExpenseCurrency
                }
                precision={2}
                currency={props.form.options.expenseCurrency}
                showCurrencyCode
                amountClassName="font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      {props.form.options.taxType && (
        <React.Fragment>
          <div className="my-4 border-t border-gray-200" />
          <Taxes form={props.form} />
        </React.Fragment>
      )}
    </React.Fragment>
  );
}

type ExpenseItemProps = {
  index: number;
  form: ExpenseForm;
};

function ExpenseItem(props: ExpenseItemProps) {
  const { toast } = useToast();
  const intl = useIntl();
  const item = props.form.values.expenseItems.at(props.index);

  const hasAttachment = props.form.options.allowExpenseItemAttachment;

  const amountId = useId();
  const attachmentId = useId();

  const { setFieldValue } = props.form;

  if (!item) {
    return null;
  }

  return (
    <div className="mb-4 rounded-md border border-slate-300 p-4">
      <div className="flex gap-4">
        {hasAttachment && (
          <div className="flex flex-col">
            <div className="flex flex-grow justify-center">
              <FormField
                label={intl.formatMessage({ defaultMessage: 'Upload file', id: '6oOCCL' })}
                name={`expenseItems.${props.index}.attachment`}
              >
                {() => {
                  return (
                    <StyledDropzone
                      {...attachmentDropzoneParams}
                      kind="EXPENSE_ITEM"
                      id={attachmentId}
                      name={attachmentId}
                      value={typeof item.attachment === 'string' ? item.attachment : item.attachment?.url}
                      isMulti={false}
                      showActions
                      size={112}
                      useGraphQL={true}
                      parseDocument={false}
                      onGraphQLSuccess={uploadResults => {
                        setFieldValue(`expenseItems.${props.index}.attachment`, uploadResults[0].file);
                      }}
                      onSuccess={file => {
                        setFieldValue(`expenseItems.${props.index}.attachment`, file);
                      }}
                      onReject={msg => {
                        toast({ variant: 'error', message: msg });
                      }}
                    />
                  );
                }}
              </FormField>
            </div>
          </div>
        )}
        <div className="flex-grow">
          <div className="mb-2">
            <FormField
              required={props.form.options.isAdminOfPayee}
              label={intl.formatMessage({ defaultMessage: 'Item Description', id: 'xNL/oy' })}
              placeholder={intl.formatMessage({ defaultMessage: 'Enter what best describes the item', id: '/eapvj' })}
              name={`expenseItems.${props.index}.description`}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-grow basis-0">
              <FormField
                required={props.form.options.isAdminOfPayee}
                label={intl.formatMessage({ defaultMessage: 'Date', id: 'expense.incurredAt' })}
                name={`expenseItems.${props.index}.incurredAt`}
              >
                {({ field }) => {
                  const value = field.value ? dayjs.utc(field.value).format('YYYY-MM-DD') : undefined;
                  return <Input type="date" {...field} value={value} />;
                }}
              </FormField>
            </div>

            <div className="flex-grow basis-0">
              <div className="flex flex-col">
                <FormField
                  label={intl.formatMessage({ defaultMessage: 'Amount', id: 'Fields.amount' })}
                  name={`expenseItems.${props.index}.amount.valueInCents`}
                >
                  {({ field }) => (
                    <InputAmount
                      {...field}
                      currencyDisplay="FULL"
                      hasCurrencyPicker
                      currency={item.amount.currency || 'USD'}
                      onCurrencyChange={v => setFieldValue(`expenseItems.${props.index}.amount.currency`, v)}
                      id={amountId}
                      name={amountId}
                      value={item.amount.valueInCents}
                      onChange={v => {
                        setFieldValue(`expenseItems.${props.index}.amount.valueInCents`, v);
                      }}
                      exchangeRate={
                        item.amount.currency !== props.form.options.expenseCurrency &&
                        get(props.form.values, `expenseItems.${props.index}.amount.exchangeRate`, 0)
                      }
                      minFxRate={
                        (item.amount?.referenceExchangeRate && 'value' in item.amount.referenceExchangeRate
                          ? item.amount.referenceExchangeRate.value || 0
                          : 0) *
                          (1 - FX_RATE_ERROR_THRESHOLD) || undefined
                      }
                      maxFxRate={
                        (item.amount?.referenceExchangeRate && 'value' in item.amount.referenceExchangeRate
                          ? item.amount.referenceExchangeRate.value || 0
                          : 0) *
                          (1 + FX_RATE_ERROR_THRESHOLD) || undefined
                      }
                      onExchangeRateChange={exchangeRate =>
                        setFieldValue(`expenseItems.${props.index}.amount.exchangeRate`, exchangeRate)
                      }
                    />
                  )}
                </FormField>

                <div className="self-end">
                  {Boolean(item.amount?.currency && props.form.options.expenseCurrency !== item.amount?.currency) && (
                    <ExchangeRate
                      className="mt-2 text-neutral-600"
                      {...getExpenseExchangeRateWarningOrError(
                        intl,
                        item.amount.exchangeRate,
                        item.amount.referenceExchangeRate,
                      )}
                      exchangeRate={
                        (item.amount.exchangeRate || {
                          source: CurrencyExchangeRateSourceType.USER,
                          fromCurrency: item.amount.currency as Currency,
                          toCurrency: props.form.options.expenseCurrency,
                        }) as CurrencyExchangeRateInput
                      }
                      approximateCustomMessage={intl.formatMessage({
                        defaultMessage: 'This value is an estimate. Please set the exact amount received if known.',
                        id: 'zNBAqh',
                      })}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type AdditionalAttachmentsProps = {
  form: ExpenseForm;
};

export function AdditionalAttachments(props: AdditionalAttachmentsProps) {
  const { toast } = useToast();
  const additionalAttachments = props.form.values.additionalAttachments;

  return (
    <div>
      <Label htmlFor="additionalAttachments">
        <FormattedMessage defaultMessage="Additional Attachments (Optional)" id="n3evmu" />
      </Label>
      <div className="flex flex-wrap gap-4 pt-2">
        <div>
          <StyledDropzone
            {...attachmentDropzoneParams}
            name="additionalAttachments"
            kind="EXPENSE_ATTACHED_FILE"
            size={112}
            isMulti
            disabled={props.form.initialLoading}
            isLoading={props.form.initialLoading}
            useGraphQL={true}
            parseDocument={false}
            onGraphQLSuccess={uploadResults => {
              props.form.setFieldValue('additionalAttachments', [
                ...(props.form.values.additionalAttachments || []),
                ...uploadResults.map(up => up.file),
              ]);
            }}
            onSuccess={() => {}}
            onReject={msg => {
              toast({ variant: 'error', message: msg });
            }}
          />
        </div>

        {additionalAttachments.map(at => (
          <div key={typeof at === 'string' ? at : at.id}>
            <StyledDropzone
              {...attachmentDropzoneParams}
              name={typeof at === 'string' ? at : at.name}
              size={112}
              value={typeof at === 'string' ? at : at?.url}
              collectFilesOnly
              showActions
              showReplaceAction={false}
              onSuccess={() => {
                props.form.setFieldValue(
                  'additionalAttachments',
                  additionalAttachments.filter(f => f !== at),
                );
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const i18nTaxRate = (intl: IntlShape, taxType: TaxType, rate: number) => {
  if (rate) {
    return `${rate * 100}%`;
  } else {
    return intl.formatMessage(
      { defaultMessage: 'No {taxName}', id: 'lTGBvW' },
      { taxName: i18nTaxType(intl, taxType, 'short') },
    );
  }
};

function Taxes(props: { form: ExpenseForm }) {
  const intl = useIntl();
  const { setFieldValue } = props.form;
  const onHasTaxChange = React.useCallback(
    (checked: CheckedState) => {
      setFieldValue('hasTax', Boolean(checked));
    },
    [setFieldValue],
  );

  return (
    <div>
      <FormField label={intl.formatMessage({ defaultMessage: 'Taxes', id: 'r+dgiv' })} name="hasTax">
        {() => (
          <div className="items-top mt-1 flex space-x-2">
            <Checkbox id="hasTax" checked={props.form.values.hasTax} onCheckedChange={onHasTaxChange} />
            <Label className="font-normal" htmlFor="hasTax">
              <FormattedMessage
                defaultMessage="Apply {taxName}"
                id="0JzeTD"
                values={{
                  taxName: i18nTaxType(intl, props.form.options.taxType),
                }}
              />
            </Label>
          </div>
        )}
      </FormField>

      <div className="items-top mt-4 flex gap-4">
        <div>
          {props.form.values.hasTax && props.form.options.taxType === TaxType.GST && (
            <FormField
              name="tax.rate"
              htmlFor={`input-${props.form.options.taxType}-rate`}
              label={intl.formatMessage(
                { defaultMessage: '{taxName} rate', id: 'Gsyrfa' },
                { taxName: i18nTaxType(intl, props.form.options.taxType, 'short') },
              )}
              inputType="number"
            >
              {({ field }) => (
                <StyledSelect
                  inputId={`input-${props.form.options.taxType}-rate`}
                  value={{
                    value: round(field.value * 100, 2),
                    label: i18nTaxRate(intl, props.form.options.taxType, field.value),
                  }}
                  onChange={({ value }) => props.form.setFieldValue('tax.rate', value)}
                  options={[0, 0.15].map(rate => ({
                    value: rate,
                    label: i18nTaxRate(intl, props.form.options.taxType, rate),
                  }))}
                />
              )}
            </FormField>
          )}

          {props.form.values.hasTax && props.form.options.taxType === TaxType.VAT && (
            <FormField
              name="tax.rate"
              htmlFor={`input-${props.form.options.taxType}-rate`}
              label={intl.formatMessage(
                { defaultMessage: '{taxName} rate', id: 'Gsyrfa' },
                { taxName: i18nTaxType(intl, props.form.options.taxType, 'short') },
              )}
              inputType="number"
            >
              {({ field, hasError }) => (
                <InputGroup
                  {...field}
                  hasError={hasError}
                  value={field.value ? round(field.value * 100, 2) : 0}
                  onChange={e =>
                    props.form.setFieldValue(
                      'tax.rate',
                      isNumber(e.target.value) ? round(e.target.value / 100, 4) : null,
                    )
                  }
                  minWidth={65}
                  append="%"
                  min={0}
                  max={100}
                  step="0.01"
                />
              )}
            </FormField>
          )}
        </div>

        {props.form.values.hasTax && (
          <FormField
            name="tax.idNumber"
            htmlFor={`input-${props.form.options.taxType}-idNumber`}
            label={intl.formatMessage(
              { defaultMessage: '{taxName} identifier', id: 'Byg+S/' },
              { taxName: i18nTaxType(intl, props.form.options.taxType, 'short') },
            )}
            placeholder={intl.formatMessage(
              { id: 'examples', defaultMessage: 'e.g., {examples}' },
              { examples: props.form.options.taxType === TaxType.VAT ? 'EU000011111' : '123456789' },
            )}
          />
        )}
      </div>
    </div>
  );
}
