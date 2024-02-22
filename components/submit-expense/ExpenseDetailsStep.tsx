import React from 'react';
import { TaxType } from '@opencollective/taxes';
import { FormikProvider } from 'formik';
import { isEmpty, round } from 'lodash';
import { FormattedMessage, IntlShape, useIntl } from 'react-intl';

import { ExpenseType } from '../../lib/graphql/types/v2/graphql';
import { i18nTaxType } from '../../lib/i18n/taxes';
import { getTaxAmount, isTaxRateValid } from '../expenses/lib/utils';

import { expenseTagsQuery } from '../dashboard/filters/ExpenseTagsFilter';
import { AutocompleteEditTags } from '../EditTags';
import ExpenseAmountBreakdown from '../expenses/ExpenseAmountBreakdown';
import ExpenseAttachedFilesForm from '../expenses/ExpenseAttachedFilesForm';
import ExpenseTypeTag from '../expenses/ExpenseTypeTag';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import StyledCheckbox from '../StyledCheckbox';
import { StyledCurrencyPicker } from '../StyledCurrencyPicker';
import StyledInput from '../StyledInput';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledInputGroup from '../StyledInputGroup';
import StyledSelect from '../StyledSelect';
import { StepListItem } from '../ui/StepList';

import { ExpenseItemsForm } from './ExpenseItemsForm';
import { ExpenseStepDefinition } from './Steps';
import { ExpenseForm, expenseTypeFromOption, ExpenseTypeOption } from './useExpenseForm';

export const ExpenseDetailsStep: ExpenseStepDefinition = {
  Form: ExpenseDetailsForm,
  StepListItem: ExpenseDetailsStepListItem,
  hasError(form) {
    if (form.options.taxType && form.values.hasTax && !!form.errors.tax) {
      return true;
    }

    return !!form.errors.expenseCurrency || !!form.errors.expenseItems;
  },
};

type ExpenseDetailsFormProps = {
  form: ExpenseForm;
};

