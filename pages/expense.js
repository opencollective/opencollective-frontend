import React from 'react';
import PropTypes from 'prop-types';
import { graphql, withApollo } from '@apollo/client/react/hoc';
import { cloneDeep, debounce, get, includes, sortBy, uniqBy, update } from 'lodash';
import memoizeOne from 'memoize-one';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { getCollectiveTypeForUrl } from '../lib/collective.lib';
import { CollectiveType } from '../lib/constants/collectives';
import expenseTypes from '../lib/constants/expenseTypes';
import { formatErrorMessage, generateNotFoundError, getErrorFromGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import { Router } from '../server/pages';

import { Sections } from '../components/collective-page/_constants';
import CollectiveNavbar from '../components/CollectiveNavbar';
import Container from '../components/Container';
import CommentForm from '../components/conversations/CommentForm';
import Thread from '../components/conversations/Thread';
import ErrorPage from '../components/ErrorPage';
import ExpenseAdminActions from '../components/expenses/ExpenseAdminActions';
import ExpenseAttachedFiles from '../components/expenses/ExpenseAttachedFiles';
import ExpenseForm, { prepareExpenseForSubmit } from '../components/expenses/ExpenseForm';
import ExpenseInfoSidebar from '../components/expenses/ExpenseInfoSidebar';
import ExpenseNotesForm from '../components/expenses/ExpenseNotesForm';
import ExpenseSummary from '../components/expenses/ExpenseSummary';
import {
  expensePageExpenseFieldsFragment,
  loggedInAccountExpensePayoutFieldsFragment,
} from '../components/expenses/graphql/fragments';
import MobileCollectiveInfoStickyBar from '../components/expenses/MobileCollectiveInfoStickyBar';
import PrivateCommentsMessage from '../components/expenses/PrivateCommentsMessage';
import { Box, Flex } from '../components/Grid';
import HTMLContent from '../components/HTMLContent';
import I18nFormatters, { getI18nLink, I18nSupportLink } from '../components/I18nFormatters';
import CommentIcon from '../components/icons/CommentIcon';
import PrivateInfoIcon from '../components/icons/PrivateInfoIcon';
import MessageBox from '../components/MessageBox';
import Page from '../components/Page';
import StyledButton from '../components/StyledButton';
import TemporaryNotification from '../components/TemporaryNotification';
import { H1, H5, Span } from '../components/Text';
import { withUser } from '../components/UserProvider';

const messages = defineMessages({
  title: {
    id: 'ExpensePage.title',
    defaultMessage: '{title} · Expense #{id}',
  },
});

const expensePageQuery = gqlV2/* GraphQL */ `
  query ExpensePage($legacyExpenseId: Int!) {
    expense(expense: { legacyId: $legacyExpenseId }) {
      ...ExpensePageExpenseFields
    }

    loggedInAccount {
      ...LoggedInAccountExpensePayoutFields
    }
  }

  ${loggedInAccountExpensePayoutFieldsFragment}
  ${expensePageExpenseFieldsFragment}
`;

const editExpenseMutation = gqlV2/* GraphQL */ `
  mutation EditExpense($expense: ExpenseUpdateInput!) {
    editExpense(expense: $expense) {
      ...ExpensePageExpenseFields
    }
  }

  ${expensePageExpenseFieldsFragment}
`;

const PrivateNoteLabel = () => {
  return (
    <Span fontSize="12px" color="black.700" fontWeight="bold">
      <FormattedMessage id="Expense.PrivateNote" defaultMessage="Private note" />
      &nbsp;&nbsp;
      <PrivateInfoIcon color="#969BA3" />
    </Span>
  );
};

const PAGE_STATUS = { VIEW: 1, EDIT: 2, EDIT_SUMMARY: 3 };
const SIDE_MARGIN_WIDTH = 'calc((100% - 1200px) / 2)';

const { USER, ORGANIZATION } = CollectiveType;

class ExpensePage extends React.Component {
  static getInitialProps({ query: { parentCollectiveSlug, collectiveSlug, ExpenseId, createSuccess } }) {
    return {
      parentCollectiveSlug,
      collectiveSlug,
      legacyExpenseId: parseInt(ExpenseId),
      createSuccess: Boolean(createSuccess),
    };
  }

  static propTypes = {
    collectiveSlug: PropTypes.string,
    parentCollectiveSlug: PropTypes.string,
    legacyExpenseId: PropTypes.number,
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
    createSuccess: PropTypes.bool,
    expenseCreated: PropTypes.string, // actually a stringed boolean 'true'
    /** @ignore from withApollo */
    client: PropTypes.object.isRequired,
    /** from withData */
    data: PropTypes.object.isRequired,
    /** from addEditExpenseMutation */
    editExpense: PropTypes.func.isRequired,
    /** from injectIntl */
    intl: PropTypes.object,
    expensesTags: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        tag: PropTypes.string,
      }),
    ),
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
      successMessageDismissed: false,
    };

    this.pollingInterval = 60;
    this.pollingTimeout = null;
    this.pollingStarted = false;
    this.pollingPaused = false;
    this.handlePolling = debounce(this.handlePolling.bind(this), 100);
  }

  componentDidMount() {
    this.handlePolling();
    document.addEventListener('mousemove', this.handlePolling);
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

  componentWillUnmount() {
    if (this.props.data?.stopPolling) {
      this.props.data.stopPolling();
    }

    document.removeEventListener('mousemove', this.handlePolling);
  }

  handlePolling() {
    if (!this.pollingStarted) {
      if (this.pollingPaused) {
        // The polling was paused, so we immediately refetch
        if (this.props.data?.refetch) {
          this.props.data.refetch();
        }
        this.pollingPaused = false;
      }
      if (this.props.data?.startPolling(this.pollingInterval * 1000)) {
        this.props.data.stopPolling();
      }
      this.pollingStarted = true;
    }

    clearTimeout(this.pollingTimeout);
    this.pollingTimeout = setTimeout(() => {
      // No mouse movement was detected since 60sec, we stop polling
      if (this.props.data?.stopPolling) {
        this.props.data.stopPolling();
      }
      this.pollingStarted = false;
      this.pollingPaused = true;
    }, this.pollingInterval * 1000);
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
      await this.props.editExpense({ variables: { expense: prepareExpenseForSubmit(editedExpense) } });
      this.setState({ status: PAGE_STATUS.VIEW, isSubmitting: false, editedExpense: undefined, error: null });
    } catch (e) {
      this.setState({ error: getErrorFromGraphqlException(e), isSubmitting: false });
      this.scrollToExpenseTop();
    }
  };

  onNotesChanges = e => {
    const name = e.target.name;
    const value = e.target.value;
    this.setState(state => ({ editedExpense: { ...state.editedExpense, [name]: value } }));
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

  getSuggestedTags(collective) {
    const tagsStats = (collective && collective.expensesTags) || null;
    return tagsStats && tagsStats.map(({ tag }) => tag);
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
      const accountsAdminOf = get(loggedInAccount, 'adminMemberships.nodes', [])
        .map(member => member.account)
        .filter(
          account =>
            [USER, ORGANIZATION].includes(account.type) ||
            // Same Host
            (account.isActive && this.props.data?.account?.host?.id === account.host?.id),
        );
      return [loggedInAccount, ...accountsAdminOf];
    }
  });

  getThreadItems = memoizeOne((comments, activities) => {
    return sortBy([...(comments || []), ...activities], 'createdAt');
  });

  onSuccessMsgDismiss = () => {
    // Replaces the route by the version without `createSuccess=true`
    const { parentCollectiveSlug, collectiveSlug, legacyExpenseId, data } = this.props;
    this.setState({ successMessageDismissed: true });
    return Router.replaceRoute(
      `expense-v2`,
      {
        parentCollectiveSlug,
        collectiveSlug,
        collectiveType: parentCollectiveSlug ? getCollectiveTypeForUrl(data?.expense?.account) : undefined,
        ExpenseId: legacyExpenseId,
      },
      {
        shallow: true, // Do not re-fetch data, do not loose state
      },
    );
  };

  onEditBtnClick = async () => {
    if (this.props.createSuccess) {
      this.onSuccessMsgDismiss();
    }

    return this.setState(() => ({ status: PAGE_STATUS.EDIT, editedExpense: this.props.data.expense }));
  };

  onDelete = async expense => {
    const collective = expense.account;
    return Router.replaceRoute('expenses', {
      parentCollectiveSlug: collective.parent?.slug,
      collectiveType: collective.parent ? getCollectiveTypeForUrl(collective) : undefined,
      collectiveSlug: collective.slug,
    });
  };

  render() {
    const { collectiveSlug, data, loadingLoggedInUser, createSuccess, intl } = this.props;
    const { isRefetchingDataForUser, error, status, editedExpense, successMessageDismissed } = this.state;

    if (!data.loading) {
      if (!data || data.error) {
        return <ErrorPage data={data} />;
      } else if (!data.expense) {
        return <ErrorPage error={generateNotFoundError(null)} log={false} />;
      } else if (!data.expense.account || this.props.collectiveSlug !== data.expense.account.slug) {
        return <ErrorPage error={generateNotFoundError(collectiveSlug)} log={false} />;
      }
    }

    const expense = data.expense;
    const loggedInAccount = data.loggedInAccount;
    const collective = expense?.account;
    const host = collective?.host;
    const canSeeInvoiceInfo = expense?.permissions.canSeeInvoiceInfo;
    const isInvoice = expense?.type === expenseTypes.INVOICE;
    const hasAttachedFiles = (isInvoice && canSeeInvoiceInfo) || expense?.attachedFiles?.length > 0;
    const showTaxFormMsg = includes(expense?.requiredLegalDocuments, 'US_TAX_FORM');
    const hasHeaderMsg = error || showTaxFormMsg;

    const payoutProfiles = this.getPayoutProfiles(loggedInAccount);

    return (
      <Page collective={collective} {...this.getPageMetaData(expense)} withoutGlobalStyles>
        {createSuccess && !successMessageDismissed && (
          <TemporaryNotification onDismiss={this.onSuccessMsgDismiss}>
            <FormattedMessage
              id="expense.createSuccess"
              defaultMessage="<strong>Expense submitted!</strong> You can edit or review updates on this page."
              values={I18nFormatters}
            />
          </TemporaryNotification>
        )}
        <CollectiveNavbar
          collective={collective}
          isLoading={!collective}
          selected={Sections.BUDGET}
          callsToAction={{ hasSubmitExpense: status === PAGE_STATUS.VIEW }}
        />
        <Flex flexWrap="wrap" my={[4, 5]} data-cy="expense-page-content">
          <Container
            display={['none', null, null, 'flex']}
            justifyContent="flex-end"
            width={SIDE_MARGIN_WIDTH}
            minWidth={90}
            pt={hasHeaderMsg ? 240 : 80}
          >
            <Flex flexDirection="column" alignItems="center" width={90}>
              {status === PAGE_STATUS.VIEW && (
                <ExpenseAdminActions
                  expense={expense}
                  collective={collective}
                  permissions={expense?.permissions}
                  onError={error => this.setState({ error })}
                  onEdit={this.onEditBtnClick}
                  onDelete={this.onDelete}
                />
              )}
            </Flex>
          </Container>
          <Box flex="1 1 650px" minWidth={300} maxWidth={792} mr={[null, 2, 3, 4, 5]} px={2} ref={this.expenseTopRef}>
            <H1 fontSize="24px" lineHeight="32px" mb={24} py={2}>
              <FormattedMessage id="Summary" defaultMessage="Summary" />
            </H1>
            {error && (
              <MessageBox type="error" withIcon mb={4}>
                {formatErrorMessage(intl, error)}
              </MessageBox>
            )}
            {showTaxFormMsg && (
              <MessageBox type="warning" withIcon={true} mb={4}>
                <FormattedMessage
                  id="expenseNeedsTaxFormMessage.msg"
                  defaultMessage="We need your tax information before we can pay you. You will receive an email from HelloWorks saying Open Collective is requesting you fill out a form. This is required by the IRS (US tax agency) for everyone who invoices $600 or more per year. We also require one for grant recipients for our records. If you have not received the email within 24 hours, or you have any questions, please contact <I18nSupportLink></I18nSupportLink>. For more info, see our <Link>help docs about taxes</Link>."
                  values={{
                    I18nSupportLink,
                    Link: getI18nLink({
                      href: 'https://docs.opencollective.com/help/expenses-and-getting-paid/tax-information',
                      openInNewTab: true,
                    }),
                  }}
                />
              </MessageBox>
            )}
            {status !== PAGE_STATUS.EDIT && (
              <Box mb={3}>
                <ExpenseSummary
                  expense={status === PAGE_STATUS.EDIT_SUMMARY ? editedExpense : expense}
                  host={host}
                  isLoading={!expense}
                  isLoadingLoggedInUser={loadingLoggedInUser || isRefetchingDataForUser}
                  permissions={expense?.permissions}
                  collective={collective}
                  showProcessActions={status !== PAGE_STATUS.EDIT_SUMMARY}
                />
                {status !== PAGE_STATUS.EDIT_SUMMARY && (
                  <React.Fragment>
                    {hasAttachedFiles && (
                      <Container mt={4} pb={4} borderBottom="1px solid #DCDEE0">
                        <H5 fontSize="16px" mb={3}>
                          <FormattedMessage id="Expense.Downloads" defaultMessage="Downloads" />
                        </H5>
                        <ExpenseAttachedFiles
                          files={expense.attachedFiles}
                          collective={collective}
                          expense={expense}
                          showInvoice={canSeeInvoiceInfo}
                        />
                      </Container>
                    )}
                    {expense?.privateMessage && (
                      <Container mt={4} pb={4} borderBottom="1px solid #DCDEE0">
                        <H5 fontSize="16px" mb={3}>
                          <FormattedMessage id="expense.notes" defaultMessage="Notes" />
                        </H5>
                        <PrivateNoteLabel mb={2} />
                        <HTMLContent color="black.700" mt={1} fontSize="13px" content={expense.privateMessage} />
                      </Container>
                    )}
                  </React.Fragment>
                )}
                {status === PAGE_STATUS.EDIT_SUMMARY && (
                  <Box mt={24}>
                    <ExpenseNotesForm onChange={this.onNotesChanges} defaultValue={expense.privateMessage} />
                    <Flex flexWrap="wrap" mt={4}>
                      <StyledButton
                        mt={2}
                        minWidth={175}
                        width={['100%', 'auto']}
                        mx={[2, 0]}
                        mr={[null, 3]}
                        whiteSpace="nowrap"
                        data-cy="edit-expense-btn"
                        onClick={() => this.setState({ status: PAGE_STATUS.EDIT })}
                        disabled={this.state.isSubmitting}
                      >
                        ← <FormattedMessage id="Expense.edit" defaultMessage="Edit expense" />
                      </StyledButton>
                      <StyledButton
                        buttonStyle="primary"
                        mt={2}
                        minWidth={175}
                        width={['100%', 'auto']}
                        mx={[2, 0]}
                        mr={[null, 3]}
                        whiteSpace="nowrap"
                        data-cy="save-expense-btn"
                        onClick={this.onSummarySubmit}
                        loading={this.state.isSubmitting}
                      >
                        <FormattedMessage id="Expense.SaveChanges" defaultMessage="Save changes" />
                      </StyledButton>
                    </Flex>
                  </Box>
                )}
              </Box>
            )}
            {status === PAGE_STATUS.EDIT && (
              <Box mb={3}>
                <ExpenseForm
                  collective={collective}
                  loading={loadingLoggedInUser}
                  expense={editedExpense}
                  expensesTags={this.getSuggestedTags(collective)}
                  payoutProfiles={payoutProfiles}
                  onCancel={() => this.setState({ status: PAGE_STATUS.VIEW, editedExpense: null })}
                  validateOnChange
                  disableSubmitIfUntouched
                  onSubmit={editedExpense =>
                    this.setState({
                      editedExpense,
                      status: PAGE_STATUS.EDIT_SUMMARY,
                    })
                  }
                />
              </Box>
            )}
            <Box my={4}>
              <PrivateCommentsMessage
                isAllowed={expense?.permissions.canComment}
                isLoading={loadingLoggedInUser || isRefetchingDataForUser}
              />
            </Box>
            {expense && (
              <Box mb={3} pt={3}>
                <Thread
                  collective={collective}
                  items={this.getThreadItems(expense.comments?.nodes, expense.activities)}
                  onCommentDeleted={this.onCommentDeleted}
                />
              </Box>
            )}
            {expense?.permissions.canComment && (
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
            )}
          </Box>
          <Flex flex="1 1" justifyContent={['center', null, 'flex-start', 'flex-end']} pt={80}>
            <Box minWidth={270} width={['100%', null, null, 275]} px={2}>
              <ExpenseInfoSidebar isLoading={data.loading} collective={collective} host={host} />
            </Box>
          </Flex>
          <Box width={SIDE_MARGIN_WIDTH} />
        </Flex>
        <MobileCollectiveInfoStickyBar isLoading={data.loading} collective={collective} host={host} />
      </Page>
    );
  }
}

const addExpensePageData = graphql(expensePageQuery, {
  options: { context: API_V2_CONTEXT },
});

const addEditExpenseMutation = graphql(editExpenseMutation, {
  name: 'editExpense',
  options: { context: API_V2_CONTEXT },
});

export default injectIntl(addExpensePageData(withApollo(withUser(addEditExpenseMutation(ExpensePage)))));
