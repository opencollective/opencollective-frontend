import { Box, Flex } from '@rebass/grid';
import { cloneDeep, uniqBy, update } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { graphql, withApollo } from 'react-apollo';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { Sections } from '../components/collective-page/_constants';
import CollectiveNavbar from '../components/CollectiveNavbar';
import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import CommentForm from '../components/conversations/CommentForm';
import { CommentFieldsFragment } from '../components/conversations/graphql';
import Thread from '../components/conversations/Thread';
import ErrorPage from '../components/ErrorPage';
import ExpenseAdminActions from '../components/expenses/ExpenseAdminActions';
import ExpenseSummary from '../components/expenses/ExpenseSummary';
import CommentIcon from '../components/icons/CommentIcon';
import Link from '../components/Link';
import Page from '../components/Page';
import PageFeatureNotSupported from '../components/PageFeatureNotSupported';
import StyledLink from '../components/StyledLink';
import hasFeature, { FEATURES } from '../lib/allowed-features';
import { generateNotFoundError, formatErrorMessage } from '../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import { ssrNotFoundError } from '../lib/nextjs_utils';
import ExpandableExpensePolicies from '../components/expenses/ExpandableExpensePolicies';
import CreateExpenseFAQ from '../components/faqs/CreateExpenseFAQ';
import Container from '../components/Container';
import { withUser } from '../components/UserProvider';
import { H5, Span, P } from '../components/Text';
import PrivateInfoIcon from '../components/icons/PrivateInfoIcon';
import StyledHr from '../components/StyledHr';
import MessageBox from '../components/MessageBox';

const messages = defineMessages({
  title: {
    id: 'ExpensePage.title',
    defaultMessage: '{title} · Expense #{id}',
  },
});

const expensePageQuery = gqlV2`
query CreateExpensePage($legacyExpenseId: Int!) {
  expense(expense: {legacyId: $legacyExpenseId}) {
    id
    legacyId
    description
    currency
    type
    status
    privateMessage
    attachments {
      id
      incurredAt
      description
      amount
      url
    }
    payee {
      id
      slug
      name
      type
      location {
        address
        country
      }
    }
    createdByAccount {
      id
      slug
      name
      type
      imageUrl
    }
    account {
      id
      slug
      name
      type
      imageUrl
      description
      settings
      twitterHandle
      currency
      expensePolicy
      ... on Collective {
        id
        isApproved
        balance
        host {
          id
          name
          slug
          type
          expensePolicy
          location {
            address
            country
          }
        }
      }
      ... on Event {
        id
        isApproved
        balance
        host {
          id
          name
          slug
          type
          expensePolicy
          location {
            address
            country
          }
        }
      }
    }
    payoutMethod {
      id
      type
      data
    }
    comments {
      nodes {
        ...CommentFields
      }
    }
    permissions {
      canEdit
      canDelete
      canSeeInvoiceInfo
    }
  }
}

${CommentFieldsFragment}
`;

const PrivateNoteLabel = () => {
  return (
    <Span fontSize="Caption" color="black.700" fontWeight="500">
      <FormattedMessage id="Expense.PrivateNote" defaultMessage="Private note" />
      &nbsp;&nbsp;
      <PrivateInfoIcon color="#969BA3" />
    </Span>
  );
};

