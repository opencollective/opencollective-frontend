import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { has, omit, omitBy } from 'lodash';
import memoizeOne from 'memoize-one';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { FEATURES, isFeatureSupported } from '../lib/allowed-features';
import { getCollectivePageMetadata, getSuggestedTags, loggedInUserCanAccessFinancialData } from '../lib/collective.lib';
import { CollectiveType } from '../lib/constants/collectives';
import expenseStatus from '../lib/constants/expense-status';
import expenseTypes from '../lib/constants/expenseTypes';
import { PayoutMethodType } from '../lib/constants/payout-method';
import { parseDateInterval } from '../lib/date-utils';
import { generateNotFoundError } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import { addParentToURLIfMissing, getCollectivePageCanonicalURL, getCollectivePageRoute } from '../lib/url-helpers';

import { parseAmountRange } from '../components/budget/filters/AmountFilter';
import CollectiveNavbar from '../components/collective-navbar';
import { NAVBAR_CATEGORIES } from '../components/collective-navbar/constants';
import { Dimensions } from '../components/collective-page/_constants';
import { collectiveNavbarFieldsFragment } from '../components/collective-page/graphql/fragments';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import ExpenseInfoSidebar from '../components/expenses/ExpenseInfoSidebar';
import ExpensesFilters from '../components/expenses/ExpensesFilters';
import ExpensesList from '../components/expenses/ExpensesList';
import { ExpensesDirection } from '../components/expenses/filters/ExpensesDirection';
import ExpensesOrder, { parseChronologicalOrderInput } from '../components/expenses/filters/ExpensesOrder';
import { expenseHostFields, expensesListFieldsFragment } from '../components/expenses/graphql/fragments';
import { Box, Flex } from '../components/Grid';
import ScheduledExpensesBanner from '../components/host-dashboard/ScheduledExpensesBanner';
import Link from '../components/Link';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import MessageBox from '../components/MessageBox';
import Page from '../components/Page';
import PageFeatureNotSupported from '../components/PageFeatureNotSupported';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import Tags from '../components/Tags';
import { H1, H5 } from '../components/Text';
import { withUser } from '../components/UserProvider';

const messages = defineMessages({
  title: {
    id: 'ExpensesPage.title',
    defaultMessage: '{collectiveName} · Expenses',
  },
});

const EXPENSES_PER_PAGE = 10;
const ORDER_SELECT_STYLE = { control: { background: 'white' } };

class ExpensePage extends React.Component {
  static getInitialProps({ query }) {
    const {
      parentCollectiveSlug,
      collectiveSlug,
      offset,
      limit,
      type,
      status,
      tag,
      amount,
      payout,
      period,
      searchTerm,
      orderBy,
      direction,
    } = query;
    return {
      parentCollectiveSlug,
      collectiveSlug,
      query: {
        offset: parseInt(offset) || undefined,
        limit: parseInt(limit) || undefined,
        type: has(expenseTypes, type) ? type : undefined,
        status: has(expenseStatus, status) || status === 'READY_TO_PAY' ? status : undefined,
        payout: has(PayoutMethodType, payout) ? payout : undefined,
        direction,
        period,
        amount,
        tag,
        searchTerm,
        orderBy,
      },
    };
  }

  static propTypes = {
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
    /** from injectIntl */
    intl: PropTypes.object,
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      refetch: PropTypes.func,
      variables: PropTypes.shape({
        offset: PropTypes.number.isRequired,
        limit: PropTypes.number.isRequired,
        account: PropTypes.object,
      }),
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
    router: PropTypes.object,
  };

  componentDidMount() {
    const { router, data } = this.props;
    const account = data?.account;
    const queryParameters = {
      ...omit(this.props.query, ['offset', 'collectiveSlug', 'parentCollectiveSlug']),
    };
    addParentToURLIfMissing(router, account, `/expenses`, queryParameters);
  }

  componentDidUpdate(oldProps) {
    const { LoggedInUser, data } = this.props;
    if (!oldProps.LoggedInUser && LoggedInUser) {
      if (LoggedInUser.isAdminOfCollectiveOrHost(data.account)) {
        data.refetch();
      }
    }
  }

  getPageMetaData(collective) {
    const baseMetadata = getCollectivePageMetadata(collective);
    if (collective) {
      return {
        ...baseMetadata,
        title: this.props.intl.formatMessage(messages.title, { collectiveName: collective.name }),
      };
    } else {
      return { ...baseMetadata, title: `Expenses` };
    }
  }

  hasFilter = memoizeOne(query => {
    return Object.entries(query).some(([key, value]) => key !== 'offset' && key !== 'limit' && value);
  });

  buildFilterLinkParams(params) {
    const queryParameters = {
      ...omit(this.props.query, ['offset', 'collectiveSlug', 'parentCollectiveSlug']),
      ...params,
    };

    return omitBy(queryParameters, value => !value);
  }

  updateFilters = (queryParams, collective) => {
    return this.props.router.push({
      pathname: `${getCollectivePageCanonicalURL(collective)}/expenses`,
      query: this.buildFilterLinkParams({ ...queryParams, offset: null }),
    });
  };

