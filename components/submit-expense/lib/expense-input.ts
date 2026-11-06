/**
 * Expense input: turns Expense form values into the input of the mutation that submits them.
 *
 * This is the only place that knows how form values map to `createExpense`,
 * `draftExpenseAndInviteUser` and `editExpense` inputs.
 */
import dayjs from 'dayjs';
import { isEmpty, pick } from 'lodash-es';

import { CollectiveType } from '../../../lib/constants/collectives';
import { standardizeExpenseItemIncurredAt } from '../../../lib/expenses';
import type {
  CreateExpenseFromDashboardMutationVariables,
  CurrencyExchangeRateInput,
  EditExpenseFromDashboardMutationVariables,
  InviteExpenseFromDashboardMutationVariables,
  RecurringExpenseInput,
  RecurringExpenseInterval,
} from '../../../lib/graphql/types/v2/graphql';
import { type Currency, ExpenseStatus, ExpenseType, PayoutMethodType } from '../../../lib/graphql/types/v2/graphql';
import {
  NEW_ACCOUNT_BALANCE_PAYOUT_METHOD_ID,
  NEW_PAYOUT_METHOD_ID,
  PAYEE_SLUG_INVITE_EXISTING_USER,
} from '../../expenses/lib/constants';

import type { Attachment, ExpenseFormOptions, ExpenseFormStartOptions, ExpenseFormValues } from './types';
import { InviteeAccountType, RecurrenceFrequencyOption, YesNoOption } from './types';

type ExpenseCreateInput = CreateExpenseFromDashboardMutationVariables['expenseCreateInput'];

export type ExpenseSubmissionPlan =
  | { kind: 'create'; variables: CreateExpenseFromDashboardMutationVariables }
  | { kind: 'invite'; variables: InviteExpenseFromDashboardMutationVariables }
  | { kind: 'edit'; variables: EditExpenseFromDashboardMutationVariables };

const getAttachmentUrl = (attachment: Attachment): string =>
  typeof attachment === 'string' ? attachment : attachment?.url;

export function generateGrantTitle(
  account: ExpenseFormOptions['account'],
  payee: ExpenseFormOptions['payee'],
  invitee: ExpenseFormOptions['invitee'],
): string {
  return `${account.name} - ${payee ? payee.name : invitee?.name}`;
}

/**
 * An empty end date means open-ended recurrence (`endsAt: null`). Invalid dates are defensively
 * mapped to `null`: `dayjs(undefined).toDate()` returns the current time, which previously created
 * recurring expenses that could never recur.
 */
function getRecurringExpenseInput(
  recurrenceFrequency?: RecurrenceFrequencyOption,
  recurrenceEndAt?: string,
): RecurringExpenseInput | undefined {
  if (!recurrenceFrequency || recurrenceFrequency === RecurrenceFrequencyOption.NONE) {
    return undefined;
  }

  const endsAt = recurrenceEndAt ? dayjs(recurrenceEndAt) : null;
  return {
    interval: recurrenceFrequency as unknown as RecurringExpenseInterval,
    endsAt: endsAt && endsAt.isValid() ? endsAt.toDate() : null,
  };
}

function getPayoutMethodInput(values: ExpenseFormValues): ExpenseCreateInput['payoutMethod'] {
  if (!values.payoutMethodId || values.payoutMethodId === NEW_PAYOUT_METHOD_ID) {
    return { ...values.newPayoutMethod, isSaved: false };
  } else if (values.payoutMethodId === NEW_ACCOUNT_BALANCE_PAYOUT_METHOD_ID) {
    return { type: PayoutMethodType.ACCOUNT_BALANCE, data: {} };
  } else {
    return { id: values.payoutMethodId };
  }
}

function getInvoiceFileInput(values: ExpenseFormValues): ExpenseCreateInput['invoiceFile'] {
  if (values.hasInvoiceOption === YesNoOption.NO) {
    return null;
  } else if (values.invoiceFile) {
    return { url: getAttachmentUrl(values.invoiceFile) };
  } else {
    return undefined;
  }
}

