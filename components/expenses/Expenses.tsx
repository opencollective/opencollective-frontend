import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { omit, omitBy } from 'lodash';
import memoizeOne from 'memoize-one';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { getSuggestedTags, loggedInUserCanAccessFinancialData } from '../../lib/collective.lib';
import { CollectiveType } from '../../lib/constants/collectives';
import { generateNotFoundError } from '../../lib/errors';
import { addParentToURLIfMissing, getCollectivePageRoute } from '../../lib/url-helpers';

import { Dimensions } from '../collective-page/_constants';
import SectionTitle from '../collective-page/SectionTitle';
import Container from '../Container';
import ErrorPage from '../ErrorPage';
import { Box, Flex } from '../Grid';
import ScheduledExpensesBanner from '../host-dashboard/ScheduledExpensesBanner';
import Link from '../Link';
import Loading from '../Loading';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import PageFeatureNotSupported from '../PageFeatureNotSupported';
import Pagination from '../Pagination';
import SearchBar from '../SearchBar';
import Tags from '../Tags';
import { H5 } from '../Text';

import { ExpensesDirection } from './filters/ExpensesDirection';
import ExpensesOrder from './filters/ExpensesOrder';
import ExpenseInfoSidebar from './ExpenseInfoSidebar';
import ExpensesFilters from './ExpensesFilters';
import ExpensesList from './ExpensesList';

// const messages = defineMessages({
//   title: {
//     id: 'ExpensesPage.title',
//     defaultMessage: '{collectiveName} · Expenses',
//   },
// });

const ORDER_SELECT_STYLE = { control: { background: 'white' } };

const Expenses = props => {
  //   const intl = useIntl();
  const router = useRouter();
  const { query, LoggedInUser, data, collectiveSlug, loading, error, variables, refetch, isDashboard = true } = props;
  const expensesRoute = isDashboard
    ? `/dashboard/expenses/${collectiveSlug}`
    : `${getCollectivePageRoute(data?.account)}/expenses`;
  useEffect(() => {
    const account = data?.account;
    const queryParameters = {
      ...omit(query, ['offset', 'collectiveSlug', 'parentCollectiveSlug']),
    };
    if (!isDashboard) {
      addParentToURLIfMissing(router, account, `/expenses`, queryParameters);
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

  const hasFilter = memoizeOne(query => {
    return Object.entries(query).some(([key, value]) => key !== 'offset' && key !== 'limit' && value);
  });

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

  const suggestedTags = memoizeOne(getSuggestedTags);

  const hasFilters = hasFilter(query);
  const isSelfHosted = data?.account?.id === data?.account?.host?.id;

  if (!loading) {
    if (error) {
      return <ErrorPage data={data} />;
    } else if (!data?.account || !data?.expenses?.nodes) {
      return <ErrorPage error={generateNotFoundError(collectiveSlug)} log={false} />;
    } else if (!loggedInUserCanAccessFinancialData(LoggedInUser, data?.account)) {
      // Hack for funds that want to keep their budget "private"
      return <PageFeatureNotSupported showContactSupportLink={false} />;
    }
  }

  if (!data?.account && loading) {
    return <Loading />;
  } else if (!data?.account) {
    return <ErrorPage error={error} loading={loading} />;
  }

  return (
    <Container position="relative" minHeight={[null, 800]}>
      <Box maxWidth={Dimensions.MAX_SECTION_WIDTH} m="0 auto" pb={3}>
        <SectionTitle textAlign="left" mb={4} display={['none', 'block']}>
          <FormattedMessage id="Expenses" defaultMessage="Expenses" />
        </SectionTitle>
        <Flex alignItems={[null, null, 'center']} mb="26px" flexWrap="wrap" gap="16px" mr={2}>
          <Box flex="0 1" flexBasis={['100%', null, '380px']}>
            <ExpensesDirection
              value={query.direction || 'RECEIVED'}
              onChange={direction => {
                const newFilters = { ...query, direction };
                updateFilters(newFilters);
              }}
            />
          </Box>
          <Box flex="12 1 150px">
            <SearchBar
              defaultValue={query.searchTerm}
              onSubmit={searchTerm => handleSearch(searchTerm)}
              height="40px"
            />
          </Box>
          <Box flex="1 1 150px">
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
          <ScheduledExpensesBanner host={data.account} />
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
                  collective={data.account}
                  host={data.account?.isHost ? data.account : data.account?.host}
                  expenses={data.expenses?.nodes}
                  nbPlaceholders={variables.limit}
                  suggestedTags={suggestedTags(data.account)}
                  isInverted={query.direction === 'SUBMITTED'}
                  view={query.direction === 'SUBMITTED' ? 'submitter' : undefined}
                />
                <Flex mt={5} justifyContent="center">
                  <Pagination
                    route={expensesRoute}
                    total={data.expenses?.totalCount}
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
              <ExpenseInfoSidebar
                isLoading={loading}
                collective={data.account}
                host={data.account?.host}
                // showExpenseTypeFilters
              >
                {data.account?.expensesTags.length > 0 && (
                  <React.Fragment>
                    <H5 mb={3}>
                      <FormattedMessage id="Tags" defaultMessage="Tags" />
                    </H5>
                    <Tags
                      isLoading={loading}
                      expense={{
                        tags: data.account?.expensesTags.map(({ tag }) => tag),
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
      </Box>
    </Container>
  );
};

Expenses.propTypes = {
  collectiveSlug: PropTypes.string,
  parentCollectiveSlug: PropTypes.string,
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
  }),
  data: PropTypes.shape({
    account: PropTypes.shape({
      id: PropTypes.string.isRequired,
      currency: PropTypes.string.isRequired,
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
};

export default Expenses;
