/**
 * Types shared by the Expense form modules (values, options, start options).
 */
import type { TaxType } from '@opencollective/taxes';
import type { z } from 'zod';

import type {
  Currency,
  ExpenseFormSchemaHostFieldsFragment,
  ExpenseFormSchemaQuery,
  ExpenseLockableFields,
  ExpenseType,
  ExpenseVendorFieldsFragment,
  LocationInput,
  MakeOptional,
  PayoutMethodType,
} from '../../../lib/graphql/types/v2/graphql';

import type { FormFieldPath } from './form-steps';

export enum InviteeAccountType {
  INDIVIDUAL = 'INDIVIDUAL',
  ORGANIZATION = 'ORGANIZATION',
}

export type ExpenseItem = {
  id?: string;
  key?: string; // used to enable FlipMove animations (will either be a generated uuid on "Add item", or using the expense item id)
  description?: string;
  incurredAt?: string;
  amount?: {
    value?: number;
    valueInCents?: number;
    currency?: string;
    exchangeRate?: {
      value?: number;
      source?: string;
      fromCurrency?: string;
      toCurrency?: string;
      date?: string;
    };
    referenceExchangeRate?: ExpenseItem['amount']['exchangeRate'] | { source: 'OPENCOLLECTIVE' };
  };
  attachment?: Attachment;
};

export enum RecurrenceFrequencyOption {
  NONE = 'none',
  MONTH = 'month',
  QUARTER = 'quarter',
  WEEK = 'week',
  YEAR = 'year',
}

export enum YesNoOption {
  YES = 'yes',
  NO = 'no',
}

export type Attachment =
  | string
  | {
      id?: string;
      name?: string;
      size?: number;
      type?: string;
      url?: string;
    };

export type ExpenseFormValues = {
  accountSlug?: string;

  inviteeExistingAccount?: string;

  inviteeAccountType: InviteeAccountType;

  inviteeNewIndividual: {
    name?: string;
    email?: string;
  };

  inviteeNewOrganization: {
    name?: string;
    email?: string;
    organization: {
      name?: string;
      slug?: string;
      website?: string;
      description?: string;
    };
  };

  inviteNote?: string;

  recurrenceFrequency?: RecurrenceFrequencyOption;
  recurrenceEndAt?: string;

  payoutMethodNameDiscrepancyReason?: string;
  newPayoutMethod: {
    type?: PayoutMethodType;
    name?: string;
    isSaved?: boolean;
    data?: { currency?: string; accountHolderName?: string } & Record<string, unknown>;
  };

  payeeSlug?: string;
  payeeLocation?: LocationInput;
  expenseTypeOption?: ExpenseType;
  payoutMethodId?: string;
  title?: string;
  accountingCategoryId?: string;
  tags?: string[];
  privateMessage?: string;
  expenseItems?: ExpenseItem[];
  additionalAttachments?: Attachment[];
  referenceCurrency?: Currency; // The "payment source" currency to use for conversions
  hasTax?: boolean;
  tax?: {
    rate: number;
    idNumber: string;
  };
  acknowledgedCollectiveInvoiceExpensePolicy?: boolean;
  acknowledgedCollectiveReceiptExpensePolicy?: boolean;
  acknowledgedCollectiveTitleExpensePolicy?: boolean;
  acknowledgedCollectiveGrantExpensePolicy?: boolean;
  acknowledgedHostInvoiceExpensePolicy?: boolean;
  acknowledgedHostReceiptExpensePolicy?: boolean;
  acknowledgedHostTitleExpensePolicy?: boolean;
  acknowledgedHostGrantExpensePolicy?: boolean;
  hasInvoiceOption?: YesNoOption;
  invoiceFile?: Attachment;
  invoiceNumber?: string;
  invoiceInfo?: string;
};

