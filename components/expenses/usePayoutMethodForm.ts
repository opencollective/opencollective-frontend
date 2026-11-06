import React from 'react';
import { gql, useQuery } from '@apollo/client';
import type { FormikErrors } from 'formik';
import { useFormik } from 'formik';
import { useIntl } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';
import type {
  Expense,
  ExpensePayoutMethodFormQuery,
  ExpensePayoutMethodFormQueryVariables,
  ExpenseUpdateInput,
  PayoutMethodInput,
} from '../../lib/graphql/types/v2/graphql';
import { PayoutMethodType } from '../../lib/graphql/types/v2/graphql';
import { NEW_ACCOUNT_BALANCE_PAYOUT_METHOD_ID, NEW_PAYOUT_METHOD_ID } from './lib/constants';
import { getAvailablePayoutMethods, getSupportedPayoutMethods } from './lib/payout-methods';

import type { ExpenseFormValues } from '../submit-expense/useExpenseForm';

import { validatePayoutMethod } from './PayoutMethodForm';

const payoutMethodFormQuery = gql`
  query ExpensePayoutMethodForm($accountSlug: String!, $payeeSlug: String!) {
    account(slug: $accountSlug) {
      id
      slug
      type
      currency
      policies {
        id
        COLLECTIVE_ADMINS_CAN_SEE_PAYOUT_METHODS
      }
      ... on AccountWithHost {
        host {
          ...ExpensePayoutMethodFormHostFields
        }
      }
      ... on Organization {
        host {
          ...ExpensePayoutMethodFormHostFields
        }
      }
    }
    payee: account(slug: $payeeSlug) {
      id
      slug
      name
      legalName
      type
      isAdmin
      payoutMethods {
        ...ExpensePayoutMethodFormMethodFields
      }
      ... on AccountWithHost {
        host {
          ...ExpensePayoutMethodFormRecipientHostFields
        }
      }
      ... on Organization {
        host {
          ...ExpensePayoutMethodFormRecipientHostFields
        }
      }
      ... on Vendor {
        hasPayoutMethod
      }
    }
    loggedInAccount {
      id
    }
  }

  fragment ExpensePayoutMethodFormHostFields on Host {
    id
    slug
    name
    type
    currency
    isAdmin
    supportedPayoutMethods
    features {
      id
      PAYPAL_CONNECT
    }
    transferwise {
      id
      availableCurrencies
    }
  }

  fragment ExpensePayoutMethodFormRecipientHostFields on Host {
    id
    slug
    name
    legalName
    type
    currency
    isAdmin
    isTrustedHost
    payoutMethods {
      ...ExpensePayoutMethodFormMethodFields
    }
  }

  fragment ExpensePayoutMethodFormMethodFields on PayoutMethod {
    id
    type
    name
    data
    isSaved
    canBeEdited
    canBeDeleted
    createdAt
    updatedAt
    isVerified
  }
`;

type Values = Pick<
  ExpenseFormValues,
  'payeeSlug' | 'expenseTypeOption' | 'payoutMethodId' | 'newPayoutMethod' | 'payoutMethodNameDiscrepancyReason'
>;

