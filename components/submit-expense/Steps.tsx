import React from 'react';
import { useFormik } from 'formik';
import { isEmpty, round } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { ExpenseType } from '../../lib/graphql/types/v2/graphql';
import { i18nTaxType } from '../../lib/i18n/taxes';
import { getTaxAmount, isTaxRateValid } from '../expenses/lib/utils';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { PayoutMethodLabel } from '../PayoutMethodLabel';

import { ExpenseDetailsForm } from './ExpenseDetailsStep';
import { ExpenseInfoForm } from './ExpenseInfoStep';
import { ExpenseSummaryForm } from './ExpenseSummaryStep';
import { InvitedPayeeLabel } from './InvitedPayeeLabel';
import { PickCollectiveStepForm } from './PickCollectiveStep';
import { PickExpenseTypeForm } from './PickExpenseTypeStep';
import { PickPaymentMethodForm } from './PickPaymentMethodStep';
import { ExpenseForm, ExpenseFormValues } from './useExpenseForm';

export const enum ExpenseFlowStep {
  COLLECTIVE = 'collective',
  EXPENSE_TYPE = 'expenseType',
  PAYMENT_METHOD = 'paymentMethod',
  EXPENSE_INFO = 'expenseInfo',
  EXPENSE_DETAILS = 'expenseDetails',
  EXPENSE_SUMMARY = 'expenseSummary',
}

export const ExpenseStepOrder = [
  ExpenseFlowStep.COLLECTIVE,
  ExpenseFlowStep.PAYMENT_METHOD,
  ExpenseFlowStep.EXPENSE_TYPE,
  ExpenseFlowStep.EXPENSE_INFO,
  ExpenseFlowStep.EXPENSE_DETAILS,
  ExpenseFlowStep.EXPENSE_SUMMARY,
];

export type StepDefinition<
  FormValues extends Record<string, any>,
  Form extends ReturnType<typeof useFormik<FormValues>>,
  AddProps = never,
> = {
  Form: React.FC<{ form: Form } | ({ form: Form } & AddProps)>;
  hasError: (form: Form) => boolean;
  Title: React.FC<{ form: Form } | {}>;
  Subtitle?: React.FC<{ form: Form } | {}>;
};

export type ExpenseStepDefinition = StepDefinition<ExpenseFormValues, ExpenseForm, { slug: string }>;

export const Steps: Record<ExpenseFlowStep, ExpenseStepDefinition> = {
  [ExpenseFlowStep.COLLECTIVE]: {
    Title: () => <FormattedMessage defaultMessage="Who is paying?" />,
    Subtitle: (props: { form: ExpenseForm }) => props.form.options.account?.name ?? '',
    Form: PickCollectiveStepForm,
    hasError(form) {
      return !!form.errors.collectiveSlug;
    },
  },
  [ExpenseFlowStep.EXPENSE_TYPE]: {
    Title: () => <FormattedMessage defaultMessage="Type of expense" />,
    Subtitle: (props: { form: ExpenseForm }) => {
      return props.form.values.expenseTypeOption === ExpenseType.INVOICE ? (
        <FormattedMessage id="Expense.Type.Invoice" defaultMessage="Invoice" />
      ) : props.form.values.expenseTypeOption === ExpenseType.RECEIPT ? (
        <FormattedMessage id="ExpenseForm.ReceiptLabel" defaultMessage="Reimbursement" />
      ) : null;
    },
    Form: PickExpenseTypeForm,
    hasError(form) {
      return !!form.errors.expenseTypeOption || !!form.errors.acknowledgedExpensePolicy;
    },
  },
  [ExpenseFlowStep.PAYMENT_METHOD]: {
    Title: () => <FormattedMessage defaultMessage="Who is getting paid?" />,
    Subtitle: function PickPaymentMethodStepSubtitle(props: { form: ExpenseForm }) {
      const payee = props.form.options.payee;

      const payoutMethod = React.useMemo(
        () => payee && payee.payoutMethods?.find(p => p.id === props.form.values.payoutMethodId),
        [payee, props.form.values.payoutMethodId],
      );

      const invitePayee = props.form.values.invitePayee;
      const invitePayoutMethod = invitePayee?.['payoutMethod'];

      const hasPayee = payee || invitePayee;
      const expensePayoutMethod = payoutMethod || invitePayoutMethod;

      if (!hasPayee) {
        return null;
      }

      if (!isEmpty(expensePayoutMethod)) {
        return (
          <React.Fragment>
            <div>{invitePayee ? <InvitedPayeeLabel invitePayee={invitePayee} /> : payee.name}</div>
            <div className="overflow-hidden text-ellipsis">
              <PayoutMethodLabel showIcon payoutMethod={expensePayoutMethod} />
            </div>
          </React.Fragment>
        );
      }

      return invitePayee ? <InvitedPayeeLabel invitePayee={invitePayee} /> : payee.name;
    },
    Form: PickPaymentMethodForm,
    hasError(form) {
      return !!form.errors.payeeSlug || !!form.errors.payoutMethodId || !!form.errors.invitePayee;
    },
  },
  [ExpenseFlowStep.EXPENSE_INFO]: {
    Form: ExpenseInfoForm,
    hasError(form) {
      return !!form.errors.title || (form.options.isAccountingCategoryRequired && !!form.errors.accountingCategoryId);
    },
    Title: (props: { form: ExpenseForm }) => {
      return props.form.options.accountingCategories?.length > 0 ? (
        <FormattedMessage defaultMessage="Title and category" />
      ) : (
        <FormattedMessage id="Title" defaultMessage="Title" />
      );
    },
    Subtitle: (props: { form: ExpenseForm }) => {
      return props.form.values.title;
    },
  },
  [ExpenseFlowStep.EXPENSE_DETAILS]: {
    Title: () => <FormattedMessage defaultMessage="Expense Details" />,
    Subtitle: function ExpenseDetailsStepSubtitle(props: { form: ExpenseForm }) {
      const intl = useIntl();

      return props.form.values.expenseItems?.length > 0 ? (
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
                amount={props.form.options.totalInvoicedInExpenseCurrency}
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
                    : getTaxAmount(props.form.options.totalInvoicedInExpenseCurrency, props.form.values.tax)
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
      ) : null;
    },
    Form: ExpenseDetailsForm,
    hasError(form) {
      if (form.options.taxType && form.values.hasTax && !!form.errors.tax) {
        return true;
      }

      return (
        !!form.errors.expenseCurrency ||
        !!form.errors.expenseItems ||
        !!form.errors.title ||
        (form.options.isAccountingCategoryRequired && !!form.errors.accountingCategoryId)
      );
    },
  },
  [ExpenseFlowStep.EXPENSE_SUMMARY]: {
    Title: () => <FormattedMessage id="Summary" defaultMessage="Summary" />,
    Form: ExpenseSummaryForm,
    hasError() {
      return false;
    },
  },
} as const;
