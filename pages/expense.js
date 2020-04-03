import { Box, Flex } from '@rebass/grid';
import { cloneDeep, uniqBy, update, get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { graphql, withApollo } from '@apollo/react-hoc';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import memoizeOne from 'memoize-one';

import { Sections } from '../components/collective-page/_constants';
import CollectiveNavbar from '../components/CollectiveNavbar';
import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import CommentForm from '../components/conversations/CommentForm';
import Thread from '../components/conversations/Thread';
import ErrorPage from '../components/ErrorPage';
import ExpenseAdminActions from '../components/expenses/ExpenseAdminActions';
import ExpenseSummary from '../components/expenses/ExpenseSummary';
import CommentIcon from '../components/icons/CommentIcon';
import Link from '../components/Link';
import Page from '../components/Page';
import StyledLink from '../components/StyledLink';
import { generateNotFoundError, formatErrorMessage, getErrorFromGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import { ssrNotFoundError } from '../lib/nextjs_utils';
import Container from '../components/Container';
import { withUser } from '../components/UserProvider';
import { H5, Span, P } from '../components/Text';
import PrivateInfoIcon from '../components/icons/PrivateInfoIcon';
import StyledHr from '../components/StyledHr';
import MessageBox from '../components/MessageBox';
import ExpenseForm, { prepareExpenseForSubmit } from '../components/expenses/ExpenseForm';
import ExpenseNotesForm from '../components/expenses/ExpenseNotesForm';
import StyledButton from '../components/StyledButton';
import ExpenseInfoSidebar from './ExpenseInfoSidebar';
import MobileCollectiveInfoStickyBar from '../components/expenses/MobileCollectiveInfoStickyBar';
import {
  loggedInAccountExpensePayoutFieldsFragment,
  expensePageExpenseFieldsFragment,
} from '../components/expenses/graphql/fragments';

const messages = defineMessages({
  title: {
    id: 'ExpensePage.title',
    defaultMessage: '{title} · Expense #{id}',
  },
});

const expensePageQuery = gqlV2`
  query CreateExpensePage($legacyExpenseId: Int!) {
    expense(expense: {legacyId: $legacyExpenseId}) {
      ...expensePageExpenseFieldsFragment
    }

    loggedInAccount {
      ...loggedInAccountExpensePayoutFieldsFragment
    }
  }

  ${loggedInAccountExpensePayoutFieldsFragment}
  ${expensePageExpenseFieldsFragment}
`;

const editExpenseMutation = gqlV2`
  mutation editExpense($expense: ExpenseUpdateInput!) {
    editExpense(expense: $expense) {
      ...expensePageExpenseFieldsFragment
    }
  }

  ${expensePageExpenseFieldsFragment}
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

const PAGE_STATUS = { VIEW: 1, EDIT: 2, EDIT_SUMMARY: 3 };
const SIDE_MARGIN_WIDTH = 'calc((100% - 1200px) / 2)';

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
    /** from withData */
    mutate: PropTypes.func.isRequired,
    /** from injectIntl */
    intl: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.expenseTopRef = React.createRef();
    this.state = {
      isRefetchingDataForUser: false,
      error: null,
      status: PAGE_STATUS.VIEW,
      editedExpense: null,
      isSubmitting: false,
    };
  }

  componentDidMount() {
    // LoggedInUser is not set during SSR, we refetch for permissions
    if (this.props.LoggedInUser) {
      this.refetchDataForUser();
    }
  }

  componentDidUpdate(oldProps, oldState) {
    // Refetch data when users are logged in to make sure they can see the private info
    if (!oldProps.LoggedInUser && this.props.LoggedInUser) {
      this.refetchDataForUser();
    }

    // Scroll to expense's top when changing status
    if (oldState.status !== this.state.status) {
      this.scrollToExpenseTop();
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

  onSummarySubmit = async () => {
    try {
      this.setState({ isSubmitting: true, error: null });
      const { editedExpense } = this.state;
      await this.props.mutate({ variables: { expense: prepareExpenseForSubmit(editedExpense) } });
      this.setState({ status: PAGE_STATUS.VIEW, isSubmitting: false });
    } catch (e) {
      this.setState({ error: getErrorFromGraphqlException(e), isSubmitting: false });
      this.scrollToExpenseTop();
    }
  };

  onNotesChanges = e => {
    const name = e.target.name;
    const value = e.target.value;
    this.setState(state => ({
      editedExpense: {
        ...state.editedExpense,
        [name]: value,
      },
    }));
  };

  scrollToExpenseTop() {
    if (this.expenseTopRef.current) {
      this.expenseTopRef.current.scrollIntoView({ behavior: 'smooth' });
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

  getPayoutProfiles = memoizeOne(loggedInAccount => {
    if (!loggedInAccount) {
      return [];
    } else {
      const accountsAdminOf = get(loggedInAccount, 'adminMemberships.nodes', []).map(member => member.account);
      return [loggedInAccount, ...accountsAdminOf];
    }
  });

  render() {
    const { collectiveSlug, data, loadingLoggedInUser, intl } = this.props;
    const { isRefetchingDataForUser, error, status, editedExpense } = this.state;

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
      }
    }

    const expense = data.expense;
    const loggedInAccount = data.loggedInAccount;
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
              width={SIDE_MARGIN_WIDTH}
              minWidth={90}
              pt={55}
            >
              <Flex flexDirection="column" alignItems="center" width={90}>
                {status === PAGE_STATUS.VIEW && (
                  <ExpenseAdminActions
                    expense={expense}
                    collective={collective}
                    permissions={expense?.permissions}
                    onError={error => this.setState({ error })}
                  />
                )}
              </Flex>
            </Container>
            <Box
              flex="1 1 650px"
              minWidth={300}
              maxWidth={750}
              mr={[null, 2, 3, 4, 5]}
              py={2}
              px={3}
              ref={this.expenseTopRef}
            >
              {status === PAGE_STATUS.VIEW && (
                <Box mb={4}>
                  <StyledLink as={Link} color="black.600" route="expenses" params={{ collectiveSlug }}>
                    &larr;&nbsp;
                    <FormattedMessage id="Back" defaultMessage="Back" />
                  </StyledLink>
                </Box>
              )}
              {error && (
                <MessageBox type="error" withIcon mb={4}>
                  {formatErrorMessage(intl, error)}
                </MessageBox>
              )}
              {status !== PAGE_STATUS.EDIT && (
                <Box mb={3}>
                  <ExpenseSummary
                    expense={status === PAGE_STATUS.EDIT_SUMMARY ? editedExpense : expense}
                    host={host}
                    isLoading={!expense}
                    isLoadingLoggedInUser={loadingLoggedInUser || isRefetchingDataForUser}
                  />
                  {expense?.privateMessage && status !== PAGE_STATUS.EDIT_SUMMARY && (
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
                  {status === PAGE_STATUS.EDIT_SUMMARY && (
                    <div>
                      <ExpenseNotesForm onChange={this.onNotesChanges} defaultValue={expense.privateMessage} />
                      <StyledButton
                        mt={3}
                        mr={2}
                        minWidth={150}
                        data-cy="edit-expense-btn"
                        onClick={() => this.setState({ status: PAGE_STATUS.EDIT })}
                        disabled={this.state.isSubmitting}
                      >
                        ← <FormattedMessage id="Expense.edit" defaultMessage="Edit expense" />
                      </StyledButton>
                      <StyledButton
                        buttonStyle="primary"
                        mt={3}
                        data-cy="submit-expense-btn"
                        onClick={this.onSummarySubmit}
                        loading={this.state.isSubmitting}
                        minWidth={150}
                      >
                        <FormattedMessage id="Expense.SaveChanges" defaultMessage="Save changes" />
                      </StyledButton>
                    </div>
                  )}
                </Box>
              )}
              {status === PAGE_STATUS.EDIT && (
                <Box mb={3}>
                  <ExpenseForm
                    collective={collective}
                    loading={loadingLoggedInUser}
                    expense={editedExpense}
                    onSubmit={expense => this.setState({ editedExpense: expense, status: PAGE_STATUS.EDIT_SUMMARY })}
                    payoutProfiles={this.getPayoutProfiles(loggedInAccount)}
                    onCancel={() => this.setState({ status: PAGE_STATUS.VIEW, editedExpense: null })}
                    validateOnChange
                    disableSubmitIfUntouched
                  />
                </Box>
              )}
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
                <Box mb={60} display={['none', null, null, 'flex']}>
                  <StyledButton
                    buttonStyle="secondary"
                    buttonSize="small"
                    onClick={() => this.setState({ status: PAGE_STATUS.EDIT, editedExpense: expense })}
                    disabled={status !== PAGE_STATUS.VIEW}
                  >
                    <FormattedMessage id="Edit" defaultMessage="Edit" />
                  </StyledButton>
                </Box>
                <ExpenseInfoSidebar isLoading={data.loading} collective={collective} host={host} />
              </Box>
            </Flex>
            <Box width={SIDE_MARGIN_WIDTH} />
          </Flex>
          <MobileCollectiveInfoStickyBar isLoading={data.loading} collective={collective} host={host} />
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

const withEditExpenseMutation = graphql(editExpenseMutation, {
  options: {
    context: API_V2_CONTEXT,
  },
});

export default injectIntl(getData(withApollo(withUser(withEditExpenseMutation(ExpensePage)))));
