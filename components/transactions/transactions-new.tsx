import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { Download as IconDownload } from '@styled-icons/feather/Download';
import { isNil, omit, omitBy, pick } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { loggedInUserCanAccessFinancialData } from '../../lib/collective.lib';
import roles from '../../lib/constants/roles';
import { TransactionKind, TransactionTypes } from '../../lib/constants/transactions';
import { parseDateInterval } from '../../lib/date-utils';
import { getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { getCollectivePageCanonicalURL } from '../../lib/url-helpers';

import { parseAmountRange } from '../budget/filters/AmountFilter';
import { collectiveNavbarFieldsFragment, processingOrderFragment } from '../collective-page/graphql/fragments';
import SectionTitle from '../collective-page/SectionTitle';
import ErrorPage from '../ErrorPage';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import Loading from '../Loading';
import MessageBox from '../MessageBox';
import Page from '../Page';
import PageFeatureNotSupported from '../PageFeatureNotSupported';
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

const transactionsPageQuery = gql`
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

const TransactionPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  #footer {
    margin-top: auto;
  }
`;

const EXPENSES_PER_PAGE = 15;

const getVariablesFromQuery = query => {
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
};

const convertProcessingOrderIntoTransactionItem = order => ({
  order,
  // Since we're filtering for OUTGOING orders, we can assume that the order is from the collective
  type: TransactionTypes.DEBIT,
  kind: TransactionKind.CONTRIBUTION,
  ...pick(order, ['id', 'amount', 'toAccount', 'fromAccount', 'description', 'createdAt', 'paymentMethod']),
});

const Transactions = ({ account }) => {
  const router = useRouter();
  const query = getVariablesFromQuery(router.query);
  const { LoggedInUser } = useLoggedInUser();
  const currentCollective = account;
  const [state, setState] = useState({
    hasChildren: null,
    hasGiftCards: null,
    hasIncognito: null,
    hasProcessingOrders: null,
  });
  const variables = { slug: account.slug, ...getVariablesFromQuery(router.query) };
  const { data, error, loading, refetch } = useQuery(transactionsPageQuery, {
    variables,
    context: API_V2_CONTEXT,
  });
  const { transactions, account: accountFromQuery } = data || {};

  useEffect(() => {
    // const queryParameters = {
    //   ...omit(router.query, ['offset', 'collectiveSlug', 'parentCollectiveSlug']),
    // };
    // addParentToURLIfMissing(router, account, `/transactions`, queryParameters);
    let newState = { ...state };
    const hasChildren =
      (data?.transactions?.nodes || []).some(
        el => el.fromAccount?.parent?.id === currentCollective.id || el.toAccount?.parent?.id === data?.account?.id,
      ) || router.query.ignoreChildrenTransactions;
    if (isNil(state.hasChildren) && hasChildren) {
      newState = { ...newState, hasChildren };
    }

    const hasGiftCards =
      (data?.transactions?.nodes || []).some(
        el => el.giftCardEmitterAccount?.id && el.giftCardEmitterAccount?.id === data?.account?.id,
      ) || router.query.ignoreGiftCardsTransactions;
    if (isNil(state.hasGiftCards) && hasGiftCards) {
      newState = { ...newState, hasChildren };
    }

    const hasIncognito =
      (data?.transactions?.nodes || []).some(el => el.account?.isIncognito) || router.query.ignoreIncognitoTransactions;
    if (isNil(state.hasIncognito) && hasIncognito) {
      newState = { ...newState, hasChildren };
    }

    const hasProcessingOrders =
      data?.account?.processingOrders?.totalCount > 0 || router.query.displayPendingContributions;
    if (isNil(state.hasProcessingOrders) && hasProcessingOrders) {
      newState = { ...newState, hasChildren };
    }
    setState(newState);
  }, [data, router.query]);

  function checkCanDownloadInvoices() {
    // const collective = account // || this.state.Collective;
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

  function updateFilters(queryParams, collective) {
    return router.push({
      pathname: `${getCollectivePageCanonicalURL(collective)}/transactions`,
      query: buildFilterLinkParams({ ...queryParams, offset: null }),
    });
  }

  const hasFilters = Object.entries(router.query).some(([key, value]) => {
    return !['view', 'offset', 'limit', 'slug'].includes(key) && value;
  });
  const canDownloadInvoices = checkCanDownloadInvoices();
  console.log({ account, accountFromQuery });
  if (!account && loading) {
    return (
      <Page title="Transactions">
        <Loading />
      </Page>
    );
  } else if (!account) {
    return <ErrorPage data={data} />;
  } else if (!loggedInUserCanAccessFinancialData(LoggedInUser, account)) {
    // Hack for funds that want to keep their budget "private"
    return <PageFeatureNotSupported showContactSupportLink={false} />;
  }

  const transactionsAndProcessingOrders =
    state.hasProcessingOrders && query.displayPendingContributions && !query.offset
      ? [
          ...(account?.processingOrders?.nodes || []).map(convertProcessingOrderIntoTransactionItem),
          ...(transactions?.nodes || []),
        ]
      : transactions?.nodes || [];

  return (
    <TransactionPageWrapper>
      {/* here was a "Header" to set Head stuff */}

      <Box maxWidth={1260} m="0 auto" px={[2, 3, 4]} py={[0, 4]} mt={[3, 0]} data-cy="transactions-page-content">
        <Flex justifyContent="space-between" alignItems="baseline">
          <SectionTitle textAlign="left" mb={1} display={['none', 'block']}>
            <FormattedMessage id="menu.transactions" defaultMessage="Transactions" />
          </SectionTitle>
          <Box flexGrow={[1, 0]}>
            <SearchBar
              placeholder="Search transactions..." // TODO: fix intl
              defaultValue={query.searchTerm}
              height="40px"
              onSubmit={searchTerm => updateFilters({ searchTerm, offset: null }, account)}
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
            onChange={queryParams => updateFilters({ ...queryParams, offset: null }, account)}
          />
          <Flex>
            {canDownloadInvoices && (
              <Box mr="8px">
                <Link href={`/${account.slug}/admin/payment-receipts`}>
                  <StyledButton buttonSize="small" minWidth={140} isBorderless flexGrow={1}>
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
              checked={query.displayPendingContributions}
              onChange={({ checked }) => updateFilters({ displayPendingContributions: checked }, account)}
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
              onChange={({ checked }) => updateFilters({ ignoreChildrenTransactions: checked }, account)}
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
              onChange={({ checked }) => updateFilters({ ignoreIncognitoTransactions: checked }, account)}
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
            <React.Fragment>
              <TransactionsList
                isLoading={loading}
                collective={account}
                //  nbPlaceholders={variables.limit}
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
    </TransactionPageWrapper>
  );
};

Transactions.propTypes = {
  account: PropTypes.object,
};

export default Transactions;
