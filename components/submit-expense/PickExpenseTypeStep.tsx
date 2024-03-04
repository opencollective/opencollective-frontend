import React from 'react';
import { FormattedMessage } from 'react-intl';

import { ExpenseType } from '../../lib/graphql/types/v2/graphql';

import HTMLContent from '../HTMLContent';
import StyledCheckbox from '../StyledCheckbox';
import { StepListItem } from '../ui/StepList';

import { RadioCardButton } from './RadioCardButton';
import { ExpenseStepDefinition } from './Steps';
import { ExpenseForm, ExpenseTypeOption } from './useExpenseForm';

export const PickExpenseTypeStep: ExpenseStepDefinition = {
  Form: PickExpenseTypeForm,
  StepListItem: PickExpenseTypeStepListItem,
  hasError(form) {
    if (!form.values.expenseTypeOption || !!form.errors.expenseTypeOption) {
      return true;
    }

    if (
      (form.options.collectiveExpensePolicy || form.options.hostExpensePolicy) &&
      !form.values.acknowledgedExpensePolicy
    ) {
      return true;
    }

    return false;
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

      {props.form.values.expenseTypeOption &&
        (props.form.options.hostExpensePolicy || props.form.options.collectiveExpensePolicy) && (
          <h1 className="mb-2 mt-5 text-lg font-bold leading-[26px] text-dark-900">
            <FormattedMessage defaultMessage="General Instructions" />
          </h1>
        )}

      {props.form.options.hostExpensePolicy && props.form.values.expenseTypeOption && (
        <React.Fragment>
          <h2 className="my-5 text-base font-bold leading-6 text-slate-800">
            <FormattedMessage defaultMessage="Host Instructions" />
          </h2>
          <div>
            <HTMLContent content={props.form.options.hostExpensePolicy} />
          </div>
        </React.Fragment>
      )}

      {props.form.options.collectiveExpensePolicy && props.form.values.expenseTypeOption && (
        <React.Fragment>
          <h2 className="my-5 text-base font-bold leading-6 text-slate-800">
            <FormattedMessage defaultMessage="Collective Instructions" />
          </h2>
          <div>
            <HTMLContent content={props.form.options.collectiveExpensePolicy} />
          </div>
        </React.Fragment>
      )}

      {props.form.values.expenseTypeOption &&
        (props.form.options.hostExpensePolicy || props.form.options.collectiveExpensePolicy) && (
          <div className="mt-3">
            <StyledCheckbox
              required
              checked={props.form.values.acknowledgedExpensePolicy}
              onChange={({ checked }) => props.form.setFieldValue('acknowledgedExpensePolicy', checked)}
              label={<FormattedMessage defaultMessage="I understand the instructions and conditions" />}
              error={props.form.touched.acknowledgedExpensePolicy && props.form.errors.acknowledgedExpensePolicy}
            />
          </div>
        )}
    </div>
  );
}

function PickExpenseTypeStepListItem(props: { className?: string; form: ExpenseForm; current: boolean }) {
  return (
    <StepListItem
      className={props.className}
      title={<FormattedMessage defaultMessage="Type of expense" />}
      subtitle={
        props.form.values.expenseTypeOption === ExpenseTypeOption.INVOICE ? (
          <FormattedMessage id="Expense.Type.Invoice" defaultMessage="Invoice" />
        ) : props.form.values.expenseTypeOption === ExpenseTypeOption.REIMBURSEMENT ? (
          <FormattedMessage id="ExpenseForm.ReceiptLabel" defaultMessage="Reimbursement" />
        ) : null
      }
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