/** A fixed-payee form that only loads payout eligibility and never recalculates expense amounts. */
export function usePayoutMethodForm(expense: Expense, onSubmit: (values: ExpenseUpdateInput) => Promise<unknown>) {
  const intl = useIntl();
  const payeeSlug = expense.payee.slug;
  const { data, loading, error, refetch } = useQuery<
    ExpensePayoutMethodFormQuery,
    ExpensePayoutMethodFormQueryVariables
  >(payoutMethodFormQuery, {
    variables: { accountSlug: expense.account.slug, payeeSlug },
  });
  const account = data?.account;
  const payee = data?.payee;
  const host = account && 'host' in account ? account.host : null;
  const payeeHost = payee && 'host' in payee ? payee.host : null;
  const isHostAdmin = Boolean(host?.isAdmin);
  const isAdminOfPayee = Boolean(payee?.isAdmin);
  const isAdminOfPayeeHost = Boolean(payeeHost?.isAdmin && host && payeeHost.id !== host.id);
  const isPaypalConnectEnabled = Boolean(host && host.features?.PAYPAL_CONNECT !== 'DISABLED');

  const supportedPayoutMethods = React.useMemo(() => getSupportedPayoutMethods(host, payee), [host, payee]);
  const availablePayoutMethods = React.useMemo(
    () =>
      payee && (isAdminOfPayee || isAdminOfPayeeHost || payee.type === CollectiveType.VENDOR)
        ? getAvailablePayoutMethods({ host, payee, payoutMethods: payee.payoutMethods, supportedPayoutMethods }) || []
        : [],
    [host, payee, isAdminOfPayee, isAdminOfPayeeHost, supportedPayoutMethods],
  );
  const newPayoutMethodTypes = React.useMemo(
    () =>
      supportedPayoutMethods.filter(
        type => ![PayoutMethodType.ACCOUNT_BALANCE, PayoutMethodType.STRIPE].includes(type),
      ),
    [supportedPayoutMethods],
  );
  // Existing methods can be unsaved and therefore absent from account.payoutMethods.
  const [includeCurrentMethod, setIncludeCurrentMethod] = React.useState(true);
  const payoutMethods = React.useMemo(
    () =>
      includeCurrentMethod &&
      expense.payoutMethod &&
      !availablePayoutMethods.some(pm => pm.id === expense.payoutMethod.id)
        ? [
            expense.payoutMethod,
            ...availablePayoutMethods.filter(
              method =>
                expense.payoutMethod.type !== PayoutMethodType.ACCOUNT_BALANCE ||
                method.id !== NEW_ACCOUNT_BALANCE_PAYOUT_METHOD_ID,
            ),
          ]
        : availablePayoutMethods,
    [availablePayoutMethods, expense.payoutMethod, includeCurrentMethod],
  );
  const initialLoading = loading || !account || !payee || Boolean(error);
  const form = useFormik<Values>({
    initialValues: {
      payeeSlug,
      expenseTypeOption: expense.type,
      payoutMethodId: expense.payoutMethod?.id || '',
      newPayoutMethod: { data: {} },
      payoutMethodNameDiscrepancyReason: '',
    },
    validate: values => {
      const errors: FormikErrors<Values> = {};
      const required = intl.formatMessage({ defaultMessage: 'Required', id: 'Seanpx' });
      if (values.payoutMethodId === NEW_PAYOUT_METHOD_ID) {
        errors.newPayoutMethod = validatePayoutMethod(values.newPayoutMethod, { isPaypalConnectEnabled });
        if (!newPayoutMethodTypes.includes(values.newPayoutMethod.type)) {
          errors.newPayoutMethod.type = required;
        }
        if (!values.newPayoutMethod.data?.currency) {
          errors.newPayoutMethod.data = { ...errors.newPayoutMethod.data, currency: required };
        }
        if (!Object.keys(errors.newPayoutMethod).length) {
          delete errors.newPayoutMethod;
        }
      } else if (!payoutMethods.some(method => method.id === values.payoutMethodId)) {
        errors.payoutMethodId = required;
      }
      return errors;
    },
    onSubmit: async values => {
      if (initialLoading) {
        return;
      }
      const payoutMethod: PayoutMethodInput =
        values.payoutMethodId === NEW_PAYOUT_METHOD_ID
          ? { ...values.newPayoutMethod, isSaved: false }
          : values.payoutMethodId === NEW_ACCOUNT_BALANCE_PAYOUT_METHOD_ID
            ? { type: PayoutMethodType.ACCOUNT_BALANCE, data: {} }
            : { id: values.payoutMethodId };
      await onSubmit({
        id: expense.id,
        payoutMethod,
      });
    },
  });
  const refresh = React.useCallback(async () => {
    await refetch();
  }, [refetch]);
  const onPayoutMethodDeleted = React.useCallback(
    (id: string) => {
      // A removed method must stay removed even if it was attached to this expense.
      if (id === expense.payoutMethod?.id) {
        setIncludeCurrentMethod(false);
      }
    },
    [expense.payoutMethod?.id],
  );

  return {
    ...form,
    onPayoutMethodDeleted,
    initialLoading,
    error,
    refresh,
    startOptions: { isInlineEdit: true },
    options: {
      account,
      host,
      payee,
      loggedInAccount: data?.loggedInAccount,
      expense,
      payoutMethods,
      newPayoutMethodTypes,
      isAdminOfPayee,
      isAdminOfPayeeHost,
      isHostAdmin,
      isPaypalConnectEnabled,
      invitee: null,
      recentlySubmittedExpenses: null,
    },
  };
}