function getItemsInput(values: ExpenseFormValues): ExpenseCreateInput['items'] {
  return values.expenseItems.map(ei => ({
    id: ei.id,
    description: ei.description,
    amountV2: {
      valueInCents: ei.amount.valueInCents,
      currency: ei.amount.currency as Currency,
      exchangeRate: ei.amount.exchangeRate
        ? ({
            ...pick(ei.amount.exchangeRate, ['source', 'rate', 'value', 'fromCurrency', 'toCurrency']),
            date: standardizeExpenseItemIncurredAt(ei.amount.exchangeRate.date || ei.incurredAt),
          } as CurrencyExchangeRateInput)
        : null,
    },
    incurredAt: values.expenseTypeOption === ExpenseType.GRANT ? new Date() : new Date(ei.incurredAt),
    url: values.expenseTypeOption === ExpenseType.RECEIPT ? getAttachmentUrl(ei.attachment) : null,
  }));
}

function getExpenseInput(
  values: ExpenseFormValues,
  options: ExpenseFormOptions,
  customData: Record<string, unknown> | undefined,
): ExpenseCreateInput {
  return {
    description:
      values.expenseTypeOption === ExpenseType.GRANT && isEmpty(values.title)
        ? generateGrantTitle(options.account, options.payee, options.invitee)
        : values.title,
    reference:
      values.expenseTypeOption === ExpenseType.INVOICE && values.hasInvoiceOption === YesNoOption.YES
        ? values.invoiceNumber
        : null,
    payee: { slug: options.payee?.slug },
    payeeLocation: values.payeeLocation,
    payoutMethod: getPayoutMethodInput(values),
    type: values.expenseTypeOption,
    accountingCategory: values.accountingCategoryId ? { id: values.accountingCategoryId } : null,
    attachedFiles: values.additionalAttachments.map(a => ({ url: getAttachmentUrl(a) })),
    currency: options.expenseCurrency,
    customData,
    invoiceInfo: values.invoiceInfo || null,
    invoiceFile: getInvoiceFileInput(values),
    items: getItemsInput(values),
    longDescription: null,
    privateMessage: values.privateMessage || null,
    tags: values.tags,
    tax: values.hasTax ? [{ rate: values.tax.rate, type: options.taxType, idNumber: values.tax.idNumber }] : null,
  };
}

function getNewInviteePayee(values: ExpenseFormValues) {
  if (values.inviteeAccountType === InviteeAccountType.INDIVIDUAL) {
    return values.inviteeNewIndividual;
  } else if (values.inviteeAccountType === InviteeAccountType.ORGANIZATION) {
    return values.inviteeNewOrganization;
  }
}

/**
 * Plans the submission of the Expense form: which mutation to run (create, invite or edit) and its
 * variables. Pure: the caller executes the plan.
 */
export function planExpenseSubmission(
  values: ExpenseFormValues,
  options: ExpenseFormOptions,
  startOptions: ExpenseFormStartOptions,
  { customData }: { customData?: Record<string, unknown> } = {},
): ExpenseSubmissionPlan {
  const expenseInput = getExpenseInput(values, options, customData);

  if (options.expense?.id && !startOptions.duplicateExpense) {
    const isConfirmingInvite = options.expense.status === ExpenseStatus.DRAFT && !options.payee?.slug;
    return {
      kind: 'edit',
      variables: {
        draftKey: startOptions.draftKey,
        expenseEditInput: {
          ...expenseInput,
          id: options.expense.id,
          payee: !isConfirmingInvite
            ? { slug: options.payee?.slug }
            : (getNewInviteePayee(values) ?? options.expense.draft?.payee),
        },
      },
    };
  } else if (
    options.payee?.type === CollectiveType.VENDOR ||
    options.payoutProfiles?.some(p => p.slug === values.payeeSlug)
  ) {
    return {
      kind: 'create',
      variables: {
        account: { slug: options.account?.slug },
        expenseCreateInput: expenseInput,
        ...(values.recurrenceFrequency !== RecurrenceFrequencyOption.NONE
          ? { recurring: getRecurringExpenseInput(values.recurrenceFrequency, values.recurrenceEndAt) }
          : {}),
      },
    };
  } else {
    const payee =
      values.payeeSlug === PAYEE_SLUG_INVITE_EXISTING_USER
        ? { slug: values.inviteeExistingAccount }
        : values.inviteeAccountType === InviteeAccountType.INDIVIDUAL
          ? values.inviteeNewIndividual
          : values.inviteeNewOrganization;
    return {
      kind: 'invite',
      variables: {
        account: { slug: options.account?.slug },
        expenseInviteInput: { ...expenseInput, payee: { ...payee, isInvite: true }, recipientNote: values.inviteNote },
      },
    };
  }
}
