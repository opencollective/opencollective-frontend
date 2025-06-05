import React, { useEffect, useState } from 'react';
import { Download as IconDownload } from '@styled-icons/feather/Download';
import { isNil, omit, omitBy, pick } from 'lodash';
import type { NextRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { isIndividualAccount } from '../../lib/collective';
import roles from '../../lib/constants/roles';
import { TransactionKind, TransactionTypes } from '../../lib/constants/transactions';
import { parseDateInterval } from '../../lib/date-utils';
import { getErrorFromGraphqlException } from '../../lib/errors';
import { usePrevious } from '../../lib/hooks/usePrevious';
import { addParentToURLIfMissing, getCollectivePageCanonicalURL } from '../../lib/url-helpers';
import type { Account, AccountWithHost, AccountWithParent, Transaction } from '@/lib/graphql/types/v2/schema';
import type LoggedInUser from '@/lib/LoggedInUser';

import { parseAmountRange } from '../budget/filters/AmountFilter';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import Loading from '../Loading';
import MessageBox from '../MessageBox';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import Pagination from '../Pagination';
import SearchBar from '../SearchBar';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import StyledSpinner from '../StyledSpinner';

import { getDefaultKinds, parseTransactionKinds } from './filters/TransactionsKindFilter';
import { parseTransactionPaymentMethodTypes } from './filters/TransactionsPaymentMethodTypeFilter';
import TransactionsDownloadCSV from './TransactionsDownloadCSV';
import TransactionsFilters from './TransactionsFilters';
import TransactionsList from './TransactionsList';

const EXPENSES_PER_PAGE = 15;

export function getVariablesFromQuery(query) {
  const amountRange = parseAmountRange(query.amount);
  const { from: dateFrom, to: dateTo } = parseDateInterval(query.period);

  const virtualCardIds = query.virtualCard
    ? typeof query.virtualCard === 'string'
      ? [query.virtualCard]
      : query.virtualCard
    : null;

  return {
    offset: parseInt(query.offset) || 0,
    limit: parseInt(query.limit) || EXPENSES_PER_PAGE,
    type: query.type,
    paymentMethodType: parseTransactionPaymentMethodTypes(query.paymentMethodType),
    status: query.status,
    tags: query.tag ? [query.tag] : undefined,
    minAmount: amountRange[0] && amountRange[0] * 100,
    maxAmount: amountRange[1] && amountRange[1] * 100,
    payoutMethodType: query.payout,
    dateFrom,
    dateTo,
    searchTerm: query.searchTerm,
    kind: query.kind ? parseTransactionKinds(query.kind) : getDefaultKinds(),
    includeIncognitoTransactions: !query.ignoreIncognitoTransactions,
    includeGiftCardTransactions: !query.ignoreGiftCardsTransactions,
    includeChildrenTransactions: !query.ignoreChildrenTransactions,
    displayPendingContributions: query.displayPendingContributions !== 'false',
    virtualCard: virtualCardIds ? virtualCardIds.map(id => ({ id })) : null,
  };
}

const convertProcessingOrderIntoTransactionItem = order => ({
  order,
  // Since we're filtering for OUTGOING orders, we can assume that the order is from the collective
  type: TransactionTypes.DEBIT,
  kind: TransactionKind.CONTRIBUTION,
  ...pick(order, ['id', 'amount', 'toAccount', 'fromAccount', 'description', 'createdAt', 'paymentMethod']),
});

interface TransactionsProps {
  account?: Pick<Account, 'id' | 'slug' | 'type'> & {
    processingOrders?: {
      nodes?: unknown[];
      totalCount?: number;
    };
  } & Pick<AccountWithParent, 'parent'> &
    Pick<AccountWithHost, 'host'>;
  transactions?: {
    totalCount?: number;
    paymentMethodTypes?: string[];
    kinds?: string[];
    nodes?: Array<
      Pick<
        Transaction,
        | 'id'
        | 'fromAccount'
        | 'toAccount'
        | 'giftCardEmitterAccount'
        | 'account'
        | 'createdAt'
        | 'amount'
        | 'kind'
        | 'type'
        | 'paymentMethod'
      > & {
        fromAccount?: Pick<AccountWithParent, 'parent'> & Pick<AccountWithHost, 'host'>;
        toAccount?: Pick<AccountWithParent, 'parent'> & Pick<AccountWithHost, 'host'>;
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
  error?: any;
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

const Transactions = ({
  LoggedInUser,
  transactions,
  error,
  account,
  loading,
  refetch,
  variables,
  router,
  isDashboard,
}: TransactionsProps) => {
  const intl = useIntl();
  const prevLoggedInUser = usePrevious(LoggedInUser);
  const [state, setState] = useState({
    hasChildren: null,
    hasGiftCards: null,
    hasIncognito: null,
    hasProcessingOrders: null,
  });

  const transactionsRoute = isDashboard
    ? `/dashboard/${account?.slug}/transactions`
    : `${getCollectivePageCanonicalURL(account)}/transactions`;

  // Refetch data when user logs in or out
  useEffect(() => {
    if (LoggedInUser !== prevLoggedInUser) {
      refetch();
    }
  }, [LoggedInUser]);

  useEffect(() => {
    const queryParameters = {
      ...omit(router.query, ['offset', 'collectiveSlug', 'parentCollectiveSlug']),
    };
    addParentToURLIfMissing(router, account, `/transactions`, queryParameters);
    let newState = { ...state };
    const hasChildren =
      (transactions?.nodes || []).some(
        el => el.fromAccount?.parent?.id === account.id || el.toAccount?.parent?.id === account?.id,
      ) || router.query.ignoreChildrenTransactions;
    if (isNil(state.hasChildren) && hasChildren) {
      newState = { ...newState, hasChildren };
    }

    const hasGiftCards =
      (transactions?.nodes || []).some(
        el => el.giftCardEmitterAccount?.id && el.giftCardEmitterAccount?.id === account?.id,
      ) || router.query.ignoreGiftCardsTransactions;
    if (isNil(state.hasGiftCards) && hasGiftCards) {
      newState = { ...newState, hasChildren };
    }

    const hasIncognito =
      (transactions?.nodes || []).some(el => el.account?.isIncognito) || router.query.ignoreIncognitoTransactions;
    if (isNil(state.hasIncognito) && hasIncognito) {
      newState = { ...newState, hasChildren };
    }

    const hasProcessingOrders = account?.processingOrders?.totalCount > 0 || router.query.displayPendingContributions;
    if (isNil(state.hasProcessingOrders) && hasProcessingOrders) {
      newState = { ...newState, hasChildren };
    }
    setState(newState);
  }, [transactions, account, router.query]);

  function checkCanDownloadInvoices() {
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
  }

  function buildFilterLinkParams(params) {
    const queryParameters = omit({ ...router.query, ...params }, [
      'offset',
      'collectiveSlug',
      'slug',
      'section',
      'parentCollectiveSlug',
    ]);

    return { ...omitBy(queryParameters, value => !value), ...pick(queryParameters, ['displayPendingContributions']) };
  }

  function updateFilters(queryParams) {
    return router.push({
      pathname: transactionsRoute,
      query: buildFilterLinkParams({ ...queryParams, offset: null }),
    });
  }

  const hasFilters = Object.entries(router.query).some(([key, value]) => {
    return !['view', 'offset', 'limit', 'slug'].includes(key) && value;
  });
  const canDownloadInvoices = checkCanDownloadInvoices();

  if (!account && loading) {
    return <Loading />;
  } else if (!account) {
    return <MessageBoxGraphqlError error={error} />;
  }

  const transactionsAndProcessingOrders =
    state.hasProcessingOrders && variables.displayPendingContributions && !variables.offset
      ? [
          ...(account?.processingOrders?.nodes || []).map(convertProcessingOrderIntoTransactionItem),
          ...(transactions?.nodes || []),
        ]
      : transactions?.nodes || [];

  return (
    <Container>
      <div className="flex flex-wrap justify-between gap-4">
        <h1 className={isDashboard ? 'text-2xl leading-10 font-bold tracking-tight' : 'text-[32px] leading-10'}>
          <FormattedMessage id="menu.transactions" defaultMessage="Transactions" />
        </h1>
        <div className="w-[276px] grow sm:grow-0">
          <SearchBar
            placeholder={intl.formatMessage({ defaultMessage: 'Search transactions…', id: 'tTmMmK' })}
            defaultValue={router.query.searchTerm}
            height="40px"
            onSubmit={searchTerm => updateFilters({ searchTerm, offset: null })}
          />
        </div>
      </div>
      <div className="mx-2 my-2 flex flex-col items-stretch gap-2 md:flex-row md:flex-wrap md:items-end">
        <TransactionsFilters
          filters={router.query}
          kinds={transactions?.kinds}
          paymentMethodTypes={transactions?.paymentMethodTypes}
          collective={account}
          onChange={queryParams => updateFilters({ ...queryParams, offset: null })}
        />
        <div className="flex justify-evenly">
          {canDownloadInvoices && (
            <Link href={`/dashboard/${account.slug}/payment-receipts`}>
              <StyledButton
                buttonSize="small"
                minWidth={140}
                height={38}
                width="100%"
                p="6px 10px"
                isBorderless
                whiteSpace="nowrap"
              >
                <FormattedMessage id="transactions.downloadinvoicesbutton" defaultMessage="Download Receipts" />
                <IconDownload size="13px" style={{ marginLeft: '8px' }} />
              </StyledButton>
            </Link>
          )}
          <TransactionsDownloadCSV collective={account} query={router.query} width="100%" />
        </div>
      </div>

      <Flex
        mx="8px"
        justifyContent="space-between"
        flexDirection={['column', 'row']}
        alignItems={['stretch', 'flex-end']}
      >
        {state.hasProcessingOrders && (
          <StyledCheckbox
            checked={router.query.displayPendingContributions !== 'false' ? true : false}
            onChange={({ checked }) => updateFilters({ displayPendingContributions: checked })}
            label={
              <FormattedMessage id="transactions.displayPendingContributions" defaultMessage="Display expected funds" />
            }
          />
        )}
        {state.hasChildren && (
          <StyledCheckbox
            name="ignoreChildrenTransactions"
            checked={router.query.ignoreChildrenTransactions ? true : false}
            onChange={({ checked }) => updateFilters({ ignoreChildrenTransactions: checked })}
            label={
              <FormattedMessage
                id="transactions.excludeChildren"
                defaultMessage="Exclude transactions from Projects and Events"
              />
            }
          />
        )}
        {state.hasGiftCards && (
          <StyledCheckbox
            name="ignoreGiftCardsTransactions"
            checked={router.query.ignoreGiftCardsTransactions ? true : false}
            onChange={({ checked }) => updateFilters({ ignoreGiftCardsTransactions: checked })}
            label={
              <FormattedMessage id="transactions.excludeGiftCards" defaultMessage="Exclude Gift Card transactions" />
            }
          />
        )}
        {state.hasIncognito && (
          <StyledCheckbox
            name="ignoreIncognitoTransactions"
            checked={router.query.ignoreIncognitoTransactions ? true : false}
            onChange={({ checked }) => updateFilters({ ignoreIncognitoTransactions: checked })}
            label={
              <FormattedMessage id="transactions.excludeIncognito" defaultMessage="Exclude Incognito transactions" />
            }
          />
        )}
      </Flex>

      <Box mt={['8px', '23px']}>
        {error ? (
          <MessageBox type="error" withIcon>
            {getErrorFromGraphqlException(error).message}
          </MessageBox>
        ) : !loading && !transactions?.nodes?.length ? (
          <MessageBox type="info" withIcon data-cy="zero-transactions-message">
            {hasFilters ? (
              <FormattedMessage
                id="TransactionsList.Empty"
                defaultMessage="No transactions found. <ResetLink>Reset filters</ResetLink> to see all transactions."
                values={{
                  ResetLink(text) {
                    return (
                      <Link data-cy="reset-transactions-filters" href={transactionsRoute}>
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
        ) : loading ? (
          <Flex p="16px" justifyContent="center">
            <StyledSpinner />
          </Flex>
        ) : (
          <React.Fragment>
            <TransactionsList
              collective={account}
              transactions={transactionsAndProcessingOrders}
              displayActions
              onMutationSuccess={() => refetch()}
            />
            <Flex mt={5} justifyContent="center">
              <Pagination
                route={`/${account.slug}/transactions`}
                total={transactions?.totalCount}
                limit={variables.limit}
                offset={variables.offset}
                ignoredQueryParams={['collectiveSlug']}
              />
            </Flex>
          </React.Fragment>
        )}
      </Box>
    </Container>
  );
};

export default Transactions;
