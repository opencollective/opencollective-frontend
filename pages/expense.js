/* eslint-disable graphql/template-strings */
import React from 'react';
import PropTypes from 'prop-types';
import { graphql, withApollo } from '@apollo/client/react/hoc';
import dayjs from 'dayjs';
import { cloneDeep } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, injectIntl } from 'react-intl';

import { getCollectivePageMetadata } from '../lib/collective.lib';
import { generateNotFoundError } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import { addParentToURLIfMissing, getCollectivePageCanonicalURL } from '../lib/url-helpers';

import CollectiveNavbar from '../components/collective-navbar';
import { NAVBAR_CATEGORIES } from '../components/collective-navbar/constants';
import ErrorPage from '../components/ErrorPage';
import Expense from '../components/expenses/Expense';
import ExpenseInfoSidebar from '../components/expenses/ExpenseInfoSidebar';
import { expensePageQuery } from '../components/expenses/graphql/queries';
import MobileCollectiveInfoStickyBar from '../components/expenses/MobileCollectiveInfoStickyBar';
import { Box, Flex } from '../components/Grid';
import Page from '../components/Page';
import { withUser } from '../components/UserProvider';

export const getVariableFromProps = props => {
  const firstOfCurrentYear = dayjs(new Date(new Date().getFullYear(), 0, 1)).utc(true).toISOString();
  return {
    legacyExpenseId: props.legacyExpenseId,
    draftKey: props.draftKey,
    totalPaidExpensesDateFrom: firstOfCurrentYear,
  };
};

const messages = defineMessages({
  title: {
    id: 'ExpensePage.title',
    defaultMessage: '{title} · Expense #{id}',
  },
});

const SIDE_MARGIN_WIDTH = 'calc((100% - 1200px) / 2)';

class ExpensePage extends React.Component {
  static getInitialProps({ query: { parentCollectiveSlug, collectiveSlug, ExpenseId, key, edit } }) {
    return {
      parentCollectiveSlug,
      collectiveSlug,
      edit,
      draftKey: key,
      legacyExpenseId: parseInt(ExpenseId),
    };
  }

  static propTypes = {
    collectiveSlug: PropTypes.string,
    parentCollectiveSlug: PropTypes.string,
    legacyExpenseId: PropTypes.number,
    draftKey: PropTypes.string,
    edit: PropTypes.string,
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
    /** @ignore from withApollo */
    client: PropTypes.object.isRequired,
    /** from withData */
    data: PropTypes.object.isRequired,
    /** from injectIntl */
    intl: PropTypes.object,
    expensesTags: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        tag: PropTypes.string,
      }),
    ),
    router: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = {
      hasRefetchedDataForUser: Boolean(props.LoggedInUser), // If the page is loaded directly with a logged in user, we can consider the query was already authenticated
    };
  }

  componentDidMount() {
    const { router, data, legacyExpenseId } = this.props;
    const account = data?.account;
    addParentToURLIfMissing(router, account, `/expenses/${legacyExpenseId}`);
  }

  componentDidUpdate(oldProps) {
    // Refetch data when users are logged in to make sure they can see the private info
    if (!oldProps.LoggedInUser && this.props.LoggedInUser) {
      this.refetchDataForUser();
    }
  }

  async refetchDataForUser() {
    try {
      this.setState({ hasRefetchedDataForUser: false });
      await this.props.data.refetch();
    } finally {
      this.setState({ hasRefetchedDataForUser: true });
    }
  }

  getPageMetaData(expense) {
    const { intl, legacyExpenseId } = this.props;
    const baseMetadata = getCollectivePageMetadata(expense?.account);
    if (expense?.description) {
      return {
        ...baseMetadata,
        title: intl.formatMessage(messages.title, { id: legacyExpenseId, title: expense.description }),
      };
    } else {
      return baseMetadata;
    }
  }

  render() {
    const { collectiveSlug, data, LoggedInUser, loadingLoggedInUser, client, legacyExpenseId, edit } = this.props;
    const { hasRefetchedDataForUser } = this.state;
    const isRefetchingDataForUser = LoggedInUser && !hasRefetchedDataForUser;

    const { loading, refetch, fetchMore, startPolling, stopPolling, error } = data;

    if (!loading && !isRefetchingDataForUser) {
      if (!data || error) {
        return <ErrorPage data={data} />;
      } else if (!data.expense) {
        return <ErrorPage error={generateNotFoundError(null)} log={false} />;
      } else if (!data.expense.account || this.props.collectiveSlug !== data.expense.account.slug) {
        return <ErrorPage error={generateNotFoundError(collectiveSlug)} log={false} />;
      }
    }

    const expense = cloneDeep(data.expense);
    if (expense && data.expensePayeeStats?.payee?.stats) {
      expense.payee.stats = data.expensePayeeStats?.payee?.stats;
    }
    const collective = expense?.account;
    const host = collective?.host;

    return (
      <Page
        collective={collective}
        canonicalURL={`${getCollectivePageCanonicalURL(collective)}/expense`}
        {...this.getPageMetaData(expense)}
      >
        <CollectiveNavbar collective={collective} isLoading={!collective} selectedCategory={NAVBAR_CATEGORIES.BUDGET} />
        <Flex flexDirection={['column', 'row']} px={[2, 3, 4]} py={[0, 5]} mt={3} data-cy="expense-page-content">
          <Box width={SIDE_MARGIN_WIDTH}></Box>
          <Box flex="1 1 650px" minWidth={300} maxWidth={[null, null, null, 792]} mr={[null, 2, 3, 4]} px={2}>
            <Expense
              data={data}
              loading={loading}
              error={error}
              refetch={refetch}
              client={client}
              fetchMore={fetchMore}
              legacyExpenseId={legacyExpenseId}
              startPolling={startPolling}
              stopPolling={stopPolling}
              isRefetchingDataForUser={isRefetchingDataForUser}
              edit={edit}
            />
          </Box>
          <Flex flex="1 1" justifyContent={['center', null, 'flex-start', 'flex-end']} pt={80}>
            <Box minWidth={270} width={['100%', null, null, 275]} px={2}>
              <ExpenseInfoSidebar
                isLoading={data.loading || loadingLoggedInUser || isRefetchingDataForUser}
                collective={collective}
                host={host}
              />
            </Box>
          </Flex>
          <Box width={SIDE_MARGIN_WIDTH} />
        </Flex>
        <MobileCollectiveInfoStickyBar
          isLoading={data.loading || loadingLoggedInUser || isRefetchingDataForUser}
          collective={collective}
          host={host}
        />
      </Page>
    );
  }
}

const addExpensePageData = graphql(expensePageQuery, {
  options(props) {
    return {
      variables: getVariableFromProps(props),
      context: API_V2_CONTEXT,
    };
  },
});

export default injectIntl(addExpensePageData(withApollo(withUser(withRouter(ExpensePage)))));