function ExpenseDetailsForm(props: ExpenseDetailsFormProps) {
  const intl = useIntl();
  const availableCurrencies = props.form.options.supportedCurrencies;

  const setFieldValue = props.form.setFieldValue;
  React.useEffect(() => {
    if (isEmpty(props.form.values.expenseItems)) {
      setFieldValue('expenseItems', [
        {
          date: new Date(),
          description: '',
          amount: {
            valueInCents: 0,
            currency: props.form.values.expenseCurrency,
          },
        },
      ]);
    }
  }, [props.form.values.expenseItems, props.form.values.expenseCurrency, setFieldValue]);

  return (
    <FormikProvider value={props.form}>
      <div className="pb-10 pr-3">
        <h1 className="mb-4 text-lg font-bold leading-[26px] text-dark-900">
          <FormattedMessage defaultMessage="Expense details" />
        </h1>
        <p className="text-xs text-slate-700">
          <FormattedMessage
            id="HostApplication.form.publicInformation"
            defaultMessage="This information is public. Please do not add any personal information such as names or addresses in this field."
          />
        </p>
        <StyledInputFormikField
          name="tags"
          labelFontWeight="bold"
          labelColor="slate.800"
          labelFontSize="16px"
          labelProps={{ my: 3, letterSpacing: 0 }}
          required={false}
          label={<FormattedMessage defaultMessage="Tag your expense" />}
        >
          {() => (
            <div className="flex items-center gap-1">
              <ExpenseTypeTag
                type={
                  [ExpenseTypeOption.INVITED_INVOICE, ExpenseTypeOption.INVOICE].includes(
                    props.form.values.expenseTypeOption,
                  )
                    ? ExpenseType.INVOICE
                    : ExpenseType.RECEIPT
                }
                mb={0}
                mr={0}
              />
              <AutocompleteEditTags
                query={expenseTagsQuery}
                variables={{ account: { slug: props.form.values.collectiveSlug } }}
                onChange={(tags: { value: string }[]) => {
                  props.form.setFieldValue(
                    'tags',
                    tags.map(t => t.value.toLowerCase()),
                  );
                }}
                value={props.form.values.tags}
              />
            </div>
          )}
        </StyledInputFormikField>

        <StyledInputFormikField
          name="expenseCurrency"
          labelFontWeight="bold"
          labelColor="slate.800"
          labelFontSize="16px"
          labelProps={{ my: 3, letterSpacing: 0 }}
          label={<FormattedMessage defaultMessage="Expense currency" />}
        >
          {() => (
            <StyledCurrencyPicker
              inputId="expense-currency-picker"
              data-cy="expense-currency-picker"
              availableCurrencies={availableCurrencies}
              value={props.form.values.expenseCurrency}
              onChange={c => props.form.setFieldValue('expenseCurrency', c)}
              width="100%"
              maxWidth="160px"
              disabled={availableCurrencies.length < 2}
              styles={{ menu: { width: '280px' } }}
              onBlur={() => props.form.setFieldTouched('expenseCurrency', true)}
            />
          )}
        </StyledInputFormikField>

        {[ExpenseType.GRANT, ExpenseType.INVOICE].includes(
          expenseTypeFromOption(props.form.values.expenseTypeOption),
        ) && (
          <ExpenseAttachedFilesForm
            title={
              expenseTypeFromOption(props.form.values.expenseTypeOption) === ExpenseType.INVOICE ? (
                <FormattedMessage id="UploadInvoice" defaultMessage="Upload invoice" />
              ) : (
                <FormattedMessage id="UploadDocumentation" defaultMessage="Upload documentation" />
              )
            }
            description={
              expenseTypeFromOption(props.form.values.expenseTypeOption) === ExpenseType.INVOICE ? (
                <FormattedMessage
                  id="UploadInvoiceDescription"
                  defaultMessage="If you already have an invoice document, you can upload it here."
                />
              ) : (
                <FormattedMessage
                  id="UploadDocumentationDescription"
                  defaultMessage="If you want to include any documentation, you can upload it here."
                />
              )
            }
            defaultValue={props.form.values.expenseAttachedFiles}
            onChange={expenseAttachedFiles =>
              props.form.setFieldValue(
                'expenseAttachedFiles',
                expenseAttachedFiles.map(eaf => ({
                  url: eaf.url,
                })),
              )
            }
          />
        )}

        <ExpenseItemsForm form={props.form} className="mt-4" />

        {props.form.options.taxType && (
          <React.Fragment>
            <div className="my-4 flex items-center justify-between gap-2">
              <div className="text-slate-80 w-fit text-base font-bold leading-6">
                <FormattedMessage defaultMessage="Tax and Total" />
              </div>
              <hr className="flex-grow border-neutral-300" />
            </div>
            <StyledCheckbox
              checked={props.form.values.hasTax}
              onChange={({ checked }) => props.form.setFieldValue('hasTax', checked)}
              label={
                <FormattedMessage
                  defaultMessage="Apply {taxName}"
                  values={{
                    taxName: i18nTaxType(intl, props.form.options.taxType),
                  }}
                />
              }
            />
          </React.Fragment>
        )}

        <div className="flex gap-4">
          <div>
            {props.form.values.hasTax && props.form.options.taxType === TaxType.GST && (
              <StyledInputFormikField
                name="tax.rate"
                htmlFor={`input-${props.form.options.taxType}-rate`}
                label={intl.formatMessage(
                  { defaultMessage: '{taxName} rate' },
                  { taxName: i18nTaxType(intl, props.form.options.taxType, 'short') },
                )}
                labelFontWeight="bold"
                labelColor="slate.800"
                labelFontSize="16px"
                labelProps={{ my: 3, letterSpacing: 0 }}
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
              </StyledInputFormikField>
            )}

            {props.form.values.hasTax && props.form.options.taxType === TaxType.VAT && (
              <StyledInputFormikField
                name="tax.rate"
                htmlFor={`input-${props.form.options.taxType}-rate`}
                label={intl.formatMessage(
                  { defaultMessage: '{taxName} rate' },
                  { taxName: i18nTaxType(intl, props.form.options.taxType, 'short') },
                )}
                labelFontWeight="bold"
                labelColor="slate.800"
                labelFontSize="16px"
                labelProps={{ my: 3, letterSpacing: 0 }}
                inputType="number"
              >
                {({ field }) => (
                  <StyledInputGroup
                    {...field}
                    value={field.value ? round(field.value * 100, 2) : null}
                    onChange={e =>
                      props.form.setFieldValue('tax.rate', e.target.value ? round(e.target.value / 100, 4) : null)
                    }
                    minWidth={65}
                    append="%"
                    min={0}
                    max={100}
                    step="0.01"
                  />
                )}
              </StyledInputFormikField>
            )}
          </div>

          {props.form.values.hasTax && (
            <StyledInputFormikField
              name="tax.idNumber"
              htmlFor={`input-${props.form.options.taxType}-idNumber`}
              label={intl.formatMessage(
                { defaultMessage: '{taxName} identifier' },
                { taxName: i18nTaxType(intl, props.form.options.taxType, 'short') },
              )}
              labelFontWeight="bold"
              labelColor="slate.800"
              labelFontSize="16px"
              labelProps={{ my: 3, letterSpacing: 0 }}
              flexGrow={1}
            >
              {({ field }) => (
                <StyledInput
                  {...field}
                  placeholder={intl.formatMessage(
                    { id: 'examples', defaultMessage: 'e.g., {examples}' },
                    { examples: props.form.options.taxType === TaxType.VAT ? 'EU000011111' : '123456789' },
                  )}
                />
              )}
            </StyledInputFormikField>
          )}
        </div>

        <div className="mt-3">
          <ExpenseAmountBreakdown
            currency={props.form.values.expenseCurrency}
            items={(props.form.values.expenseItems || []).map(ei => ({ ...ei, amountV2: ei.amount }))}
            taxes={props.form.values.tax ? [{ ...props.form.values.tax, type: props.form.options.taxType }] : []}
          />
        </div>
      </div>
    </FormikProvider>
  );
}

