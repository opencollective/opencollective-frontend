import React from 'react';
import type { ApolloClient, FetchResult } from '@apollo/client';
import { gql, useApolloClient, useMutation } from '@apollo/client';
import { accountHasGST, accountHasVAT, checkVATNumberFormat, TaxType } from '@opencollective/taxes';
import dayjs from 'dayjs';
import type { Path, PathValue } from 'dot-path-value';
import type { FieldInputProps, FormikErrors, FormikHelpers } from 'formik';
import { useFormik } from 'formik';
import { isEmpty, isEqual, isNull, omit, pick, set, uniqBy } from 'lodash';
import memoizeOne from 'memoize-one';
import type { IntlShape } from 'react-intl';
import { useIntl } from 'react-intl';
import type { ZodObjectDef } from 'zod';
import z from 'zod';

import { AccountTypesWithHost, CollectiveType } from '../../lib/constants/collectives';
import { getPayoutProfiles } from '../../lib/expenses';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import type {
  CreateExpenseFromDashboardMutation,
  CreateExpenseFromDashboardMutationVariables,
  EditExpenseFromDashboardMutation,
  EditExpenseFromDashboardMutationVariables,
  ExpenseFormExchangeRatesQuery,
  ExpenseFormExchangeRatesQueryVariables,
  ExpenseFormSchemaHostFieldsFragment,
  ExpenseFormSchemaQuery,
  ExpenseFormSchemaQueryVariables,
  ExpenseVendorFieldsFragment,
  InviteExpenseFromDashboardMutation,
  InviteExpenseFromDashboardMutationVariables,
  LocationInput,
} from '../../lib/graphql/types/v2/graphql';
import type { Amount, CurrencyExchangeRateInput, RecurringExpenseInterval } from '../../lib/graphql/types/v2/schema';
import {
  Currency,
  ExpenseLockableFields,
  ExpenseStatus,
  ExpenseType,
  PayoutMethodType,
} from '../../lib/graphql/types/v2/schema';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import type LoggedInUser from '../../lib/LoggedInUser';
import { isValidEmail } from '../../lib/utils';
import { userMustSetAccountingCategory } from '../expenses/lib/accounting-categories';
import { computeExpenseAmounts } from '../expenses/lib/utils';
import { AnalyticsEvent } from '@/lib/analytics/events';
import { track } from '@/lib/analytics/plausible';

import { accountHoverCardFields } from '../AccountHoverCard';
import { loggedInAccountExpensePayoutFieldsFragment } from '../expenses/graphql/fragments';
import { validatePayoutMethod } from '../expenses/PayoutMethodForm';
import { getCustomZodErrorMap } from '../FormikZod';

export enum InviteeAccountType {
  INDIVIDUAL = 'INDIVIDUAL',
  ORGANIZATION = 'ORGANIZATION',
}

type ExpenseItem = {
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

type Attachment =
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
  expenseItems?: ExpenseItem[];
  additionalAttachments?: Attachment[];
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
};

type ExpenseFormik = Omit<ReturnType<typeof useFormik<ExpenseFormValues>>, 'setFieldValue' | 'getFieldProps'> & {
  setFieldValue: <F extends Path<ExpenseFormValues>>(
    field: F,
    value: PathValue<ExpenseFormValues, F>,
  ) => Promise<void> | Promise<FormikErrors<ExpenseFormValues>>;
  getFieldProps: <F extends Path<ExpenseFormValues>>(field: F) => FieldInputProps<any>;
};

export type ExpenseForm = ExpenseFormik & {
  options: ExpenseFormOptions;
  startOptions: ExpenseFormStartOptions;
  initialLoading: boolean;
  refresh: () => void;
};

const formSchemaQuery = gql`
  query ExpenseFormSchema(
    $collectiveSlug: String
    $hasCollectiveSlug: Boolean!
    $payeeSlug: String
    $hasPayeeSlug: Boolean!
    $submitterSlug: String
    $hasSubmitterSlug: Boolean!
    $hasExpenseId: Boolean!
    $expenseId: Int
    $expenseKey: String
  ) {
    account(slug: $collectiveSlug) @include(if: $hasCollectiveSlug) {
      ...ExpenseFormAccountFields

      ... on AccountWithHost {
        host {
          vendorsForAccount: vendors(forAccount: { slug: $collectiveSlug }, limit: 5) {
            nodes {
              ...ExpenseVendorFields
            }
          }
          vendors(limit: 1) {
            totalCount
          }
        }
      }

      ... on Organization {
        host {
          vendorsForAccount: vendors(forAccount: { slug: $collectiveSlug }, limit: 5) {
            nodes {
              ...ExpenseVendorFields
            }
          }
          vendors(limit: 1) {
            totalCount
          }
        }
      }
    }

    payee: account(slug: $payeeSlug) @include(if: $hasPayeeSlug) {
      ...ExpenseFormPayeeFields
    }

    loggedInAccount {
      id
      legacyId
      ...LoggedInAccountExpensePayoutFields
    }

    submitter: account(slug: $submitterSlug) @include(if: $hasSubmitterSlug) {
      ...ExpenseFormSubmitterFields
    }

    recentlySubmittedExpenses: expenses(
      createdByAccount: { slug: $submitterSlug }
      limit: 10
      types: [INVOICE, RECEIPT]
      orderBy: { field: CREATED_AT, direction: DESC }
    ) @include(if: $hasSubmitterSlug) {
      nodes {
        account {
          ...ExpenseFormAccountFields
        }
        payee {
          ...ExpenseFormAccountFields
        }
        payoutMethod {
          id
        }
      }
    }

    expense(expense: { legacyId: $expenseId }, draftKey: $expenseKey) @include(if: $hasExpenseId) {
      id
      legacyId
      description
      createdAt
      longDescription
      amountV2 {
        valueInCents
        currency
      }
      taxes {
        id
        type
        rate
        idNumber
      }
      requiredLegalDocuments
      accountingCategory {
        id
      }
      currency
      type
      status
      account {
        ...ExpenseFormAccountFields
      }
      createdByAccount {
        ...ExpenseFormAccountFields
      }
      payee {
        ...ExpenseFormPayeeFields
      }
      payoutMethod {
        id
      }
      attachedFiles {
        id
        url
        info {
          name
          type
          size
        }
      }
      invoiceFile {
        id
        url
        name
        type
        size
        ... on ImageFileInfo {
          width
        }
      }
      items {
        id
        description
        url
        file {
          name
          type
          size
        }
        amount: amountV2 {
          currency
          valueInCents
          exchangeRate {
            value
            source
            fromCurrency
            toCurrency
            date
          }
        }
        createdAt
        incurredAt
      }
      privateMessage
      invoiceInfo
      reference
      tags
      permissions {
        id
        canEdit
        canEditAccountingCategory
        canEditTags
        canDeclineExpenseInvite(draftKey: $expenseKey)
      }
      draft
      lockedFields
      submitter: createdByAccount {
        ...ExpenseFormSubmitterFields
      }
    }
  }

  ${loggedInAccountExpensePayoutFieldsFragment}

  fragment ExpenseFormSchemaFeatureFields on Account {
    features {
      id
      MULTI_CURRENCY_EXPENSES
      PAYPAL_PAYOUTS
    }
  }

  fragment ExpenseFormSchemaPolicyFields on Account {
    policies {
      EXPENSE_CATEGORIZATION {
        requiredForExpenseSubmitters
        requiredForCollectiveAdmins
      }

      EXPENSE_POLICIES {
        invoicePolicy
        receiptPolicy
        titlePolicy
        grantPolicy
      }
    }
  }

  fragment ExpenseFormSchemaHostFields on Host {
    id
    legacyId
    name
    legalName
    slug
    type
    currency
    settings

    location {
      id
      address
      country
    }
    transferwise {
      id
      availableCurrencies
    }

    supportedPayoutMethods
    isTrustedHost

    expensesTags {
      id
      tag
    }

    ...ExpenseFormSchemaPolicyFields
    ...ExpenseFormSchemaFeatureFields

    accountingCategories(kind: EXPENSE) {
      nodes {
        id
        name
        kind
        expensesTypes
        friendlyName
        code
        instructions
        appliesTo
      }
    }
  }

  fragment ExpenseVendorFields on Vendor {
    id
    slug
    name
    type
    description
    imageUrl(height: 64)
    hasPayoutMethod
    payoutMethods {
      id
      type
      name
      data
      isSaved
    }
  }

  fragment ExpenseFormAccountFields on Account {
    id
    legacyId
    name
    slug
    type
    currency
    settings
    supportedExpenseTypes

    stats {
      balance {
        valueInCents
        currency
      }
    }

    ...AccountHoverCardFields
    ...ExpenseFormSchemaFeatureFields
    ...ExpenseFormSchemaPolicyFields

    ... on AccountWithHost {
      host {
        ...ExpenseFormSchemaHostFields
      }
    }
    ... on Organization {
      host {
        ...ExpenseFormSchemaHostFields
      }
    }

    policies {
      EXPENSE_POLICIES {
        invoicePolicy
        receiptPolicy
        titlePolicy
        grantPolicy
      }
    }

    ... on AccountWithParent {
      parent {
        id
        legacyId
        slug
      }
    }

    admins: members(role: ADMIN) {
      totalCount
      nodes {
        id
        account {
          id
          type
          slug
          name
          imageUrl
          ...AccountHoverCardFields
          emails
        }
      }
    }
  }

  fragment ExpenseFormSubmitterFields on Account {
    id
    slug
    name
    imageUrl
  }

  fragment ExpenseFormPayeeFields on Account {
    id
    legacyId
    slug
    name
    legalName
    type
    isAdmin
    payoutMethods {
      id
      type
      name
      data
      isSaved
      canBeEditedOrDeleted
    }

    location {
      address
      country
    }

    ... on AccountWithHost {
      host {
        ...ExpenseFormSchemaHostFields
      }
    }
    ... on Organization {
      host {
        ...ExpenseFormSchemaHostFields
      }
    }
    ... on AccountWithParent {
      parent {
        id
        slug
      }
    }
  }

  ${accountHoverCardFields}
`;

