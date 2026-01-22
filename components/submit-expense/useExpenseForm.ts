import React from 'react';
import type { ApolloClient, FetchResult } from '@apollo/client';
import { gql, useApolloClient, useMutation } from '@apollo/client';
import { accountHasGST, accountHasVAT, checkVATNumberFormat, TaxType } from '@opencollective/taxes';
import type { Account } from '@opencollective/taxes/dist/types/Accounts';
import dayjs from 'dayjs';
import type { Path, PathValue } from 'dot-path-value';
import type { FieldInputProps, FormikErrors, FormikHelpers } from 'formik';
import { useFormik } from 'formik';
import { isEmpty, isEqual, isNull, omit, pick, set, uniqBy } from 'lodash';
import memoizeOne from 'memoize-one';
import type { IntlShape } from 'react-intl';
import { useIntl } from 'react-intl';
import type { ZodObjectDef } from 'zod';
import { z } from 'zod';

import { AccountTypesWithHost, CollectiveType } from '../../lib/constants/collectives';
import { getPayoutProfiles, standardizeExpenseItemIncurredAt } from '../../lib/expenses';
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
import { getArrayValuesMemoizer, isValidEmail } from '../../lib/utils';
import { userMustSetAccountingCategory } from '../expenses/lib/accounting-categories';
import { computeExpenseAmounts } from '../expenses/lib/utils';
import { AnalyticsEvent } from '@/lib/analytics/events';
import { track } from '@/lib/analytics/plausible';

import { accountHoverCardFieldsFragment } from '../AccountHoverCard';
import { accountingCategorySelectFieldsFragment } from '../AccountingCategorySelect';
import { loggedInAccountExpensePayoutFieldsFragment } from '../expenses/graphql/fragments';
import { validatePayoutMethod } from '../expenses/PayoutMethodForm';
import { getCustomZodErrorMap } from '../FormikZod';

import { supportsBaseExpenseTypes } from './form/helper';

export enum InviteeAccountType {
  INDIVIDUAL = 'INDIVIDUAL',
  ORGANIZATION = 'ORGANIZATION',
}