const i18nTaxRate = (intl: IntlShape, taxType: TaxType, rate: number) => {
  if (rate) {
    return `${rate * 100}%`;
  } else {
    return intl.formatMessage({ defaultMessage: 'No {taxName}' }, { taxName: i18nTaxType(intl, taxType, 'short') });
  }
};

function ExpenseDetailsStepListItem(props: { className?: string; form: ExpenseForm; current: boolean }) {
  const intl = useIntl();
  const totalExpenseAmount = (props.form.values.expenseItems ?? []).reduce(
    (acc, ei) => acc + ei.amount.valueInCents,
    0,
  );
  return (
    <StepListItem
      className="w-full"
      title={<FormattedMessage defaultMessage="Expense Details" />}
      subtitle={
        props.form.values.expenseItems?.length > 0 ? (
          <div>
            <div>
              <span>
                <FormattedMoneyAmount
                  amountStyles={{
                    fontWeight: 'normal',
                  }}
                  abbreviate
                  showCurrencyCode={false}
                  currency={props.form.values.expenseCurrency}
                  amount={totalExpenseAmount}
                />
              </span>
              &nbsp;
              <span>
                <FormattedMessage
                  defaultMessage="({n} {n, plural, one {item} other {items}})"
                  values={{ n: props.form.values.expenseItems?.length ?? 0 }}
                />
              </span>
            </div>
            {props.form.options.taxType && props.form.values.hasTax && (
              <span>
                <FormattedMoneyAmount
                  amount={
                    !isTaxRateValid(props.form.values.tax?.rate)
                      ? null
                      : getTaxAmount(totalExpenseAmount, props.form.values.tax)
                  }
                  precision={2}
                  currency={props.form.values.expenseCurrency}
                  showCurrencyCode={false}
                  amountStyles={null}
                />
                &nbsp;
                {i18nTaxType(intl, props.form.options.taxType, 'short')}
                {isTaxRateValid(props.form.values.tax?.rate) && (
                  <React.Fragment>&nbsp;{`(${round(props.form.values.tax?.rate * 100, 2)}%)`}</React.Fragment>
                )}
              </span>
            )}
          </div>
        ) : null
      }
      completed={!ExpenseDetailsStep.hasError(props.form)}
      current={props.current}
    />
  );
}