type ExpenseFormOptions = {
  schema: z.ZodType<RecursivePartial<ExpenseFormValues>, ZodObjectDef, RecursivePartial<ExpenseFormValues>>;
  supportedExpenseTypes?: ExpenseType[];
  allowInvite?: boolean;
  payoutProfiles?: ExpenseFormSchemaQuery['loggedInAccount'][];
  payoutMethods?: ExpenseFormSchemaQuery['loggedInAccount']['payoutMethods'];
  payoutMethod?:
    | ExpenseFormSchemaQuery['loggedInAccount']['payoutMethods'][number]
    | ExpenseFormValues['newPayoutMethod'];
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
  submitter?: ExpenseFormSchemaQuery['submitter'];
  loggedInAccount?: ExpenseFormSchemaQuery['loggedInAccount'];
  expense?: ExpenseFormSchemaQuery['expense'];
  totalInvoicedInExpenseCurrency?: number;
  invitee?: ExpenseFormValues['inviteeNewIndividual'] | ExpenseFormValues['inviteeNewOrganization'];
  expenseCurrency?: Currency;
  allowDifferentItemCurrency?: boolean;
  isLongFormItemDescription?: boolean;
  hasExpenseItemDate?: boolean;
  canSetupRecurrence?: boolean;
  canChangeAccount?: boolean;
  lockedFields?: ExpenseLockableFields[];
};

const memoizedExpenseFormSchema = memoizeOne(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (apolloClient: ApolloClient<any>, variables: ExpenseFormSchemaQueryVariables, refresh?: boolean) => {
    return await apolloClient.query<ExpenseFormSchemaQuery, ExpenseFormSchemaQueryVariables>({
      query: formSchemaQuery,
      context: API_V2_CONTEXT,
      variables: variables,
      errorPolicy: 'all',
      fetchPolicy: refresh ? 'network-only' : 'cache-first',
    });
  },
  (newArgs, lastArgs) => {
    const [, newVariables, refresh] = newArgs;
    const [, lastVariables] = lastArgs;

    return !refresh && isEqual(newVariables, lastVariables);
  },
);

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object | undefined
      ? RecursivePartial<T[P]>
      : T[P];
};

