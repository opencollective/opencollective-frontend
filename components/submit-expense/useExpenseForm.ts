import React from 'react';
import { ApolloClient, gql, useApolloClient } from '@apollo/client';
import { accountHasGST, accountHasVAT, checkVATNumberFormat, TaxType } from '@opencollective/taxes';
import dayjs from 'dayjs';
import type { Path, PathValue } from 'dot-path-value';
import { FormikErrors, FormikHelpers, useFormik } from 'formik';
import { isEmpty, isEqual, pick, set, uniqBy } from 'lodash';
import memoizeOne from 'memoize-one';
import { IntlShape, useIntl } from 'react-intl';
import z, { ZodObjectDef } from 'zod';

import { AccountTypesWithHost, CollectiveType } from '../../lib/constants/collectives';
import { LoggedInUser } from '../../lib/custom_typings/LoggedInUser';
import { getPayoutProfiles } from '../../lib/expenses';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import {
  Amount,
  Currency,
  ExpenseFormExchangeRatesQuery,
  ExpenseFormExchangeRatesQueryVariables,
  ExpenseFormSchemaHostFieldsFragment,
  ExpenseFormSchemaQuery,
  ExpenseFormSchemaQueryVariables,
  ExpenseStatus,
  ExpenseType,
  PayoutMethodType,
} from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { userMustSetAccountingCategory } from '../expenses/lib/accounting-categories';
import { computeExpenseAmounts, expenseTypeSupportsItemCurrency, getSupportedCurrencies } from '../expenses/lib/utils';

import { loggedInAccountExpensePayoutFieldsFragment } from '../expenses/graphql/fragments';
import { getCustomZodErrorMap } from '../FormikZod';

export type ExpenseTypeOption = ExpenseType.INVOICE | ExpenseType.RECEIPT;

