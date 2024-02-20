import React from 'react';
import { FormattedMessage } from 'react-intl';

import { ExpenseType } from '../../lib/graphql/types/v2/graphql';

import { StepListItem } from '../ui/StepList';

import { RadioCardButton } from './RadioCardButton';
import { ExpenseStepDefinition } from './Steps';
import { ExpenseForm, ExpenseTypeOption } from './useExpenseForm';

export const PickExpenseTypeStep: ExpenseStepDefinition = {
  Form: PickExpenseTypeForm,
  StepListItem: PickExpenseTypeStepListItem,
  hasError(form) {
    return !!form.errors.expenseTypeOption;
  },
};

type PickExpenseTypeFormProps = {
  slug: string;
  form: ExpenseForm;
};

function PickExpenseTypeForm(props: PickExpenseTypeFormProps) {
  const supportedExpenseTypes = props.form.options.supportedExpenseTypes || [];

  return (
    <div className="flex-grow pr-2">
      <h1 className="mb-4 text-lg font-bold leading-[26px] text-dark-900">
        <FormattedMessage defaultMessage="What are you here for?" />
      </h1>
      <h2 className="mb-2 text-base font-bold leading-6 text-slate-800">
        <FormattedMessage defaultMessage="Submitting an expense" />
      </h2>
      <div className="flex gap-2">
        {supportedExpenseTypes.includes(ExpenseType.INVOICE) && (
          <ExpenseTypeOptionButton
            title={<FormattedMessage id="Expense.Type.Invoice" defaultMessage="Invoice" />}
            subtitle={<FormattedMessage defaultMessage="I am submitting an invoice to get paid" />}
            onClick={() => props.form.setFieldValue('expenseTypeOption', ExpenseTypeOption.INVOICE)}
            checked={props.form.values.expenseTypeOption === ExpenseTypeOption.INVOICE}
          />
        )}
        {supportedExpenseTypes.includes(ExpenseType.RECEIPT) && (
          <ExpenseTypeOptionButton
            title={<FormattedMessage id="ExpenseForm.ReceiptLabel" defaultMessage="Reimbursement" />}
            subtitle={
              <FormattedMessage defaultMessage="I am asking to be reimbursed for something I've already paid for" />
            }
            onClick={() => props.form.setFieldValue('expenseTypeOption', ExpenseTypeOption.REIMBURSEMENT)}
            checked={props.form.values.expenseTypeOption === ExpenseTypeOption.REIMBURSEMENT}
          />
        )}
      </div>
      <h2 className="mb-2 mt-8 text-base font-bold leading-6 text-slate-800">
        <FormattedMessage defaultMessage="Inviting someone to submit an expense" />
      </h2>
      <div className="flex gap-2">
        {supportedExpenseTypes.includes(ExpenseType.INVOICE) && (
          <ExpenseTypeOptionButton
            disabled
            title={<FormattedMessage defaultMessage="Invoice Invitation" />}
            subtitle={<FormattedMessage defaultMessage="I am inviting someone to submit an invoice to get paid" />}
            onClick={() => props.form.setFieldValue('expenseTypeOption', ExpenseTypeOption.INVITED_INVOICE)}
            checked={props.form.values.expenseTypeOption === ExpenseTypeOption.INVITED_INVOICE}
          />
        )}
        {supportedExpenseTypes.includes(ExpenseType.RECEIPT) && (
          <ExpenseTypeOptionButton
            disabled
            title={<FormattedMessage defaultMessage="Reimbursement Invitation" />}
            subtitle={
              <FormattedMessage defaultMessage="I am inviting someone to get reimbursed for something they've paid for" />
            }
            onClick={() => props.form.setFieldValue('expenseTypeOption', ExpenseTypeOption.INVITED_REIMBURSEMENT)}
            checked={props.form.values.expenseTypeOption === ExpenseTypeOption.INVITED_REIMBURSEMENT}
          />
        )}
      </div>
      <h2 className="mb-2 mt-8 text-base font-bold leading-6 text-slate-800">
        <FormattedMessage defaultMessage="Other" />
      </h2>
      <div className="flex gap-2">
        <ExpenseTypeOptionButton
          disabled
          title={<FormattedMessage defaultMessage="Vendor Payment" />}
          subtitle={
            <FormattedMessage defaultMessage="I want to pay a vendor that has provided the Collective with products or services" />
          }
          onClick={() => props.form.setFieldValue('expenseTypeOption', ExpenseTypeOption.VENDOR)}
          checked={props.form.values.expenseTypeOption === ExpenseTypeOption.VENDOR}
        />
        {supportedExpenseTypes.includes(ExpenseType.GRANT) && (
          <ExpenseTypeOptionButton
            title={<FormattedMessage defaultMessage="Grant Application" />}
            subtitle={<FormattedMessage defaultMessage="I am applying for a grant" />}
            onClick={() => props.form.setFieldValue('expenseTypeOption', ExpenseTypeOption.GRANT)}
            checked={props.form.values.expenseTypeOption === ExpenseTypeOption.GRANT}
          />
        )}
      </div>
    </div>
  );
}

function PickExpenseTypeStepListItem(props: { className?: string; form: ExpenseForm; current: boolean }) {
  return (
    <StepListItem
      className={props.className}
      title={<FormattedMessage defaultMessage="Type of expense" />}
      subtitle={props.form.values.expenseTypeOption}
      completed={!PickExpenseTypeStep.hasError(props.form)}
      current={props.current}
    />
  );
}

type ExpenseTypeOptionButtonProps = {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  checked?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function ExpenseTypeOptionButton(props: ExpenseTypeOptionButtonProps) {
  return (
    <RadioCardButton
      className="flex-1"
      checked={props.checked}
      disabled={props.disabled}
      onClick={props.onClick}
      title={<div className="font-bold">{props.title}</div>}
      content={<div className="text-sm">{props.subtitle}</div>}
    />
  );
}