function buildFormSchema(
  values: ExpenseFormValues,
  options: Omit<ExpenseFormOptions, 'schema'>,
  intl: IntlShape,
  pickSchemaFields?: Record<string, boolean>,
): z.ZodType<RecursivePartial<ExpenseFormValues>, z.ZodObjectDef, RecursivePartial<ExpenseFormValues>> {
  const schema = z.object({
    accountSlug: z
      .string()
      .nullish()
      .refine(
        slug => {
          return slug && !slug.startsWith('__');
        },
        {
          message: 'Required',
        },
      ),
    payeeSlug: z
      .string()
      .nullish()
      .refine(
        slug => {
          if (slug === '__invite' || slug === '__inviteExistingUser') {
            return true;
          }

          return options.expense?.status === ExpenseStatus.DRAFT && !options.loggedInAccount
            ? true
            : slug && !slug.startsWith('__');
        },
        {
          message: 'Required',
        },
      ),
    expenseId: z.number().nullish(),
    expenseTypeOption: z.nativeEnum(ExpenseType).refine(
      v => {
        if (options.account?.supportedExpenseTypes?.length > 0) {
          return options.account.supportedExpenseTypes.includes(v);
        }

        return true;
      },
      {
        message: 'Required',
      },
    ),
    payoutMethodId: z
      .string()
      .nullish()
      .refine(
        v => {
          if (['__invite', '__inviteSomeone', '__inviteExistingUser'].includes(values.payeeSlug)) {
            return true;
          }
          if (
            v === '__newAccountBalancePayoutMethod' &&
            options.payoutMethods?.some(pm => pm.type === PayoutMethodType.ACCOUNT_BALANCE)
          ) {
            return true;
          }
          if (v && v !== '__newPayoutMethod' && !options.payee?.payoutMethods?.some(pm => pm.id === v)) {
            return false;
          }

          return true;
        },
        {
          message: 'Required',
        },
      ),
    accountingCategoryId: z
      .string()
      .nullish()
      .refine(
        v => {
          if (
            options.isAccountingCategoryRequired &&
            options.accountingCategories?.length > 0 &&
            !options.accountingCategories.some(ac => ac.id === v) &&
            !isNull(v) // null represents "I don't know" and is a valid option
          ) {
            return false;
          }

          return true;
        },
        {
          message: 'Required',
        },
      ),
    title: z
      .string()
      .nullish()
      .refine(
        v => {
          if (
            ['__invite', '__inviteSomeone', '__inviteExistingUser'].includes(values.payeeSlug) ||
            values.expenseTypeOption === ExpenseType.GRANT
          ) {
            return true;
          }

          return v.length > 0;
        },
        {
          message: 'Required',
        },
      ),
    reference: z.string().optional(),
    tags: z.array(z.string()).optional(),
    expenseAttachedFiles: z
      .array(
        z.object({
          url: z.string().url(),
        }),
      )
      .optional()
      .nullable(),
    invoiceFile: z
      .union([
        z.string().url().nullish(),
        z.object({
          url: z.string().url().nullish(),
        }),
      ])
      .refine(
        attachment => {
          if (['__invite', '__inviteSomeone', '__inviteExistingUser'].includes(values.payeeSlug)) {
            return true;
          }

          if (values.expenseTypeOption === ExpenseType.INVOICE && values.hasInvoiceOption === YesNoOption.YES) {
            return typeof attachment === 'string' ? !!attachment : !!attachment?.url;
          }
          return true;
        },
        {
          message: 'Required',
        },
      ),
    invoiceNumber: z
      .string()
      .nullish()
      .refine(
        invoiceNumber => {
          if (['__invite', '__inviteSomeone', '__inviteExistingUser'].includes(values.payeeSlug)) {
            return true;
          }

          if (values.expenseTypeOption === ExpenseType.INVOICE && values.hasInvoiceOption === YesNoOption.YES) {
            return !!invoiceNumber;
          }
          return true;
        },
        {
          message: 'Required',
        },
      ),
    expenseItems: z.array(
      z
        .object({
          description: z
            .string()
            .nullish()
            .refine(
              v => {
                if (!options.isAdminOfPayee) {
                  return true;
                }

                return v.length > 0;
              },
              {
                message: 'Required',
              },
            ),
          attachment: z
            .union([
              z.string().nullish(),
              z.object({
                url: z.string().nullish(),
              }),
            ])
            .nullish()
            .refine(
              attachment => {
                if ([ExpenseType.GRANT, ExpenseType.INVOICE].includes(values.expenseTypeOption)) {
                  return true;
                }

                return typeof attachment === 'string' ? !!attachment : !!attachment?.url;
              },
              {
                message: 'Required',
              },
            ),
          incurredAt: z
            .string()
            .nullish()
            .refine(
              incurredAt => {
                if (values.expenseTypeOption === ExpenseType.GRANT) {
                  return true;
                }

                return !!incurredAt;
              },
              {
                message: 'Required',
              },
            ),
          amount: z.object({
            valueInCents: z.number().min(1),
            currency: z.string().refine(v => Object.values(Currency).includes(v as Currency), {
              message: `Currency must be one of: ${Object.values(Currency).join(',')}`,
            }),
            exchangeRate: z
              .object({
                value: z.number(),
                source: z.string(),
                fromCurrency: z.string(),
                toCurrency: z.string(),
                date: z.string().nullable(),
              })
              .nullable(),
          }),
        })
        .refine(
          item => {
            if (item.amount.currency && item.amount.currency !== options.expenseCurrency) {
              return (
                item.amount.exchangeRate?.value &&
                item.amount.exchangeRate?.source &&
                item.amount.exchangeRate?.toCurrency === options.expenseCurrency
              );
            }
            return true;
          },
          {
            message: intl.formatMessage({ defaultMessage: 'Missing exchange rate', id: 'UXE8lX' }),
            path: ['amount', 'exchangeRate', 'value'],
          },
        ),
    ),
    hasTax: z.boolean().nullable(),
    tax: z
      .object({
        rate: z
          .number()
          .refine(
            v => {
              if (options.taxType !== TaxType.GST) {
                return true;
              }
              return [0, 0.15].includes(v);
            },
            {
              message: 'GST tax must be 0% or 15%',
            },
          )
          .refine(
            v => {
              if (options.taxType !== TaxType.VAT) {
                return true;
              }

              return v > 0 && v < 1;
            },
            {
              message: 'VAT tax must be between 0% and 100%',
            },
          ),
        idNumber: z
          .string()
          .nullable()
          .refine(
            v => {
              if (options.taxType !== TaxType.VAT) {
                return true;
              }

              return checkVATNumberFormat(v).isValid;
            },
            {
              message: 'Invalid VAT Number',
            },
          ),
      })
      .nullable()
      .refine(v => {
        if (!values.hasTax) {
          return true;
        }

        return !!v;
      }),
    acknowledgedCollectiveInvoiceExpensePolicy: z
      .boolean()
      .nullish()
      .refine(
        v =>
          values.expenseTypeOption === ExpenseType.INVOICE && options.account?.policies?.EXPENSE_POLICIES?.invoicePolicy
            ? v
            : true,
        {
          message: 'Required',
        },
      ),
    acknowledgedCollectiveReceiptExpensePolicy: z
      .boolean()
      .nullish()
      .refine(
        v =>
          values.expenseTypeOption === ExpenseType.RECEIPT && options.account?.policies?.EXPENSE_POLICIES?.receiptPolicy
            ? v
            : true,
        {
          message: 'Required',
        },
      ),
    acknowledgedCollectiveTitleExpensePolicy: z
      .boolean()
      .nullish()
      .refine(
        v => {
          if (values.expenseTypeOption === ExpenseType.GRANT) {
            return true;
          }
          return options.account?.policies?.EXPENSE_POLICIES?.titlePolicy ? v : true;
        },
        {
          message: 'Required',
        },
      ),
    acknowledgedCollectiveGrantExpensePolicy: z
      .boolean()
      .nullish()
      .refine(
        v =>
          values.expenseTypeOption === ExpenseType.GRANT && options.account?.policies?.EXPENSE_POLICIES?.grantPolicy
            ? v
            : true,
        {
          message: 'Required',
        },
      ),
    acknowledgedHostInvoiceExpensePolicy: z
      .boolean()
      .nullish()
      .refine(
        v =>
          values.expenseTypeOption === ExpenseType.INVOICE &&
          options.host?.policies?.EXPENSE_POLICIES?.invoicePolicy &&
          options.host?.slug !== options.account?.slug
            ? v
            : true,
        {
          message: 'Required',
        },
      ),
    acknowledgedHostReceiptExpensePolicy: z
      .boolean()
      .nullish()
      .refine(
        v =>
          values.expenseTypeOption === ExpenseType.RECEIPT &&
          options.host?.policies?.EXPENSE_POLICIES?.receiptPolicy &&
          options.host?.slug !== options.account?.slug
            ? v
            : true,
        {
          message: 'Required',
        },
      ),
    acknowledgedHostTitleExpensePolicy: z
      .boolean()
      .nullish()
      .refine(
        v => {
          if (values.expenseTypeOption === ExpenseType.GRANT) {
            return true;
          }
          return options.host?.policies?.EXPENSE_POLICIES?.titlePolicy && options.host?.slug !== options.account?.slug
            ? v
            : true;
        },
        {
          message: 'Required',
        },
      ),
    acknowledgedHostGrantExpensePolicy: z
      .boolean()
      .nullish()
      .refine(
        v =>
          values.expenseTypeOption === ExpenseType.GRANT &&
          options.host?.policies?.EXPENSE_POLICIES?.grantPolicy &&
          options.host?.slug !== options.account?.slug
            ? v
            : true,
        {
          message: 'Required',
        },
      ),
    payoutMethodNameDiscrepancyReason: z
      .string()
      .nullish()
      .refine(
        v => {
          if (options.payoutMethod?.type === PayoutMethodType.BANK_ACCOUNT) {
            const accountHolderName: string = options.payoutMethod?.data?.accountHolderName ?? '';
            const payeeLegalName: string = options.payee?.legalName ?? '';
            if (accountHolderName.trim().toLowerCase() !== payeeLegalName.trim().toLowerCase()) {
              return !!v;
            }
          }

          return true;
        },
        {
          message: 'Required',
        },
      ),
    newPayoutMethod: z.object({
      type: z
        .nativeEnum(PayoutMethodType)
        .nullish()
        .refine(
          type => {
            if (['__invite', '__inviteSomeone', '__inviteExistingUser'].includes(values.payeeSlug)) {
              return true;
            }

            if (options.expense?.status === ExpenseStatus.DRAFT && !options.loggedInAccount) {
              return !!type;
            }

            if (!values.payoutMethodId || values.payoutMethodId === '__newPayoutMethod') {
              return !!type;
            }

            return true;
          },
          {
            message: 'Required',
          },
        ),
      name: z.string().nullish(),
      data: z
        .object({
          currency: z
            .string()
            .nullish()
            .refine(
              currency => {
                if (['__invite', '__inviteSomeone', '__inviteExistingUser'].includes(values.payeeSlug)) {
                  return true;
                }

                if (values.payoutMethodId === '__newAccountBalancePayoutMethod') {
                  return true;
                }

                if (values.payoutMethodId === '__newPayoutMethod') {
                  return !!currency;
                }

                return true;
              },
              {
                message: 'Required',
              },
            ),
        })
        .nullish(),
    }),
    inviteNote: z.string().nullish(),
    inviteeExistingAccount: z
      .string()
      .nullish()
      .refine(
        inviteeExistingAccount => {
          if (values.payeeSlug === '__inviteExistingUser') {
            return !!inviteeExistingAccount;
          }

          return true;
        },
        {
          message: 'Required',
        },
      ),
    inviteeNewIndividual: z.object({
      name: z
        .string()
        .nullish()
        .refine(
          name => {
            if (values.payeeSlug === '__invite' && values.inviteeAccountType === InviteeAccountType.INDIVIDUAL) {
              return !isEmpty(name);
            }

            return true;
          },
          {
            message: 'Required',
          },
        ),
      email: z
        .string()
        .nullish()
        .refine(
          email => {
            if (values.payeeSlug === '__invite' && values.inviteeAccountType === InviteeAccountType.INDIVIDUAL) {
              return isValidEmail(email);
            }

            return true;
          },
          {
            message: 'Required',
          },
        )
        .refine(
          email => {
            if (email) {
              return isValidEmail(email);
            }

            return true;
          },
          {
            message: 'Invalid',
          },
        ),
    }),
    inviteeNewOrganization: z.object({
      name: z
        .string()
        .nullish()
        .refine(
          name => {
            if (values.payeeSlug === '__invite' && values.inviteeAccountType === InviteeAccountType.ORGANIZATION) {
              return !isEmpty(name);
            }

            return true;
          },
          {
            message: 'Required',
          },
        ),
      email: z
        .string()
        .nullish()
        .refine(
          email => {
            if (values.payeeSlug === '__invite' && values.inviteeAccountType === InviteeAccountType.ORGANIZATION) {
              return !!email;
            }

            return true;
          },
          {
            message: 'Required',
          },
        )
        .refine(
          email => {
            if (email) {
              return isValidEmail(email);
            }

            return true;
          },
          {
            message: 'Invalid',
          },
        ),
      organization: z
        .object({
          name: z
            .string()
            .nullish()
            .refine(
              name => {
                if (values.payeeSlug === '__invite' && values.inviteeAccountType === InviteeAccountType.ORGANIZATION) {
                  return !isEmpty(name);
                }

                return true;
              },
              {
                message: 'Required',
              },
            ),
          slug: z
            .string()
            .nullish()
            .refine(
              slug => {
                if (values.payeeSlug === '__invite' && values.inviteeAccountType === InviteeAccountType.ORGANIZATION) {
                  return !isEmpty(slug);
                }

                return true;
              },
              {
                message: 'Required',
              },
            ),
          website: z
            .string()
            .nullish()
            .refine(
              website => {
                if (values.payeeSlug === '__invite' && values.inviteeAccountType === InviteeAccountType.ORGANIZATION) {
                  return !isEmpty(website);
                }

                return true;
              },
              {
                message: 'Required',
              },
            ),
          description: z
            .string()
            .nullish()
            .refine(
              description => {
                if (values.payeeSlug === '__invite' && values.inviteeAccountType === InviteeAccountType.ORGANIZATION) {
                  return !isEmpty(description);
                }

                return true;
              },
              {
                message: 'Required',
              },
            ),
        })
        .nullish()
        .refine(
          organization => {
            if (values.payeeSlug === '__invite' && values.inviteeAccountType === InviteeAccountType.ORGANIZATION) {
              return !!organization;
            }

            return true;
          },
          {
            message: 'Required',
          },
        ),
    }),
  });

  return pickSchemaFields ? schema.pick(pickSchemaFields as { [K in keyof z.infer<typeof schema>]?: true }) : schema;
}

