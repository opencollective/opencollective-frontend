import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { omit, omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { getSuggestedTags } from '../../lib/collective.lib';
import { CollectiveType } from '../../lib/constants/collectives';
import { addParentToURLIfMissing, getCollectivePageRoute } from '../../lib/url-helpers';

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
  const { query, LoggedInUser, data, loading, variables, refetch, isDashboard, isSubmitted } = props;

  const expensesRoute = isDashboard
    ? `/dashboard/${variables.collectiveSlug}/expenses`
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

  function getTagProps(tag) {
    if (tag === query.tag) {
      return { type: 'info', closeButtonProps: true };
    }
  }

  const suggestedTags = React.useMemo(() => getSuggestedTags(data?.account), [data?.account]);

  return (
    <div className="mx-auto max-w-screen-lg">
      {/* TODO: include this as a view, similar strategy as host dashboard */}
      {/* {isSelfHosted && LoggedInUser?.isHostAdmin(data?.account) && data.scheduledExpenses?.totalCount > 0 && (
        <ScheduledExpensesBanner hostSlug={data.account.slug} />
      )} */}
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
                host={data?.account?.isHost ? data?.account : data?.account?.host}
                expenses={data?.expenses?.nodes}
                nbPlaceholders={variables.limit}
                suggestedTags={suggestedTags}
                isInverted={isSubmitted}
                view={isSubmitted ? 'submitter' : undefined}
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
        {/* TODO: move this to the page itself */}
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
    </div>
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
