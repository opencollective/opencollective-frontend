import React from 'react';
import { useFormik } from 'formik';

import { ExpenseDetailsStep } from './ExpenseDetailsStep';
import { ExpenseInfoStep } from './ExpenseInfoStep';
import { ExpenseSummaryStep } from './ExpenseSummaryStep';
import { PickCollectiveStep } from './PickCollectiveStep';
import { PickExpenseTypeStep } from './PickExpenseTypeStep';
import { PickPaymentMethodStep } from './PickPaymentMethodStep';
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
  ExpenseFlowStep.EXPENSE_TYPE,
  ExpenseFlowStep.PAYMENT_METHOD,
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
  StepListItem: React.FC<{ form: Form; current: boolean; className?: string }>;
};

export type ExpenseStepDefinition = StepDefinition<ExpenseFormValues, ExpenseForm, { slug: string }>;

export const Steps: Record<ExpenseFlowStep, ExpenseStepDefinition> = {
  [ExpenseFlowStep.COLLECTIVE]: PickCollectiveStep,
  [ExpenseFlowStep.EXPENSE_TYPE]: PickExpenseTypeStep,
  [ExpenseFlowStep.PAYMENT_METHOD]: PickPaymentMethodStep,
  [ExpenseFlowStep.EXPENSE_INFO]: ExpenseInfoStep,
  [ExpenseFlowStep.EXPENSE_DETAILS]: ExpenseDetailsStep,
  [ExpenseFlowStep.EXPENSE_SUMMARY]: ExpenseSummaryStep,
} as const;
