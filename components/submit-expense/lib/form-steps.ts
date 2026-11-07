/**
 * Form steps: which form values each step of a flow owns.
 *
 * Each flow (Expense, Grant, and each edit dialog sub-form) declares its steps once. Error state per
 * step, the first incomplete step to scroll to, "next" validation and partial schema validation are
 * all derived from these definitions.
 */
import type { Path } from 'dot-path-value';
import type { FormikErrors, FormikTouched } from 'formik';
import { get, isEmpty, uniq } from 'lodash-es';

import type { ExpenseUpdateInput } from '../../../lib/graphql/types/v2/graphql';

import type { ExpenseFormOptions, ExpenseFormValues } from './types';

export type FormFieldPath = Path<ExpenseFormValues>;

export type FormStep<Id extends string = string> = {
  id: Id;
  /** The form values this step owns */
  fields: readonly FormFieldPath[];
  /** Whether the step is shown, when it depends on the options */
  isVisible?: (options: ExpenseFormOptions) => boolean;
};

type StepFormState = {
  initialLoading?: boolean;
  errors: FormikErrors<ExpenseFormValues>;
  touched: FormikTouched<ExpenseFormValues>;
  options: ExpenseFormOptions;
};

// ---- Expense flow ----

export enum ExpenseStep {
  INVITE_WELCOME = 'INVITE_WELCOME',
  WHO_IS_PAYING = 'WHO_IS_PAYING',
  WHO_IS_GETTING_PAID = 'WHO_IS_GETTING_PAID',
  PAYOUT_METHOD = 'PAYOUT_METHOD',
  TYPE_OF_EXPENSE = 'TYPE_OF_EXPENSE',
  EXPENSE_CATEGORY = 'EXPENSE_CATEGORY',
  EXPENSE_ITEMS = 'EXPENSE_ITEMS',
  ADDITIONAL_DETAILS = 'ADDITIONAL_DETAILS',
  SUMMARY = 'SUMMARY',
}

export const EXPENSE_FLOW_STEPS: readonly FormStep<ExpenseStep>[] = [
  { id: ExpenseStep.INVITE_WELCOME, fields: [] },
  { id: ExpenseStep.WHO_IS_PAYING, fields: ['accountSlug'] },
  {
    id: ExpenseStep.WHO_IS_GETTING_PAID,
    fields: [
      'payeeSlug',
      'inviteeExistingAccount',
      'inviteeAccountType',
      'inviteeNewIndividual',
      'inviteeNewOrganization',
      'inviteNote',
    ],
  },
  { id: ExpenseStep.PAYOUT_METHOD, fields: ['payoutMethodId', 'newPayoutMethod', 'payoutMethodNameDiscrepancyReason'] },
  {
    id: ExpenseStep.TYPE_OF_EXPENSE,
    fields: [
      'expenseTypeOption',
      'acknowledgedCollectiveInvoiceExpensePolicy',
      'acknowledgedCollectiveReceiptExpensePolicy',
      'acknowledgedCollectiveGrantExpensePolicy',
      'acknowledgedHostInvoiceExpensePolicy',
      'acknowledgedHostReceiptExpensePolicy',
      'acknowledgedHostGrantExpensePolicy',
      'hasInvoiceOption',
      'invoiceFile',
      'invoiceNumber',
      'invoiceInfo',
    ],
  },
  {
    id: ExpenseStep.EXPENSE_CATEGORY,
    fields: ['accountingCategoryId'],
    isVisible: options => Boolean(options.isAccountingCategoryRequired && options.accountingCategories?.length),
  },
  {
    id: ExpenseStep.EXPENSE_ITEMS,
    fields: ['expenseItems', 'additionalAttachments', 'hasTax', 'tax', 'referenceCurrency'],
  },
  {
    id: ExpenseStep.ADDITIONAL_DETAILS,
    fields: [
      'title',
      'acknowledgedCollectiveTitleExpensePolicy',
      'acknowledgedHostTitleExpensePolicy',
      'privateMessage',
      'tags',
    ],
  },
  { id: ExpenseStep.SUMMARY, fields: ['recurrenceFrequency', 'recurrenceEndAt'] },
];

// ---- Grant flow ----

export enum GrantStep {
  INFORMATION = 'INFORMATION',
  GRANT_PROVIDER = 'GRANT_PROVIDER',
  INSTRUCTIONS = 'INSTRUCTIONS',
  INVITATION_NOTE = 'INVITATION_NOTE',
  APPLICATION_FORM = 'APPLICATION_FORM',
  WHO_WILL_RECEIVE_FUNDS = 'WHO_WILL_RECEIVE_FUNDS',
  PAYOUT_METHOD = 'PAYOUT_METHOD',
  DESCRIPTION = 'DESCRIPTION',
  SUMMARY = 'SUMMARY',
}