function getPayeeSlug(values: ExpenseFormValues): string {
  switch (values.payeeSlug) {
    case '__findAccountIAdminister':
    case '__invite':
    case '__inviteSomeone':
    case '__vendor':
      return null;
    case '__inviteExistingUser':
      return values.inviteeExistingAccount;
    default:
      return values.payeeSlug;
  }
}

async function buildFormOptions(
  intl: IntlShape,
  apolloClient: ApolloClient<any>,
  loggedInUser: LoggedInUser,
  values: ExpenseFormValues,
  startOptions: ExpenseFormStartOptions,
  refresh?: boolean,
): Promise<ExpenseFormOptions> {
  const options: ExpenseFormOptions = { schema: z.object({}) };

  const collectiveSlug = values.accountSlug && !values.accountSlug.startsWith('__') ? values.accountSlug : null;
  const payeeSlug = getPayeeSlug(values);

  try {
    const query = await memoizedExpenseFormSchema(
      apolloClient,
      {
        collectiveSlug: collectiveSlug,
        hasCollectiveSlug: !!collectiveSlug,
        payeeSlug: payeeSlug,
        hasPayeeSlug: !!payeeSlug,
        hasExpenseId: !!startOptions.expenseId,
        expenseId: startOptions.expenseId,
        expenseKey: startOptions.draftKey,
        hasSubmitterSlug: !!loggedInUser?.collective?.slug,
        submitterSlug: loggedInUser?.collective?.slug,
      },
      refresh,
    );

    const expense = query.data?.expense;
    if (expense) {
      options.expense = query.data.expense;
    }

    const recentlySubmittedExpenses = query.data?.recentlySubmittedExpenses;
    const account = values.accountSlug ? query.data?.account : options.expense?.account;
    const host = account && 'host' in account ? account.host : null;
    const payee =
      query.data?.payee ||
      (options.expense?.status === ExpenseStatus.DRAFT &&
      options.expense.payee &&
      options.expense.draft?.payee?.slug === options.expense.payee.slug
        ? options.expense.payee
        : null);

    const payeeHost = payee && 'host' in payee ? payee.host : null;
    const submitter = options.expense?.submitter || query.data?.submitter;

    if (account && options.expense?.status === ExpenseStatus.DRAFT) {
      options.canChangeAccount = false;
    } else {
      options.canChangeAccount = true;
    }

    if (recentlySubmittedExpenses) {
      options.recentlySubmittedExpenses = recentlySubmittedExpenses;
    }

    if (account) {
      options.account = account;
    }

    if (submitter) {
      options.submitter = submitter;
    }

    if (payee) {
      options.payee = payee;
    }

    if (query.data?.loggedInAccount) {
      options.loggedInAccount = query.data.loggedInAccount;
    }

    if (values.payeeSlug === '__invite') {
      options.invitee =
        values.inviteeAccountType === InviteeAccountType.INDIVIDUAL
          ? values.inviteeNewIndividual
          : values.inviteeNewOrganization;
    } else if (
      options.expense?.status === ExpenseStatus.DRAFT &&
      options.expense.draft.payee &&
      !options.loggedInAccount
    ) {
      options.invitee = options.expense.draft.payee;
    }

    if (host) {
      options.host = host;
      options.vendorsForAccount =
        'vendorsForAccount' in host
          ? (((host.vendorsForAccount as any)?.nodes as ExpenseVendorFieldsFragment[]) || []).filter(
              v => v.hasPayoutMethod,
            )
          : [];
      options.showVendorsOption = 'vendors' in host ? (host.vendors as any)?.totalCount > 0 : false;
      options.supportedPayoutMethods = host.supportedPayoutMethods || [];
      options.expenseTags = host.expensesTags;
      options.isAccountingCategoryRequired = userMustSetAccountingCategory(loggedInUser, account, host);
      options.accountingCategories = host.accountingCategories.nodes;
    } else {
      options.supportedPayoutMethods = [PayoutMethodType.OTHER, PayoutMethodType.BANK_ACCOUNT];
    }

    if (payeeHost && host && payeeHost.id === host.id) {
      options.supportedPayoutMethods = [PayoutMethodType.ACCOUNT_BALANCE];
    } else {
      options.supportedPayoutMethods = options.supportedPayoutMethods.filter(
        t => t !== PayoutMethodType.CREDIT_CARD && t !== PayoutMethodType.ACCOUNT_BALANCE,
      );
    }

    if (payee && (AccountTypesWithHost as readonly string[]).includes(payee.type)) {
      options.supportedPayoutMethods = options.supportedPayoutMethods.filter(t => t !== PayoutMethodType.OTHER);
    }

    if ((account?.supportedExpenseTypes ?? []).length > 0) {
      options.supportedExpenseTypes = account.supportedExpenseTypes;
    }

    if (query.data?.loggedInAccount) {
      options.payoutProfiles = getPayoutProfiles(query.data.loggedInAccount);
      if (payee && payee.type !== CollectiveType.VENDOR) {
        options.payoutMethods = options.payoutProfiles
          ?.find(p => p.slug === payee?.slug)
          ?.payoutMethods?.filter(p => options.supportedPayoutMethods.includes(p.type))
          .map(pm => {
            if (pm.type === PayoutMethodType.ACCOUNT_BALANCE && host) {
              return { ...pm, data: { currency: host.currency } };
            }
            return pm;
          });

        // Add ACCOUNT_BALANCE payout method if it's supported but not available for the payee
        if (
          options.supportedPayoutMethods?.includes(PayoutMethodType.ACCOUNT_BALANCE) &&
          host &&
          !options.payoutMethods?.some(pm => pm.type === PayoutMethodType.ACCOUNT_BALANCE)
        ) {
          options.payoutMethods = [
            ...(options.payoutMethods || []),
            {
              id: '__newAccountBalancePayoutMethod',
              type: PayoutMethodType.ACCOUNT_BALANCE,
              data: { currency: host.currency },
              isSaved: true,
            },
          ];
        }
      } else if (payee && payee.type === CollectiveType.VENDOR) {
        options.payoutMethods = payee.payoutMethods?.filter(p => options.supportedPayoutMethods.includes(p.type));
      }

      // Filter out ACCOUNT_BALANCE from the list of payout methods, since we add it manually to the default list
      options.newPayoutMethodTypes = options.supportedPayoutMethods.filter(t => t !== PayoutMethodType.ACCOUNT_BALANCE);

      if (values.payoutMethodId && values.payoutMethodId !== '__newPayoutMethod') {
        options.payoutMethod = options.payoutMethods?.find(p => p.id === values.payoutMethodId);
      } else if (values.payoutMethodId === '__newPayoutMethod') {
        options.payoutMethod = values.newPayoutMethod;
      }

      // Allow setting this flag to true with the `isInlineEdit` flag in start options to enable full editing experience (i.e. editing payotu method)
      options.isAdminOfPayee =
        startOptions.isInlineEdit ||
        options.payoutProfiles.some(p => p.slug === values.payeeSlug) ||
        values.payeeSlug === '__findAccountIAdminister';
    } else {
      options.payoutMethod = values.newPayoutMethod;
      options.newPayoutMethodTypes = options.supportedPayoutMethods;
    }

    if (!startOptions.duplicateExpense && options.expense?.lockedFields?.length) {
      options.lockedFields = options.expense.lockedFields;
    }

    if (
      options.expense &&
      !startOptions.duplicateExpense &&
      options.lockedFields?.includes?.(ExpenseLockableFields.AMOUNT)
    ) {
      options.expenseCurrency = options.expense.currency;
    } else if (values.expenseTypeOption === ExpenseType.GRANT) {
      options.expenseCurrency = options.account?.currency;
    } else if (options.payoutMethod) {
      options.expenseCurrency = options.payoutMethod.data?.currency || options.account?.currency;
    } else {
      options.expenseCurrency = options.account?.currency;
    }

    options.isLongFormItemDescription = false;
    options.allowDifferentItemCurrency = true;
    options.hasExpenseItemDate = true;
    options.canSetupRecurrence = true;

    if (values.expenseTypeOption === ExpenseType.GRANT) {
      options.isLongFormItemDescription = true;
      options.allowDifferentItemCurrency = false;
      options.hasExpenseItemDate = false;
      options.canSetupRecurrence = false;
    }

    options.allowExpenseItemAttachment = values.expenseTypeOption === ExpenseType.RECEIPT;

    options.allowInvite = !startOptions.isInlineEdit && options.expense?.status !== ExpenseStatus.DRAFT;

    if (values.expenseTypeOption === ExpenseType.INVOICE) {
      if (accountHasVAT(account as any, host as any)) {
        options.taxType = TaxType.VAT;
      } else if (accountHasGST(host || account)) {
        options.taxType = TaxType.GST;
      }
    }

    if (options.expenseCurrency && values.expenseItems?.length > 0) {
      const { totalInvoiced } = computeExpenseAmounts(
        options.expenseCurrency,
        (values.expenseItems || []).map(ei => ({
          description: ei.description,
          amountV2: ei.amount as Amount,
          incurredAt: typeof ei.incurredAt === 'string' ? new Date(ei.incurredAt) : ei.incurredAt,
        })),
        values.tax ? [{ ...values.tax, type: options.taxType }] : [],
      );

      options.totalInvoicedInExpenseCurrency = totalInvoiced;
    }

    options.schema = buildFormSchema(values, options, intl, startOptions.pickSchemaFields);

    return options;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return options;
  }
}

