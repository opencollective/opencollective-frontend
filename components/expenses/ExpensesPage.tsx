import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { omit, omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { getSuggestedTags } from '../../lib/collective.lib';
import { CollectiveType } from '../../lib/constants/collectives';
import { addParentToURLIfMissing, getCollectivePageRoute } from '../../lib/url-helpers';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import ScheduledExpensesBanner from '../host-dashboard/ScheduledExpensesBanner';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import Pagination from '../Pagination';
import SearchBar from '../SearchBar';
import Tags from '../Tags';
import { H5 } from '../Text';

import { ExpensesDirection } from './filters/ExpensesDirection';
import ExpensesOrder from './filters/ExpensesOrder';
import ExpenseInfoSidebar from './ExpenseInfoSidebar';
import ExpensesFilters from './ExpensesFilters';
import ExpensesList from './ExpensesList';

const ORDER_SELECT_STYLE = { control: { background: 'white' } };

const Expenses = props => {
  const router = useRouter();
  const { query, LoggedInUser, data, loading, variables, refetch, isDashboard, onlySubmittedExpenses } = props;

  const expensesRoute = isDashboard
    ? query.direction === 'SUBMITTED'
      ? `/dashboard/${variables.collectiveSlug}/submitted-expenses`
      : `/dashboard/${variables.collectiveSlug}/expenses`
    : `${getCollectivePageRoute(data?.account)}/expenses`;

  useEffect(() => {
    const queryParameters = {
      ...omit(query, ['offset', 'collectiveSlug', 'parentCollectiveSlug']),
    };
    if (!isDashboard) {
      addParentToURLIfMissing(router, data?.account, `/expenses`, queryParameters);
    }
  }, []);

  const [oldLoggedInUser, setOldLoggedInUser] = useState(null);

  useEffect(() => {
    if (!oldLoggedInUser && LoggedInUser) {
      if (LoggedInUser.isAdminOfCollectiveOrHost(data?.account)) {
        refetch();
      }
    }
    setOldLoggedInUser(LoggedInUser);
  }, [oldLoggedInUser, LoggedInUser, data]);

  const hasFilters = React.useMemo(() => {
    return Object.entries(query).some(([key, value]) => key !== 'offset' && key !== 'limit' && value);
  }, [query]);

  function buildFilterLinkParams(params) {
    const queryParameters = {
      ...omit(query, ['offset', 'collectiveSlug', 'parentCollectiveSlug']),
      ...params,
    };

    return omitBy(queryParameters, value => !value);
  }

  function updateFilters(queryParams) {
    return router.push({
      pathname: expensesRoute,
      query: buildFilterLinkParams({ ...queryParams, offset: null }),
    });
  }

  function handleSearch(searchTerm) {
    const params = buildFilterLinkParams({ searchTerm, offset: null });
    router.push({ pathname: expensesRoute, query: params });
  }

  function getTagProps(tag) {
    if (tag === query.tag) {
      return { type: 'info', closeButtonProps: true };
    }
  }

  const suggestedTags = React.useMemo(() => getSuggestedTags(data?.account), [data?.account]);

  const isSelfHosted = data?.account?.id === data?.account?.host?.id;

  return (
    <Container>
      {!isDashboard && (
        <React.Fragment>
          <h1 className={'mb-6 text-[32px] leading-10'}>
            {onlySubmittedExpenses ? (
              <FormattedMessage defaultMessage="Submitted Expenses" />
            ) : (
              <FormattedMessage id="Expenses" defaultMessage="Expenses" />
            )}
          </h1>
        </React.Fragment>
      )}

      <Flex alignItems={[null, null, 'center']} mb="26px" flexWrap="wrap" gap="16px" mr={2}>
        {!isDashboard && !onlySubmittedExpenses && (
          <Box flex="0 1" flexBasis={['100%', null, '380px']}>
            <ExpensesDirection
              value={query.direction || 'RECEIVED'}
              onChange={direction => {
                const newFilters = { ...query, direction };
                updateFilters(newFilters);
              }}
            />
          </Box>
        )}
        <Box flex="12 1 160px">
          <SearchBar defaultValue={query.searchTerm} onSubmit={searchTerm => handleSearch(searchTerm)} height="40px" />
        </Box>
        <Box flex="0 1 160px">
          <ExpensesOrder
            value={query.orderBy}
            onChange={orderBy => updateFilters({ ...query, orderBy })}
            styles={ORDER_SELECT_STYLE}
          />
        </Box>
      </Flex>
      <Box mx="8px">
        {data?.account ? (
          <ExpensesFilters
            collective={data.account}
            filters={query}
            onChange={queryParams => updateFilters(queryParams)}
            wrap={false}
            showOrderFilter={false} // On this page, the order filter is displayed at the top
          />
        ) : (
          <LoadingPlaceholder height={70} />
        )}
      </Box>
      {isSelfHosted && LoggedInUser?.isHostAdmin(data?.account) && data.scheduledExpenses?.totalCount > 0 && (
        <ScheduledExpensesBanner hostSlug={data.account.slug} />
      )}
      <Flex justifyContent="space-between" flexWrap="wrap" gridGap={[0, 3, 5]}>
        <Box flex="1 1 500px" minWidth={300} mb={5} mt={['16px', '46px']}>
          {!loading && !data.expenses?.nodes.length ? (
            <MessageBox type="info" withIcon data-cy="zero-expense-message">
              {hasFilters ? (
                <FormattedMessage
                  id="ExpensesList.Empty"
                  defaultMessage="No expense matches the given filters, <ResetLink>reset them</ResetLink> to see all expenses."
                  values={{
                    ResetLink: text => (
                      <Link data-cy="reset-expenses-filters" href={expensesRoute}>
                        <span>{text}</span>
                      </Link>
                    ),
                  }}
                />
              ) : (
                <FormattedMessage id="expenses.empty" defaultMessage="No expenses" />
              )}
            </MessageBox>
          ) : (
            <React.Fragment>
              <ExpensesList
                isLoading={loading}
                collective={data?.account}
                host={data?.account?.host ?? (data?.account?.isHost ? data?.account : null)}
                expenses={data?.expenses?.nodes}
                nbPlaceholders={variables.limit}
                suggestedTags={suggestedTags}
                isInverted={query.direction === 'SUBMITTED'}
                view={query.direction === 'SUBMITTED' ? 'submitter' : undefined}
                useDrawer={isDashboard}
                openExpenseLegacyId={Number(router.query.openExpenseId)}
                setOpenExpenseLegacyId={legacyId => {
                  router.push(
                    {
                      pathname: expensesRoute,
                      query: buildFilterLinkParams({ ...query, openExpenseId: legacyId }),
                    },
                    undefined,
                    { shallow: true },
                  );
                }}
              />
              <Flex mt={5} justifyContent="center">
                <Pagination
                  route={expensesRoute}
                  total={data?.expenses?.totalCount}
                  limit={variables.limit}
                  offset={variables.offset}
                  ignoredQueryParams={['collectiveSlug', 'parentCollectiveSlug']}
                />
              </Flex>
            </React.Fragment>
          )}
        </Box>
        {!isDashboard && (
          <Box minWidth={270} width={['100%', null, null, 275]} mt={[0, 48]}>
            <ExpenseInfoSidebar isLoading={loading} collective={data?.account} host={data?.account?.host}>
              {data?.account?.expensesTags.length > 0 && (
                <React.Fragment>
                  <H5 mb={3}>
                    <FormattedMessage id="Tags" defaultMessage="Tags" />
                  </H5>
                  <Tags
                    isLoading={loading}
                    expense={{
                      tags: data?.account?.expensesTags.map(({ tag }) => tag),
                    }}
                    limit={30}
                    getTagProps={getTagProps}
                    data-cy="expense-tags-title"
                    showUntagged
                  >
                    {({ key, tag, renderedTag, props: { closeButtonProps } }) => (
                      <Link
                        key={key}
                        href={{
                          pathname: expensesRoute,
                          query: buildFilterLinkParams({ tag: closeButtonProps ? null : tag }),
                        }}
                        data-cy="expense-tags-link"
                      >
                        {renderedTag}
                      </Link>
                    )}
                  </Tags>
                </React.Fragment>
              )}
            </ExpenseInfoSidebar>
          </Box>
        )}
      </Flex>
    </Container>
  );
};

Expenses.propTypes = {
  LoggedInUser: PropTypes.object,
  query: PropTypes.shape({
    type: PropTypes.string,
    tag: PropTypes.string,
    searchTerm: PropTypes.string,
    direction: PropTypes.string,
    orderBy: PropTypes.string,
  }),
  loading: PropTypes.bool,
  error: PropTypes.any,
  refetch: PropTypes.func,
  variables: PropTypes.shape({
    offset: PropTypes.number.isRequired,
    limit: PropTypes.number.isRequired,
    account: PropTypes.object,
    collectiveSlug: PropTypes.string,
  }),
  data: PropTypes.shape({
    account: PropTypes.shape({
      id: PropTypes.string.isRequired,
      currency: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      name: PropTypes.string,
      isArchived: PropTypes.bool,
      isHost: PropTypes.bool,
      host: PropTypes.object,
      expensesTags: PropTypes.array,
      type: PropTypes.oneOf(Object.keys(CollectiveType)),
    }),
    expenses: PropTypes.shape({
      nodes: PropTypes.array,
      totalCount: PropTypes.number,
      offset: PropTypes.number,
      limit: PropTypes.number,
    }),
    scheduledExpenses: PropTypes.shape({
      totalCount: PropTypes.number,
    }),
  }),
  isDashboard: PropTypes.bool,
  onlySubmittedExpenses: PropTypes.bool,
};

export default Expenses;
