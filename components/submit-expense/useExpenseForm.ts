import React from 'react';
import { ApolloClient, gql, useApolloClient } from '@apollo/client';
import type { Path, PathValue } from 'dot-path-value';
import { FormikErrors, useFormik } from 'formik';
import { isEmpty, set } from 'lodash';
import z from 'zod';

import { LoggedInUser } from '../../lib/custom_typings/LoggedInUser';
import { getPayoutProfiles } from '../../lib/expenses';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import {
  Currency,
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
  date: string;
  amount: { valueInCents: number; currency: string };
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
        valueInCents: z.number(),
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
    name
    slug
    currency

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
};

async function buildFormOptions(
  apolloClient: ApolloClient<any>,
  loggedInUser: LoggedInUser,
  values: ExpenseFormValues,
): Promise<ExpenseFormOptions> {
  const options: ExpenseFormOptions = { schema: minimumSchema };

  if (!values.collectiveSlug) {
    return options;
  }

  try {
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
        z.object({
          description: z.string().min(1),
          url:
            expenseTypeFromOption(values.expenseTypeOption) === ExpenseType.RECEIPT
              ? z.string().url()
              : z.string().url().optional(),
          date: z.string(),
          amount: z.object({
            valueInCents: z.number(),
            currency: z.string().refine(v => Object.values(Currency).includes(v as Currency), {
              message: `Currency must be one of: ${Object.values(Currency).join(',')}`,
            }),
          }),
        }),
      ),
    });

    options.allowExpenseItemAttachment = options.allowExpenseItemCurrencyChange =
      expenseTypeFromOption(values.expenseTypeOption) === ExpenseType.RECEIPT;

    return options;
  } catch (err) {
    return options;
  }
}

export function useExpenseForm(opts: {
  initialValues: Parameters<typeof useFormik<ExpenseFormValues>>['0']['initialValues'];
  onSubmit: Parameters<typeof useFormik<ExpenseFormValues>>['0']['onSubmit'];
}): ExpenseForm {
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
    onSubmit: opts.onSubmit,
  });

  /* field dependencies */
  const setFieldValue = expenseForm.setFieldValue;
  // reset fields that depend on collective
  React.useEffect(() => {
    return () => {
      setFieldValue('expenseTypeOption', null);
      setFieldValue('accountingCategoryId', null);
      setFieldValue('payoutMethodId', null);
      setFieldValue('expenseCurrency', null);
    };
  }, [setFieldValue, expenseForm.values.collectiveSlug]);

  // reset fields that depend on payee
  React.useEffect(() => {
    return () => {
      setFieldValue('payoutMethodId', null);
    };
  }, [setFieldValue, expenseForm.values.payeeSlug]);

  // reset fields that depend on expense type
  React.useEffect(() => {
    return () => {
      setFieldValue('expenseCurrency', null);
      setFieldValue('expenseAttachedFiles', null);
      setFieldValue('expenseItems', null);
    };
  }, [setFieldValue, expenseForm.values.expenseTypeOption]);

  React.useEffect(() => {
    return () => {
      setFieldValue('expenseCurrency', null);
    };
  }, [setFieldValue, expenseForm.values.payoutMethodId]);

  // calculate form
  React.useEffect(() => {
    async function refreshFormOptions() {
      setFormOptions(await buildFormOptions(apolloClient, LoggedInUser, expenseForm.values));
    }
    refreshFormOptions();
  }, [apolloClient, LoggedInUser, expenseForm.values]);

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

    for (const item of expenseForm.values.expenseItems) {
      if (!item.amount?.currency || !item.amount?.valueInCents) {
        item.amount = {
          ...item.amount,
          currency: expenseForm.values.expenseCurrency,
        };
      }
    }
  }, [expenseForm.values.expenseCurrency, expenseForm.values.expenseItems]);

  return Object.assign(expenseForm, {
    options: formOptions,
  });
}
