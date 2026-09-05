import React from 'react';
import type { useFormik } from 'formik';
import { omit } from 'lodash-es';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import {
  AccountingCategoryAppliesTo,
  AccountingCategoryKind,
  ExpenseType,
} from '../../../../lib/graphql/types/v2/graphql';
import { i18nExpenseType } from '../../../../lib/i18n/expense';

import { useFormikZod } from '@/components/FormikZod';
import { FormSectionTitle } from '@/components/ui/FormSectionTitle';

import RichTextEditor from '../../../RichTextEditor';
import StyledInput from '../../../StyledInput';
import StyledInputField from '../../../StyledInputField';
import StyledSelect from '../../../StyledSelect';

const accountingCategoryFormSchema = z.object({
  name: z.string().min(1).max(60),
  friendlyName: z.string().max(60).optional().nullable(),
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
  'kind' | 'hostOnly' | 'instructions' | 'name' | 'friendlyName' | 'code' | 'expensesTypes' | 'appliesTo';

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

export const AccountingCategoryType = {
  BALANCE: 'BALANCE',
  CLEARING: 'CLEARING',
  PROFIT_AND_LOSS: 'PROFIT_AND_LOSS',
} as const;

type AccountingCategoryTypeValue = (typeof AccountingCategoryType)[keyof typeof AccountingCategoryType];

const BALANCE_SHEET_KINDS: AccountingCategoryKind[] = [
  AccountingCategoryKind.BALANCE_ACCOUNT,
  AccountingCategoryKind.CLEARING_ACCOUNT,
];

export const isBalanceSheetKind = (kind: AccountingCategoryKind) => BALANCE_SHEET_KINDS.includes(kind);

export const getAccountingCategoryType = (kind: AccountingCategoryKind): AccountingCategoryTypeValue => {
  switch (kind) {
    case AccountingCategoryKind.BALANCE_ACCOUNT:
      return AccountingCategoryType.BALANCE;
    case AccountingCategoryKind.CLEARING_ACCOUNT:
      return AccountingCategoryType.CLEARING;
    default:
      return AccountingCategoryType.PROFIT_AND_LOSS;
  }
};

const KINDS_BY_TYPE: Record<AccountingCategoryTypeValue, AccountingCategoryKind[]> = {
  [AccountingCategoryType.BALANCE]: [AccountingCategoryKind.BALANCE_ACCOUNT],
  [AccountingCategoryType.CLEARING]: [AccountingCategoryKind.CLEARING_ACCOUNT],
  [AccountingCategoryType.PROFIT_AND_LOSS]: [AccountingCategoryKind.EXPENSE, AccountingCategoryKind.CONTRIBUTION],
};

export const AccountingCategoryTypeI18n = defineMessages({
  [AccountingCategoryType.BALANCE]: {
    id: 'Balance',
    defaultMessage: 'Balance',
  },
  [AccountingCategoryType.CLEARING]: {
    defaultMessage: 'Clearing',
    id: 'c3NvXn',
  },
  [AccountingCategoryType.PROFIT_AND_LOSS]: {
    defaultMessage: 'Profit and Loss',
    id: 'a4eA0B',
  },
});

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
  [AccountingCategoryKind.BALANCE_ACCOUNT]: {
    defaultMessage: 'Balance account',
    id: 'tEEe+f',
  },
  [AccountingCategoryKind.CLEARING_ACCOUNT]: {
    defaultMessage: 'Clearing account',
    id: 'Ulo2mw',
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

export function AccountingCategoryTypeLabel({
  kind,
  expensesTypes,
}: {
  kind: AccountingCategoryKind;
  expensesTypes?: ExpenseType[] | null;
}) {
  const intl = useIntl();
  const type = getAccountingCategoryType(kind);
  const kindLabel = AccountingCategoryKindI18n[kind];
  const expenseTypesLabel =
    kind !== AccountingCategoryKind.EXPENSE
      ? null
      : expensesTypes?.length
        ? expensesTypes.map(value => i18nExpenseType(intl, value)).join(', ')
        : intl.formatMessage({ id: 'AllExpenses', defaultMessage: 'All expenses' });

  return (
    <div className="flex flex-col">
      <span>
        <FormattedMessage {...AccountingCategoryTypeI18n[type]} />
      </span>
      {type === AccountingCategoryType.PROFIT_AND_LOSS && kindLabel && (
        <span className="text-xs text-muted-foreground">
          <FormattedMessage {...kindLabel} />
          {expenseTypesLabel && <React.Fragment>&nbsp;·&nbsp;{expenseTypesLabel}</React.Fragment>}
        </span>
      )}
    </div>
  );
}

type AccountingCategoryFormProps = {
  formik: ReturnType<typeof useFormik<FormValues>>;
  hasHosting: boolean;
};

function FormSection({ title, children }: React.PropsWithChildren<{ title: React.ReactNode }>) {
  return (
    <div>
      <FormSectionTitle>{title}</FormSectionTitle>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function AccountingCategoryForm(props: AccountingCategoryFormProps) {
  const intl = useIntl();
  const { formik } = props;
  const selectedKind = formik.values.kind.value;
  const isBalanceSheet = isBalanceSheetKind(selectedKind);
  const selectedType = getAccountingCategoryType(selectedKind);
  const showInstructions = selectedKind === AccountingCategoryKind.EXPENSE || isBalanceSheet;

  const accountingCategoryTypeOptions = Object.values(AccountingCategoryType).map(type => ({
    value: type,
    label: intl.formatMessage(AccountingCategoryTypeI18n[type]),
  }));

  const accountingCategoryKindOptions = KINDS_BY_TYPE[selectedType].map(kind => ({
    value: kind,
    label: intl.formatMessage(AccountingCategoryKindI18n[kind]),
  }));

  const accountingCategoryAppliesToOptions = [
    {
      value: null,
      label: intl.formatMessage(AccountingCategoryAppliesToI18n.ALL),
    },
    {
      value: AccountingCategoryAppliesTo.HOST,
      label: intl.formatMessage(AccountingCategoryAppliesToI18n[AccountingCategoryAppliesTo.HOST]),
    },
    {
      value: AccountingCategoryAppliesTo.HOSTED_COLLECTIVES,
      label: intl.formatMessage(AccountingCategoryAppliesToI18n[AccountingCategoryAppliesTo.HOSTED_COLLECTIVES]),
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

  const getFieldError = field => (formik.submitCount || formik.touched[field]) && formik.errors[field];

  const setKind = (kind: AccountingCategoryKind) => {
    const defaultHostOnly = kind !== AccountingCategoryKind.EXPENSE;
    formik.setValues({
      ...formik.values,
      hostOnly: hostOnlyOptions.find(c => c.value === defaultHostOnly),
      kind: {
        value: kind,
        label: intl.formatMessage(AccountingCategoryKindI18n[kind]),
      },
      ...(isBalanceSheetKind(kind)
        ? { appliesTo: accountingCategoryAppliesToOptions.find(c => c.value === null) }
        : {}),
    });
  };

  return (
    <div className="space-y-8">
      <FormSection title={<FormattedMessage defaultMessage="Details" id="Details" />}>
        <StyledInputField
          required
          name="code"
          label={intl.formatMessage({ defaultMessage: 'Accounting code', id: 'tvVFNA' })}
          error={getFieldError('code')}
          mt={0}
        >
          <StyledInput
            {...formik.getFieldProps('code')}
            required
            width="100%"
            maxWidth={500}
            maxLength={60}
            onChange={e => formik.setFieldValue('code', e.target.value)}
          />
        </StyledInputField>
        <StyledInputField
          name="name"
          required
          label={intl.formatMessage({ defaultMessage: 'Category name', id: 'kgVqk1' })}
          error={getFieldError('name')}
          mt={0}
        >
          <StyledInput
            {...formik.getFieldProps('name')}
            required
            width="100%"
            maxWidth={500}
            maxLength={60}
            onChange={e => formik.setFieldValue('name', e.target.value)}
          />
        </StyledInputField>
        <StyledInputField
          required={false}
          name="friendlyName"
          error={getFieldError('friendlyName')}
          label={intl.formatMessage({ id: 'AccountingCategory.friendlyName', defaultMessage: 'Friendly name' })}
          hint={
            <FormattedMessage
              defaultMessage="An alternative name that's easier to understand for non-accountants"
              id="AccountingCategory.friendlyName.hint"
            />
          }
          hintPosition="above"
          mt={0}
        >
          <StyledInput
            {...formik.getFieldProps('friendlyName')}
            placeholder={formik.values.name}
            width="100%"
            maxWidth={500}
            maxLength={60}
            onChange={e => formik.setFieldValue('friendlyName', e.target.value)}
          />
        </StyledInputField>
      </FormSection>

      <FormSection title={<FormattedMessage defaultMessage="Category type" id="mwRz71" />}>
        <StyledInputField
          name="type"
          required
          label={intl.formatMessage({ defaultMessage: 'Type', id: 'Type' })}
          hintPosition="above"
          hint={
            <FormattedMessage
              defaultMessage="Balance and clearing categories track where money comes from and where it goes, Profit and Loss categories track the kind of expense or revenue"
              id="1Q7HMj"
            />
          }
          mt={0}
        >
          <StyledSelect
            inputId="type"
            options={accountingCategoryTypeOptions}
            value={accountingCategoryTypeOptions.find(c => c.value === selectedType)}
            required
            width="100%"
            maxWidth={500}
            onChange={({ value }) => {
              if (value !== selectedType) {
                setKind(KINDS_BY_TYPE[value][0]);
              }
            }}
          />
        </StyledInputField>
        {selectedType === AccountingCategoryType.PROFIT_AND_LOSS && (
          <StyledInputField
            name="kind"
            required
            label={intl.formatMessage({ defaultMessage: 'Kind', id: 'Transaction.Kind' })}
            error={getFieldError('kind')}
            mt={0}
          >
            <StyledSelect
              {...formik.getFieldProps('kind')}
              inputId="kind"
              options={accountingCategoryKindOptions}
              required
              width="100%"
              maxWidth={500}
              onChange={({ value }) => setKind(value)}
            />
          </StyledInputField>
        )}
        {selectedKind === AccountingCategoryKind.EXPENSE && (
          <StyledInputField
            name="expensesTypes"
            required
            error={getFieldError('expensesTypes')}
            label={intl.formatMessage({ defaultMessage: 'Expense Types', id: 'D+aS5Z' })}
            hintPosition="above"
            hint={
              <FormattedMessage
                defaultMessage="Select specific expense types that this category applies to, or leave empty to apply to all expense types"
                id="AccountingCategory.expensesTypes.hint"
              />
            }
            mt={0}
          >
            <StyledSelect
              {...formik.getFieldProps('expensesTypes')}
              inputId="expensesTypes"
              options={expenseTypeOptions}
              placeholder={intl.formatMessage({ id: 'AllExpenses', defaultMessage: 'All expenses' })}
              isMulti
              width="100%"
              maxWidth={500}
              onChange={(options: { value: ExpenseType }[]) =>
                formik.setFieldValue(
                  'expensesTypes',
                  options.map(({ value }) => expenseTypeOptions.find(c => c.value === value)),
                )
              }
            />
          </StyledInputField>
        )}
      </FormSection>

      <FormSection title={<FormattedMessage defaultMessage="Visibility" id="JAkIqb" />}>
        {props.hasHosting && !isBalanceSheet && (
          <StyledInputField
            name="appliesTo"
            required
            error={getFieldError('appliesTo')}
            label={intl.formatMessage({ defaultMessage: 'Applies To', id: 'M+BG8u' })}
            hint={
              <FormattedMessage
                defaultMessage="Choose whether this category applies to your own transactions or the transactions of your hosted collectives"
                id="AccountingCategory.appliesTo.hint"
              />
            }
            hintPosition="above"
            mt={0}
          >
            <StyledSelect
              {...formik.getFieldProps('appliesTo')}
              inputId="appliesTo"
              options={accountingCategoryAppliesToOptions}
              required
              width="100%"
              maxWidth={500}
              onChange={({ value }) => {
                formik.setFieldValue(
                  'appliesTo',
                  accountingCategoryAppliesToOptions.find(c => c.value === value),
                );
              }}
            />
          </StyledInputField>
        )}
        <StyledInputField
          name="hostOnly"
          required
          error={getFieldError('hostOnly')}
          label={intl.formatMessage({ defaultMessage: 'Visible only to host admins', id: 'NvBPFR' })}
          hintPosition="above"
          hint={
            isBalanceSheet ? (
              <FormattedMessage
                defaultMessage="Balance and clearing accounts are only managed by host admins"
                id="dkE4/H"
              />
            ) : selectedKind !== AccountingCategoryKind.EXPENSE ? (
              <FormattedMessage
                defaultMessage="Only host admins can categorize added funds and contributions"
                id="AccountingCategory.hostOnly.hint"
              />
            ) : undefined
          }
          mt={0}
        >
          <StyledSelect
            {...formik.getFieldProps('hostOnly')}
            inputId="hostOnly"
            disabled={selectedKind !== AccountingCategoryKind.EXPENSE}
            options={hostOnlyOptions}
            required
            width="100%"
            maxWidth={500}
            onChange={({ value }) =>
              formik.setFieldValue(
                'hostOnly',
                hostOnlyOptions.find(c => c.value === value),
              )
            }
          />
        </StyledInputField>
      </FormSection>

      {showInstructions && (
        <FormSection title={<FormattedMessage defaultMessage="Instructions" id="sV2v5L" />}>
          <StyledInputField
            name="instructions"
            required
            error={getFieldError('instructions')}
            hintPosition="above"
            hint={
              isBalanceSheet ? (
                <FormattedMessage
                  defaultMessage="Provide detailed instructions on when and how to use this account, this will be displayed when selecting the account"
                  id="u2nQRm"
                />
              ) : (
                <FormattedMessage
                  defaultMessage="Provide detailed instructions on when and how to use this accounting category, this will be displayed on the expense submission form"
                  id="AccountingCategory.instructions.hint"
                />
              )
            }
            mt={0}
          >
            <RichTextEditor
              {...formik.getFieldProps('instructions')}
              defaultValue={formik.values.instructions}
              withBorders
              showCount
              version="simplified"
              editorMinHeight="12.5rem"
              editorMaxHeight={500}
              onChange={e => formik.setFieldValue('instructions', e.target.value)}
              fontSize="14px"
            />
          </StyledInputField>
        </FormSection>
      )}
    </div>
  );
}
