import React from 'react';
import type { useFormik } from 'formik';
import { omit } from 'lodash';
import { defineMessages, useIntl } from 'react-intl';
import { z } from 'zod';

import {
  AccountingCategoryAppliesTo,
  AccountingCategoryKind,
  ExpenseType,
} from '../../../../lib/graphql/types/v2/schema';
import { i18nExpenseType } from '../../../../lib/i18n/expense';

import { useFormikZod } from '@/components/FormikZod';

import RichTextEditor from '../../../RichTextEditor';
import StyledInput from '../../../StyledInput';
import StyledInputField from '../../../StyledInputField';
import StyledSelect from '../../../StyledSelect';

const accountingCategoryFormSchema = z.object({
  name: z.string().min(1).max(60),
  friendlyName: z.string().max(60).optional(),
  code: z.string().min(1).max(60),
  appliesTo: z
    .object({
      value: z.nativeEnum(AccountingCategoryAppliesTo).nullable(),
      label: z.string(),
    })
    .nullable(),
  kind: z.object({
    value: z.nativeEnum(AccountingCategoryKind),
    label: z.string(),
  }),
  expensesTypes: z
    .array(
      z.object({
        value: z.nativeEnum(ExpenseType),
        label: z.string(),
      }),
    )
    .optional()
    .nullable(),
  hostOnly: z.object({
    value: z.boolean(),
    label: z.string(),
  }),
  instructions: z.string().optional().nullable(),
});

type FormValues = {
  name: string;
  friendlyName?: string;
  code: string;
  appliesTo?: { value: AccountingCategoryAppliesTo; label: string };
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
  | 'expensesTypes'
  | 'appliesTo';

type useAccountingCategoryFormikOptions = {
  onSubmit: (values) => void | Promise<void>;
  initialValues: FormValues;
};

export function useAccountingCategoryFormik(opts: useAccountingCategoryFormikOptions) {
  const formik = useFormikZod({
    schema: accountingCategoryFormSchema,
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

export const AccountingCategoryAppliesToI18n = defineMessages({
  [AccountingCategoryAppliesTo.HOST]: {
    id: 'AccountingCategory.AppliesTo.HOST',
    defaultMessage: 'Operational Funds',
  },
  [AccountingCategoryAppliesTo.HOSTED_COLLECTIVES]: {
    id: 'AccountingCategory.AppliesTo.HOSTED_COLLECTIVES',
    defaultMessage: 'Managed Funds',
  },
  ALL: {
    id: 'AccountingCategory.appliesTo.both',
    defaultMessage: 'All',
  },
});

type AccountingCategoryFormProps = {
  formik: ReturnType<typeof useFormik<FormValues>>;
  isIndependentCollective: boolean;
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

  const accountingCategoryAppliesToOptions = [
    {
      value: null,
      label: intl.formatMessage(AccountingCategoryAppliesToI18n.ALL),
    },
    {
      value: AccountingCategoryAppliesTo.HOSTED_COLLECTIVES,
      label: intl.formatMessage(AccountingCategoryAppliesToI18n[AccountingCategoryAppliesTo.HOSTED_COLLECTIVES]),
    },
    {
      value: AccountingCategoryAppliesTo.HOST,
      label: intl.formatMessage(AccountingCategoryAppliesToI18n[AccountingCategoryAppliesTo.HOST]),
    },
  ];

  const expenseTypeOptions = Object.values(omit(ExpenseType, ExpenseType.FUNDING_REQUEST)).map(t => ({
    value: t,
    label: i18nExpenseType(intl, t),
  }));

  const hostOnlyOptions = [
    {
      value: false,
      label: intl.formatMessage({ defaultMessage: 'No', id: 'oUWADl' }),
    },
    {
      value: true,
      label: intl.formatMessage({ defaultMessage: 'Yes', id: 'a5msuh' }),
    },
  ];

  const getFieldError = field =>
    (props.formik.submitCount || props.formik.touched[field]) && props.formik.errors[field];

  return (
    <React.Fragment>
      <StyledInputField
        required
        name="code"
        label={intl.formatMessage({ defaultMessage: 'Accounting code', id: 'tvVFNA' })}
        error={getFieldError('code')}
        mt={3}
      >
        <StyledInput
          {...props.formik.getFieldProps('code')}
          required
          width="100%"
          maxWidth={500}
          maxLength={60}
          onChange={e => props.formik.setFieldValue('code', e.target.value)}
        />
      </StyledInputField>
      <StyledInputField
        name="name"
        required
        label={intl.formatMessage({ defaultMessage: 'Category name', id: 'kgVqk1' })}
        error={getFieldError('name')}
        mt={3}
      >
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
        error={getFieldError('friendlyName')}
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
      {!props.isIndependentCollective && (
        <StyledInputField
          name="appliesTo"
          required
          error={getFieldError('appliesTo')}
          label={intl.formatMessage({ defaultMessage: 'Applies To', id: 'M+BG8u' })}
          mt={3}
        >
          <StyledSelect
            {...props.formik.getFieldProps('appliesTo')}
            inputId="kind"
            options={accountingCategoryAppliesToOptions}
            required
            width="100%"
            maxWidth={500}
            onChange={({ value }) => {
              props.formik.setValues({
                ...props.formik.values,
                appliesTo: accountingCategoryAppliesToOptions.find(c => c.value === value),
              });
            }}
          />
        </StyledInputField>
      )}
      <StyledInputField
        name="kind"
        required
        label={intl.formatMessage({ defaultMessage: 'Kind', id: 'Transaction.Kind' })}
        error={getFieldError('kind')}
        mt={3}
      >
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
      <StyledInputField
        name="hostOnly"
        required
        error={getFieldError('hostOnly')}
        label={intl.formatMessage({ defaultMessage: 'Visible only to host admins', id: 'NvBPFR' })}
        mt={3}
      >
        <StyledSelect
          {...props.formik.getFieldProps('hostOnly')}
          inputId="hostOnly"
          disabled={props.formik.values.kind.value !== AccountingCategoryKind.EXPENSE}
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
      {props.formik.values.kind.value === AccountingCategoryKind.EXPENSE && (
        <StyledInputField
          name="expensesTypes"
          required
          error={getFieldError('expensesTypes')}
          label={intl.formatMessage({ defaultMessage: 'Expense Types', id: 'D+aS5Z' })}
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

      {props.formik.values.kind.value === AccountingCategoryKind.EXPENSE && (
        <StyledInputField
          name="instructions"
          required
          error={getFieldError('instructions')}
          label={intl.formatMessage({ defaultMessage: 'Instructions', id: 'sV2v5L' })}
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
