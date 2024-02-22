import React from 'react';
import { ApolloClient, gql, useApolloClient } from '@apollo/client';
import { accountHasGST, accountHasVAT, checkVATNumberFormat, TaxType } from '@opencollective/taxes';
import dayjs from 'dayjs';
import type { Path, PathValue } from 'dot-path-value';
import { FormikErrors, FormikHelpers, useFormik } from 'formik';
import { isEmpty, isEqual, map, partialRight, pick, set, uniqBy } from 'lodash';
import { IntlShape, useIntl } from 'react-intl';
import z from 'zod';

import { LoggedInUser } from '../../lib/custom_typings/LoggedInUser';
import { getPayoutProfiles } from '../../lib/expenses';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import {
  Currency,
  ExpenseFormExchangeRatesQuery,
  ExpenseFormExchangeRatesQueryVariables,
  ExpenseFormSchemaHostFieldsFragment,
  ExpenseFormSchemaQuery,
  ExpenseFormSchemaQueryVariables,
  ExpenseType,
} from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { userMustSetAccountingCategory } from '../expenses/lib/accounting-categories';
import { getSupportedCurrencies } from '../expenses/lib/utils';

import { loggedInAccountExpensePayoutFieldsFragment } from '../expenses/graphql/fragments';

export enum ExpenseTypeOption {
  INVOICE = 'INVOICE',
  REIMBURSEMENT = 'REIMBURSEMENT',
  INVITED_INVOICE = 'INVITED_INVOICE',
  INVITED_REIMBURSEMENT = 'INVITED_REIMBURSEMENT',
  GRANT = 'GRANT',
  VENDOR = 'VENDOR',
}

export function expenseTypeFromOption(opt: ExpenseTypeOption) {
  switch (opt) {
    case ExpenseTypeOption.INVOICE:
    case ExpenseTypeOption.INVITED_INVOICE:
      return ExpenseType.INVOICE;
    case ExpenseTypeOption.REIMBURSEMENT:
    case ExpenseTypeOption.INVITED_REIMBURSEMENT:
      return ExpenseType.RECEIPT;
    case ExpenseTypeOption.GRANT:
      return ExpenseType.GRANT;
    case ExpenseTypeOption.VENDOR:
      return ExpenseType.RECEIPT;
  }
}

