import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';
import { has, pick } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import hasFeature, { FEATURES } from '../lib/allowed-features';
import expenseTypes from '../lib/constants/expenseTypes';
import { generateNotFoundError } from '../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import CollectiveNavbar from '../components/CollectiveNavbar';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import ExpensesList from '../components/expenses/ExpensesList';
import ExpenseTags from '../components/expenses/ExpenseTags';
import ExpenseTypeTag from '../components/expenses/ExpenseTypeTag';
import { Box, Flex } from '../components/Grid';
import Link from '../components/Link';
import MessageBox from '../components/MessageBox';
import Page from '../components/Page';
import PageFeatureNotSupported from '../components/PageFeatureNotSupported';
import Pagination from '../components/Pagination';
import { H1, H5 } from '../components/Text';

import ExpenseInfoSidebar from './ExpenseInfoSidebar';

const messages = defineMessages({
  title: {
    id: 'ExpensesPage.title',
    defaultMessage: '{collectiveName} · Expenses',
  },
});

const EXPENSES_PER_PAGE = 10;

class ExpensePage extends React.Component {
  static getInitialProps({ query }) {
    const { parentAccountSlug, accountSlug, offset, limit, type, tag } = query;
    return {
      parentAccountSlug,
      accountSlug,
      offset: parseInt(offset) || undefined,
      limit: parseInt(limit) || undefined,
      type,
      tag,
    };
  }

