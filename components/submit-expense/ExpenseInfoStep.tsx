import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { FormikProvider } from 'formik';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { ExpenseInfoStepQuery, ExpenseInfoStepQueryVariables, ExpenseType } from '../../lib/graphql/types/v2/graphql';

import AccountingCategorySelect from '../AccountingCategorySelect';
import HTMLContent from '../HTMLContent';
import Loading from '../Loading';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import StyledInput from '../StyledInput';
import StyledInputFormikField from '../StyledInputFormikField';
import { StepListItem } from '../ui/StepList';

import { ExpenseStepDefinition } from './Steps';
import { ExpenseForm, expenseTypeFromOption, ExpenseTypeOption } from './useExpenseForm';

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

export const ExpenseInfoStep: ExpenseStepDefinition = {
  Form: ExpenseInfoForm,
  StepListItem: ExpenseInfoStepListItem,
  hasError(form) {
    return !!form.errors.title || (form.options.isAccountingCategoryRequired && !!form.errors.accountingCategoryId);
  },
};

type ExpenseInfoFormProps = {
  form: ExpenseForm;
};

function ExpenseInfoForm(props: ExpenseInfoFormProps) {
  const intl = useIntl();
  const query = useQuery<ExpenseInfoStepQuery, ExpenseInfoStepQueryVariables>(
    gql`
      query ExpenseInfoStep($collectiveSlug: String!) {
        account(slug: $collectiveSlug) {
          id
          slug
          ... on AccountWithHost {
            host {
              ...ExpenseInfoStepHostFields
            }
          }
          ... on Organization {
            host {
              ...ExpenseInfoStepHostFields
            }
          }
        }
      }

      fragment ExpenseInfoStepHostFields on Host {
        id
        name
        slug
        expensePolicy
        accountingCategories(kind: EXPENSE) {
          nodes {
            id
            name
            kind
            expensesTypes
            friendlyName
            code
            instructions
          }
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        collectiveSlug: props.form.values.collectiveSlug,
      },
    },
  );

  if (query.loading) {
    return <Loading />;
  }

  if (query.error) {
    return <MessageBoxGraphqlError error={query.error} />;
  }

  const account = query.data?.account;
  const host = account && 'host' in account ? account.host : null;

  const selectedCategory = (props.form.options.accountingCategories || []).find(
    c => c.id === props.form.values.accountingCategoryId,
  );

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold leading-[26px] text-dark-900">
        <FormattedMessage defaultMessage="What kind of expense is this?" />
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
          label={
            expenseTypeFromOption(props.form.values.expenseTypeOption) === ExpenseType.GRANT ? (
              <FormattedMessage defaultMessage="Grant Subject" />
            ) : (
              <FormattedMessage defaultMessage="Expense Title" />
            )
          }
        >
          {({ field }) => (
            <StyledInput
              {...field}
              placeholder={intl.formatMessage(
                expenseTypeFromOption(props.form.values.expenseTypeOption) === ExpenseType.GRANT
                  ? I18nMessages.grantSubjectPlaceholder
                  : I18nMessages.descriptionPlaceholder,
              )}
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
                  account={query.data.account as any}
                  host={host}
                  expenseType={
                    [ExpenseTypeOption.INVITED_INVOICE, ExpenseTypeOption.INVOICE].includes(
                      props.form.values.expenseTypeOption,
                    )
                      ? ExpenseType.INVOICE
                      : ExpenseType.RECEIPT
                  }
                  selectedCategory={selectedCategory as any}
                  onChange={c => props.form.setFieldValue('accountingCategoryId', c.id)}
                  onBlur={() => props.form.setFieldTouched('accountingCategoryId', true)}
                />
              )}
            </StyledInputFormikField>
          </FormikProvider>

          {(props.form.options.expensePolicy || selectedCategory?.instructions) && (
            <h1 className="mb-2 mt-5 text-lg font-bold leading-[26px] text-dark-900">
              <FormattedMessage defaultMessage="General Instructions" />
            </h1>
          )}
          {props.form.options.expensePolicy && (
            <React.Fragment>
              <h2 className="my-5 text-base font-bold leading-6 text-slate-800">
                <FormattedMessage defaultMessage="Host Instructions" />
              </h2>
              <div>
                <HTMLContent content={props.form.options.expensePolicy} />
              </div>
            </React.Fragment>
          )}

          {selectedCategory?.instructions && (
            <React.Fragment>
              <h2 className="mb-2 mt-4 text-base font-bold leading-6 text-slate-800">
                <FormattedMessage defaultMessage="Account Category Instructions" />
              </h2>

              <div>
                <HTMLContent content={selectedCategory.instructions} />
              </div>
            </React.Fragment>
          )}
        </React.Fragment>
      )}
    </div>
  );
}

function ExpenseInfoStepListItem(props: { className?: string; form: ExpenseForm; current: boolean }) {
  return (
    <StepListItem
      className={props.className}
      title={<FormattedMessage defaultMessage="Expense Info" />}
      subtitle={props.form.values.title}
      completed={!ExpenseInfoStep.hasError(props.form)}
      current={props.current}
    />
  );
}