export type ExpenseItem = {
  description: string;
  date: Date;
  amount: {
    valueInCents: number;
    currency: string;
    exchangeRate?: {
      value: number;
      source: string;
      fromCurrency: string;
      toCurrency: string;
      date: string;
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
};

export type ExpenseFormik = Omit<ReturnType<typeof useFormik<ExpenseFormValues>>, 'setFieldValue'> & {
  setFieldValue: <F extends Path<ExpenseFormValues>>(
    field: F,
    value: PathValue<ExpenseFormValues, F>,
  ) => Promise<void> | Promise<FormikErrors<ExpenseFormValues>>;
};

export type ExpenseForm = ExpenseFormik & { options: ExpenseFormOptions };

const minimumSchema = z.object({
  collectiveSlug: z.string(),
  payeeSlug: z.string(),
  payoutMethodId: z.string(),
  title: z.string().min(1),
  expenseCurrency: z.string().refine(v => Object.values(Currency).includes(v as Currency), {
    message: `Currency must be one of: ${Object.values(Currency).join(',')}`,
  }),
  tags: z.array(z.string()).optional(),
  expenseItems: z.array(
    z.object({
      description: z.string().min(1),
      url: z.string().url().optional(),
      date: z.string(),
      amount: z.object({
        valueInCents: z.number().min(1),
        currency: z.string().refine(v => Object.values(Currency).includes(v as Currency), {
          message: `Currency must be one of: ${Object.values(Currency).join(',')}`,
        }),
      }),
    }),
  ),
});

const formSchemaQuery = gql`
  query ExpenseFormSchema($collectiveSlug: String!, $payeeSlug: String, $hasPayeeSlug: Boolean!) {
    account(slug: $collectiveSlug) {
      id
      name
      slug
      currency
      settings
      supportedExpenseTypes

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

    payee: account(slug: $payeeSlug) @include(if: $hasPayeeSlug) {
      id
      payoutMethods {
        id
        type
        name
        data
        isSaved
      }
    }

    loggedInAccount {
      id
      ...LoggedInAccountExpensePayoutFields
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
`;

type ExpenseFormOptions = {
  schema: z.ZodObject<any>;
  supportedCurrencies?: string[];
  supportedExpenseTypes?: ExpenseType[];
  payoutProfiles?: ExpenseFormSchemaQuery['loggedInAccount'][];
  expenseTags?: ExpenseFormSchemaHostFieldsFragment['expensesTags'];
  expensePolicy?: string;
  isAccountingCategoryRequired?: boolean;
  accountingCategories?: ExpenseFormSchemaHostFieldsFragment['accountingCategories']['nodes'];
  allowExpenseItemAttachment?: boolean;
  allowExpenseItemCurrencyChange?: boolean;
  taxType?: TaxType;
};

async function buildFormOptions(
  intl: IntlShape,
  apolloClient: ApolloClient<any>,
  loggedInUser: LoggedInUser,
  values: ExpenseFormValues,
): Promise<ExpenseFormOptions> {
  const options: ExpenseFormOptions = { schema: minimumSchema };

  if (!values.collectiveSlug) {
    return options;
  }

  try {
    // TODO: memo or enable cache for this.
    const query = await apolloClient.query<ExpenseFormSchemaQuery, ExpenseFormSchemaQueryVariables>({
      query: formSchemaQuery,
      context: API_V2_CONTEXT,
      variables: {
        collectiveSlug: values.collectiveSlug,
        payeeSlug: values.payeeSlug,
        hasPayeeSlug: !!values.payeeSlug,
      },
    });

    const account = query.data?.account;
    const host = account && 'host' in account ? account.host : null;

    if (host) {
      options.expensePolicy = host.expensePolicy;
      options.expenseTags = host.expensesTags;
      options.isAccountingCategoryRequired = userMustSetAccountingCategory(loggedInUser, account, host);
      options.accountingCategories = host.accountingCategories.nodes;

      if (options.isAccountingCategoryRequired) {
        options.schema = options.schema.extend({
          accountingCategoryId: z.string(),
        });
      }
    }

    if ((query.data?.account?.supportedExpenseTypes ?? []).length > 0) {
      options.schema = options.schema.extend({
        expenseTypeOption: z
          .nativeEnum(ExpenseTypeOption)
          .refine(v => query.data.account.supportedExpenseTypes.includes(expenseTypeFromOption(v)), {
            message: 'expense type not supported',
          }),
      });
      options.supportedExpenseTypes = query.data.account.supportedExpenseTypes;
    }

    if (query.data?.loggedInAccount) {
      options.payoutProfiles = getPayoutProfiles(query.data.loggedInAccount);
    }

    options.supportedCurrencies = Object.values(Currency);
    if (query.data?.payee && values.payoutMethodId && values.expenseTypeOption) {
      const supportedCurrencies = getSupportedCurrencies(query.data?.account, {
        payee: query.data?.payee,
        payoutMethod: query.data?.payee?.payoutMethods?.find(p => p.id === values.payoutMethodId),
        type: expenseTypeFromOption(values.expenseTypeOption),
        currency: account.currency,
      });

      options.schema = options.schema.extend({
        expenseCurrency: z.string().refine(v => supportedCurrencies.includes(v), {
          message: `Currency must be one of: ${supportedCurrencies.join(',')}`,
        }),
      });

      options.supportedCurrencies = supportedCurrencies;
    }

    options.schema = options.schema.extend({
      expenseItems: z.array(
        z
          .object({
            description: z.string().min(1),
            url:
              expenseTypeFromOption(values.expenseTypeOption) === ExpenseType.RECEIPT
                ? z.string().url()
                : z.string().url().optional(),
            date: z.string(),
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
                .nullable()
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
    });

    options.allowExpenseItemAttachment = options.allowExpenseItemCurrencyChange =
      expenseTypeFromOption(values.expenseTypeOption) === ExpenseType.RECEIPT;

    if (expenseTypeFromOption(values.expenseTypeOption) === ExpenseType.INVOICE) {
      if (accountHasVAT(account as any, host as any)) {
        options.taxType = TaxType.VAT;
      } else if (accountHasGST(host || account)) {
        options.taxType = TaxType.GST;
      }
    }

    if (options.taxType) {
      options.schema = options.schema.extend({
        hasTax: z.boolean().optional(),
      });
    }

    if (values.hasTax) {
      options.schema = options.schema.extend({
        tax: z.object({
          rate:
            options.taxType === TaxType.GST
              ? z.number().refine(v => [0, 0.15].includes(v), {
                  message: 'GST tax must be 0% or 15%',
                })
              : z.number().refine(v => v > 0 && v < 1, {
                  message: 'VAT tax must be between 0% and 100%',
                }),
          idNumber:
            options.taxType === TaxType.GST
              ? z.string().optional()
              : z.string().refine(v => checkVATNumberFormat(v).isValid, {
                  message: 'Invalid VAT Number',
                }),
        }),
      });
    }

    return options;
  } catch (err) {
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
      Math.abs(dayjs.utc(ei.amount.exchangeRate.date).diff(dayjs.utc(ei.date), 'days')) > 2));

export function useExpenseForm(opts: {
  initialValues: ExpenseFormValues;
  onSubmit: (
    values: ExpenseFormValues,
    formikHelpers: FormikHelpers<ExpenseFormValues>,
    options: ExpenseFormOptions,
  ) => void | Promise<any>;
}): ExpenseForm {
  const intl = useIntl();
  const apolloClient = useApolloClient();
  const { LoggedInUser } = useLoggedInUser();
  const [formOptions, setFormOptions] = React.useState<ExpenseFormOptions>({ schema: minimumSchema });

  const expenseForm: ExpenseFormik = useFormik<ExpenseFormValues>({
    initialValues: opts.initialValues,
    async validate(values) {
      const result = formOptions.schema.safeParse(values);
      if (result.success === false) {
        const errs = {};

        for (const issue of result.error.issues) {
          set(errs, issue.path, issue.message);
        }
        return errs;
      }
    },
    onSubmit(values, formikHelpers) {
      return opts.onSubmit(values, formikHelpers, formOptions);
    },
  });

  const prevValues = usePrevious(expenseForm.values);

  /* field dependencies */
  const setFieldValue = expenseForm.setFieldValue;
  // reset fields that depend on collective
  React.useEffect(() => {
    if (expenseForm.values.collectiveSlug !== prevValues.collectiveSlug) {
      setFieldValue('expenseTypeOption', null);
      setFieldValue('accountingCategoryId', null);
      setFieldValue('payoutMethodId', null);
      setFieldValue('expenseCurrency', null);
    }
  }, [setFieldValue, prevValues.collectiveSlug, expenseForm.values.collectiveSlug]);

  // reset fields that depend on payee
  React.useEffect(() => {
    if (expenseForm.values.payeeSlug !== prevValues.payeeSlug) {
      setFieldValue('payoutMethodId', null);
    }
  }, [setFieldValue, prevValues.payeeSlug, expenseForm.values.payeeSlug]);

  // reset fields that depend on expense type
  React.useEffect(() => {
    if (expenseForm.values.expenseTypeOption !== prevValues.expenseTypeOption) {
      setFieldValue('expenseCurrency', null);
      setFieldValue('expenseAttachedFiles', null);
      setFieldValue('expenseItems', null);
    }
  }, [setFieldValue, prevValues.expenseTypeOption, expenseForm.values.expenseTypeOption]);

  React.useEffect(() => {
    if (expenseForm.values.payoutMethodId !== prevValues.payoutMethodId) {
      setFieldValue('expenseCurrency', null);
    }
  }, [setFieldValue, prevValues.payoutMethodId, expenseForm.values.payoutMethodId]);

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
        date: dayjs.utc(ei.date).toDate(),
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
        console.error(err);
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

  // calculate form
  React.useEffect(() => {
    async function refreshFormOptions() {
      setFormOptions(await buildFormOptions(intl, apolloClient, LoggedInUser, expenseForm.values));
    }
    refreshFormOptions();
  }, [apolloClient, LoggedInUser, expenseForm.values, intl]);

  // revalidate form
  const validateForm = expenseForm.validateForm;
  React.useEffect(() => {
    validateForm();
  }, [formOptions.schema, validateForm]);

  React.useEffect(() => {
    const availableCurrencies = formOptions.supportedCurrencies || [];
    if (availableCurrencies.length === 1 && expenseForm.values.expenseCurrency !== availableCurrencies[0]) {
      setFieldValue('expenseCurrency', availableCurrencies[0]);
    }
  }, [formOptions.supportedCurrencies, expenseForm.values.expenseCurrency, setFieldValue]);

  React.useEffect(() => {
    if (isEmpty(expenseForm.values.expenseItems)) {
      return;
    }

    expenseForm.values.expenseItems.forEach((ei, i) => {
      if (!ei.amount?.currency && !ei.amount?.valueInCents) {
        setFieldValue(`expenseItems.${i}.amount.currency`, expenseForm.values.expenseCurrency);
      }
    });
  }, [expenseForm.values.expenseCurrency, expenseForm.values.expenseItems, setFieldValue]);

  return Object.assign(expenseForm, {
    options: formOptions,
  });
}