export type ExpenseItem = {
  description?: string;
  incurredAt?: Date;
  amount?: {
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
  url?: string;
};

export type ExpenseFormValues = {
  collectiveSlug?: string;
  payeeSlug?: string;
  expenseTypeOption?: ExpenseTypeOption;
  payoutMethodId?: string;
  title?: string;
  accountingCategoryId?: string;
  tags?: string[];
  expenseCurrency?: string;
  expenseItems?: ExpenseItem[];
  expenseAttachedFiles?: { url: string }[];
  hasTax?: boolean;
  tax?: {
    rate: number;
    idNumber: string;
  };
  acknowledgedExpensePolicy?: boolean;
  inviteNote?: string;
  invitePayee?:
    | {
        // platform user
        legacyId: number;
      }
    | {
        // outside platform user
        name?: string;
        email?: string;
        payoutMethod?: Record<string, any>;
        organization?: {
          description?: string;
          name?: string;
          slug?: string;
          website?: string;
        };
      };
};

export type ExpenseFormik = Omit<ReturnType<typeof useFormik<ExpenseFormValues>>, 'setFieldValue'> & {
  setFieldValue: <F extends Path<ExpenseFormValues>>(
    field: F,
    value: PathValue<ExpenseFormValues, F>,
  ) => Promise<void> | Promise<FormikErrors<ExpenseFormValues>>;
};

export type ExpenseForm = ExpenseFormik & {
  options: ExpenseFormOptions;
  startOptions: ExpenseFormStartOptions;
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
      ...AccountFields
    }

    payee: account(slug: $payeeSlug) @include(if: $hasPayeeSlug) {
      ...PayeeFields
    }

    loggedInAccount {
      id
      ...LoggedInAccountExpensePayoutFields
    }

    submitter: account(slug: $submitterSlug) @include(if: $hasSubmitterSlug) {
      ...SubmitterFields
    }

    recentlySubmittedExpenses: expenses(
      createdByAccount: { slug: $submitterSlug }
      limit: 10
      types: [INVOICE, RECEIPT]
      orderBy: { field: CREATED_AT, direction: DESC }
    ) @include(if: $hasSubmitterSlug) {
      nodes {
        account {
          id
          name
          type
          slug
          imageUrl
        }
        payee {
          id
          name
          type
          slug
          imageUrl
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
        ...AccountFields
      }
      payee {
        ...PayeeFields
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
      tags
      permissions {
        id
        canEdit
        canEditAccountingCategory
        canEditTags
      }
      draft
      submitter: createdByAccount {
        ...SubmitterFields
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

    expensePolicy
    accountingCategories(kind: EXPENSE) {
      nodes {
        id
        name
        kind
        expensesTypes
        friendlyName
        code
        instructions
      }
    }
  }

  fragment AccountFields on Account {
    id
    name
    slug
    currency
    settings
    supportedExpenseTypes

    expensePolicy

    stats {
      balance {
        valueInCents
        currency
      }
    }

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
  }

  fragment SubmitterFields on Account {
    id
    slug
    name
    imageUrl
  }

  fragment PayeeFields on Account {
    id
    slug
    name
    type
    isAdmin
    payoutMethods {
      id
      type
      name
      data
      isSaved
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
  }
`;

type ExpenseFormOptions = {
  schema: z.ZodType<RecursivePartial<ExpenseFormValues>, ZodObjectDef, RecursivePartial<ExpenseFormValues>>;
  supportedCurrencies?: string[];
  supportedExpenseTypes?: ExpenseType[];
  payoutProfiles?: ExpenseFormSchemaQuery['loggedInAccount'][];
  supportedPayoutMethods?: PayoutMethodType[];
  expenseTags?: ExpenseFormSchemaHostFieldsFragment['expensesTags'];
  hostExpensePolicy?: string;
  collectiveExpensePolicy?: string;
  isAccountingCategoryRequired?: boolean;
  accountingCategories?: ExpenseFormSchemaHostFieldsFragment['accountingCategories']['nodes'];
  allowExpenseItemAttachment?: boolean;
  allowExpenseItemCurrencyChange?: boolean;
  taxType?: TaxType;
  recentlySubmittedExpenses?: ExpenseFormSchemaQuery['recentlySubmittedExpenses'];
  host?: ExpenseFormSchemaHostFieldsFragment;
  account?: ExpenseFormSchemaQuery['account'];
  payee?: ExpenseFormSchemaQuery['payee'];
  submitter?: ExpenseFormSchemaQuery['submitter'];
  loggedInAccount?: ExpenseFormSchemaQuery['loggedInAccount'];
  expense?: ExpenseFormSchemaQuery['expense'];
  totalInvoicedInExpenseCurrency?: number;
};

const memoizedExpenseFormSchema = memoizeOne(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (apolloClient: ApolloClient<any>, variables: ExpenseFormSchemaQueryVariables, refresh?: boolean) => {
    return await apolloClient.query<ExpenseFormSchemaQuery, ExpenseFormSchemaQueryVariables>({
      query: formSchemaQuery,
      context: API_V2_CONTEXT,
      variables: variables,
      errorPolicy: 'all',
      fetchPolicy: 'cache-first',
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
  startOptions: ExpenseFormStartOptions,
  intl: IntlShape,
): z.ZodType<RecursivePartial<ExpenseFormValues>, z.ZodObjectDef, RecursivePartial<ExpenseFormValues>> {
  const supportedCurrencies =
    options.supportedCurrencies?.length > 0 ? options.supportedCurrencies : Object.values(Currency);

  return z.object({
    expenseId: z.number().nullish(),
    collectiveSlug: z.string().refine(
      slug => {
        if (!startOptions.expenseId || !options.expense) {
          return true;
        }

        return slug === options.expense.account.slug;
      },
      {
        message: 'Required',
      },
    ),
    payeeSlug: z
      .string()
      .nullish()
      .refine(
        v => {
          if (v) {
            return true;
          }

          if (values.invitePayee) {
            return true;
          }

          return !!v;
        },
        {
          message: 'Required',
        },
      ),
    expenseTypeOption: z.enum([ExpenseType.INVOICE, ExpenseType.RECEIPT]).refine(
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
          if (
            options.payee &&
            options.payee.type !== CollectiveType.VENDOR &&
            !options.payee.payoutMethods?.some(pm => pm.id === v)
          ) {
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
            !options.accountingCategories.some(ac => ac.id === v)
          ) {
            return false;
          }

          return true;
        },
        {
          message: 'Required',
        },
      ),
    title: z.string().min(1),
    expenseCurrency: z.string().refine(v => supportedCurrencies.includes(v), {
      message: `Currency must be one of: ${supportedCurrencies.join(',')}`,
    }),
    tags: z.array(z.string()).optional(),
    expenseAttachedFiles: z
      .array(
        z.object({
          url: z.string().url(),
        }),
      )
      .optional()
      .nullable(),
    expenseItems: z.array(
      z
        .object({
          description: z.string().min(1),
          url: z
            .string()
            .url()
            .nullish()
            .refine(
              url => {
                if (values.expenseTypeOption === ExpenseType.INVOICE) {
                  return true;
                }

                return !!url;
              },
              {
                message: 'File upload required for expense items',
              },
            ),
          incurredAt: z.date(),
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
            if (item.amount.currency && item.amount.currency !== values.expenseCurrency) {
              return item.amount.exchangeRate?.value && item.amount.exchangeRate?.source;
            }
            return true;
          },
          {
            message: intl.formatMessage({ defaultMessage: 'Missing exchange rate' }),
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
    acknowledgedExpensePolicy: z
      .boolean()
      .nullish()
      .refine(
        v => {
          if (!options.hostExpensePolicy && !options.collectiveExpensePolicy) {
            return true;
          }
          return !!v;
        },
        {
          message: 'Required',
        },
      ),
    inviteNote: z.string().nullish(),
    invitePayee: z
      .union([
        z.object({
          legacyId: z.number(),
        }),
        z.object({
          legacyId: z.undefined(),
          name: z.string().min(1),
          email: z.string().email().min(1),
        }),
      ])
      .nullish(),
  });
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

  try {
    const query = await memoizedExpenseFormSchema(
      apolloClient,
      {
        collectiveSlug: values.collectiveSlug,
        hasCollectiveSlug: !!values.collectiveSlug,
        payeeSlug: values.payeeSlug,
        hasPayeeSlug: !!values.payeeSlug,
        hasExpenseId: !!startOptions.expenseId,
        expenseId: startOptions.expenseId,
        expenseKey: startOptions.draftKey,
        hasSubmitterSlug: !!loggedInUser?.collective?.slug,
        submitterSlug: loggedInUser?.collective?.slug,
      },
      refresh,
    );

    const expense = query.data?.expense;
    const recentlySubmittedExpenses = query.data?.recentlySubmittedExpenses;
    const account = options.expense?.account || query.data?.account;
    const host = account && 'host' in account ? account.host : null;
    const payee = options.expense?.payee || query.data?.payee;
    const payeeHost = payee && 'host' in payee ? payee.host : null;
    const submitter = options.expense?.submitter || query.data?.submitter;

    if (expense) {
      options.expense = query.data.expense;
    }

    if (recentlySubmittedExpenses) {
      options.recentlySubmittedExpenses = recentlySubmittedExpenses;
    }

    if (account) {
      options.account = account;
      options.collectiveExpensePolicy = account.expensePolicy;
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

    if (host) {
      options.host = host;
      options.supportedPayoutMethods = host.supportedPayoutMethods || [];
      options.hostExpensePolicy = host.expensePolicy;
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

    if (payee && AccountTypesWithHost.includes(payee.type)) {
      options.supportedPayoutMethods = options.supportedPayoutMethods.filter(t => t !== PayoutMethodType.OTHER);
    }

    if ((account?.supportedExpenseTypes ?? []).length > 0) {
      options.supportedExpenseTypes = query.data.account.supportedExpenseTypes;
    }

    if (query.data?.loggedInAccount) {
      options.payoutProfiles = getPayoutProfiles(query.data.loggedInAccount);
    }

    options.supportedCurrencies = Object.values(Currency);
    if (payee && values.payoutMethodId && values.expenseTypeOption) {
      const supportedCurrencies = getSupportedCurrencies(account, {
        payee: payee,
        payoutMethod: payee?.payoutMethods?.find(p => p.id === values.payoutMethodId),
        type: values.expenseTypeOption,
        currency: account.currency,
      });

      options.supportedCurrencies = supportedCurrencies;
    }

    options.allowExpenseItemAttachment = values.expenseTypeOption === ExpenseType.RECEIPT;
    options.allowExpenseItemCurrencyChange = expenseTypeSupportsItemCurrency(values.expenseTypeOption);

    if (values.expenseTypeOption === ExpenseType.INVOICE) {
      if (accountHasVAT(account as any, host as any)) {
        options.taxType = TaxType.VAT;
      } else if (accountHasGST(host || account)) {
        options.taxType = TaxType.GST;
      }
    }

    if (values.expenseCurrency && values.expenseItems?.length > 0) {
      const { totalInvoiced } = computeExpenseAmounts(
        values.expenseCurrency,
        (values.expenseItems || []).map(ei => ({
          description: ei.description,
          amountV2: ei.amount as Amount,
          incurredAt: ei.incurredAt,
        })),
        values.tax ? [{ ...values.tax, type: options.taxType }] : [],
      );

      options.totalInvoicedInExpenseCurrency = totalInvoiced;
    }

    options.schema = buildFormSchema(values, options, startOptions, intl);

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
  preselectInvitePayee?: boolean;
  duplicateExpense?: boolean;
  expenseId?: number;
  draftKey?: string;
};

export function useExpenseForm(opts: {
  formRef?: React.MutableRefObject<HTMLFormElement>;
  initialValues: ExpenseFormValues;
  startOptions: ExpenseFormStartOptions;
  onSubmit: (
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

  const expenseForm: ExpenseFormik = useFormik<ExpenseFormValues>({
    initialValues: opts.initialValues,
    initialStatus: { schema: formOptions.schema },
    async validate(values) {
      const result = formOptions.schema.safeParse(values, { errorMap: getCustomZodErrorMap(intl) });
      if (result.success === false) {
        const errs = {};

        for (const issue of result.error.issues) {
          set(errs, issue.path, issue.message);
        }
        return errs;
      }
    },
    onSubmit(values, formikHelpers) {
      return opts.onSubmit(values, formikHelpers, formOptions, startOptions.current);
    },
    validateOnBlur: false,
  });

  const prevValues = usePrevious(expenseForm.values);

  /* field dependencies */
  const setFieldValue = expenseForm.setFieldValue;

  React.useEffect(() => {
    if (!formOptions.expense || setInitialExpenseValues.current) {
      return;
    }

    setInitialExpenseValues.current = true;
    setFieldValue('accountingCategoryId', formOptions.expense.accountingCategory?.id);
    setFieldValue('collectiveSlug', formOptions.expense.account.slug);
    setFieldValue('expenseCurrency', formOptions.expense.currency);
    setFieldValue('expenseTypeOption', formOptions.expense.type as ExpenseTypeOption);
    setFieldValue('hasTax', (formOptions.expense.taxes || []).length > 0);
    setFieldValue('payoutMethodId', formOptions.expense.payoutMethod?.id);
    setFieldValue('tags', formOptions.expense.tags);
    if (formOptions.expense.taxes?.length > 0) {
      setFieldValue('tax.idNumber', formOptions.expense.taxes[0].idNumber);
      setFieldValue('tax.rate', formOptions.expense.taxes[0].rate);
    }
    setFieldValue('title', formOptions.expense.description);

    if (formOptions.expense.status === ExpenseStatus.DRAFT && formOptions.expense.draft?.payee) {
      if (
        formOptions.loggedInAccount &&
        formOptions.expense.draft.payee?.slug &&
        formOptions.expense.draft.payee?.slug === formOptions.loggedInAccount.slug
      ) {
        setFieldValue('payeeSlug', formOptions.expense.draft.payee?.slug);
      } else {
        setFieldValue('inviteNote', formOptions.expense.longDescription);
        setFieldValue('invitePayee', formOptions.expense.draft?.payee);
        if (formOptions.expense.draft?.payoutMethod) {
          setFieldValue('invitePayee.payoutMethod', formOptions.expense.draft?.payoutMethod);
        }
      }
    } else if (formOptions.expense.payee?.slug) {
      setFieldValue('payeeSlug', formOptions.expense.payee?.slug);
    }

    if (formOptions.expense.status === ExpenseStatus.DRAFT) {
      setFieldValue(
        'expenseAttachedFiles',
        formOptions.expense.draft?.attachedFiles?.map(af => ({ url: af.url })),
      );
      setFieldValue(
        'expenseItems',
        formOptions.expense.draft?.items?.map(ei => ({
          url: ei.url,
          description: ei.description ?? '',
          incurredAt: dayjs.utc(ei.incurredAt).toDate(),
          amount: {
            valueInCents: ei.amountV2?.valueInCents ?? ei.amount,
            currency: ei.amountV2?.currency ?? ei.currency,
          },
        })),
      );
    } else {
      if (
        !startOptions.current.duplicateExpense &&
        (formOptions.hostExpensePolicy || formOptions.collectiveExpensePolicy)
      ) {
        setFieldValue('acknowledgedExpensePolicy', true);
      }

      if (!startOptions.current.duplicateExpense) {
        setFieldValue(
          'expenseAttachedFiles',
          formOptions.expense.attachedFiles?.map(af => ({ url: af.url })),
        );
      }

      setFieldValue(
        'expenseItems',
        formOptions.expense.items?.map(ei => ({
          url: !startOptions.current.duplicateExpense ? ei.url : null,
          description: ei.description ?? '',
          incurredAt: !startOptions.current.duplicateExpense ? dayjs.utc(ei.incurredAt).toDate() : null,
          amount: {
            valueInCents: ei.amount.valueInCents,
            currency: ei.amount.currency,
            exchangeRate: !startOptions.current.duplicateExpense ? ei.amount.exchangeRate : null,
          },
        })),
      );
    }
  }, [
    formOptions.expense,
    formOptions.hostExpensePolicy,
    formOptions.loggedInAccount,
    formOptions.collectiveExpensePolicy,
    setInitialExpenseValues,
    setFieldValue,
  ]);

  React.useEffect(() => {
    if (!prevValues.payeeSlug && expenseForm.values.payeeSlug) {
      setFieldValue('invitePayee', null);
      setFieldValue('inviteNote', null);
    }
  }, [setFieldValue, prevValues.payeeSlug, expenseForm.values.payeeSlug]);

  React.useEffect(() => {
    if (!prevValues.invitePayee && expenseForm.values.invitePayee) {
      setFieldValue('payeeSlug', null);
    }
  }, [setFieldValue, prevValues.invitePayee, expenseForm.values.invitePayee]);

  React.useEffect(() => {
    if (!formOptions.taxType) {
      setFieldValue('hasTax', false);
      setFieldValue('tax', null);
    }
  }, [formOptions.taxType, setFieldValue]);

  React.useEffect(() => {
    if (!expenseForm.values.hasTax) {
      setFieldValue('tax', null);
    }
  }, [expenseForm.values.hasTax, setFieldValue]);

  React.useEffect(() => {
    if (isEmpty(expenseForm.values.expenseItems)) {
      return;
    }

    const exchangeRateRequests = uniqBy(
      expenseForm.values.expenseItems.filter(needExchangeRateFilter(expenseForm.values.expenseCurrency)).map(ei => ({
        fromCurrency: ei.amount.currency as Currency,
        toCurrency: expenseForm.values.expenseCurrency as Currency,
        date: ei.incurredAt,
      })),
      ei => `${ei.fromCurrency}-${ei.toCurrency}-${ei.date}`,
    );

    expenseForm.values.expenseItems.forEach((ei, i) => {
      if (ei.amount?.currency && ei.amount.currency === expenseForm.values.expenseCurrency) {
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
            if (needExchangeRateFilter(expenseForm.values.expenseCurrency)(ei)) {
              const exchangeRate = res.data.currencyExchangeRate.find(
                rate =>
                  rate.fromCurrency === ei.amount.currency && rate.toCurrency === expenseForm.values.expenseCurrency,
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
  }, [apolloClient, expenseForm.values.expenseCurrency, expenseForm.values.expenseItems, setFieldValue]);

  const setStatus = expenseForm.setStatus;
  React.useEffect(() => {
    setStatus({ schema: formOptions.schema });
  }, [formOptions.schema, setStatus]);

  // calculate form
  React.useEffect(() => {
    async function refreshFormOptions() {
      setFormOptions(
        await buildFormOptions(intl, apolloClient, LoggedInUser, expenseForm.values, startOptions.current),
      );
    }

    refreshFormOptions();
  }, [apolloClient, LoggedInUser, expenseForm.values, intl, startOptions]);

  // revalidate form
  const validateForm = expenseForm.validateForm;
  React.useEffect(() => {
    validateForm();
  }, [formOptions.schema, validateForm]);

  React.useEffect(() => {
    let newCurrency = expenseForm.values.expenseCurrency;
    const availableCurrencies = formOptions.supportedCurrencies || [];

    // single available currency
    if (availableCurrencies.length === 1 && expenseForm.values.expenseCurrency !== availableCurrencies[0]) {
      newCurrency = availableCurrencies[0];
    } else if (
      !expenseForm.values.expenseCurrency &&
      formOptions.account?.currency &&
      availableCurrencies.includes(formOptions.account?.currency)
    ) {
      newCurrency = formOptions.account?.currency;
    }

    if (newCurrency && expenseForm.values.expenseCurrency !== newCurrency) {
      setFieldValue('expenseCurrency', newCurrency);
    }

    for (let i = 0; i < (expenseForm.values.expenseItems?.length ?? 0); i++) {
      const expenseItem = expenseForm.values.expenseItems[i];
      if (!expenseItem.amount?.currency) {
        setFieldValue(`expenseItems.${i}.amount.currency`, newCurrency);
      }
    }
  }, [
    formOptions.supportedCurrencies,
    formOptions.account?.currency,
    prevValues.expenseCurrency,
    expenseForm.values.expenseTypeOption,
    expenseForm.values.expenseCurrency,
    expenseForm.values.expenseItems,
    setFieldValue,
  ]);

  return Object.assign(expenseForm, {
    options: formOptions,
    startOptions: startOptions.current,
    refresh: async () =>
      setFormOptions(
        await buildFormOptions(intl, apolloClient, LoggedInUser, expenseForm.values, startOptions.current, true),
      ),
  });
}
