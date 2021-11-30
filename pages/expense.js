/* eslint-disable graphql/template-strings */
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql, withApollo } from '@apollo/client/react/hoc';
import dayjs from 'dayjs';
import { cloneDeep, debounce, get, includes, omit, sortBy, uniqBy, update } from 'lodash';
import memoizeOne from 'memoize-one';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { getCollectiveTypeForUrl, getSuggestedTags } from '../lib/collective.lib';
import { NAVBAR_CATEGORIES } from '../lib/collective-sections';
import { CollectiveType } from '../lib/constants/collectives';
import expenseStatus from '../lib/constants/expense-status';
import expenseTypes from '../lib/constants/expenseTypes';
import { formatErrorMessage, generateNotFoundError, getErrorFromGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import CollectiveNavbar from '../components/collective-navbar';
import { Sections } from '../components/collective-page/_constants';
import Container from '../components/Container';
import CommentForm from '../components/conversations/CommentForm';
import { commentFieldsFragment } from '../components/conversations/graphql';
import Thread from '../components/conversations/Thread';
import ErrorPage from '../components/ErrorPage';
import ExpenseAdminActions from '../components/expenses/ExpenseAdminActions';
import ExpenseAttachedFiles from '../components/expenses/ExpenseAttachedFiles';
import ExpenseForm, { prepareExpenseForSubmit } from '../components/expenses/ExpenseForm';
import ExpenseInfoSidebar from '../components/expenses/ExpenseInfoSidebar';
import ExpenseInviteNotificationBanner from '../components/expenses/ExpenseInviteNotificationBanner';
import ExpenseMissingReceiptNotificationBanner from '../components/expenses/ExpenseMissingReceiptNotificationBanner';
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
import { getI18nLink, I18nSupportLink } from '../components/I18nFormatters';
import CommentIcon from '../components/icons/CommentIcon';
import PrivateInfoIcon from '../components/icons/PrivateInfoIcon';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import MessageBox from '../components/MessageBox';
import Page from '../components/Page';
import StyledButton from '../components/StyledButton';
import StyledCheckbox from '../components/StyledCheckbox';
import StyledLink from '../components/StyledLink';
import { H1, H5, Span } from '../components/Text';
import { TOAST_TYPE, withToasts } from '../components/ToastProvider';
import { withUser } from '../components/UserProvider';

const getVariableFromProps = props => {
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

const expensePageQuery = gqlV2/* GraphQL */ `
  query ExpensePage($legacyExpenseId: Int!, $draftKey: String, $offset: Int, $totalPaidExpensesDateFrom: DateTime) {
    expense(expense: { legacyId: $legacyExpenseId }, draftKey: $draftKey) {
      ...ExpensePageExpenseFields
      comments(limit: 100, offset: $offset) {
        totalCount
        nodes {
          ...CommentFields
        }
      }
    }

    # As it uses a dedicated variable this needs to be separated from the ExpensePageExpenseFields fragment
    expensePayeeStats: expense(expense: { legacyId: $legacyExpenseId }) {
      id
      payee {
        id
        stats {
          id
          totalPaidInvoices: totalPaidExpenses(expenseType: [INVOICE], dateFrom: $totalPaidExpensesDateFrom) {
            valueInCents
            currency
          }
          totalPaidReceipts: totalPaidExpenses(expenseType: [RECEIPT], dateFrom: $totalPaidExpensesDateFrom) {
            valueInCents
            currency
          }
          totalPaidGrants: totalPaidExpenses(expenseType: [GRANT], dateFrom: $totalPaidExpensesDateFrom) {
            valueInCents
            currency
          }
        }
      }
    }

    loggedInAccount {
      ...LoggedInAccountExpensePayoutFields
    }
  }

  ${loggedInAccountExpensePayoutFieldsFragment}
  ${expensePageExpenseFieldsFragment}
  ${commentFieldsFragment}
`;

const editExpenseMutation = gqlV2/* GraphQL */ `
  mutation EditExpense($expense: ExpenseUpdateInput!, $draftKey: String) {
    editExpense(expense: $expense, draftKey: $draftKey) {
      ...ExpensePageExpenseFields
    }
  }

  ${expensePageExpenseFieldsFragment}
`;

const verifyExpenseMutation = gqlV2/* GraphQL */ `
  mutation VerifyExpense($expense: ExpenseReferenceInput!, $draftKey: String) {
    verifyExpense(expense: $expense, draftKey: $draftKey) {
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

const { ORGANIZATION } = CollectiveType;

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
    /** from addEditExpenseMutation */
    editExpense: PropTypes.func.isRequired,
    verifyExpense: PropTypes.func.isRequired,
    addToast: PropTypes.func.isRequired,
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
    this.expenseTopRef = React.createRef();
    this.state = {
      isRefetchingDataForUser: false,
      error: null,
      status:
        this.props.draftKey && this.props.data.expense?.status === expenseStatus.DRAFT
          ? PAGE_STATUS.EDIT
          : PAGE_STATUS.VIEW,
      editedExpense: null,
      isSubmitting: false,
      isPoolingEnabled: true,
      tos: false,
      newsletterOptIn: false,
      createdUser: null,
    };

    this.pollingInterval = 60;
    this.pollingTimeout = null;
    this.pollingStarted = false;
    this.pollingPaused = false;
    this.handlePolling = debounce(this.handlePolling.bind(this), 100);
  }

  componentDidMount() {
    const shouldEditDraft = this.props.data.expense?.status === expenseStatus.DRAFT && this.props.draftKey;
    if (shouldEditDraft) {
      this.setState(() => ({
        status: PAGE_STATUS.EDIT,
        editedExpense: this.props.data.expense,
        isPoolingEnabled: false,
      }));
    }

    const expense = this.props.data?.expense;
    if (
      expense?.status === expenseStatus.UNVERIFIED &&
      expense?.permissions?.canEdit &&
      this.props.LoggedInUser &&
      expense?.createdByAccount?.slug === this.props.LoggedInUser?.collective?.slug
    ) {
      this.handleExpenseVerification();
    }

    this.handlePolling();
    document.addEventListener('mousemove', this.handlePolling);
  }

  componentDidUpdate(oldProps, oldState) {
    // Refetch data when users are logged in to make sure they can see the private info
    if (!oldProps.LoggedInUser && this.props.LoggedInUser) {
      this.refetchDataForUser();
    }

    // Automatically edit expense if missing receipt
    const expense = this.props.data?.expense;
    const isMissingReceipt =
      expense?.status === expenseStatus.PAID &&
      expense?.type === expenseTypes.CHARGE &&
      expense?.permissions?.canEdit &&
      expense?.items?.every(item => !item.url);
    if (this.props.edit && isMissingReceipt && this.state.status !== PAGE_STATUS.EDIT) {
      this.onEditBtnClick();
      this.props.router.replace(document.location.pathname);
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
    if (this.state.isPoolingEnabled) {
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
  }

  async refetchDataForUser() {
    try {
      this.setState({ isRefetchingDataForUser: true });
      await this.props.data.refetch();
    } finally {
      this.setState({ isRefetchingDataForUser: false });
    }
  }

  async handleExpenseVerification() {
    const expense = this.props.data?.expense;
    await this.props.verifyExpense({
      variables: { expense: { id: expense.id } },
    });

    const { parentCollectiveSlug, collectiveSlug, legacyExpenseId, data } = this.props;
    const parentCollectiveSlugRoute = parentCollectiveSlug ? `${parentCollectiveSlug}/` : '';
    const collectiveType = parentCollectiveSlug ? getCollectiveTypeForUrl(data?.account) : undefined;
    const collectiveTypeRoute = collectiveType ? `${collectiveType}/` : '';
    await this.props.router.push(
      `${parentCollectiveSlugRoute}${collectiveTypeRoute}${collectiveSlug}/expenses/${legacyExpenseId}`,
    );
    this.props.data.refetch();
    this.props.addToast({
      type: TOAST_TYPE.SUCCESS,
      title: <FormattedMessage id="Expense.Submitted" defaultMessage="Expense submitted" />,
      message: (
        <FormattedMessage id="Expense.SuccessPage" defaultMessage="You can edit or review updates on this page." />
      ),
    });
    window.scrollTo(0, 0);
  }

  onSummarySubmit = async () => {
    try {
      this.setState({ isSubmitting: true, error: null });
      const { editedExpense } = this.state;
      if (!editedExpense.payee.id && this.state.newsletterOptIn) {
        editedExpense.payee.newsletterOptIn = this.state.newsletterOptIn;
      }
      await this.props.editExpense({
        variables: {
          expense: prepareExpenseForSubmit(editedExpense),
          draftKey: this.props.data.expense?.status === expenseStatus.DRAFT ? this.props.draftKey : null,
        },
      });
      if (this.props.data.expense?.type === expenseTypes.CHARGE) {
        await this.props.data.refetch();
      }
      const createdUser = editedExpense?.payee;
      this.setState({
        status: PAGE_STATUS.VIEW,
        isSubmitting: false,
        editedExpense: undefined,
        error: null,
        createdUser,
      });
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
    const { client } = this.props;
    const query = expensePageQuery;
    const variables = getVariableFromProps(this.props);
    const data = cloneDeep(client.readQuery({ query, variables }));
    return [data, query, variables];
  }

  getSuggestedTags = memoizeOne(getSuggestedTags);

  onCommentAdded = comment => {
    // Add comment to cache if not already fetched
    const [data, query, variables] = this.clonePageQueryCacheData();
    update(data, 'expense.comments.nodes', comments => uniqBy([...comments, comment], 'id'));
    update(data, 'expense.comments.totalCount', totalCount => totalCount + 1);
    this.props.client.writeQuery({ query, variables, data });
  };

  onCommentDeleted = comment => {
    const [data, query, variables] = this.clonePageQueryCacheData();
    update(data, 'expense.comments.nodes', comments => comments.filter(c => c.id !== comment.id));
    update(data, 'expense.comments.totalCount', totalCount => totalCount - 1);
    this.props.client.writeQuery({ query, variables, data });
  };

  fetchMore = async () => {
    const { legacyExpenseId, draftKey, data } = this.props;

    // refetch before fetching more as comments added to the cache can change the offset
    await data.refetch();
    await data.fetchMore({
      variables: { legacyExpenseId, draftKey, offset: get(data, 'expense.comments.nodes', []).length },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) {
          return prev;
        }

        const newValues = {};

        newValues.expense = {
          ...prev.expense,
          comments: {
            ...fetchMoreResult.expense.comments,
            nodes: [...prev.expense.comments.nodes, ...fetchMoreResult.expense.comments.nodes],
          },
        };

        return Object.assign({}, prev, newValues);
      },
    });
  };

  // This function is currently a duplicate of the one in create-expense.js
  getPayoutProfiles = memoizeOne(loggedInAccount => {
    if (!loggedInAccount) {
      return [];
    } else {
      const payoutProfiles = [loggedInAccount];
      for (const membership of get(loggedInAccount, 'adminMemberships.nodes', [])) {
        if (
          // Organizations
          [ORGANIZATION].includes(membership.account.type) ||
          // Relax available accounts
          membership.account.isActive
        ) {
          // Push main account
          payoutProfiles.push(omit(membership.account, ['childrenAccounts']));
          // Push children and add Host if missing
          for (const childrenAccount of membership.account.childrenAccounts.nodes) {
            payoutProfiles.push({ host: membership.account.host, ...childrenAccount });
          }
        }
      }
      return payoutProfiles;
    }
  });

  getThreadItems = memoizeOne((comments, activities) => {
    return sortBy([...(comments || []), ...activities], 'createdAt');
  });

  onEditBtnClick = async () => {
    return this.setState(() => ({ status: PAGE_STATUS.EDIT, editedExpense: this.props.data.expense }));
  };

  onDelete = async expense => {
    const collective = expense.account;
    const parentCollectiveSlugRoute = collective.parent?.slug ? `${collective.parent?.slug}/` : '';
    const collectiveType = collective.parent ? getCollectiveTypeForUrl(collective) : undefined;
    const collectiveTypeRoute = collectiveType ? `${collectiveType}/` : '';
    return this.props.router.replace(`${parentCollectiveSlugRoute}${collectiveTypeRoute}${collective.slug}/expenses`);
  };

  render() {
    const { collectiveSlug, data, loadingLoggedInUser, intl } = this.props;
    const { isRefetchingDataForUser, error, status, editedExpense } = this.state;

    if (!data.loading && !isRefetchingDataForUser) {
      if (!data || data.error) {
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
    const loggedInAccount = data.loggedInAccount;
    const collective = expense?.account;
    const host = collective?.host;
    const canSeeInvoiceInfo = expense?.permissions.canSeeInvoiceInfo;
    const isInvoice = expense?.type === expenseTypes.INVOICE;
    const isDraft = expense?.status === expenseStatus.DRAFT;
    const hasAttachedFiles = (isInvoice && canSeeInvoiceInfo) || expense?.attachedFiles?.length > 0;
    const showTaxFormMsg = includes(expense?.requiredLegalDocuments, 'US_TAX_FORM');
    const hasHeaderMsg = error || showTaxFormMsg;
    const isMissingReceipt =
      expense?.status === expenseStatus.PAID &&
      expense?.type === expenseTypes.CHARGE &&
      expense?.permissions?.canEdit &&
      expense?.items?.every(item => !item.url);
    const skipSummary = isMissingReceipt && status === PAGE_STATUS.EDIT;

    const payoutProfiles = this.getPayoutProfiles(loggedInAccount);

    let threadItems;

    if (expense) {
      threadItems = this.getThreadItems(expense.comments?.nodes, expense.activities);
    }

    return (
      <Page collective={collective} {...this.getPageMetaData(expense)}>
        <CollectiveNavbar
          collective={collective}
          isLoading={!collective}
          selected={Sections.BUDGET}
          selectedCategory={NAVBAR_CATEGORIES.BUDGET}
          callsToAction={{ hasSubmitExpense: status === PAGE_STATUS.VIEW }}
        />
        <Flex flexDirection={['column', 'row']} my={[4, 5]} data-cy="expense-page-content">
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
                />
              )}
            </Flex>
          </Container>
          <Box
            flex="1 1 650px"
            minWidth={300}
            maxWidth={[null, null, null, 792]}
            mr={[null, 2, 3, 4]}
            px={2}
            ref={this.expenseTopRef}
          >
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
            {status === PAGE_STATUS.VIEW &&
              ((expense?.status === expenseStatus.UNVERIFIED && this.state.createdUser) || isDraft) && (
                <ExpenseInviteNotificationBanner expense={expense} createdUser={this.state.createdUser} />
              )}
            {isMissingReceipt && (
              <ExpenseMissingReceiptNotificationBanner onEdit={status !== PAGE_STATUS.EDIT && this.onEditBtnClick} />
            )}
            {status !== PAGE_STATUS.EDIT && (
              <Box mb={3}>
                <ExpenseSummary
                  expense={status === PAGE_STATUS.EDIT_SUMMARY ? editedExpense : expense}
                  host={host}
                  isLoading={!expense}
                  isEditing={status === PAGE_STATUS.EDIT_SUMMARY}
                  isLoadingLoggedInUser={loadingLoggedInUser || isRefetchingDataForUser}
                  collective={collective}
                  onError={error => this.setState({ error })}
                  onEdit={this.onEditBtnClick}
                  onDelete={this.onDelete}
                  suggestedTags={this.getSuggestedTags(collective)}
                  canEditTags={get(expense, 'permissions.canEditTags', false)}
                  showProcessButtons
                />
                {status !== PAGE_STATUS.EDIT_SUMMARY && (
                  <React.Fragment>
                    {hasAttachedFiles && (
                      <Container mt={4} pb={4} borderBottom="1px solid #DCDEE0">
                        <H5 fontSize="16px" mb={3}>
                          <FormattedMessage id="Downloads" defaultMessage="Downloads" />
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
                    {isDraft && !loggedInAccount && (
                      <Fragment>
                        <MessageBox type="info" fontSize="12px">
                          <FormattedMessage
                            id="Expense.SignUpInfoBox"
                            defaultMessage="You need to create an account to receive a payment from {collectiveName}, by clicking 'Join and Submit' you agree to create an account on Open Collective."
                            values={{ collectiveName: collective.name }}
                          />
                        </MessageBox>
                        <Box mt={3}>
                          <StyledCheckbox
                            name="tos"
                            label={
                              <FormattedMessage
                                id="TOSAndPrivacyPolicyAgreement"
                                defaultMessage="I agree with the {toslink} and {privacylink} of Open Collective."
                                values={{
                                  toslink: (
                                    <StyledLink href="/tos" openInNewTab>
                                      <FormattedMessage id="tos" defaultMessage="terms of service" />
                                    </StyledLink>
                                  ),
                                  privacylink: (
                                    <StyledLink href="/privacypolicy" openInNewTab>
                                      <FormattedMessage id="privacypolicy" defaultMessage="privacy policy" />
                                    </StyledLink>
                                  ),
                                }}
                              />
                            }
                            required
                            onChange={({ checked }) => {
                              this.setState({ tos: checked });
                            }}
                          />
                        </Box>
                        <Box mt={3}>
                          <StyledCheckbox
                            name="newsletterOptIn"
                            label={
                              <span>
                                <FormattedMessage
                                  id="newsletter.label"
                                  defaultMessage="Receive our monthly newsletter"
                                />
                                .
                              </span>
                            }
                            required
                            onChange={({ checked }) => {
                              this.setState({ newsletterOptIn: checked });
                            }}
                          />
                        </Box>
                      </Fragment>
                    )}
                    {!isDraft && (
                      <ExpenseNotesForm onChange={this.onNotesChanges} defaultValue={expense.privateMessage} />
                    )}
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
                        disabled={isDraft ? !loggedInAccount && !this.state.tos : false}
                      >
                        {isDraft && !loggedInAccount ? (
                          <FormattedMessage id="Expense.JoinAndSubmit" defaultMessage="Join and Submit" />
                        ) : (
                          <FormattedMessage id="SaveChanges" defaultMessage="Save changes" />
                        )}
                      </StyledButton>
                    </Flex>
                  </Box>
                )}
              </Box>
            )}
            {status === PAGE_STATUS.EDIT && (
              <Box mb={3}>
                {data.loading || loadingLoggedInUser ? (
                  <LoadingPlaceholder width="100%" height={400} />
                ) : (
                  <ExpenseForm
                    collective={collective}
                    loading={data.loading || loadingLoggedInUser || isRefetchingDataForUser}
                    expense={editedExpense || expense}
                    originalExpense={expense}
                    expensesTags={this.getSuggestedTags(collective)}
                    payoutProfiles={payoutProfiles}
                    loggedInAccount={loggedInAccount}
                    onCancel={() => this.setState({ status: PAGE_STATUS.VIEW, editedExpense: null })}
                    onSubmit={editedExpense => {
                      if (skipSummary) {
                        this.setState({
                          editedExpense,
                        });
                        return this.onSummarySubmit();
                      } else {
                        this.setState({
                          editedExpense,
                          status: PAGE_STATUS.EDIT_SUMMARY,
                        });
                      }
                    }}
                    validateOnChange
                    disableSubmitIfUntouched
                  />
                )}
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
                  hasMore={expense.comments?.totalCount > threadItems.length}
                  items={threadItems}
                  fetchMore={this.fetchMore}
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

const addEditExpenseMutation = graphql(editExpenseMutation, {
  name: 'editExpense',
  options: { context: API_V2_CONTEXT },
});

const addVerifyExpenseMutation = graphql(verifyExpenseMutation, {
  name: 'verifyExpense',
  options: { context: API_V2_CONTEXT },
});

export default injectIntl(
  withToasts(
    addVerifyExpenseMutation(addExpensePageData(withApollo(withUser(withRouter(addEditExpenseMutation(ExpensePage)))))),
  ),
);