const stepFields = <Id extends string>(steps: readonly FormStep<Id>[], id: Id) => steps.find(s => s.id === id).fields;

export const GRANT_FLOW_STEPS: readonly FormStep<GrantStep>[] = [
  { id: GrantStep.GRANT_PROVIDER, fields: ['accountSlug', 'expenseTypeOption'] },
  {
    id: GrantStep.INSTRUCTIONS,
    fields: ['acknowledgedCollectiveGrantExpensePolicy', 'acknowledgedHostGrantExpensePolicy'],
  },
  { id: GrantStep.INVITATION_NOTE, fields: [] },
  {
    id: GrantStep.WHO_WILL_RECEIVE_FUNDS,
    fields: stepFields(EXPENSE_FLOW_STEPS, ExpenseStep.WHO_IS_GETTING_PAID),
  },
  { id: GrantStep.PAYOUT_METHOD, fields: stepFields(EXPENSE_FLOW_STEPS, ExpenseStep.PAYOUT_METHOD) },
  {
    id: GrantStep.DESCRIPTION,
    fields: ['title', 'expenseItems', 'additionalAttachments', 'hasTax', 'tax', 'referenceCurrency'],
  },
  { id: GrantStep.SUMMARY, fields: [] },
];

export function getGrantStepFields(id: GrantStep): readonly FormFieldPath[] {
  return stepFields(GRANT_FLOW_STEPS, id);
}

// ---- Edit dialog sub-forms ----

/** The form values each edit dialog sub-form validates, and the Expense input fields it submits */
export const EDIT_EXPENSE_STEPS = {
  payee: {
    id: 'payee',
    fields: ['accountSlug', 'payeeSlug', 'payoutMethodId', 'expenseItems', 'hasTax', 'tax'],
    inputFields: ['payee', 'payeeLocation', 'currency', 'items', 'payoutMethod', 'tax'],
  },
  draftPayoutMethod: {
    id: 'draftPayoutMethod',
    fields: ['payoutMethodId', 'expenseItems', 'hasTax', 'tax', 'referenceCurrency'],
    inputFields: ['payoutMethod', 'payee', 'payeeLocation', 'currency', 'items', 'tax'],
  },
  expenseDetails: {
    id: 'expenseDetails',
    fields: [
      'expenseItems',
      'hasTax',
      'tax',
      'additionalAttachments',
      'invoiceFile',
      'invoiceNumber',
      'invoiceInfo',
      'referenceCurrency',
    ],
    inputFields: ['items', 'attachedFiles', 'invoiceInfo', 'invoiceFile', 'reference', 'currency', 'tax'],
  },
  attachReceipts: { id: 'attachReceipts', fields: ['expenseItems'], inputFields: ['items', 'attachedFiles'] },
  type: {
    id: 'type',
    fields: [
      'expenseItems',
      'hasTax',
      'tax',
      'additionalAttachments',
      'invoiceFile',
      'invoiceNumber',
      'invoiceInfo',
      'expenseTypeOption',
    ],
    inputFields: ['items', 'attachedFiles', 'invoiceFile', 'invoiceInfo', 'reference', 'type', 'tax'],
  },
} as const satisfies Record<string, FormStep & { inputFields: readonly (keyof ExpenseUpdateInput)[] }>;

// ---- Derivations ----

/** The top-level form values owned by the given fields, to validate them only */
export function getValidatedValueKeys(fields: readonly FormFieldPath[]): (keyof ExpenseFormValues)[] {
  return uniq(fields.map(field => field.split('.')[0] as keyof ExpenseFormValues));
}

export function getVisibleSteps<Id extends string>(steps: readonly FormStep<Id>[], options: ExpenseFormOptions) {
  return steps.filter(step => !step.isVisible || step.isVisible(options));
}

function getStepErrors(step: FormStep, errors: FormikErrors<ExpenseFormValues>) {
  return step.fields.filter(field => !isEmpty(get(errors, field)));
}

export function isStepComplete(step: FormStep, form: StepFormState): boolean {
  return !form.initialLoading && getStepErrors(step, form.errors).length === 0;
}

export function isStepTouched(step: FormStep, form: StepFormState): boolean {
  return !form.initialLoading && (step.fields.length === 0 || step.fields.some(field => get(form.touched, field)));
}

/** The first visible step with errors, to scroll to */
export function getFirstIncompleteStep<Id extends string>(steps: readonly FormStep<Id>[], form: StepFormState) {
  return getVisibleSteps(steps, form.options).find(step => !isStepComplete(step, form)) ?? null;
}
