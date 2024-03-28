import React from 'react';
import { FormattedMessage } from 'react-intl';

import { ExpenseType } from '../../lib/graphql/types/v2/graphql';

import HTMLContent from '../HTMLContent';
import StyledCheckbox from '../StyledCheckbox';

import { RadioCardButton } from './RadioCardButton';
import { ExpenseForm } from './useExpenseForm';

type PickExpenseTypeFormProps = {
  slug: string;
  form: ExpenseForm;
};

export function PickExpenseTypeForm(props: PickExpenseTypeFormProps) {
  const supportedExpenseTypes = props.form.options.supportedExpenseTypes || [];

  return (
    <div className="flex-grow pr-2">
      <h1 className="mb-4 text-lg font-bold leading-[26px] text-dark-900">
        <FormattedMessage defaultMessage="Select the type of expense" />
      </h1>
      <div className="flex gap-2">
        {supportedExpenseTypes.includes(ExpenseType.INVOICE) && (
          <ExpenseTypeOptionButton
            title={<FormattedMessage id="Expense.Type.Invoice" defaultMessage="Invoice" />}
            subtitle={<FormattedMessage defaultMessage="I am submitting an invoice to get paid" />}
            onClick={() => props.form.setFieldValue('expenseTypeOption', ExpenseType.INVOICE)}
            checked={props.form.values.expenseTypeOption === ExpenseType.INVOICE}
          />
        )}
        {supportedExpenseTypes.includes(ExpenseType.RECEIPT) && (
          <ExpenseTypeOptionButton
            title={<FormattedMessage id="ExpenseForm.ReceiptLabel" defaultMessage="Reimbursement" />}
            subtitle={
              <FormattedMessage defaultMessage="I am asking to be reimbursed for something I've already paid for" />
            }
            onClick={() => props.form.setFieldValue('expenseTypeOption', ExpenseType.RECEIPT)}
            checked={props.form.values.expenseTypeOption === ExpenseType.RECEIPT}
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
          <h2 className="mb-2 mt-5 text-base font-bold leading-6 text-slate-800">
            <FormattedMessage defaultMessage="Host Instructions" />
          </h2>
          <div>
            <HTMLContent openLinksInNewTab content={props.form.options.hostExpensePolicy} />
          </div>
        </React.Fragment>
      )}

      {props.form.options.collectiveExpensePolicy && props.form.values.expenseTypeOption && (
        <React.Fragment>
          <h2 className="mb-2 mt-8 text-base font-bold leading-6 text-slate-800">
            <FormattedMessage defaultMessage="Collective Instructions" />
          </h2>
          <div>
            <HTMLContent openLinksInNewTab content={props.form.options.collectiveExpensePolicy} />
          </div>
        </React.Fragment>
      )}

      {props.form.values.expenseTypeOption &&
        (props.form.options.hostExpensePolicy || props.form.options.collectiveExpensePolicy) && (
          <div className="mb-2 mt-5">
            <StyledCheckbox
              name="acknowledgedExpensePolicy"
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
