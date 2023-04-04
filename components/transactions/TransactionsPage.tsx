import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { Download as IconDownload } from '@styled-icons/feather/Download';
import { isNil, omit, omitBy, pick } from 'lodash';
import { FormattedMessage } from 'react-intl';

import roles from '../../lib/constants/roles';
import { TransactionKind, TransactionTypes } from '../../lib/constants/transactions';
import { parseDateInterval } from '../../lib/date-utils';
import { getErrorFromGraphqlException } from '../../lib/errors';
import { addParentToURLIfMissing, getCollectivePageCanonicalURL } from '../../lib/url-helpers';

import { parseAmountRange } from '../budget/filters/AmountFilter';
import { collectiveNavbarFieldsFragment, processingOrderFragment } from '../collective-page/graphql/fragments';
import SectionTitle from '../collective-page/SectionTitle';
import ErrorPage from '../ErrorPage';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import Loading from '../Loading';
import MessageBox from '../MessageBox';
import Pagination from '../Pagination';
import SearchBar from '../SearchBar';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';

import { getDefaultKinds, parseTransactionKinds } from './filters/TransactionsKindFilter';
import { parseTransactionPaymentMethodTypes } from './filters/TransactionsPaymentMethodTypeFilter';
import { transactionsQueryCollectionFragment } from './graphql/fragments';
import TransactionsDownloadCSV from './TransactionsDownloadCSV';
import TransactionsFilters from './TransactionsFilters';
import TransactionsList from './TransactionsList';

export const transactionsPageQuery = gql`
  query TransactionsPage(
    $slug: String!
    $limit: Int!
    $offset: Int!
    $type: TransactionType
    $paymentMethodType: [PaymentMethodType]
    $minAmount: Int
    $maxAmount: Int
    $dateFrom: DateTime
    $dateTo: DateTime
    $searchTerm: String
    $kind: [TransactionKind]
    $includeIncognitoTransactions: Boolean
    $includeGiftCardTransactions: Boolean
    $includeChildrenTransactions: Boolean
  ) {
    account(slug: $slug) {
      id
      legacyId
      slug
      name
      type
      createdAt
      imageUrl(height: 256)
      currency
      settings
      features {
        id
        ...NavbarFields
      }
      ... on AccountWithParent {
        parent {
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
    }
    transactions(
      account: { slug: $slug }
      limit: $limit
      offset: $offset
      type: $type
      paymentMethodType: $paymentMethodType
      minAmount: $minAmount
      maxAmount: $maxAmount
      dateFrom: $dateFrom
      dateTo: $dateTo
      searchTerm: $searchTerm
      kind: $kind
      includeIncognitoTransactions: $includeIncognitoTransactions
      includeGiftCardTransactions: $includeGiftCardTransactions
      includeChildrenTransactions: $includeChildrenTransactions
      includeDebts: true
    ) {
      ...TransactionsQueryCollectionFragment
    }
  }
  ${transactionsQueryCollectionFragment}
  ${collectiveNavbarFieldsFragment}
  ${processingOrderFragment}
`;

const EXPENSES_PER_PAGE = 15;

export function getVariablesFromQuery(query) {
  const amountRange = parseAmountRange(query.amount);
  const { from: dateFrom, to: dateTo } = parseDateInterval(query.period);
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
  };
}