export type ExpenseFormOptions = {
  schema: z.ZodType<RecursivePartial<ExpenseFormValues>>;
  supportedExpenseTypes?: ExpenseType[];
  allowInvite?: boolean;
  payoutProfiles?: ExpenseFormSchemaQuery['loggedInAccount'][];
  payoutMethods?: Array<
    MakeOptional<ExpenseFormSchemaQuery['loggedInAccount']['payoutMethods'][number], 'createdAt' | 'updatedAt'>
  >;
  payoutMethod?:
    ExpenseFormSchemaQuery['loggedInAccount']['payoutMethods'][number] | ExpenseFormValues['newPayoutMethod'];
  supportedPayoutMethods?: PayoutMethodType[];
  newPayoutMethodTypes?: PayoutMethodType[];
  expenseTags?: ExpenseFormSchemaHostFieldsFragment['expensesTags'];
  isAccountingCategoryRequired?: boolean;
  accountingCategories?: ExpenseFormSchemaHostFieldsFragment['accountingCategories']['nodes'];
  allowExpenseItemAttachment?: boolean;
  taxType?: TaxType;
  recentlySubmittedExpenses?: ExpenseFormSchemaQuery['recentlySubmittedExpenses'];
  host?: ExpenseFormSchemaHostFieldsFragment;
  vendorsForAccount?: ExpenseVendorFieldsFragment[];
  showVendorsOption?: boolean;
  account?: ExpenseFormSchemaQuery['account'] | ExpenseFormSchemaQuery['expense']['account'];
  payee?: ExpenseFormSchemaQuery['payee'];
  isAdminOfPayee?: boolean;
  isAdminOfPayeeHost?: boolean;
  isHostAdmin?: boolean;
  submitter?: ExpenseFormSchemaQuery['submitter'];
  loggedInAccount?: ExpenseFormSchemaQuery['loggedInAccount'];
  expense?: ExpenseFormSchemaQuery['expense'];
  totalInvoicedInExpenseCurrency?: number;
  invitee?: ExpenseFormValues['inviteeNewIndividual'] | ExpenseFormValues['inviteeNewOrganization'];
  expenseCurrency?: Currency;
  availableReferenceCurrencies?: Currency[]; // Available currencies that can be selected as reference
  allowDifferentItemCurrency?: boolean;
  isLongFormItemDescription?: boolean;
  hasExpenseItemDate?: boolean;
  canSetupRecurrence?: boolean;
  canChangeAccount?: boolean;
  lockedFields?: ExpenseLockableFields[];
  hasInvalidAccount?: boolean;
  isPaypalConnectEnabled?: boolean;
};

export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object | undefined
      ? RecursivePartial<T[P]>
      : T[P];
};

export type ExpenseFormStartOptions = {
  duplicateExpense?: boolean;
  expenseId?: number;
  draftKey?: string;
  isInlineEdit?: boolean;
  /** Only validate these fields (partial validation), all by default */
  pickSchemaFields?: readonly FormFieldPath[];
};

/** All the form values, at runtime (the type checker ensures the list is complete) */
export const EXPENSE_FORM_VALUE_KEYS = Object.keys({
  accountSlug: true,
  inviteeExistingAccount: true,
  inviteeAccountType: true,
  inviteeNewIndividual: true,
  inviteeNewOrganization: true,
  inviteNote: true,
  recurrenceFrequency: true,
  recurrenceEndAt: true,
  payoutMethodNameDiscrepancyReason: true,
  newPayoutMethod: true,
  payeeSlug: true,
  payeeLocation: true,
  expenseTypeOption: true,
  payoutMethodId: true,
  title: true,
  accountingCategoryId: true,
  tags: true,
  privateMessage: true,
  expenseItems: true,
  additionalAttachments: true,
  referenceCurrency: true,
  hasTax: true,
  tax: true,
  acknowledgedCollectiveInvoiceExpensePolicy: true,
  acknowledgedCollectiveReceiptExpensePolicy: true,
  acknowledgedCollectiveTitleExpensePolicy: true,
  acknowledgedCollectiveGrantExpensePolicy: true,
  acknowledgedHostInvoiceExpensePolicy: true,
  acknowledgedHostReceiptExpensePolicy: true,
  acknowledgedHostTitleExpensePolicy: true,
  acknowledgedHostGrantExpensePolicy: true,
  hasInvoiceOption: true,
  invoiceFile: true,
  invoiceNumber: true,
  invoiceInfo: true,
} satisfies Record<keyof ExpenseFormValues, true>) as (keyof ExpenseFormValues)[];