class ExpensePage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, ExpenseId } }) {
    return { collectiveSlug, legacyExpenseId: parseInt(ExpenseId) };
  }

  static propTypes = {
    collectiveSlug: PropTypes.string,
    legacyExpenseId: PropTypes.number,
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
    expenseCreated: PropTypes.string, // actually a stringed boolean 'true'
    /** @ignore from withApollo */
    client: PropTypes.object.isRequired,
    /** from withData */
    data: PropTypes.object.isRequired,
    /** from injectIntl */
    intl: PropTypes.object,
  };

  state = { isRefetchingDataForUser: false, error: null };

  componentDidMount() {
    // LoggedInUser is not set during SSR, we refetch for permissions
    if (this.props.LoggedInUser) {
      this.refetchDataForUser();
    }
  }

  componentDidUpdate(oldProps) {
    // Refetch data when users are logged in to make sure they can see the private info
    if (!oldProps.LoggedInUser && this.props.LoggedInUser) {
      this.refetchDataForUser();
    }
  }

  async refetchDataForUser() {
    try {
      this.setState({ isRefetchingDataForUser: true });
      await this.props.data.refetch();
    } finally {
      this.setState({ isRefetchingDataForUser: false });
    }
  }

  getPageMetaData(expense) {
    const { intl, legacyExpenseId } = this.props;
    if (expense?.description) {
      return { title: intl.formatMessage(messages.title, { id: legacyExpenseId, title: expense.description }) };
    }
  }

  clonePageQueryCacheData() {
    const { client, legacyExpenseId, collectiveSlug } = this.props;
    const query = expensePageQuery;
    const variables = { collectiveSlug, legacyExpenseId };
    const data = cloneDeep(client.readQuery({ query, variables }));
    return [data, query, variables];
  }

  onCommentAdded = comment => {
    // Add comment to cache if not already fetched
    const [data, query, variables] = this.clonePageQueryCacheData();
    update(data, 'expense.comments.nodes', comments => uniqBy([...comments, comment], 'id'));
    this.props.client.writeQuery({ query, variables, data });
  };

  onCommentDeleted = comment => {
    const [data, query, variables] = this.clonePageQueryCacheData();
    update(data, 'expense.comments.nodes', comments => comments.filter(c => c.id !== comment.id));
    this.props.client.writeQuery({ query, variables, data });
  };

  render() {
    const { collectiveSlug, data, loadingLoggedInUser, intl } = this.props;
    const { isRefetchingDataForUser, error } = this.state;

    if (!data.loading) {
      if (!data || data.error) {
        return <ErrorPage data={data} />;
      } else if (!data.expense) {
        ssrNotFoundError(); // Force 404 when rendered server side
        return null; // TODO: page for expense not found
      } else if (!data.expense.account) {
        return <ErrorPage error={generateNotFoundError(collectiveSlug, true)} log={false} />;
      } else if (this.props.collectiveSlug !== data.expense.account.slug) {
        // TODO Error: Not on the righ URL
        return null;
      } else if (!hasFeature(data.expense.account, FEATURES.NEW_EXPENSE_FLOW)) {
        return <PageFeatureNotSupported />;
      }
    }

    const expense = data.expense;
    const collective = expense?.account;
    const host = collective?.host;
    return (
      <Page collective={collective} {...this.getPageMetaData(expense)} withoutGlobalStyles>
        <CollectiveThemeProvider collective={collective}>
          <CollectiveNavbar collective={collective} isLoading={!collective} selected={Sections.BUDGET} />
          <Flex flexWrap="wrap" my={[4, null, 5]} data-cy="expense-page-content">
            <Container
              display={['none', null, null, 'flex']}
              justifyContent="flex-end"
              width="calc((100% - 1260px) / 2)"
              minWidth={90}
              pt={55}
            >
              <Flex flexDirection="column" alignItems="center" width={90}>
                <ExpenseAdminActions
                  expense={expense}
                  collective={collective}
                  permissions={expense?.permissions}
                  onError={error => this.setState({ error })}
                />
              </Flex>
            </Container>
            <Box flex="1 1 650px" minWidth={300} maxWidth={816} mr={[null, 3, 4, 5]} py={3} px={3}>
              <Box mb={4}>
                <StyledLink as={Link} color="black.600" route="expenses" params={{ collectiveSlug }}>
                  &larr;&nbsp;
                  <FormattedMessage id="Back" defaultMessage="Back" />
                </StyledLink>
              </Box>
              {error && (
                <MessageBox type="error" withIcon mb={4}>
                  {formatErrorMessage(intl, error)}
                </MessageBox>
              )}
              <Box mb={3}>
                <ExpenseSummary
                  expense={expense}
                  host={host}
                  isLoading={!expense}
                  isLoadingLoggedInUser={loadingLoggedInUser || isRefetchingDataForUser}
                />
                {expense?.privateMessage && (
                  <Box>
                    <H5 fontSize="LeadParagraph" mb={2}>
                      <FormattedMessage id="expense.notes" defaultMessage="Notes" />
                    </H5>
                    <PrivateNoteLabel />
                    <P color="black.700" mt={1} fontSize="LeadCaption">
                      {expense.privateMessage}
                    </P>
                    <StyledHr borderColor="#DCDEE0" mt={4} />
                  </Box>
                )}
              </Box>
              {expense && (
                <Box mb={3} pt={3}>
                  <Thread
                    collective={collective}
                    items={expense.comments.nodes}
                    onCommentDeleted={this.onCommentDeleted}
                  />
                </Box>
              )}
              <Flex mt="40px">
                <Box display={['none', null, 'block']} flex="0 0" p={3}>
                  <CommentIcon size={24} color="lightgrey" />
                </Box>
                <Box flex="1 1" maxWidth={[null, null, 'calc(100% - 56px)']}>
                  <CommentForm
                    id="new-comment-on-expense"
                    ExpenseId={expense && expense.id}
                    disabled={!expense}
                    onSuccess={this.onCommentAdded}
                  />
                </Box>
              </Flex>
            </Box>
            <Flex flex="1 1" justifyContent={['center', null, 'flex-start', 'flex-end']} pt={[1, 2, 5]}>
              <Box minWidth={300} width={['100%', null, null, 300]} px={3}>
                <ExpandableExpensePolicies host={host} collective={collective} mt={50} />
                <Box mt={50}>
                  <CreateExpenseFAQ
                    withBorderLeft
                    withNewButtons
                    titleProps={{ fontSize: 'H5', fontWeight: 500, mb: 3 }}
                  />
                </Box>
              </Box>
            </Flex>
            <Box width="calc((100% - 1260px) / 2)" />
          </Flex>
        </CollectiveThemeProvider>
      </Page>
    );
  }
}

const getData = graphql(expensePageQuery, {
  options: {
    context: API_V2_CONTEXT,
    pollInterval: 60000, // Will refresh the data every 60s to get new comments
  },
});

export default injectIntl(getData(withApollo(withUser(ExpensePage))));