type ExpenseItem = {
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

type ExpenseFormik = Omit<ReturnType<typeof useFormik<ExpenseFormValues>>, 'setFieldValue' | 'getFieldProps'> & {
  setFieldValue: <F extends Path<ExpenseFormValues>>(
    field: F,
    value: PathValue<ExpenseFormValues, F>,
  ) => Promise<void> | Promise<FormikErrors<ExpenseFormValues>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          vendorsForAccount: vendors(visibleToAccounts: [{ slug: $collectiveSlug }], limit: 5) {
            nodes {
              ...ExpenseVendorFields
            }
          }
          vendors(visibleToAccounts: [{ slug: $collectiveSlug }], limit: 1) {
            totalCount
          }
        }
      }

      ... on Organization {
        host {
          vendorsForAccount: vendors(visibleToAccounts: [{ slug: $collectiveSlug }], limit: 5) {
            nodes {
              ...ExpenseVendorFields
            }
          }
          vendors(visibleToAccounts: [{ slug: $collectiveSlug }], limit: 1) {
            totalCount
          }
        }
      }
    }

    payee: account(slug: $payeeSlug) @include(if: $hasPayeeSlug) {
      ...ExpenseFormPayeeFields

      ... on Vendor {
        hasPayoutMethod
      }
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
        data
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
      CHART_OF_ACCOUNTS
    }
  }

  fragment ExpenseFormSchemaPolicyFields on Account {
    policies {
      id
      COLLECTIVE_ADMINS_CAN_SEE_PAYOUT_METHODS
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

  fragment ExpenseFormPayoutMethods on PayoutMethod {
    id
    type
    name
    data
    isSaved
    canBeEdited
    canBeDeleted
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
    isFirstPartyHost
    isTrustedHost

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

    expensesTags {
      id
      tag
    }

    payoutMethods {
      ...ExpenseFormPayoutMethods
    }

    ...ExpenseFormSchemaPolicyFields
    ...ExpenseFormSchemaFeatureFields

    accountingCategories(kind: EXPENSE) {
      nodes {
        ...AccountingCategorySelectFields
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
    vendorInfo {
      taxId
      taxType
    }
    payoutMethods {
      id
      type
      name
      data
      isSaved
    }
    visibleToAccounts {
      id
      legacyId
      slug
      name
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
    isVerified

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
      id
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
    type
    isVerified
    name
    imageUrl
    isHost
    isArchived
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
      ...ExpenseFormPayoutMethods
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

  ${accountHoverCardFieldsFragment}
  ${accountingCategorySelectFieldsFragment}
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
};

const memoizeAvailableReferenceCurrencies = getArrayValuesMemoizer<Currency>();

/**
 * Memoized GraphQL query for expense form schema data.
 *
 * Uses memoizeOne to cache query results and prevent redundant network requests.
 * Only refetches when variables change or refresh is explicitly requested.
 */
const memoizedExpenseFormSchema = memoizeOne(
  async (apolloClient: ApolloClient<unknown>, variables: ExpenseFormSchemaQueryVariables, refresh?: boolean) => {
    return await apolloClient.query<ExpenseFormSchemaQuery, ExpenseFormSchemaQueryVariables>({
      query: formSchemaQuery,

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

/**
 * Builds dynamic Zod validation schema based on form options and context.
 *
 * This function creates different validation rules depending on:
 * - Expense type (INVOICE vs RECEIPT vs GRANT)
 * - Account settings (VAT/GST requirements, accounting categories)
 * - Form state (invite vs direct submission)
 *
 * @param values Current form values
 * @param options Form configuration options
 * @param intl Internationalization context for error messages
 * @param pickSchemaFields Optional field filtering for partial validation
 * @returns Zod schema for form validation
 */
function buildFormSchema(
  values: ExpenseFormValues,
  options: Omit<ExpenseFormOptions, 'schema'>,
  intl: IntlShape,
  pickSchemaFields?: Record<string, boolean>,
): z.ZodType<RecursivePartial<ExpenseFormValues>, z.ZodObjectDef, RecursivePartial<ExpenseFormValues>> {
  const requiredMessage = { message: intl.formatMessage({ defaultMessage: 'Required', id: 'Seanpx' }) };
  const schema = z.object({
    accountSlug: z
      .string()
      .nullish()
      .refine(slug => {
        return slug && !slug.startsWith('__');
      }, requiredMessage)
      .refine(
        accountSlug => {
          if (!accountSlug) {
            return false;
          }
          if (!options.supportedExpenseTypes) {
            return true;
          }

          if (
            values.expenseTypeOption === ExpenseType.GRANT &&
            !options.supportedExpenseTypes.includes(ExpenseType.GRANT)
          ) {
            return false;
          }

          if (
            values.expenseTypeOption !== ExpenseType.GRANT &&
            !supportsBaseExpenseTypes(options.supportedExpenseTypes)
          ) {
            return false;
          }

          return true;
        },
        () => ({
          message: intl.formatMessage({
            defaultMessage: 'The selected account does not support expense submissions.',
            id: '6dZw2w',
          }),
        }),
      ),
    payeeSlug: z
      .string()
      .nullish()
      .refine(slug => {
        if (slug === '__invite' || slug === '__inviteExistingUser') {
          return true;
        }

        return options.expense?.status === ExpenseStatus.DRAFT && !options.loggedInAccount
          ? true
          : slug && !slug.startsWith('__');
      }, requiredMessage),
    expenseId: z.number().nullish(),
    expenseTypeOption: z.nativeEnum(ExpenseType).refine(v => {
      if (v === ExpenseType.GRANT && options.account?.type === CollectiveType.FUND) {
        return true;
      }

      if (options.account?.supportedExpenseTypes?.length > 0) {
        return options.account.supportedExpenseTypes.includes(v);
      }

      return true;
    }, requiredMessage),
    payoutMethodId: z
      .string()
      .nullish()
      .refine(v => {
        if (['__invite', '__inviteSomeone', '__inviteExistingUser'].includes(values.payeeSlug)) {
          return true;
        }
        if (
          v === '__newAccountBalancePayoutMethod' &&
          options.payoutMethods?.some(pm => pm.type === PayoutMethodType.ACCOUNT_BALANCE)
        ) {
          return true;
        }

        if (options.payee?.type === CollectiveType.VENDOR && !options.payee?.['hasPayoutMethod']) {
          return false;
        }

        // If the payee has a host and the payer account is under a different one, show the host's payout method (cross-host expense)
        if (v && v !== '__newPayoutMethod') {
          const payee = options.payee;
          const account = options.account;
          const host = account && 'host' in account ? account.host : null;
          if (payee?.['host'] && host && payee['host'].id !== host.id) {
            if (!payee['host'].payoutMethods?.some(pm => pm.id === v)) {
              return false;
            }
          } else if (!options.payee?.payoutMethods?.some(pm => pm.id === v)) {
            return false;
          }
        }

        return true;
      }, requiredMessage),
    accountingCategoryId: z
      .string()
      .nullish()
      .refine(v => {
        if (
          options.isAccountingCategoryRequired &&
          options.accountingCategories?.length > 0 &&
          !options.accountingCategories.some(ac => ac.id === v) &&
          !isNull(v) && // null represents "I don't know" and is a valid option
          values.expenseTypeOption !== ExpenseType.GRANT
        ) {
          return false;
        }

        return true;
      }, requiredMessage),
    title: z
      .string()
      .nullish()
      .refine(v => {
        if (
          ['__invite', '__inviteSomeone', '__inviteExistingUser'].includes(values.payeeSlug) ||
          values.expenseTypeOption === ExpenseType.GRANT
        ) {
          return true;
        }

        return v.length > 0;
      }, requiredMessage),
    reference: z.string().optional(),
    tags: z.array(z.string()).optional(),
    privateMessage: z.string().optional().nullable(),
    referenceCurrency: z
      .nativeEnum(Currency)
      .optional()
      .nullable()
      .refine(
        v => {
          // If multiple currencies are supported, the reference currency must be set
          if (options.availableReferenceCurrencies.length > 1) {
            return v && options.availableReferenceCurrencies.includes(v);
          } else {
            return !v || v === options.availableReferenceCurrencies[0];
          }
        },
        value => ({
          message: value
            ? intl.formatMessage({ defaultMessage: 'Invalid value', id: 'FormError.InvalidValue' })
            : intl.formatMessage({ defaultMessage: 'Required', id: 'Seanpx' }),
        }),
      ),
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
      .refine(attachment => {
        if (['__invite', '__inviteSomeone', '__inviteExistingUser'].includes(values.payeeSlug)) {
          return true;
        }

        if (values.expenseTypeOption === ExpenseType.INVOICE && values.hasInvoiceOption === YesNoOption.YES) {
          return typeof attachment === 'string' ? !!attachment : !!attachment?.url;
        }
        return true;
      }, requiredMessage),
    invoiceNumber: z
      .string()
      .nullish()
      .refine(invoiceNumber => {
        if (['__invite', '__inviteSomeone', '__inviteExistingUser'].includes(values.payeeSlug)) {
          return true;
        }

        if (values.expenseTypeOption === ExpenseType.INVOICE && values.hasInvoiceOption === YesNoOption.YES) {
          return options.isAdminOfPayee || options.payee?.type === CollectiveType.VENDOR ? !!invoiceNumber : true;
        }
        return true;
      }, requiredMessage),
    invoiceInfo: z.string().optional(),
    expenseItems: z.array(
      z
        .object({
          description: z
            .string()
            .nullish()
            .refine(v => {
              if (!options.isAdminOfPayee && options.payee?.type !== CollectiveType.VENDOR) {
                return true;
              }

              return v.length > 0;
            }, requiredMessage),
          attachment: z
            .union([
              z.string().nullish(),
              z.object({
                url: z.string().nullish(),
              }),
            ])
            .nullish()
            .refine(attachment => {
              if (
                [ExpenseType.GRANT, ExpenseType.INVOICE, ExpenseType.SETTLEMENT, ExpenseType.PLATFORM_BILLING].includes(
                  values.expenseTypeOption,
                )
              ) {
                return true;
              }

              return typeof attachment === 'string' ? !!attachment : !!attachment?.url;
            }, requiredMessage),
          incurredAt: z
            .string()
            .nullish()
            .refine(incurredAt => {
              if (values.expenseTypeOption === ExpenseType.GRANT) {
                return true;
              }

              return !!incurredAt;
            }, requiredMessage),
          amount: z.object({
            valueInCents: z.number().min(1),
            currency: z.string().refine(
              v => Object.values(Currency).includes(v as Currency),
              () => ({
                message: intl.formatMessage(
                  {
                    id: 'FormError.enum',
                    defaultMessage: 'Must be one of: {options}',
                  },
                  {
                    options: Object.values(Currency).join(','),
                  },
                ),
              }),
            ),
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
          () => ({
            message: intl.formatMessage({ defaultMessage: 'Missing exchange rate', id: 'UXE8lX' }),
            path: ['amount', 'exchangeRate', 'value'],
          }),
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
            () => ({
              message: intl.formatMessage(
                {
                  id: 'FormError.enum',
                  defaultMessage: 'Must be one of: {options}',
                },
                {
                  options: '0%, 15%',
                },
              ),
            }),
          )
          .refine(
            v => {
              if (options.taxType !== TaxType.VAT) {
                return true;
              }

              return v >= 0 && v < 1;
            },
            () => ({
              message: intl.formatMessage(
                { defaultMessage: 'Value must be between {min} and {max}', id: 'f5QMcL' },
                { min: '0%', max: '100%' },
              ),
            }),
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
            () => ({
              message: intl.formatMessage({ defaultMessage: 'Invalid VAT Number', id: 'zL/Rl8' }),
            }),
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
        requiredMessage,
      ),
    acknowledgedCollectiveReceiptExpensePolicy: z
      .boolean()
      .nullish()
      .refine(
        v =>
          values.expenseTypeOption === ExpenseType.RECEIPT && options.account?.policies?.EXPENSE_POLICIES?.receiptPolicy
            ? v
            : true,
        requiredMessage,
      ),
    acknowledgedCollectiveTitleExpensePolicy: z
      .boolean()
      .nullish()
      .refine(v => {
        if (values.expenseTypeOption === ExpenseType.GRANT) {
          return true;
        }
        return options.account?.policies?.EXPENSE_POLICIES?.titlePolicy ? v : true;
      }, requiredMessage),
    acknowledgedCollectiveGrantExpensePolicy: z
      .boolean()
      .nullish()
      .refine(
        v =>
          values.expenseTypeOption === ExpenseType.GRANT && options.account?.policies?.EXPENSE_POLICIES?.grantPolicy
            ? v
            : true,
        requiredMessage,
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
        requiredMessage,
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
        requiredMessage,
      ),
    acknowledgedHostTitleExpensePolicy: z
      .boolean()
      .nullish()
      .refine(v => {
        if (values.expenseTypeOption === ExpenseType.GRANT) {
          return true;
        }
        return options.host?.policies?.EXPENSE_POLICIES?.titlePolicy && options.host?.slug !== options.account?.slug
          ? v
          : true;
      }, requiredMessage),
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
        requiredMessage,
      ),
    payoutMethodNameDiscrepancyReason: z.string().nullish().optional(),
    // See https://github.com/opencollective/opencollective/issues/8306
    // .refine(v => {
    //   if (options.payoutMethod?.type === PayoutMethodType.BANK_ACCOUNT) {
    //     const accountHolderName: string = options.payoutMethod?.data?.accountHolderName ?? '';
    //     const payeeLegalName: string = options.payee?.legalName ?? options.payee?.name ?? '';
    //     if (accountHolderName.trim().toLowerCase() !== payeeLegalName.trim().toLowerCase()) {
    //       return !!v;
    //     }
    //   }

    //   return true;
    // }, requiredMessage)
    newPayoutMethod: z.object({
      type: z
        .nativeEnum(PayoutMethodType)
        .nullish()
        .refine(type => {
          if (['__invite', '__inviteSomeone', '__inviteExistingUser'].includes(values.payeeSlug)) {
            return true;
          }

          if (options.payee?.type === CollectiveType.VENDOR && !options.isHostAdmin) {
            return true;
          }

          if (options.expense?.status === ExpenseStatus.DRAFT && !options.loggedInAccount) {
            return !!type;
          }

          if (!values.payoutMethodId || values.payoutMethodId === '__newPayoutMethod') {
            return !!type;
          }

          return true;
        }, requiredMessage),
      name: z.string().nullish(),
      data: z
        .object({
          currency: z
            .string()
            .nullish()
            .refine(currency => {
              if (['__invite', '__inviteSomeone', '__inviteExistingUser'].includes(values.payeeSlug)) {
                return true;
              }

              if (options.payee?.type === CollectiveType.VENDOR && !options.isHostAdmin) {
                return true;
              }

              if (values.payoutMethodId === '__newAccountBalancePayoutMethod') {
                return true;
              }

              if (values.payoutMethodId === '__newPayoutMethod') {
                return !!currency;
              }

              return true;
            }, requiredMessage),
        })
        .nullish(),
    }),
    inviteNote: z.string().nullish(),
    inviteeExistingAccount: z
      .string()
      .nullish()
      .refine(inviteeExistingAccount => {
        if (values.payeeSlug === '__inviteExistingUser') {
          return !!inviteeExistingAccount;
        }

        return true;
      }, requiredMessage),
    inviteeNewIndividual: z.object({
      name: z
        .string()
        .nullish()
        .refine(name => {
          if (values.payeeSlug === '__invite' && values.inviteeAccountType === InviteeAccountType.INDIVIDUAL) {
            return !isEmpty(name);
          }

          return true;
        }, requiredMessage),
      email: z
        .string()
        .nullish()
        .refine(email => {
          if (values.payeeSlug === '__invite' && values.inviteeAccountType === InviteeAccountType.INDIVIDUAL) {
            return isValidEmail(email);
          }

          return true;
        }, requiredMessage)
        .refine(
          email => {
            if (email) {
              return isValidEmail(email);
            }

            return true;
          },
          () => ({
            message: intl.formatMessage({
              defaultMessage: 'This email address is not valid',
              id: 'FormError.InvalidEmail',
            }),
          }),
        ),
    }),
    inviteeNewOrganization: z.object({
      name: z
        .string()
        .nullish()
        .refine(name => {
          if (values.payeeSlug === '__invite' && values.inviteeAccountType === InviteeAccountType.ORGANIZATION) {
            return !isEmpty(name);
          }

          return true;
        }, requiredMessage),
      email: z
        .string()
        .nullish()
        .refine(email => {
          if (values.payeeSlug === '__invite' && values.inviteeAccountType === InviteeAccountType.ORGANIZATION) {
            return !!email;
          }

          return true;
        }, requiredMessage)
        .refine(
          email => {
            if (email) {
              return isValidEmail(email);
            }

            return true;
          },
          () => ({
            message: intl.formatMessage({
              defaultMessage: 'This email address is not valid',
              id: 'FormError.InvalidEmail',
            }),
          }),
        ),
      organization: z
        .object({
          name: z
            .string()
            .nullish()
            .refine(name => {
              if (values.payeeSlug === '__invite' && values.inviteeAccountType === InviteeAccountType.ORGANIZATION) {
                return !isEmpty(name);
              }

              return true;
            }, requiredMessage),
          slug: z
            .string()
            .nullish()
            .refine(slug => {
              if (values.payeeSlug === '__invite' && values.inviteeAccountType === InviteeAccountType.ORGANIZATION) {
                return !isEmpty(slug);
              }

              return true;
            }, requiredMessage),
          website: z.string().nullish(),
          description: z
            .string()
            .nullish()
            .refine(description => {
              if (values.payeeSlug === '__invite' && values.inviteeAccountType === InviteeAccountType.ORGANIZATION) {
                return !isEmpty(description);
              }

              return true;
            }, requiredMessage),
        })
        .nullish()
        .refine(organization => {
          if (values.payeeSlug === '__invite' && values.inviteeAccountType === InviteeAccountType.ORGANIZATION) {
            return !!organization;
          }

          return true;
        }, requiredMessage),
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
    case '__newVendor':
      return null;
    case '__inviteExistingUser':
      return values.inviteeExistingAccount;
    default:
      return values.payeeSlug;
  }
}

async function buildFormOptions(
  intl: IntlShape,
  apolloClient: ApolloClient<unknown>,
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
    const expenseType = values.expenseTypeOption || options.expense?.type;
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
      options.isHostAdmin = loggedInUser?.isAdminOfCollective(host) ?? false;
      options.host = host;
      options.vendorsForAccount =
        'vendorsForAccount' in host ? (host.vendorsForAccount?.['nodes'] as ExpenseVendorFieldsFragment[]) || [] : [];
      options.showVendorsOption = options.isHostAdmin || ('vendors' in host ? host.vendors?.['totalCount'] > 0 : false);
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

    if (account?.supportedExpenseTypes) {
      options.supportedExpenseTypes = account.supportedExpenseTypes;
      if (!supportsBaseExpenseTypes(options.supportedExpenseTypes) && !query.loading) {
        options.hasInvalidAccount = true;
      }
    }

    if (query.data?.loggedInAccount) {
      options.payoutProfiles = getPayoutProfiles(query.data.loggedInAccount);
      options.isAdminOfPayee =
        options.payoutProfiles.some(p => p.slug === values.payeeSlug) ||
        values.payeeSlug === '__findAccountIAdminister';
      if (payee && payee.type !== CollectiveType.VENDOR && options.isAdminOfPayee) {
        // If the payee has a host and the payer account is under a different one, show the host's payout method (cross-host expense)
        if (payee['host'] && host && payee['host'].id !== host.id) {
          options.payoutMethods = payee['host'].payoutMethods?.filter(p =>
            options.supportedPayoutMethods.includes(p.type),
          );
        } else {
          // Add ACCOUNT_BALANCE payout method if it's supported and available for the payee
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
        }
      } else if (payee && payee.type === CollectiveType.VENDOR) {
        options.payoutMethods = payee.payoutMethods?.filter(p => options.supportedPayoutMethods.includes(p.type));
      }

      // Filter out ACCOUNT_BALANCE from the list of payout methods, since we add it manually to the default list
      options.newPayoutMethodTypes = options.supportedPayoutMethods.filter(
        t => ![PayoutMethodType.ACCOUNT_BALANCE, PayoutMethodType.STRIPE].includes(t),
      );

      if (values.payoutMethodId && values.payoutMethodId !== '__newPayoutMethod') {
        options.payoutMethod = options.payoutMethods?.find(p => p.id === values.payoutMethodId);
      } else if (
        values.payoutMethodId === '__newPayoutMethod' &&
        ((options.payee?.type === CollectiveType.VENDOR && options.isHostAdmin) || options.isAdminOfPayee)
      ) {
        options.payoutMethod = values.newPayoutMethod;
      }
    } else {
      options.payoutMethod = values.newPayoutMethod;
      options.newPayoutMethodTypes = options.supportedPayoutMethods;
    }

    if (!startOptions.duplicateExpense && options.expense?.lockedFields?.length) {
      options.lockedFields = options.expense.lockedFields;
    }

    // Compute available reference currencies from all sources
    const availableCurrencies = new Set<Currency>();
    if (options.expense && options.lockedFields?.includes?.(ExpenseLockableFields.AMOUNT)) {
      availableCurrencies.add(options.expense.currency);
    } else if (expenseType === ExpenseType.GRANT) {
      // Grants are always in the account currency
      availableCurrencies.add(options.account?.currency);
    } else {
      // For all other expenses one of the items currencies
      values.expenseItems?.forEach(item => {
        if (item.amount?.currency) {
          availableCurrencies.add(item.amount.currency as Currency);
        }
      });

      // If we didn't get any currency from the items, default to the account + payout method currencies
      if (availableCurrencies.size === 0) {
        if (options.account?.currency) {
          availableCurrencies.add(options.account.currency);
        }
        if (options.payoutMethod?.data?.currency) {
          availableCurrencies.add(options.payoutMethod.data.currency);
        }
      }
    }

    options.availableReferenceCurrencies = memoizeAvailableReferenceCurrencies(Array.from(availableCurrencies));

    if (options.availableReferenceCurrencies.length === 1) {
      options.expenseCurrency = options.availableReferenceCurrencies[0]; // If there's only one available currency, use it
    } else if (options.availableReferenceCurrencies.includes(values.referenceCurrency as Currency)) {
      options.expenseCurrency = values.referenceCurrency as Currency; // If the user provided a reference currency, use it
    } else if (options.expense?.currency) {
      options.expenseCurrency = options.expense.currency; // Use the expense currency if it's set
    }

    options.isLongFormItemDescription = false;
    options.allowDifferentItemCurrency = true;
    options.hasExpenseItemDate = true;
    options.canSetupRecurrence = true;

    if (expenseType === ExpenseType.GRANT) {
      options.isLongFormItemDescription = true;
      options.allowDifferentItemCurrency = false;
      options.hasExpenseItemDate = false;
      options.canSetupRecurrence = false;
    }

    options.allowExpenseItemAttachment = expenseType === ExpenseType.RECEIPT || expenseType === ExpenseType.CHARGE;

    options.allowInvite = !startOptions.isInlineEdit && options.expense?.status !== ExpenseStatus.DRAFT;

    if (expenseType === ExpenseType.INVOICE) {
      // Preserve tax type from existing expense if it has taxes
      if (options.expense?.taxes?.length > 0) {
        options.taxType = options.expense.taxes[0].type;
      } else if (accountHasVAT(account as Account, host as Account)) {
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

/**
 * Central hook for managing expense form state, validation, data fetching, and submission.
 *
 * This hook integrates Formik for form management, Zod for validation, Apollo Client for
 * data fetching/mutations, and handles complex initialization workflows for both expense
 * creation and editing scenarios.
 *
 * @param opts Configuration options including form ref, initial values, and callbacks
 * @returns ExpenseForm object with form state, validation, and submission methods
 *
 * @see README.md for detailed architecture documentation
 */
export function useExpenseForm(opts: {
  formRef?: React.RefObject<HTMLFormElement>;
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
  ) => void | Promise<unknown>;
}): ExpenseForm {
  const intl = useIntl();
  const apolloClient = useApolloClient();
  const { LoggedInUser } = useLoggedInUser();
  const [formOptions, setFormOptions] = React.useState<ExpenseFormOptions>({ schema: z.object({}) });
  const startOptions = React.useRef(opts.startOptions);
  const [expenseLoaded, setExpenseLoaded] = React.useState(false);
  const setInitialExpenseValues = React.useRef(false);
  const setInitialFormOptions = React.useRef(false);
  const initialLoading = React.useRef(true);
  const expenseFormValues = React.useRef<ExpenseFormValues>(opts.initialValues);

  const initialValues = React.useRef(opts.initialValues);
  const initialStatus = React.useRef({ schema: formOptions.schema });

  // GraphQL mutations for expense operations
  const [createExpense] = useMutation<CreateExpenseFromDashboardMutation, CreateExpenseFromDashboardMutationVariables>(
    gql`
      mutation CreateExpenseFromDashboard(
        $expenseCreateInput: ExpenseCreateInput!
        $account: AccountReferenceInput!
        $recurring: RecurringExpenseInput
      ) {
        expense: createExpense(expense: $expenseCreateInput, account: $account, recurring: $recurring) {
          id
          legacyId
        }
      }
    `,
    {
      context: {
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
            invoiceInfo: values.invoiceInfo || null,
            invoiceFile:
              values.hasInvoiceOption === YesNoOption.NO
                ? null
                : values.invoiceFile
                  ? { url: typeof values.invoiceFile === 'string' ? values.invoiceFile : values.invoiceFile.url }
                  : undefined,
            items: values.expenseItems.map(ei => ({
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
              url:
                values.expenseTypeOption === ExpenseType.RECEIPT
                  ? typeof ei.attachment === 'string'
                    ? ei.attachment
                    : ei.attachment?.url
                  : null,
            })),
            longDescription: null,
            privateMessage: values.privateMessage || null,
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

        if (!isEmpty(errs)) {
          // eslint-disable-next-line no-console
          console.log('Form validation error', errs, values); // The form does not always surface errors properly, this will help to troubleshoot.
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

  // Load initial values from expense
  React.useEffect(() => {
    if (!formOptions.expense || setInitialExpenseValues.current) {
      return;
    }

    setInitialExpenseValues.current = true;
    setFieldValue('accountingCategoryId', formOptions.expense.accountingCategory?.id);
    setFieldValue('accountSlug', formOptions.expense.account.slug);
    setFieldValue('expenseTypeOption', formOptions.expense.type);
    setFieldValue('payoutMethodId', formOptions.expense.payoutMethod?.id);
    setFieldValue('tags', formOptions.expense.tags);
    setFieldValue('title', formOptions.expense.description);
    setFieldTouched('title', true);
    setFieldValue('privateMessage', formOptions.expense.privateMessage);

    // Load taxes
    const taxes = formOptions.expense.taxes || [];
    setFieldValue('hasTax', taxes.length > 0);
    if (taxes?.length > 0) {
      setFieldValue('tax.idNumber', taxes[0].idNumber);
      setFieldValue('tax.rate', taxes[0].rate);
    }

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

    if (formOptions.expense.invoiceInfo) {
      setFieldValue('invoiceInfo', formOptions.expense.invoiceInfo);
    }

    if (formOptions.expense.status === ExpenseStatus.DRAFT) {
      setFieldValue(
        'expenseItems',
        formOptions.expense.draft?.items?.map(ei => ({
          id: !startOptions.current.duplicateExpense ? ei.id : undefined,
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
          id: !startOptions.current.duplicateExpense ? ei.id : undefined,
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
      setFieldTouched('expenseItems', true);
      setExpenseLoaded(true);
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

  // Drop taxes when not supported
  React.useEffect(() => {
    if (!formOptions.taxType) {
      setFieldValue('hasTax', false);
      setFieldValue('tax', null);
    }
  }, [formOptions.taxType, setFieldValue]);

  // Move attachments when switching expense type
  React.useEffect(() => {
    if (expenseForm.values.expenseTypeOption === ExpenseType.INVOICE) {
      if (expenseForm.values.expenseItems.length === 1 && expenseForm.values.expenseItems[0].attachment) {
        setFieldValue('invoiceFile', expenseForm.values.expenseItems[0].attachment);
        setFieldValue('expenseItems.0.attachment', null);
        setFieldValue('hasInvoiceOption', YesNoOption.YES);
      } else {
        const numberOfAdditionalAttachments = expenseForm.values.additionalAttachments?.length ?? 0;
        let count = 0;

        expenseForm.values.expenseItems.forEach((item, i) => {
          if (item.attachment) {
            setFieldValue(`additionalAttachments.${numberOfAdditionalAttachments + count}`, item.attachment);
            setFieldValue(`expenseItems.${i}.attachment`, null);
            count++;
          }
        });
      }
    } else if (expenseForm.values.expenseTypeOption === ExpenseType.RECEIPT) {
      if (expenseForm.values.invoiceFile) {
        for (let i = 0; i < expenseForm.values.expenseItems.length; i++) {
          setFieldValue(`expenseItems.${i}.attachment`, expenseForm.values.invoiceFile);
        }
        setFieldValue('invoiceFile', null);
      }
    }
  }, [expenseForm.values.expenseTypeOption]);

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
    if (initialLoading.current) {
      return;
    } else if (!expenseForm.values.hasTax) {
      setFieldValue('tax', null);
    } else if (!expenseForm.values.tax) {
      const selectedVendor = formOptions.vendorsForAccount?.find(
        v => v.slug === expenseForm.values.payeeSlug && formOptions?.taxType === v.vendorInfo?.taxType,
      );
      if (selectedVendor && !expenseForm.values.tax) {
        setFieldValue('tax', { idNumber: selectedVendor.vendorInfo?.taxId, rate: 0 });
      }
    }
  }, [
    expenseForm.values.hasTax,
    expenseForm.values.tax,
    expenseForm.values.payeeSlug,
    formOptions.vendorsForAccount,
    setFieldValue,
  ]);

  // Reset expense type if the account does not support it (unless we're editing an existing one)
  React.useEffect(() => {
    if (
      !initialLoading.current &&
      expenseForm.values.expenseTypeOption &&
      !formOptions.expense?.id &&
      formOptions.supportedExpenseTypes &&
      !formOptions.supportedExpenseTypes.includes(expenseForm.values.expenseTypeOption)
    ) {
      setFieldValue('expenseTypeOption', null);
    }
  }, [formOptions.supportedExpenseTypes, expenseForm.values.expenseTypeOption, formOptions.expense?.id, setFieldValue]);

  React.useEffect(() => {
    if (expenseForm.values.accountingCategoryId && (formOptions.accountingCategories || []).length === 0) {
      setFieldValue('accountingCategoryId', null);
    }
  }, [formOptions.accountingCategories, expenseForm.values.accountingCategoryId, setFieldValue]);

  // Reset reference currency if it's no longer in the available currencies
  React.useEffect(() => {
    if (
      !initialLoading.current &&
      formOptions.availableReferenceCurrencies &&
      expenseForm.values.referenceCurrency &&
      !formOptions.availableReferenceCurrencies.includes(expenseForm.values.referenceCurrency as Currency)
    ) {
      setFieldValue('referenceCurrency', null);
    }
  }, [expenseForm.values.referenceCurrency, formOptions.availableReferenceCurrencies, setFieldValue]);

  // Set item currency if we're done loading and there's a single available reference currency
  React.useEffect(() => {
    if (
      !initialLoading.current &&
      formOptions.availableReferenceCurrencies &&
      formOptions.availableReferenceCurrencies.length === 1 &&
      expenseForm.values.expenseItems.length === 1 &&
      !expenseForm.values.expenseItems[0].amount?.currency
    ) {
      setFieldValue('expenseItems.0.amount.currency', formOptions.availableReferenceCurrencies[0]);
    }
  }, [formOptions.availableReferenceCurrencies, setFieldValue, expenseForm.values.expenseItems]);

  // If there's an existing expense, assume that reference currency = expense currency
  React.useEffect(() => {
    if (
      formOptions.expense?.id &&
      formOptions.expense.currency &&
      !expenseForm.values.referenceCurrency &&
      formOptions.availableReferenceCurrencies.length > 1
    ) {
      setFieldValue('referenceCurrency', formOptions.expense.currency);
    }
  }, [
    formOptions.expense,
    expenseForm.values.referenceCurrency,
    formOptions.availableReferenceCurrencies,
    setFieldValue,
  ]);

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

    /**
     * Fetches exchange rates for expense items with different currencies.
     * Uses AbortController to cancel in-flight requests on component unmount.
     */
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
          context: {},
          variables: {
            exchangeRateRequests,
          },
        });

        if (ctrl.signal.aborted) {
          return;
        }

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
      } catch {
        return;
      }
    }

    updateExchangeRates();

    return () => {
      if (!queryComplete) {
        ctrl.abort();
      }
    };
  }, [
    apolloClient,
    formOptions.expenseCurrency,
    expenseForm.values.expenseItems,
    expenseForm.values.expenseTypeOption,
    setFieldValue,
  ]);

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
    if (startOptions.current.expenseId && !expenseLoaded) {
      return;
    }

    for (let i = 0; i < (expenseForm.values.expenseItems?.length ?? 0); i++) {
      const expenseItem = expenseForm.values.expenseItems[i];
      if (!expenseItem.amount?.currency) {
        setFieldValue(`expenseItems.${i}.amount.currency`, formOptions.expenseCurrency);
      }
    }
  }, [formOptions.expenseCurrency, expenseForm.values.expenseItems, setFieldValue, expenseLoaded]);

  React.useEffect(() => {
    if (
      expenseForm.values.payoutMethodId &&
      !expenseForm.values.payoutMethodId.startsWith('__') &&
      !formOptions.payoutMethods?.some(p => p.id === expenseForm.values.payoutMethodId)
    ) {
      setFieldValue('payoutMethodId', null);
    }

    const selectedPayoutMethod = formOptions.payoutMethods?.find(p => p.id === expenseForm.values.payoutMethodId);
    if (
      selectedPayoutMethod &&
      selectedPayoutMethod.data?.currency &&
      formOptions.allowDifferentItemCurrency &&
      !expenseForm.touched.expenseItems &&
      expenseForm.values.expenseItems[0]?.amount?.currency !== selectedPayoutMethod.data?.currency &&
      !startOptions.current.isInlineEdit // expenseItems will not be touched when editing the payout method, we don't want to update the expense items currency then
    ) {
      setFieldValue(
        'expenseItems',
        expenseForm.values.expenseItems.map(ei => ({
          ...ei,
          amount: {
            ...ei.amount,
            currency: selectedPayoutMethod.data?.currency,
          },
        })),
      );
    }
  }, [
    formOptions.allowDifferentItemCurrency,
    formOptions.payoutMethods,
    expenseForm.values.payoutMethodId,
    setFieldValue,
    setFormOptions,
    expenseForm.touched.expenseItems,
    expenseForm.values.expenseItems,
  ]);

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