  static propTypes = {
    accountSlug: PropTypes.string,
    parentAccountSlug: PropTypes.string,
    type: PropTypes.string,
    tag: PropTypes.string,
    /** from injectIntl */
    intl: PropTypes.object,
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      variables: PropTypes.shape({
        offset: PropTypes.number.isRequired,
        limit: PropTypes.number.isRequired,
      }),
      account: PropTypes.shape({
        id: PropTypes.string.isRequired,
      }),
      expenses: PropTypes.shape({
        nodes: PropTypes.array,
        totalCount: PropTypes.number,
        offset: PropTypes.number,
        limit: PropTypes.number,
      }),
    }),
  };

  getPageMetaData(collective) {
    if (collective) {
      return { title: this.props.intl.formatMessage(messages.title, { collectiveName: collective.name }) };
    } else {
      return { title: `Expenses` };
    }
  }

  buildFilterLinkParams(params) {
    return {
      ...pick(this.props, ['accountSlug', 'limit', 'parentAccountSlug', 'tag', 'type']),
      ...params,
    };
  }

  getTagProps = tag => {
    if (tag === this.props.tag) {
      return { type: 'info', closeButtonProps: true };
    }
  };

  renderExpenseTypeFilterTag(type) {
    const isSelected = this.props.type === type;
    const params = this.buildFilterLinkParams({ type: isSelected ? null : type });
    return (
      <Link route="expenses-v2" params={params}>
        <ExpenseTypeTag background="#4E5052" type={type} closeButtonProps={isSelected} />
      </Link>
    );
  }

  render() {
    const { accountSlug, data } = this.props;

    if (!data.loading) {
      if (!data || data.error) {
        return <ErrorPage data={data} />;
      } else if (!data.account || !data.expenses?.nodes) {
        return <ErrorPage error={generateNotFoundError(accountSlug, true)} log={false} />;
      } else if (!hasFeature(data.account, FEATURES.RECEIVE_EXPENSES)) {
        return <PageFeatureNotSupported />;
      }
    }

    const hasFilters = this.props.tag || this.props.type;
    return (
      <Page collective={data.account} {...this.getPageMetaData(data.account)} withoutGlobalStyles>
        <CollectiveNavbar collective={data.account} isLoading={!data.account} />
        <Container position="relative" minHeight={[null, 800]}>
          <Box maxWidth={1242} m="0 auto" px={[2, 3, 4]} py={[4, 5]}>
            <Flex justifyContent="space-between" flexWrap="wrap">
              <Box flex="1 1 500px" minWidth={300} maxWidth={750} mr={[0, 3, 5]} mb={5}>
                <H1 fontSize="H4" lineHeight="H4" mb={24} py={2}>
                  <FormattedMessage id="section.expenses.title" defaultMessage="Expenses" />
                </H1>
                {!data.loading && !data.expenses?.nodes.length ? (
                  <MessageBox type="info" withIcon>
                    {hasFilters ? (
                      <FormattedMessage
                        id="ExpensesList.Empty"
                        defaultMessage="No expense matches the given filters, <ResetLink>reset them</ResetLink> to see all expenses."
                        values={{
                          ResetLink: text => (
                            <Link route="expenses-v2" params={this.buildFilterLinkParams({ tag: null, type: null })}>
                              {text}
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
                      isLoading={data.loading}
                      collective={data.account}
                      expenses={data.expenses?.nodes}
                      nbPlaceholders={data.variables.limit}
                    />
                    <Flex mt={5} justifyContent="center">
                      <Pagination
                        route="expenses-v2"
                        total={data.expenses?.totalCount}
                        limit={data.variables.limit}
                        offset={data.variables.offset}
                        scrollToTopOnChange
                      />
                    </Flex>
                  </React.Fragment>
                )}
              </Box>
              <Box minWidth={270} width={['100%', null, null, 275]} mt={70}>
                <ExpenseInfoSidebar
                  isLoading={data.loading}
                  collective={data.account}
                  host={data.account?.host}
                  tags={data.account?.expensesTags.map(({ tag }) => tag)}
                  showExpenseTypeFilters
                >
                  <H5 mb={3}>
                    <FormattedMessage id="Tags" defaultMessage="Tags" />
                  </H5>
                  <Flex flexWrap="wrap" mb={2}>
                    {this.renderExpenseTypeFilterTag(expenseTypes.RECEIPT)}
                    {this.renderExpenseTypeFilterTag(expenseTypes.INVOICE)}
                  </Flex>
                  <ExpenseTags
                    isLoading={data.loading}
                    expense={{ tags: data.account?.expensesTags.map(({ tag }) => tag) }}
                    limit={30}
                    getTagProps={this.getTagProps}
                  >
                    {({ key, tag, renderedTag, props }) => (
                      <Link
                        key={key}
                        route="expenses-v2"
                        params={this.buildFilterLinkParams({ tag: props.closeButtonProps ? null : tag })}
                      >
                        {renderedTag}
                      </Link>
                    )}
                  </ExpenseTags>
                </ExpenseInfoSidebar>
              </Box>
            </Flex>
          </Box>
        </Container>
      </Page>
    );
  }
}

const EXPENSES_PAGE_QUERY = gqlV2`
  query ExpensesPageQuery($accountSlug: String!, $limit: Int!, $offset: Int!, $type: ExpenseType, $tags: [String]) {
    account(slug: $accountSlug) {
      id
      slug
      type
      imageUrl
      name
      currency
      expensesTags {
        id
        tag
      }
      ... on Event {
        balance
        parentCollective {
          id
          name
          slug
          type
        }
        host {
          id
          name
          slug
          type
        }
      }
      ... on Collective {
        balance
        host {
          id
          name
          slug
          type
        }
      }
    }
    expenses(account: {slug: $accountSlug}, limit: $limit, offset: $offset, type: $type, tags: $tags) {
      totalCount
      offset
      limit
      nodes {
        id
        legacyId
        description
        status
        createdAt
        tags
        amount
        currency
        type
        payee {
          id
          type
          slug
          imageUrl(height: 80)
        }
        createdByAccount {
          id
          type
          slug
        }
      }
    }
  }
`;

const getData = graphql(EXPENSES_PAGE_QUERY, {
  options: props => ({
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-and-network',
    variables: {
      accountSlug: props.accountSlug,
      offset: props.offset || 0,
      limit: props.limit || EXPENSES_PER_PAGE,
      type: has(expenseTypes, props.type) ? props.type : undefined,
      tags: props.tag ? [props.tag] : undefined,
    },
  }),
});

export default injectIntl(getData(ExpensePage));
