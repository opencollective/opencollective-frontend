import React, { useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import type { NextRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { isIndividualAccount } from '../../lib/collective';
import roles from '../../lib/constants/roles';
import { getErrorFromGraphqlException } from '../../lib/errors';
import { usePrevious } from '../../lib/hooks/usePrevious';
import type { Account, PaymentMethod, PaymentMethodType, Transaction } from '@/lib/graphql/types/v2/schema';
import { TransactionKind } from '@/lib/graphql/types/v2/schema';
import useQueryFilter from '@/lib/hooks/useQueryFilter';
import type LoggedInUser from '@/lib/LoggedInUser';
import { cn } from '@/lib/utils';

import { accountNavbarFieldsFragment } from '@/components/collective-navbar/fragments';
import { childAccountFilter } from '@/components/dashboard/filters/ChildAccountFilter';
import { Filterbar } from '@/components/dashboard/filters/Filterbar';
import { Pagination } from '@/components/dashboard/filters/Pagination';
import {
  filters as commonFilters,
  schema as commonSchema,
  toVariables as commonToVariables,
} from '@/components/dashboard/sections/transactions/filters';
import { transactionsQueryCollectionFragment } from '@/components/transactions/graphql/fragments';
import TransactionsList from '@/components/transactions/TransactionsList';

import Container from '../Container';
import ExportTransactionsCSVModal from '../dashboard/ExportTransactionsCSVModal';
import Link from '../Link';
import MessageBox from '../MessageBox';
import { Button } from '../ui/Button';

const processingOrderFragment = gql`
  fragment ProcessingOrderFields on Order {
    id
    legacyId
    nextChargeDate
    paymentMethod {
      id
      service
      name
      type
      expiryDate
      data
      balance {
        value
        valueInCents
        currency
      }
    }
    amount {
      value
      valueInCents
      currency
    }
    totalAmount {
      value
      valueInCents
      currency
    }
    status
    description
    createdAt
    frequency
    tier {
      id
      name
    }
    totalDonations {
      value
      valueInCents
      currency
    }
    fromAccount {
      id
      name
      slug
      isIncognito
      type
      ... on Individual {
        isGuest
      }
    }
    toAccount {
      id
      slug
      name
      type
      description
      tags
      imageUrl
      settings
      ... on AccountWithHost {
        host {
          id
          slug
          paypalClientId
          supportedPaymentMethods
        }
      }
      ... on Organization {
        host {
          id
          slug
          paypalClientId
          supportedPaymentMethods
        }
      }
    }
    platformTipAmount {
      value
      valueInCents
    }
  }
`;

export const transactionsPageQuery = gql`
  query TransactionsPage(
    $slug: String!
    $excludeAccount: [AccountReferenceInput!]
    $limit: Int!
    $offset: Int!
    $type: TransactionType
    $paymentMethodType: [PaymentMethodType]
    $paymentMethodService: [PaymentMethodService]
    $amount: AmountRangeInput
    $minAmount: Int
    $maxAmount: Int
    $dateFrom: DateTime
    $dateTo: DateTime
    $clearedFrom: DateTime
    $clearedTo: DateTime
    $searchTerm: String
    $kind: [TransactionKind]
    $includeIncognitoTransactions: Boolean
    $includeGiftCardTransactions: Boolean
    $includeChildrenTransactions: Boolean
    $virtualCard: [VirtualCardReferenceInput]
    $sort: ChronologicalOrderInput
    $group: [String]
    $includeHost: Boolean
    $expenseType: [ExpenseType]
    $expense: ExpenseReferenceInput
    $order: OrderReferenceInput
    $isRefund: Boolean
    $hasDebt: Boolean
    $merchantId: [String]
    $accountingCategory: [String]
    $paymentMethod: [PaymentMethodReferenceInput]
    $payoutMethod: PayoutMethodReferenceInput
  ) {
    account(slug: $slug) {
      id
      legacyId
      slug
      name
      type
      createdAt
      isActive
      imageUrl(height: 256)
      currency
      settings
      supportedExpenseTypes
      features {
        id
        ...NavbarFields
      }
      ... on AccountWithParent {
        parent {
          id
          slug
          name
        }
      }
      ... on AccountWithHost {
        host {
          id
          slug
        }
      }
      processingOrders: orders(filter: OUTGOING, includeIncognito: true, status: [PENDING, PROCESSING]) {
        totalCount
        nodes {
          id
          ...ProcessingOrderFields
        }
      }
      childrenAccounts {
        totalCount
        nodes {
          id
        }
      }
    }

    transactions(
      account: { slug: $slug }
      excludeAccount: $excludeAccount
      limit: $limit
      offset: $offset
      type: $type
      paymentMethodType: $paymentMethodType
      paymentMethodService: $paymentMethodService
      amount: $amount
      minAmount: $minAmount
      maxAmount: $maxAmount
      dateFrom: $dateFrom
      dateTo: $dateTo
      clearedFrom: $clearedFrom
      clearedTo: $clearedTo
      searchTerm: $searchTerm
      kind: $kind
      includeIncognitoTransactions: $includeIncognitoTransactions
      includeGiftCardTransactions: $includeGiftCardTransactions
      includeChildrenTransactions: $includeChildrenTransactions
      includeDebts: true
      virtualCard: $virtualCard
      orderBy: $sort
      group: $group
      includeHost: $includeHost
      expenseType: $expenseType
      expense: $expense
      order: $order
      isRefund: $isRefund
      hasDebt: $hasDebt
      merchantId: $merchantId
      accountingCategory: $accountingCategory
      paymentMethod: $paymentMethod
      payoutMethod: $payoutMethod
    ) {
      ...TransactionsQueryCollectionFragment
      kinds
      paymentMethodTypes
      totalCount
    }
  }
  ${transactionsQueryCollectionFragment}
  ${accountNavbarFieldsFragment}
  ${processingOrderFragment}
`;

export const schema = commonSchema.extend({
  account: childAccountFilter.schema,
});

interface TransactionsProps {
  account?: Pick<Account, 'id' | 'slug' | 'type' | 'settings' | 'currency'> & {
    childrenAccounts?: {
      nodes?: unknown[];
    };
    processingOrders?: {
      nodes?: unknown[];
      totalCount?: number;
    };
    parent?: Pick<Account, 'id' | 'slug' | 'name'>;
    host?: Pick<Account, 'id' | 'slug'>;
  };
  transactions?: {
    totalCount?: number;
    paymentMethodTypes?: string[];
    kinds?: string[];
    nodes?: Array<
      Pick<Transaction, 'id' | 'createdAt' | 'amount' | 'kind' | 'type'> & {
        giftCardEmitterAccount?: Pick<Account, 'id' | 'slug' | 'name'>;
        fromAccount?: Pick<Account, 'id' | 'slug' | 'name'> & {
          parent?: Pick<Account, 'id' | 'slug' | 'name'>;
          host?: Pick<Account, 'id' | 'slug'>;
        };
        toAccount?: Pick<Account, 'id' | 'slug' | 'name'> & {
          parent?: Pick<Account, 'id' | 'slug' | 'name'>;
          host?: Pick<Account, 'id' | 'slug'>;
        };
        paymentMethod?: Pick<PaymentMethod, 'id' | 'service' | 'name' | 'type' | 'expiryDate' | 'data'>;
      }
    >;
  };
  variables?: {
    offset: number;
    limit: number;
    displayPendingContributions: boolean;
  };
  loading?: boolean;
  refetch?(...args: unknown[]): unknown;
  error?: Error;
  LoggedInUser?: LoggedInUser;
  query?: {
    searchTerm?: string;
    offset?: string;
    ignoreIncognitoTransactions?: string;
    ignoreGiftCardsTransactions?: string;
    ignoreChildrenTransactions?: string;
    displayPendingContributions?: string;
  };
  router?: NextRouter;
  isDashboard?: boolean;
}

export const toVariables /* : FiltersToVariables<FilterValues, TransactionsTableQueryVariables, FilterMeta>*/ = {
  ...commonToVariables,
  account: (value, key, meta) => {
    if (meta?.childrenAccounts && !meta.childrenAccounts.length) {
      return { includeChildrenTransactions: false };
    } else if (!value) {
      return { includeChildrenTransactions: true };
    } else {
      return {
        account: { slug: value },
        includeChildrenTransactions: false,
      };
    }
  },
};

const filters /* : FilterComponentConfigs<FilterValues, FilterMeta>*/ = {
  ...commonFilters,
  account: childAccountFilter.filter,
};

export const defaultFilterValues = {
  kind: [
    TransactionKind.ADDED_FUNDS,
    TransactionKind.CONTRIBUTION,
    TransactionKind.EXPENSE,
    TransactionKind.BALANCE_TRANSFER,
  ] as TransactionKind[],
};

const Transactions = ({ LoggedInUser, account, ...props }: TransactionsProps) => {
  const prevLoggedInUser = usePrevious(LoggedInUser);
  const [displayExportCSVModal, setDisplayExportCSVModal] = React.useState(false);

  const queryFilter = useQueryFilter({
    schema,
    toVariables,
    filters: filters as typeof filters & {},
    meta: {
      currency: account.currency,
      paymentMethodTypes: props.transactions?.paymentMethodTypes as PaymentMethodType[],
      kinds: props.transactions?.kinds as TransactionKind[],
      accountSlug: account.slug,
      childrenAccounts: account.childrenAccounts?.nodes ?? [],
    },
    defaultFilterValues,
    shallow: true,
  });

  const { data, error, loading, refetch, previousData } = useQuery(transactionsPageQuery, {
    variables: {
      slug: account.slug,
      includeIncognitoTransactions: true,
      includeChildrenTransactions: true,
      ...queryFilter.variables,
    },
    fetchPolicy: 'cache-first',
  });

  const transactions = data?.transactions || previousData?.transactions || props.transactions;

  // Refetch data when user logs in or out
  useEffect(() => {
    if (LoggedInUser !== prevLoggedInUser) {
      refetch();
    }
  }, [LoggedInUser]);

  const canDownloadInvoice = React.useMemo(() => {
    if (!account || !LoggedInUser) {
      return false;
    } else if (account.type !== 'ORGANIZATION' && !isIndividualAccount(account)) {
      return false;
    } else {
      return (
        LoggedInUser.isAdminOfCollectiveOrHost(account) ||
        LoggedInUser.hasRole(roles.ACCOUNTANT, account) ||
        LoggedInUser.hasRole(roles.ACCOUNTANT, account.host)
      );
    }
  }, [LoggedInUser, account]);

  return (
    <Container>
      <div className="mb-4 flex items-center gap-2">
        <Filterbar hideSeparator className="grow" {...queryFilter} />
        <div className="flex shrink items-center gap-2">
          <ExportTransactionsCSVModal
            open={displayExportCSVModal}
            setOpen={setDisplayExportCSVModal}
            queryFilter={queryFilter}
            account={account}
            canCreatePreset={false}
            trigger={
              <Button
                size="sm"
                variant="outline"
                className="rounded-full whitespace-nowrap"
                onClick={() => setDisplayExportCSVModal(true)}
                data-cy="download-csv"
              >
                <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
              </Button>
            }
          />
          {canDownloadInvoice && (
            <Button size="sm" variant="outline" className="rounded-full" asChild>
              <Link href={`/dashboard/${account.slug}/payment-receipts`}>
                <FormattedMessage id="transactions.downloadinvoicesbutton" defaultMessage="Download Receipts" />
              </Link>
            </Button>
          )}
        </div>
      </div>
      <div className="mt-4">
        {error ? (
          <MessageBox type="error" withIcon>
            {getErrorFromGraphqlException(error).message}
          </MessageBox>
        ) : !loading && !transactions.nodes?.length ? (
          <MessageBox type="info" withIcon data-cy="zero-transactions-message">
            {queryFilter.hasFilters ? (
              <FormattedMessage
                id="TransactionsList.Empty"
                defaultMessage="No transactions found. <ResetLink>Reset filters</ResetLink> to see all transactions."
                values={{
                  ResetLink(text) {
                    return (
                      <Link data-cy="reset-transactions-filters" href={`/${account.slug}/transactions`}>
                        <span>{text}</span>
                      </Link>
                    );
                  },
                }}
              />
            ) : (
              <FormattedMessage id="transactions.empty" defaultMessage="No transactions" />
            )}
          </MessageBox>
        ) : (
          <div className="flex flex-col gap-4">
            <div className={cn(loading && 'animate-pulse')}>
              <TransactionsList collective={account} transactions={transactions.nodes} displayActions />
            </div>
            <Pagination queryFilter={queryFilter} total={transactions.totalCount} />
          </div>
        )}
      </div>
    </Container>
  );
};

export default Transactions;