  handleSearch = (searchTerm, collective) => {
    const params = this.buildFilterLinkParams({ searchTerm, offset: null });
    this.props.router.push({ pathname: `${getCollectivePageCanonicalURL(collective)}/expenses`, query: params });
  };

  getTagProps = tag => {
    if (tag === this.props.query.tag) {
      return { type: 'info', closeButtonProps: true };
    }
  };

  getShouldDisplayFeatureNotSupported = account => {
    if (!account) {
      return true;
    }
  };

  getSuggestedTags = memoizeOne(getSuggestedTags);

  render() {
    const { collectiveSlug, data, query, LoggedInUser } = this.props;
    const hasFilters = this.hasFilter(query);
    const isSelfHosted = data.account?.id === data.account?.host?.id;

    if (!data.loading) {
      if (data.error) {
        return <ErrorPage data={data} />;
      } else if (!data.account || !data.expenses?.nodes) {
        return <ErrorPage error={generateNotFoundError(collectiveSlug)} log={false} />;
      } else if (!isFeatureSupported(data.account, FEATURES.RECEIVE_EXPENSES)) {
        return <PageFeatureNotSupported />;
      } else if (!loggedInUserCanAccessFinancialData(LoggedInUser, data.account)) {
        // Hack for funds that want to keep their budget "private"
        return <PageFeatureNotSupported showContactSupportLink={false} />;
      }
    }

    return (
      <Page
        collective={data.account}
        canonicalURL={`${getCollectivePageCanonicalURL(data.account)}/expenses`}
        {...this.getPageMetaData(data.account)}
      >
        <CollectiveNavbar
          collective={data.account}
          isLoading={!data.account}
          selectedCategory={NAVBAR_CATEGORIES.BUDGET}
        />
        <Container position="relative" minHeight={[null, 800]}>
          <Box maxWidth={Dimensions.MAX_SECTION_WIDTH} m="0 auto" px={[2, 3, 4]} py={[0, 5]} mt={3}>
            <H1 fontSize="32px" lineHeight="40px" mb="32px" fontWeight="normal">
              <FormattedMessage id="Expenses" defaultMessage="Expenses" />
            </H1>
            <Flex alignItems={[null, null, 'center']} mb="26px" flexWrap="wrap" gap="16px" mr={2}>
              <Box flex="0 1" flexBasis={['100%', null, '380px']}>
                <ExpensesDirection
                  value={query.direction}
                  onChange={direction => this.updateFilters({ ...query, direction }, data.account)}
                />
              </Box>
              <Box flex="12 1 150px">
                <SearchBar
                  defaultValue={query.searchTerm}
                  onSubmit={searchTerm => this.handleSearch(searchTerm, data.account)}
                  height="40px"
                />
              </Box>
              <Box flex="1 1 150px">
                <ExpensesOrder
                  value={query.orderBy}
                  onChange={orderBy => this.updateFilters({ ...query, orderBy }, data.account)}
                  styles={ORDER_SELECT_STYLE}
                />
              </Box>
            </Flex>
            <Box mx="8px">
              {data.account ? (
                <ExpensesFilters
                  collective={data.account}
                  filters={query}
                  onChange={queryParams => this.updateFilters(queryParams, data.account)}
                  wrap={false}
                  showOrderFilter={false} // On this page, the order filter is displayed at the top
                />
              ) : (
                <LoadingPlaceholder height={70} />
              )}
            </Box>
            {isSelfHosted && LoggedInUser?.isHostAdmin(data.account) && data.scheduledExpenses?.totalCount > 0 && (
              <ScheduledExpensesBanner host={data.account} />
            )}
            <Flex justifyContent="space-between" flexWrap="wrap">
              <Box flex="1 1 500px" minWidth={300} mr={[0, 3, 5]} mb={5} mt={['16px', '46px']}>
                {!data?.loading && !data.expenses?.nodes.length ? (
                  <MessageBox type="info" withIcon data-cy="zero-expense-message">
                    {hasFilters ? (
                      <FormattedMessage
                        id="ExpensesList.Empty"
                        defaultMessage="No expense matches the given filters, <ResetLink>reset them</ResetLink> to see all expenses."
                        values={{
                          ResetLink: text => (
                            <Link
                              data-cy="reset-expenses-filters"
                              href={`${getCollectivePageRoute(data.account)}/expenses`}
                            >
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
                      isLoading={Boolean(data?.loading)}
                      collective={data.account}
                      host={data.account?.isHost ? data.account : data.account?.host}
                      expenses={data.expenses?.nodes}
                      nbPlaceholders={data.variables.limit}
                      suggestedTags={this.getSuggestedTags(data.account)}
                      isInverted={query.direction === 'SUBMITTED'}
                    />
                    <Flex mt={5} justifyContent="center">
                      <Pagination
                        route={`${getCollectivePageRoute(data.account)}/expenses`}
                        total={data.expenses?.totalCount}
                        limit={data.variables.limit}
                        offset={data.variables.offset}
                        ignoredQueryParams={['collectiveSlug', 'parentCollectiveSlug']}
                      />
                    </Flex>
                  </React.Fragment>
                )}
              </Box>
              <Box minWidth={270} width={['100%', null, null, 275]} mt={[0, 48]}>
                <ExpenseInfoSidebar
                  isLoading={data.loading}
                  collective={data.account}
                  host={data.account?.host}
                  showExpenseTypeFilters
                >
                  {data.account?.expensesTags.length > 0 && (
                    <React.Fragment>
                      <H5 mb={3}>
                        <FormattedMessage id="Tags" defaultMessage="Tags" />
                      </H5>
                      <Tags
                        isLoading={data.loading}
                        expense={{
                          tags: data.account?.expensesTags.map(({ tag }) => tag),
                        }}
                        limit={30}
                        getTagProps={this.getTagProps}
                        data-cy="expense-tags-title"
                        showUntagged
                      >
                        {({ key, tag, renderedTag, props }) => (
                          <Link
                            key={key}
                            href={{
                              pathname: `${getCollectivePageRoute(data.account)}/expenses`,
                              query: this.buildFilterLinkParams({ tag: props.closeButtonProps ? null : tag }),
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
            </Flex>
          </Box>
        </Container>
      </Page>
    );
  }
}

const expensesPageQuery = gql`
  query ExpensesPage(
    $collectiveSlug: String!
    $account: AccountReferenceInput
    $fromAccount: AccountReferenceInput
    $limit: Int!
    $offset: Int!
    $type: ExpenseType
    $tags: [String]
    $status: ExpenseStatusFilter
    $minAmount: Int
    $maxAmount: Int
    $payoutMethodType: PayoutMethodType
    $dateFrom: DateTime
    $dateTo: DateTime
    $searchTerm: String
    $orderBy: ChronologicalOrderInput
  ) {
    account(slug: $collectiveSlug) {
      id
      legacyId
      slug
      type
      imageUrl
      backgroundImageUrl
      twitterHandle
      name
      currency
      isArchived
      isActive
      settings
      createdAt
      supportedExpenseTypes
      expensesTags {
        id
        tag
      }
      features {
        id
        ...NavbarFields
      }

      stats {
        id
        balanceWithBlockedFunds {
          valueInCents
          currency
        }
      }

      ... on AccountWithHost {
        isApproved
        host {
          id
          ...ExpenseHostFields
        }
      }

      ... on AccountWithParent {
        parent {
          id
          slug
          imageUrl
          backgroundImageUrl
          twitterHandle
        }
      }

      ... on Organization {
        # We add that for hasFeature
        isHost
        isActive
      }

      ... on Event {
        parent {
          id
          name
          slug
          type
        }
      }

      ... on Project {
        parent {
          id
          name
          slug
          type
        }
      }
    }
    expenses(
      account: $account
      fromAccount: $fromAccount
      limit: $limit
      offset: $offset
      type: $type
      tag: $tags
      status: $status
      minAmount: $minAmount
      maxAmount: $maxAmount
      payoutMethodType: $payoutMethodType
      dateFrom: $dateFrom
      dateTo: $dateTo
      searchTerm: $searchTerm
      orderBy: $orderBy
    ) {
      totalCount
      offset
      limit
      nodes {
        id
        ...ExpensesListFieldsFragment
      }
    }
    # limit: 1 as current best practice to avoid the API fetching entries it doesn't need
    # TODO: We don't need to try and fetch this field on non-host accounts (should use a ... on Host)
    scheduledExpenses: expenses(
      host: { slug: $collectiveSlug }
      status: SCHEDULED_FOR_PAYMENT
      payoutMethodType: BANK_ACCOUNT
      limit: 1
    ) {
      totalCount
    }
  }

  ${expensesListFieldsFragment}
  ${collectiveNavbarFieldsFragment}
  ${expenseHostFields}
`;

const addExpensesPageData = graphql(expensesPageQuery, {
  options: props => {
    const amountRange = parseAmountRange(props.query.amount);
    const { from: dateFrom, to: dateTo } = parseDateInterval(props.query.period);
    const orderBy = props.query.orderBy && parseChronologicalOrderInput(props.query.orderBy);
    const showSubmitted = props.query.direction === 'SUBMITTED';
    const fromAccount = showSubmitted ? { slug: props.collectiveSlug } : null;
    const account = !showSubmitted ? { slug: props.collectiveSlug } : null;
    return {
      context: API_V2_CONTEXT,
      variables: {
        collectiveSlug: props.collectiveSlug,
        fromAccount,
        account,
        offset: props.query.offset || 0,
        limit: props.query.limit || EXPENSES_PER_PAGE,
        type: props.query.type,
        status: props.query.status,
        tags: props.query.tag ? (props.query.tag === 'untagged' ? null : [props.query.tag]) : undefined,
        minAmount: amountRange[0] && amountRange[0] * 100,
        maxAmount: amountRange[1] && amountRange[1] * 100,
        payoutMethodType: props.query.payout,
        dateFrom,
        dateTo,
        orderBy,
        searchTerm: props.query.searchTerm,
      },
    };
  },
});

export default injectIntl(addExpensesPageData(withUser(withRouter(ExpensePage))));