const convertProcessingOrderIntoTransactionItem = order => ({
  order,
  // Since we're filtering for OUTGOING orders, we can assume that the order is from the collective
  type: TransactionTypes.DEBIT,
  kind: TransactionKind.CONTRIBUTION,
  ...pick(order, ['id', 'amount', 'toAccount', 'fromAccount', 'description', 'createdAt', 'paymentMethod']),
});

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
}) => {
  const [state, setState] = useState({
    hasChildren: null,
    hasGiftCards: null,
    hasIncognito: null,
    hasProcessingOrders: null,
  });

  const transactionsRoute = isDashboard
    ? `/dashboard/transactions/${account?.slug}`
    : `${getCollectivePageCanonicalURL(account)}/transactions`;

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
    } else if (account.type !== 'ORGANIZATION' && account.type !== 'USER') {
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
    const queryParameters = {
      ...omit(params, ['offset', 'collectiveType', 'parentCollectiveSlug']),
    };

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
    return <ErrorPage error={error} loading={loading} />;
  }

  const transactionsAndProcessingOrders =
    state.hasProcessingOrders && variables.displayPendingContributions && !variables.offset
      ? [
          ...(account?.processingOrders?.nodes || []).map(convertProcessingOrderIntoTransactionItem),
          ...(transactions?.nodes || []),
        ]
      : transactions?.nodes || [];

  return (
    <Box maxWidth={1260} m="0 auto" pb={3} data-cy="transactions-page-content">
      <Flex justifyContent="space-between" alignItems="baseline">
        <SectionTitle textAlign="left" mb={1} display={['none', 'block']}>
          <FormattedMessage id="menu.transactions" defaultMessage="Transactions" />
        </SectionTitle>
        <Box flexGrow={[1, 0]}>
          <SearchBar
            placeholder="Search transactions..." // TODO: fix intl
            defaultValue={router.query.searchTerm}
            height="40px"
            onSubmit={searchTerm => updateFilters({ searchTerm, offset: null })}
          />
        </Box>
      </Flex>
      <Flex
        mb={['8px', '23px']}
        mt={4}
        mx="8px"
        justifyContent="space-between"
        flexDirection={['column', 'row']}
        alignItems={['stretch', 'flex-end']}
      >
        <TransactionsFilters
          filters={router.query}
          kinds={transactions?.kinds}
          paymentMethodTypes={transactions?.paymentMethodTypes}
          collective={account}
          onChange={queryParams => updateFilters({ ...queryParams, offset: null })}
        />
        <Flex>
          {canDownloadInvoices && (
            <Box mr="8px">
              <Link href={`/${account.slug}/admin/payment-receipts`}>
                <StyledButton
                  buttonSize="small"
                  minWidth={140}
                  height={38}
                  mb="8px"
                  p="6px 10px"
                  isBorderless
                  flexGrow={1}
                  whiteSpace="nowrap"
                >
                  <FormattedMessage id="transactions.downloadinvoicesbutton" defaultMessage="Download Receipts" />
                  <IconDownload size="13px" style={{ marginLeft: '8px' }} />
                </StyledButton>
              </Link>
            </Box>
          )}
          <TransactionsDownloadCSV collective={account} query={router.query} />
        </Flex>
      </Flex>

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
              <FormattedMessage
                id="transactions.displayPendingContributions"
                defaultMessage="Display pending contributions"
              />
            }
          />
        )}
        {state.hasChildren && (
          <StyledCheckbox
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
            checked={router.query.ignoreGiftCardsTransactions ? true : false}
            onChange={({ checked }) => updateFilters({ ignoreGiftCardsTransactions: checked }, account)}
            label={
              <FormattedMessage id="transactions.excludeGiftCards" defaultMessage="Exclude Gift Card transactions" />
            }
          />
        )}
        {state.hasIncognito && (
          <StyledCheckbox
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
        ) : (
          <React.Fragment>
            <TransactionsList
              isLoading={loading}
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
    </Box>
  );
};

Transactions.propTypes = {
  account: PropTypes.object,
  transactions: PropTypes.shape({
    nodes: PropTypes.array,
    totalCount: PropTypes.number,
    paymentMethodTypes: PropTypes.array,
    kinds: PropTypes.array,
  }),
  variables: PropTypes.object,
  loading: PropTypes.bool,
  refetch: PropTypes.func,
  error: PropTypes.any,
  LoggedInUser: PropTypes.object,
  query: PropTypes.shape({
    searchTerm: PropTypes.string,
    offset: PropTypes.string,
    ignoreIncognitoTransactions: PropTypes.string,
    ignoreGiftCardsTransactions: PropTypes.string,
    ignoreChildrenTransactions: PropTypes.string,
    displayPendingContributions: PropTypes.string,
  }),
  router: PropTypes.object,
  isDashboard: PropTypes.bool,
};

export default Transactions;
