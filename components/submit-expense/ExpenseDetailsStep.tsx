import React from 'react';
import { FormikProvider } from 'formik';
import { isEmpty } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { ExpenseType } from '../../lib/graphql/types/v2/graphql';

import { expenseTagsQuery } from '../dashboard/filters/ExpenseTagsFilter';
import { AutocompleteEditTags } from '../EditTags';
import ExpenseAttachedFilesForm from '../expenses/ExpenseAttachedFilesForm';
import ExpenseTypeTag from '../expenses/ExpenseTypeTag';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { StyledCurrencyPicker } from '../StyledCurrencyPicker';
import StyledInputFormikField from '../StyledInputFormikField';
import { StepListItem } from '../ui/StepList';

import { ExpenseItemsForm } from './ExpenseItemsForm';
import { ExpenseStepDefinition } from './Steps';
import { ExpenseForm, expenseTypeFromOption, ExpenseTypeOption } from './useExpenseForm';

export const ExpenseDetailsStep: ExpenseStepDefinition = {
  Form: ExpenseDetailsForm,
  StepListItem: ExpenseDetailsStepListItem,
  hasError(form) {
    return !!form.errors.expenseCurrency || !!form.errors.expenseItems;
  },
};

type ExpenseDetailsFormProps = {
  form: ExpenseForm;
};

function ExpenseDetailsForm(props: ExpenseDetailsFormProps) {
  const availableCurrencies = props.form.options.supportedCurrencies;

  const setFieldValue = props.form.setFieldValue;
  React.useEffect(() => {
    if (isEmpty(props.form.values.expenseItems)) {
      setFieldValue('expenseItems', [
        {
          date: new Date().toISOString().substring(0, 10),
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
      <div>
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
      </div>
    </FormikProvider>
  );
}

function ExpenseDetailsStepListItem(props: { className?: string; form: ExpenseForm; current: boolean }) {
  return (
    <StepListItem
      className="w-full"
      title={<FormattedMessage defaultMessage="Expense Details" />}
      subtitle={
        props.form.values.expenseItems?.length > 0 ? (
          <div>
            <span>
              <FormattedMoneyAmount
                amountStyles={{
                  fontWeight: 'normal',
                }}
                abbreviate
                showCurrencyCode={false}
                currency={props.form.values.expenseCurrency}
                amount={(props.form.values.expenseItems ?? []).reduce((acc, ei) => acc + ei.amount.valueInCents, 0)}
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
        ) : null
      }
      completed={!ExpenseDetailsStep.hasError(props.form)}
      current={props.current}
    />
  );
}