function usePrevious<T>(value: T): T {
  const ref = React.useRef<T>(value);
  React.useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

const needExchangeRateFilter = (expectedCurrency: string) => (ei: ExpenseItem) =>
  expectedCurrency &&
  ei.amount.currency &&
  ei.amount.currency !== expectedCurrency &&
  (!ei.amount.exchangeRate ||
    !ei.amount.exchangeRate.source ||
    !ei.amount.exchangeRate.value ||
    ei.amount.exchangeRate.fromCurrency !== ei.amount.currency ||
    ei.amount.exchangeRate.toCurrency !== expectedCurrency ||
    (ei.amount.exchangeRate.source === 'OPENCOLLECTIVE' &&
      Math.abs(dayjs.utc(ei.amount.exchangeRate.date).diff(dayjs.utc(ei.incurredAt), 'days')) > 2));

type ExpenseFormStartOptions = {
  duplicateExpense?: boolean;
  expenseId?: number;
  draftKey?: string;
  isInlineEdit?: boolean;
  pickSchemaFields?: Record<string, boolean>;
};

export function useExpenseForm(opts: {
  formRef?: React.MutableRefObject<HTMLFormElement>;
  initialValues: ExpenseFormValues;
  startOptions: ExpenseFormStartOptions;
  handleOnSubmit?: boolean;
  onSuccess?: (
    result: FetchResult<CreateExpenseFromDashboardMutation> | FetchResult<EditExpenseFromDashboardMutation>,
    type: 'new' | 'invite' | 'edit',
  ) => void; // when handleOnSubmit === true
  onError?: (err) => void; // when handleOnSubmit === true
  onSubmit?: (
    values: ExpenseFormValues,
    formikHelpers: FormikHelpers<ExpenseFormValues>,
    options: ExpenseFormOptions,
    startOptions: ExpenseFormStartOptions,
  ) => void | Promise<any>;
}): ExpenseForm {
  const intl = useIntl();
  const apolloClient = useApolloClient();
  const { LoggedInUser } = useLoggedInUser();
  const [formOptions, setFormOptions] = React.useState<ExpenseFormOptions>({ schema: z.object({}) });
  const startOptions = React.useRef(opts.startOptions);
  const setInitialExpenseValues = React.useRef(false);
  const setInitialFormOptions = React.useRef(false);
  const initialLoading = React.useRef(true);
  const expenseFormValues = React.useRef<ExpenseFormValues>(opts.initialValues);

  const initialValues = React.useRef(opts.initialValues);
  const initialStatus = React.useRef({ schema: formOptions.schema });

  const [createExpense] = useMutation<CreateExpenseFromDashboardMutation, CreateExpenseFromDashboardMutationVariables>(
    gql`
      mutation CreateExpenseFromDashboard(
        $expenseCreateInput: ExpenseCreateInput!
        $account: AccountReferenceInput!
        $recurring: RecurringExpenseInput
        $privateComment: String
      ) {
        expense: createExpense(
          expense: $expenseCreateInput
          account: $account
          privateComment: $privateComment
          recurring: $recurring
        ) {
          id
          legacyId
        }
      }
    `,
    {
      context: {
        ...API_V2_CONTEXT,
        headers: {
          'x-is-new-expense-flow': 'true',
        },
      },
    },
  );

  const [draftExpenseAndInviteUser] = useMutation<
    InviteExpenseFromDashboardMutation,
    InviteExpenseFromDashboardMutationVariables
  >(
    gql`
      mutation InviteExpenseFromDashboard(
        $expenseInviteInput: ExpenseInviteDraftInput!
        $account: AccountReferenceInput!
      ) {
        expense: draftExpenseAndInviteUser(expense: $expenseInviteInput, account: $account) {
          id
          legacyId
        }
      }
    `,
    {
      context: {
        ...API_V2_CONTEXT,
        headers: {
          'x-is-new-expense-flow': 'true',
        },
      },
    },
  );

  const [editExpense] = useMutation<EditExpenseFromDashboardMutation, EditExpenseFromDashboardMutationVariables>(
    gql`
      mutation EditExpenseFromDashboard($expenseEditInput: ExpenseUpdateInput!, $draftKey: String) {
        expense: editExpense(expense: $expenseEditInput, draftKey: $draftKey) {
          id
          legacyId
        }
      }
    `,
    {
      context: {
        ...API_V2_CONTEXT,
        headers: {
          'x-is-new-expense-flow': 'true',
        },
      },
    },
  );

  const { onSubmit, onError, onSuccess } = opts;
  const onSubmitCallback = React.useCallback(
    async (values: ExpenseFormValues, formikHelpers: FormikHelpers<ExpenseFormValues>) => {
      if (opts.handleOnSubmit) {
        let result: FetchResult<CreateExpenseFromDashboardMutation> | FetchResult<EditExpenseFromDashboardMutation>;
        try {
          track(AnalyticsEvent.EXPENSE_SUBMISSION_SUBMITTED);

          const attachedFiles = values.additionalAttachments.map(a => ({
            url: typeof a === 'string' ? a : a?.url,
          }));

          const expenseInput: CreateExpenseFromDashboardMutationVariables['expenseCreateInput'] = {
            description:
              values.expenseTypeOption === ExpenseType.GRANT && isEmpty(values.title)
                ? generateGrantTitle(formOptions.account, formOptions.payee, formOptions.invitee)
                : values.title,
            reference:
              values.expenseTypeOption === ExpenseType.INVOICE && values.hasInvoiceOption === YesNoOption.YES
                ? values.invoiceNumber
                : null,
            payee: {
              slug: formOptions.payee?.slug,
            },
            payeeLocation: values.payeeLocation,
            payoutMethod:
              !values.payoutMethodId || values.payoutMethodId === '__newPayoutMethod'
                ? { ...values.newPayoutMethod, isSaved: false }
                : values.payoutMethodId === '__newAccountBalancePayoutMethod'
                  ? {
                      type: PayoutMethodType.ACCOUNT_BALANCE,
                      data: {},
                    }
                  : {
                      id: values.payoutMethodId,
                    },
            type: values.expenseTypeOption,
            accountingCategory: values.accountingCategoryId
              ? {
                  id: values.accountingCategoryId,
                }
              : null,
            attachedFiles,
            currency: formOptions.expenseCurrency,
            customData: null,
            invoiceInfo: null,
            invoiceFile:
              values.hasInvoiceOption === YesNoOption.NO
                ? null
                : values.invoiceFile
                  ? { url: typeof values.invoiceFile === 'string' ? values.invoiceFile : values.invoiceFile.url }
                  : undefined,
            items: values.expenseItems.map(ei => ({
              description: ei.description,
              amountV2: {
                valueInCents: ei.amount.valueInCents,
                currency: ei.amount.currency as Currency,
                exchangeRate: ei.amount.exchangeRate
                  ? ({
                      ...pick(ei.amount.exchangeRate, ['source', 'rate', 'value', 'fromCurrency', 'toCurrency']),
                      date: new Date(ei.amount.exchangeRate.date || ei.incurredAt),
                    } as CurrencyExchangeRateInput)
                  : null,
              },
              incurredAt: values.expenseTypeOption === ExpenseType.GRANT ? new Date() : new Date(ei.incurredAt),
              url:
                values.expenseTypeOption === ExpenseType.RECEIPT
                  ? typeof ei.attachment === 'string'
                    ? ei.attachment
                    : ei.attachment?.url
                  : null,
            })),
            longDescription: null,
            privateMessage: null,
            tags: values.tags,
            tax: values.hasTax
              ? [
                  {
                    rate: values.tax.rate,
                    type: formOptions.taxType,
                    idNumber: values.tax.idNumber,
                  },
                ]
              : null,
          };

          if (formOptions.expense?.id && !startOptions.current.duplicateExpense) {
            const editInput: EditExpenseFromDashboardMutationVariables['expenseEditInput'] = {
              ...expenseInput,
              id: formOptions.expense.id,
              payee:
                formOptions.expense?.status === ExpenseStatus.DRAFT && !formOptions.payee?.slug
                  ? formOptions.expense?.draft?.payee
                  : {
                      slug: formOptions.payee?.slug,
                    },
            };
            result = await editExpense({
              variables: {
                expenseEditInput: editInput,
                draftKey: startOptions.current.draftKey,
              },
            });

            onSuccess(result, 'edit');
          } else if (
            formOptions.payee?.type === CollectiveType.VENDOR ||
            formOptions.payoutProfiles.some(p => p.slug === values.payeeSlug)
          ) {
            result = await createExpense({
              variables: {
                account: {
                  slug: formOptions.account?.slug,
                },
                expenseCreateInput: expenseInput,
                ...(values.recurrenceFrequency !== RecurrenceFrequencyOption.NONE
                  ? {
                      recurring: {
                        interval: values.recurrenceFrequency as unknown as RecurringExpenseInterval,
                        endsAt: dayjs(values.recurrenceEndAt).toDate(),
                      },
                    }
                  : {}),
                privateComment:
                  formOptions.payoutMethod?.type === PayoutMethodType.BANK_ACCOUNT &&
                  formOptions.payoutMethod?.data?.accountHolderName !== formOptions.payee?.legalName
                    ? values.payoutMethodNameDiscrepancyReason
                    : null,
              },
            });

            onSuccess(result, 'new');
          } else {
            const payee =
              values.payeeSlug === '__inviteExistingUser'
                ? { slug: values.inviteeExistingAccount }
                : values.inviteeAccountType === InviteeAccountType.INDIVIDUAL
                  ? values.inviteeNewIndividual
                  : values.inviteeNewOrganization;
            const inviteInput: InviteExpenseFromDashboardMutationVariables['expenseInviteInput'] = {
              ...expenseInput,
              payee: {
                ...payee,
                isInvite: true,
              },
              recipientNote: values.inviteNote,
            };
            result = await draftExpenseAndInviteUser({
              variables: {
                account: {
                  slug: formOptions.account?.slug,
                },
                expenseInviteInput: inviteInput,
              },
            });

            onSuccess(result, 'invite');
          }

          track(AnalyticsEvent.EXPENSE_SUBMISSION_SUBMITTED_SUCCESS);
        } catch (err) {
          track(AnalyticsEvent.EXPENSE_SUBMISSION_SUBMITTED_ERROR);
          onError(err);
        } finally {
          // h.setSubmitting(false);
        }
        return;
      }
      return onSubmit(values, formikHelpers, formOptions, startOptions.current);
    },
    [
      opts.handleOnSubmit,
      onSubmit,
      formOptions,
      editExpense,
      onSuccess,
      createExpense,
      draftExpenseAndInviteUser,
      onError,
    ],
  );

  const validate = React.useCallback(
    (values: ExpenseFormValues) => {
      const result = formOptions.schema.safeParse(values, { errorMap: getCustomZodErrorMap(intl) });
      const newPayoutMethodErrors =
        values.payoutMethodId === '__newPayoutMethod' &&
        omit(validatePayoutMethod(values.newPayoutMethod), ['data.currency', 'type']);
      if (result.success === false || !isEmpty(newPayoutMethodErrors)) {
        const errs = {};

        if (result.success === false) {
          for (const issue of result.error.issues) {
            set(errs, issue.path, issue.message);
          }
        }

        if (!isEmpty(newPayoutMethodErrors)) {
          errs['newPayoutMethod'] = {
            ...(errs['newPayoutMethod'] || {}),
            ...newPayoutMethodErrors,
          };
        }

        return errs;
      }
    },
    [formOptions.schema, intl],
  );

  const expenseForm: ExpenseFormik = useFormik<ExpenseFormValues>({
    initialValues: initialValues.current,
    initialStatus: initialStatus.current,
    validate,
    onSubmit: onSubmitCallback,
    validateOnBlur: false,
  });

  const prevFormOptions = usePrevious(formOptions);

  /* field dependencies */
  const setFieldValue = expenseForm.setFieldValue;
  const setFieldTouched = expenseForm.setFieldTouched;

  React.useEffect(() => {
    if (!formOptions.expense || setInitialExpenseValues.current) {
      return;
    }

    setInitialExpenseValues.current = true;
    setFieldValue('accountingCategoryId', formOptions.expense.accountingCategory?.id);
    setFieldValue('accountSlug', formOptions.expense.account.slug);
    setFieldValue('expenseTypeOption', formOptions.expense.type);
    setFieldValue('hasTax', (formOptions.expense.taxes || []).length > 0);
    setFieldValue('payoutMethodId', formOptions.expense.payoutMethod?.id);
    setFieldValue('tags', formOptions.expense.tags);
    if (formOptions.expense.taxes?.length > 0) {
      setFieldValue('tax.idNumber', formOptions.expense.taxes[0].idNumber);
      setFieldValue('tax.rate', formOptions.expense.taxes[0].rate);
    }
    setFieldValue('title', formOptions.expense.description);
    setFieldTouched('title', true);

    if (formOptions.expense.status === ExpenseStatus.DRAFT && formOptions.expense.draft?.payee) {
      if (
        formOptions.loggedInAccount &&
        formOptions.expense.draft.payee?.slug &&
        formOptions.expense.draft.payee?.slug === formOptions.loggedInAccount.slug
      ) {
        setFieldValue('payeeSlug', formOptions.expense.draft.payee?.slug);
      } else {
        if (formOptions.expense.draft?.payee?.slug) {
          setFieldValue('payeeSlug', formOptions.expense.draft?.payee?.slug);
        } else if (formOptions.expense?.draft?.payee?.organization) {
          setFieldValue('inviteeAccountType', InviteeAccountType.ORGANIZATION);
        } else {
          setFieldValue('inviteeAccountType', InviteeAccountType.INDIVIDUAL);
        }
        setFieldValue('inviteeNewOrganization', formOptions.expense?.draft?.payee);
        setFieldValue('inviteeNewIndividual', formOptions.expense?.draft?.payee);

        setFieldValue('inviteNote', formOptions.expense.longDescription);
      }
    } else if (formOptions.expense.payee?.slug) {
      setFieldValue('payeeSlug', formOptions.expense.payee?.slug);
    } else if (formOptions.expense.draft?.payee) {
      if (formOptions.expense?.draft?.payee?.organization) {
        setFieldValue('inviteeAccountType', InviteeAccountType.ORGANIZATION);
      } else {
        setFieldValue('inviteeAccountType', InviteeAccountType.INDIVIDUAL);
      }
      setFieldValue('inviteeNewOrganization', formOptions.expense?.draft?.payee);
      setFieldValue('inviteeNewIndividual', formOptions.expense?.draft?.payee);
    }

    const expenseAttachedFiles =
      formOptions.expense.status === ExpenseStatus.DRAFT
        ? formOptions.expense.draft?.attachedFiles
        : formOptions.expense.attachedFiles;
    const invoiceFile =
      formOptions.expense.status === ExpenseStatus.DRAFT
        ? formOptions.expense.draft?.invoiceFile
        : formOptions.expense.invoiceFile;
    const additionalAttachments = expenseAttachedFiles;

    if (!startOptions.current.duplicateExpense) {
      if (invoiceFile) {
        setFieldValue('invoiceFile', invoiceFile.url);
        setFieldValue('hasInvoiceOption', YesNoOption.YES);
        setFieldValue('invoiceNumber', formOptions.expense.reference);
      } else {
        setFieldValue('hasInvoiceOption', YesNoOption.NO);
      }
      if (additionalAttachments) {
        setFieldValue(
          'additionalAttachments',
          additionalAttachments.map(af => af.url),
        );
      }
    }

    if (formOptions.expense.status === ExpenseStatus.DRAFT) {
      setFieldValue(
        'expenseItems',
        formOptions.expense.draft?.items?.map(ei => ({
          key: ei.id,
          attachment: ei.url,
          description: ei.description ?? '',
          incurredAt: dayjs.utc(ei.incurredAt).toISOString().substring(0, 10),
          amount: {
            valueInCents: ei.amountV2?.valueInCents ?? ei.amount,
            currency: ei.amountV2?.currency ?? ei.currency,
          },
        })),
      );
    } else {
      setFieldValue(
        'expenseItems',
        formOptions.expense.items?.map(ei => ({
          key: ei.id,
          attachment: !startOptions.current.duplicateExpense ? ei.url : null,
          description: ei.description ?? '',
          incurredAt: !startOptions.current.duplicateExpense
            ? dayjs.utc(ei.incurredAt).toISOString().substring(0, 10)
            : null,
          amount: {
            valueInCents: ei.amount.valueInCents,
            currency: ei.amount.currency,
            exchangeRate: !startOptions.current.duplicateExpense ? ei.amount.exchangeRate : null,
          },
        })),
      );
    }
  }, [formOptions.expense, formOptions.loggedInAccount, setInitialExpenseValues, setFieldValue, setFieldTouched]);

  React.useEffect(() => {
    if (prevFormOptions?.host?.slug !== formOptions.host?.slug) {
      if (
        (expenseForm.values.payeeSlug === '__vendor' ||
          prevFormOptions.vendorsForAccount?.some(v => v.slug === expenseForm.values.payeeSlug)) &&
        !formOptions.vendorsForAccount?.some(v => v.slug === expenseForm.values.payeeSlug)
      ) {
        setFieldValue('payeeSlug', null);
      }
    }
  }, [
    prevFormOptions?.host?.slug,
    formOptions.host?.slug,
    prevFormOptions?.vendorsForAccount,
    formOptions.vendorsForAccount,
    expenseForm.values.payeeSlug,
    setFieldValue,
  ]);

  React.useEffect(() => {
    if (!formOptions.taxType) {
      setFieldValue('hasTax', false);
      setFieldValue('tax', null);
    }
  }, [formOptions.taxType, setFieldValue]);

  React.useEffect(() => {
    setFieldValue('payoutMethodNameDiscrepancyReason', '');
    setFieldTouched('payoutMethodNameDiscrepancyReason', false);
  }, [expenseForm.values.payoutMethodId, setFieldValue, setFieldTouched]);

  React.useEffect(() => {
    if (
      expenseForm.values.expenseItems.length === 1 &&
      !isEmpty(expenseForm.values.expenseItems[0].description) &&
      !expenseForm.touched.title &&
      !formOptions.lockedFields?.includes?.(ExpenseLockableFields.DESCRIPTION) &&
      expenseForm.values.expenseTypeOption !== ExpenseType.GRANT
    ) {
      setFieldValue('title', expenseForm.values.expenseItems[0].description);
    }
  }, [
    expenseForm.values.expenseItems,
    expenseForm.touched.title,
    setFieldValue,
    formOptions.lockedFields,
    expenseForm.values.expenseTypeOption,
  ]);

  React.useEffect(() => {
    if (!expenseForm.values.hasTax) {
      setFieldValue('tax', null);
    }
  }, [expenseForm.values.hasTax, setFieldValue]);

  React.useEffect(() => {
    if (expenseForm.values.accountingCategoryId && (formOptions.accountingCategories || []).length === 0) {
      setFieldValue('accountingCategoryId', null);
    }
  }, [formOptions.accountingCategories, expenseForm.values.accountingCategoryId, setFieldValue]);

  React.useEffect(() => {
    if (isEmpty(expenseForm.values.expenseItems)) {
      return;
    }

    const exchangeRateRequests = uniqBy(
      expenseForm.values.expenseItems.filter(needExchangeRateFilter(formOptions.expenseCurrency)).map(ei => ({
        fromCurrency: ei.amount.currency as Currency,
        toCurrency: formOptions.expenseCurrency,
        date: dayjs.utc(ei.incurredAt).toDate(),
      })),
      ei => `${ei.fromCurrency}-${ei.toCurrency}-${ei.date}`,
    );

    expenseForm.values.expenseItems.forEach((ei, i) => {
      if (formOptions.expenseCurrency && ei.amount?.currency && ei.amount.currency === formOptions.expenseCurrency) {
        setFieldValue(`expenseItems.${i}.amount.exchangeRate`, null);
      }
    });

    if (isEmpty(exchangeRateRequests)) {
      return;
    }

    const ctrl = new AbortController();
    let queryComplete = false;
    async function updateExchangeRates() {
      try {
        const res = await apolloClient.query<ExpenseFormExchangeRatesQuery, ExpenseFormExchangeRatesQueryVariables>({
          query: gql`
            query ExpenseFormExchangeRates($exchangeRateRequests: [CurrencyExchangeRateRequest!]!) {
              currencyExchangeRate(requests: $exchangeRateRequests) {
                value
                source
                fromCurrency
                toCurrency
                date
                isApproximate
              }
            }
          `,
          context: {
            ...API_V2_CONTEXT,
            fetchOptions: {
              signal: ctrl.signal,
            },
          },
          variables: {
            exchangeRateRequests,
          },
        });

        queryComplete = true;
        if (!isEmpty(res.data?.currencyExchangeRate)) {
          expenseForm.values.expenseItems.forEach((ei, i) => {
            if (needExchangeRateFilter(formOptions.expenseCurrency)(ei)) {
              const exchangeRate =
                res.data.currencyExchangeRate.find(
                  rate =>
                    rate.fromCurrency === ei.amount.currency &&
                    rate.toCurrency === formOptions.expenseCurrency &&
                    (!ei.incurredAt || dayjs.utc(ei.incurredAt).isSame(dayjs.utc(rate.date), 'day')),
                ) ||
                res.data.currencyExchangeRate.find(
                  rate => rate.fromCurrency === ei.amount.currency && rate.toCurrency === formOptions.expenseCurrency,
                );
              setFieldValue(
                `expenseItems.${i}.amount.exchangeRate`,
                pick(exchangeRate, ['date', 'fromCurrency', 'toCurrency', 'value', 'source']),
              );
              setFieldValue(
                `expenseItems.${i}.amount.referenceExchangeRate`,
                pick(exchangeRate, ['date', 'fromCurrency', 'toCurrency', 'value', 'source']),
              );
            }
          });
        }
      } catch (err) {
        return;
      }
    }

    updateExchangeRates();

    return () => {
      if (!queryComplete) {
        ctrl.abort();
      }
    };
  }, [apolloClient, formOptions.expenseCurrency, expenseForm.values.expenseItems, setFieldValue]);

  const setStatus = expenseForm.setStatus;
  React.useEffect(() => {
    setStatus({ schema: formOptions.schema });
  }, [formOptions.schema, setStatus]);

  const refreshFormOptions = React.useCallback(
    async (force?: boolean) => {
      setFormOptions(
        await buildFormOptions(
          intl,
          apolloClient,
          LoggedInUser,
          expenseFormValues.current,
          startOptions.current,
          force,
        ),
      );

      setInitialFormOptions.current = true;
    },
    [apolloClient, LoggedInUser, intl],
  );

  // calculate form
  React.useEffect(() => {
    expenseFormValues.current = expenseForm.values;

    refreshFormOptions();
  }, [refreshFormOptions, expenseForm.values]);

  // revalidate form
  const validateForm = expenseForm.validateForm;
  React.useEffect(() => {
    async function runValidation() {
      await validateForm();

      if (setInitialFormOptions.current && !startOptions.current.expenseId) {
        initialLoading.current = false;
      } else if (setInitialFormOptions.current && setInitialExpenseValues.current) {
        initialLoading.current = false;
      }
    }

    runValidation();
  }, [formOptions.schema, validateForm]);

  React.useEffect(() => {
    for (let i = 0; i < (expenseForm.values.expenseItems?.length ?? 0); i++) {
      const expenseItem = expenseForm.values.expenseItems[i];
      if (!expenseItem.amount?.currency) {
        setFieldValue(`expenseItems.${i}.amount.currency`, formOptions.expenseCurrency);
      }
    }
  }, [formOptions.expenseCurrency, expenseForm.values.expenseItems, setFieldValue]);

  React.useEffect(() => {
    if (
      expenseForm.values.payoutMethodId &&
      !expenseForm.values.payoutMethodId.startsWith('__') &&
      !formOptions.payoutMethods?.some(p => p.id === expenseForm.values.payoutMethodId)
    ) {
      setFieldValue('payoutMethodId', null);
    }
  }, [formOptions.payoutMethods, expenseForm.values.payoutMethodId, setFieldValue]);

  const refresh = React.useCallback(async () => refreshFormOptions(true), [refreshFormOptions]);

  return Object.assign(expenseForm, {
    options: formOptions,
    startOptions: startOptions.current,
    initialLoading: initialLoading.current,
    refresh,
  });
}
export function generateGrantTitle(
  account: ExpenseFormOptions['account'],
  payee: ExpenseFormOptions['payee'],
  invitee: ExpenseFormOptions['invitee'],
): string {
  return `${account.name} - ${payee ? payee.name : invitee?.name}`;
}
