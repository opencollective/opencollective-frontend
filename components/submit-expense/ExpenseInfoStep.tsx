import React from 'react';
import { FormikProvider } from 'formik';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import AccountingCategorySelect from '../AccountingCategorySelect';
import HTMLContent from '../HTMLContent';
import StyledInput from '../StyledInput';
import StyledInputFormikField from '../StyledInputFormikField';

import { ExpenseForm } from './useExpenseForm';

const I18nMessages = defineMessages({
  descriptionPlaceholder: {
    id: `ExpenseForm.DescriptionPlaceholder`,
    defaultMessage: 'Enter expense title here...',
  },
  grantSubjectPlaceholder: {
    id: `ExpenseForm.GrantSubjectPlaceholder`,
    defaultMessage: 'e.g., research, software development, etc...',
  },
});

type ExpenseInfoFormProps = {
  form: ExpenseForm;
};

export function ExpenseInfoForm(props: ExpenseInfoFormProps) {
  const intl = useIntl();
  const account = props.form.options.account;
  const host = account && 'host' in account ? account.host : null;

  const selectedCategory = (props.form.options.accountingCategories || []).find(
    c => c.id === props.form.values.accountingCategoryId,
  );

  return (
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
      <FormikProvider value={props.form}>
        <StyledInputFormikField
          name="title"
          labelFontWeight="bold"
          labelColor="slate.800"
          labelFontSize="16px"
          labelProps={{ my: 2, letterSpacing: 0 }}
          label={<FormattedMessage defaultMessage="Expense Title" />}
        >
          {({ field }) => (
            <StyledInput
              {...field}
              placeholder={intl.formatMessage(I18nMessages.descriptionPlaceholder)}
              className="w-full"
              onChange={e => props.form.setFieldValue('title', e.target.value)}
            />
          )}
        </StyledInputFormikField>
      </FormikProvider>

      {props.form.options.accountingCategories?.length > 0 && (
        <React.Fragment>
          <FormikProvider value={props.form}>
            <StyledInputFormikField
              name="accountingCategoryId"
              labelFontWeight="bold"
              labelColor="slate.800"
              labelFontSize="16px"
              labelProps={{ my: 2, letterSpacing: 0 }}
              label={<FormattedMessage defaultMessage="Expense Category" />}
            >
              {() => (
                <AccountingCategorySelect
                  kind="EXPENSE"
                  showCode
                  account={account as any}
                  host={host}
                  expenseType={props.form.values.expenseTypeOption}
                  selectedCategory={selectedCategory as any}
                  onChange={c => props.form.setFieldValue('accountingCategoryId', c.id)}
                  onBlur={() => props.form.setFieldTouched('accountingCategoryId', true)}
                />
              )}
            </StyledInputFormikField>
          </FormikProvider>

          {selectedCategory?.instructions && (
            <React.Fragment>
              <h2 className="mb-2 mt-4 text-base font-bold leading-6 text-slate-800">
                <FormattedMessage defaultMessage="Account Category Instructions" />
              </h2>

              <div>
                <HTMLContent openLinksInNewTab content={selectedCategory.instructions} />
              </div>
            </React.Fragment>
          )}
        </React.Fragment>
      )}
    </div>
  );
}
