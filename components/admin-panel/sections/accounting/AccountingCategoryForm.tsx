import React from 'react';
import { useFormik } from 'formik';
import { omit } from 'lodash';
import { defineMessages, useIntl } from 'react-intl';

import { AccountingCategoryKind, ExpenseType } from '../../../../lib/graphql/types/v2/graphql';
import { i18nExpenseType } from '../../../../lib/i18n/expense';

import RichTextEditor from '../../../RichTextEditor';
import StyledInput from '../../../StyledInput';
import StyledInputField from '../../../StyledInputField';
import StyledSelect from '../../../StyledSelect';

type FormValues = {
  name: string;
  friendlyName?: string;
  code: string;
  kind: { value: AccountingCategoryKind; label: string };
  expensesTypes?: { value: ExpenseType; label: string }[];
  hostOnly?: { value: boolean; label: string };
  instructions?: string;
};

export type EditableAccountingCategoryFields =
  | 'kind'
  | 'hostOnly'
  | 'instructions'
  | 'name'
  | 'friendlyName'
  | 'code'
  | 'expensesTypes';

type useAccountingCategoryFormikOptions = {
  onSubmit: (values: FormValues) => void | Promise<void>;
  initialValues: FormValues;
};
export function useAccountingCategoryFormik(opts: useAccountingCategoryFormikOptions) {
  const formik = useFormik({
    initialValues: opts.initialValues,
    onSubmit: opts.onSubmit,
  });

  const { setFieldValue, values } = formik;
  React.useEffect(() => {
    if (values.kind.value !== AccountingCategoryKind.EXPENSE) {
      setFieldValue('expensesTypes', null);
    }
  }, [setFieldValue, values.kind]);

  return formik;
}

export const AccountingCategoryKindI18n = defineMessages({
  [AccountingCategoryKind.EXPENSE]: {
    id: 'Expenses',
    defaultMessage: 'Expenses',
  },
  [AccountingCategoryKind.ADDED_FUNDS]: {
    id: 'AccountingCategory.Kind.ADDED_FUNDS',
    defaultMessage: 'Added Funds',
  },
  [AccountingCategoryKind.CONTRIBUTION]: {
    id: 'Contributions',
    defaultMessage: 'Contributions',
  },
});

type AccountingCategoryFormProps = {
  formik: ReturnType<typeof useFormik<FormValues>>;
};

export function AccountingCategoryForm(props: AccountingCategoryFormProps) {
  const intl = useIntl();

  const accountingCategoryKindOptions = [
    {
      value: AccountingCategoryKind.EXPENSE,
      label: intl.formatMessage(AccountingCategoryKindI18n[AccountingCategoryKind.EXPENSE]),
    },
    {
      value: AccountingCategoryKind.CONTRIBUTION,
      label: intl.formatMessage(AccountingCategoryKindI18n[AccountingCategoryKind.CONTRIBUTION]),
    },
  ];

  const expenseTypeOptions = Object.values(omit(ExpenseType, ExpenseType.FUNDING_REQUEST)).map(t => ({
    value: t,
    label: i18nExpenseType(intl, t),
  }));

  const hostOnlyOptions = [
    {
      value: false,
      label: intl.formatMessage({ defaultMessage: 'No' }),
    },
    {
      value: true,
      label: intl.formatMessage({ defaultMessage: 'Yes' }),
    },
  ];

  return (
    <React.Fragment>
      <StyledInputField name="kind" required label={intl.formatMessage({ defaultMessage: 'Category kind' })} mt={3}>
        <StyledSelect
          {...props.formik.getFieldProps('kind')}
          inputId="kind"
          options={accountingCategoryKindOptions}
          required
          width="100%"
          maxWidth={500}
          onChange={({ value }) => {
            const defaultHostOnly = value !== AccountingCategoryKind.EXPENSE;
            props.formik.setValues({
              ...props.formik.values,
              hostOnly: hostOnlyOptions.find(c => c.value === defaultHostOnly),
              kind: accountingCategoryKindOptions.find(c => c.value === value),
            });
          }}
        />
      </StyledInputField>
      {props.formik.values.kind.value === AccountingCategoryKind.EXPENSE && (
        <StyledInputField name="hostOnly" required label={intl.formatMessage({ defaultMessage: 'Host only' })} mt={3}>
          <StyledSelect
            {...props.formik.getFieldProps('hostOnly')}
            inputId="hostOnly"
            options={hostOnlyOptions}
            required
            width="100%"
            maxWidth={500}
            onChange={({ value }) =>
              props.formik.setFieldValue(
                'hostOnly',
                hostOnlyOptions.find(c => c.value === value),
              )
            }
          />
        </StyledInputField>
      )}
      {props.formik.values.kind.value === AccountingCategoryKind.EXPENSE && (
        <StyledInputField
          name="expensesTypes"
          required
          label={intl.formatMessage({ defaultMessage: 'Expense Types' })}
          mt={3}
        >
          <StyledSelect
            {...props.formik.getFieldProps('expensesTypes')}
            inputId="expensesTypes"
            options={expenseTypeOptions}
            placeholder={intl.formatMessage({ id: 'AllExpenses', defaultMessage: 'All expenses' })}
            isMulti
            width="100%"
            maxWidth={500}
            onChange={(options: { value: ExpenseType }[]) =>
              props.formik.setFieldValue(
                'expensesTypes',
                options.map(({ value }) => expenseTypeOptions.find(c => c.value === value)),
              )
            }
          />
        </StyledInputField>
      )}
      <StyledInputField name="name" required label={intl.formatMessage({ defaultMessage: 'Category name' })} mt={3}>
        <StyledInput
          {...props.formik.getFieldProps('name')}
          required
          width="100%"
          maxWidth={500}
          maxLength={60}
          onChange={e => props.formik.setFieldValue('name', e.target.value)}
        />
      </StyledInputField>
      <StyledInputField
        required={false}
        name="friendlyName"
        label={intl.formatMessage({ id: 'AccountingCategory.friendlyName', defaultMessage: 'Friendly name' })}
        mt={3}
      >
        <StyledInput
          {...props.formik.getFieldProps('friendlyName')}
          placeholder={props.formik.values.name}
          width="100%"
          maxWidth={500}
          maxLength={60}
          onChange={e => props.formik.setFieldValue('friendlyName', e.target.value)}
        />
      </StyledInputField>
      <StyledInputField required name="code" label={intl.formatMessage({ defaultMessage: 'Accounting code' })} mt={3}>
        <StyledInput
          {...props.formik.getFieldProps('code')}
          required
          width="100%"
          maxWidth={500}
          maxLength={60}
          onChange={e => props.formik.setFieldValue('code', e.target.value)}
        />
      </StyledInputField>
      {props.formik.values.kind.value === AccountingCategoryKind.EXPENSE && (
        <StyledInputField
          name="instructions"
          required
          label={intl.formatMessage({ defaultMessage: 'Instructions' })}
          mt={3}
        >
          <RichTextEditor
            {...props.formik.getFieldProps('instructions')}
            defaultValue={props.formik.values.instructions}
            withBorders
            showCount
            version="simplified"
            editorMinHeight="12.5rem"
            editorMaxHeight={500}
            onChange={e => props.formik.setFieldValue('instructions', e.target.value)}
            fontSize="14px"
          />
        </StyledInputField>
      )}
    </React.Fragment>
  );
}
