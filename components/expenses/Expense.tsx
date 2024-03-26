import React, { Fragment, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Undo } from '@styled-icons/fa-solid/Undo';
import { themeGet } from '@styled-system/theme-get';
import dayjs from 'dayjs';
import { cloneDeep, debounce, get, includes, sortBy, uniqBy, update } from 'lodash';
import { useRouter } from 'next/router';
import { createPortal } from 'react-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { getCollectiveTypeForUrl } from '../../lib/collective';
import CommentType from '../../lib/constants/commentTypes';
import expenseTypes from '../../lib/constants/expenseTypes';
import { formatErrorMessage, getErrorFromGraphqlException } from '../../lib/errors';
import { getFilesFromExpense, getPayoutProfiles } from '../../lib/expenses';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { ExpenseStatus } from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { usePrevious } from '../../lib/hooks/usePrevious';
import { itemHasOCR } from './lib/ocr';

import ConfirmationModal from '../ConfirmationModal';
import Container from '../Container';
import CommentForm from '../conversations/CommentForm';
import Thread from '../conversations/Thread';
import { useDrawerActionsContainer } from '../Drawer';
import FilesViewerModal from '../FilesViewerModal';
import { Box, Flex } from '../Grid';
import HTMLContent from '../HTMLContent';
import { getI18nLink, I18nSupportLink, WebsiteName } from '../I18nFormatters';
import CommentIcon from '../icons/CommentIcon';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import Link from '../Link';
import LinkCollective from '../LinkCollective';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import StyledLink from '../StyledLink';
import { H1, H5, Span } from '../Text';

import { editExpenseMutation } from './graphql/mutations';
import { expensePageQuery } from './graphql/queries';
import { ConfirmOCRValues } from './ConfirmOCRValues';
import ExpenseForm, { msg as expenseFormMsg, prepareExpenseForSubmit } from './ExpenseForm';
import ExpenseInviteNotificationBanner from './ExpenseInviteNotificationBanner';
import ExpenseMissingReceiptNotificationBanner from './ExpenseMissingReceiptNotificationBanner';
import ExpenseNotesForm from './ExpenseNotesForm';
import ExpenseRecurringBanner from './ExpenseRecurringBanner';
import ExpenseSummary from './ExpenseSummary';
import PrivateCommentsMessage from './PrivateCommentsMessage';
import TaxFormLinkModal from './TaxFormLinkModal';

const getVariableFromProps = props => {
  const firstOfCurrentYear = dayjs(new Date(new Date().getFullYear(), 0, 1))
    .utc(true)
    .toISOString();
  return {
    legacyExpenseId: props.legacyExpenseId,
    draftKey: props.draftKey,
    totalPaidExpensesDateFrom: firstOfCurrentYear,
  };
};

const ExpenseHeader = styled(H1)<{ inDrawer?: boolean }>`
  ${props =>
    props.inDrawer
      ? css`
          font-size: 16px;
          font-weight: 500;
          letter-spacing: 0;
          line-height: 24px;
          letter-spacing: 0;
        `
      : css`
          font-size: 24px;
        `}

  margin-bottom: 24px;
  > a {
    color: inherit;
    text-decoration: underline;

    :hover {
      color: ${themeGet('colors.black.600')};
    }
  }
`;

const PrivateNoteLabel = () => {
  return (
    <Span fontSize="12px" color="black.700" fontWeight="bold">
      <FormattedMessage id="Expense.PrivateNote" defaultMessage="Private note" />
      &nbsp;&nbsp;
      <PrivateInfoIcon size={12} className="text-muted-foreground" />
    </Span>
  );
};

const PAGE_STATUS = { VIEW: 1, EDIT: 2, EDIT_SUMMARY: 3 };

function Expense(props) {
  const {
    data,
    loading,
    error,
    refetch,
    fetchMore,
    draftKey,
    client,
    isRefetchingDataForUser,
    legacyExpenseId,
    isDrawer,
  } = props;
  const { LoggedInUser, loadingLoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const router = useRouter();
  const [state, setState] = useState({
    error: error || null,
    status: draftKey && data?.expense?.status === ExpenseStatus.DRAFT ? PAGE_STATUS.EDIT : PAGE_STATUS.VIEW,
    editedExpense: null,
    isSubmitting: false,
    isPollingEnabled: true,
    tos: false,
    newsletterOptIn: false,
    createdUser: null,
    showTaxLinkModal: false,
    showFilesViewerModal: false,
  });
  const [openUrl, setOpenUrl] = useState(null);
  const [replyingToComment, setReplyingToComment] = useState(null);
  const [hasConfirmedOCR, setConfirmedOCR] = useState(false);
  const hasItemsWithOCR = Boolean(state.editedExpense?.items?.some(itemHasOCR));
  const mustConfirmOCR = hasItemsWithOCR && !hasConfirmedOCR;
  const pollingInterval = 60;
  let pollingTimeout = null;
  let pollingStarted = false;
  let pollingPaused = false;
  const drawerActionsContainer = useDrawerActionsContainer();

  useEffect(() => {
    const shouldEditDraft = data?.expense?.status === ExpenseStatus.DRAFT && draftKey;
    if (shouldEditDraft) {
      setState(state => ({
        ...state,
        status: PAGE_STATUS.EDIT,
        editedExpense: data?.expense,
        isPollingEnabled: false,
      }));
    }

    handlePolling();
    document.addEventListener('mousemove', handlePolling);

    return () => {
      if (props.stopPolling) {
        props.stopPolling();
      }
      document.removeEventListener('mousemove', handlePolling);
    };
  }, []);

  // Automatically edit expense if missing receipt
  useEffect(() => {
    const expense = data?.expense;
    const isMissingReceipt =
      expense?.status === ExpenseStatus.PAID &&
      expense?.type === expenseTypes.CHARGE &&
      expense?.permissions?.canEdit &&
      expense?.items?.every(item => !item.url);

    if (props.edit && isMissingReceipt && state.status !== PAGE_STATUS.EDIT) {
      onEditBtnClick();
      router.replace(document.location.pathname);
    }
  }, [props.edit, props.data, state.status]);

  // Update status when data or draftKey changes
  useEffect(() => {
    const status = draftKey && data?.expense?.status === ExpenseStatus.DRAFT ? PAGE_STATUS.EDIT : PAGE_STATUS.VIEW;
    if (status !== state.status) {
      setState(state => ({ ...state, status }));
    }
  }, [props.data, draftKey]);

  // Scroll to expense's top when changing status
  const prevState = usePrevious(state);

  useEffect(() => {
    if (prevState && prevState.status !== state.status) {
      scrollToExpenseTop();
    }
  }, [state.status]);

  // Update error state when error prop changes (from Expense query)
  useEffect(() => {
    setState(state => ({ ...state, error }));
  }, [error]);

  const [editExpense] = useMutation(editExpenseMutation, {
    context: API_V2_CONTEXT,
  });

  const expenseTopRef = useRef(null);
  const { status, editedExpense } = state;

  const expense = cloneDeep(data?.expense);
  if (expense && data?.expensePayeeStats?.payee?.stats) {
    expense.payee.stats = data.expensePayeeStats?.payee?.stats;
  }
  const loggedInAccount = data?.loggedInAccount;
  const collective = expense?.account;
  const host = collective?.host;
  const isDraft = expense?.status === ExpenseStatus.DRAFT;
  const showTaxFormMsg = includes(expense?.requiredLegalDocuments, 'US_TAX_FORM');
  const isMissingReceipt =
    [ExpenseStatus.PAID, ExpenseStatus.PROCESSING].includes(expense?.status) &&
    expense?.type === expenseTypes.CHARGE &&
    expense?.permissions?.canEdit &&
    expense?.items?.every(item => !item.url);
  const isRecurring = expense?.recurringExpense;
  const skipSummary = isMissingReceipt && status === PAGE_STATUS.EDIT;
  const [showResetModal, setShowResetModal] = useState(false);
  const payoutProfiles = getPayoutProfiles(loggedInAccount);

  const threadItems = React.useMemo(() => {
    const comments = expense?.comments?.nodes || [];
    const activities = expense?.activities || [];
    return sortBy([...comments, ...activities], 'createdAt');
  }, [expense]);

  const isEditing = status === PAGE_STATUS.EDIT || status === PAGE_STATUS.EDIT_SUMMARY;
  const isEditingExistingExpense = isEditing && expense !== undefined;
  const inDrawer = Boolean(drawerActionsContainer);

  const handlePolling = debounce(() => {
    if (state.isPollingEnabled) {
      if (!pollingStarted) {
        if (pollingPaused) {
          // The polling was paused, so we immediately refetch
          props.refetch?.();
          pollingPaused = false;
        }
        props.startPolling?.(pollingInterval * 1000);
        pollingStarted = true;
      }

      clearTimeout(pollingTimeout);
      pollingTimeout = setTimeout(() => {
        // No mouse movement was detected since 60sec, we stop polling
        props.stopPolling?.();
        pollingStarted = false;
        pollingPaused = true;
      }, pollingInterval * 1000);
    }
  }, 100);

  const clonePageQueryCacheData = () => {
    const { client } = props;
    const query = expensePageQuery;
    const variables = getVariableFromProps(props);
    const data = cloneDeep(client.readQuery({ query, variables }));
    return [data, query, variables];
  };

  const onEditBtnClick = async () => {
    return setState(state => ({ ...state, status: PAGE_STATUS.EDIT, editedExpense: data?.expense }));
  };

  const onCancel = () => setState(state => ({ ...state, status: PAGE_STATUS.VIEW, editedExpense: null }));

  const onDelete = async expense => {
    const collective = expense.account;
    const parentCollectiveSlugRoute = collective.parent?.slug ? `${collective.parent?.slug}/` : '';
    const collectiveType = collective.parent ? getCollectiveTypeForUrl(collective) : undefined;
    const collectiveTypeRoute = collectiveType ? `${collectiveType}/` : '';
    return router.replace(`${parentCollectiveSlugRoute}${collectiveTypeRoute}${collective.slug}/expenses`);
  };

  const onSummarySubmit = async editedExpense => {
    try {
      setState(state => ({ ...state, isSubmitting: true, error: null }));

      if (!editedExpense.payee.id && state.newsletterOptIn) {
        editedExpense.payee.newsletterOptIn = state.newsletterOptIn;
      }
      await editExpense({
        variables: {
          expense: prepareExpenseForSubmit(editedExpense),
          draftKey: data?.expense?.status === ExpenseStatus.DRAFT ? draftKey : null,
        },
      });
      if (data?.expense?.type === expenseTypes.CHARGE) {
        await refetch();
      }
      const createdUser = editedExpense?.payee;
      setState(state => ({
        ...state,
        status: PAGE_STATUS.VIEW,
        isSubmitting: false,
        editedExpense: undefined,
        error: null,
        createdUser,
      }));
    } catch (e) {
      setState(state => ({ ...state, error: getErrorFromGraphqlException(e), isSubmitting: false }));
      scrollToExpenseTop();
    }
  };

  const scrollToExpenseTop = () => {
    if (expenseTopRef?.current) {
      expenseTopRef?.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo(0, 0);
    }
  };
  const onNotesChanges = e => {
    const name = e.target.name;
    const value = e.target.value;
    setState(state => ({ ...state, editedExpense: { ...state.editedExpense, [name]: value } }));
  };

  const onCommentAdded = comment => {
    //  Add comment to cache if not already fetched
    const [data, query, variables] = clonePageQueryCacheData();
    update(data, 'expense.comments.nodes', comments => uniqBy([...comments, comment], 'id'));
    update(data, 'expense.comments.totalCount', totalCount => totalCount + 1);
    client.writeQuery({ query, variables, data });
  };

  const onCommentDeleted = comment => {
    const [data, query, variables] = clonePageQueryCacheData();
    update(data, 'expense.comments.nodes', comments => comments.filter(c => c.id !== comment.id));
    update(data, 'expense.comments.totalCount', totalCount => totalCount - 1);
    client.writeQuery({ query, variables, data });
  };

  const fetchMoreComments = async () => {
    // refetch before fetching more as comments added to the cache can change the offset
    await refetch();
    await fetchMore({
      variables: { legacyExpenseId, draftKey, offset: get(data, 'expense.comments.nodes', []).length },
      updateQuery: (prev: any, { fetchMoreResult }) => {
        if (!fetchMoreResult) {
          return prev;
        }
        const newValues = {
          expense: {
            ...prev.expense,
            comments: {
              ...fetchMoreResult.expense.comments,
              nodes: [...prev.expense.comments.nodes, ...fetchMoreResult.expense.comments.nodes],
            },
          },
        };
        return Object.assign({}, prev, newValues);
      },
    });
  };

  const openFileViewer = url => {
    setOpenUrl(url);
    setState({ ...state, showFilesViewerModal: true });
  };

  const files = React.useMemo(() => getFilesFromExpense(expense, intl), [expense]);

  const confirmSaveButtons = (
    <Flex flex={1} flexWrap="wrap" gridGap={[2, 3]}>
      <StyledButton
        minWidth={175}
        whiteSpace="nowrap"
        data-cy="edit-expense-btn"
        onClick={() => setState(state => ({ ...state, status: PAGE_STATUS.EDIT }))}
        disabled={state.isSubmitting}
      >
        ← <FormattedMessage id="Expense.edit" defaultMessage="Edit expense" />
      </StyledButton>
      <StyledButton
        buttonStyle="primary"
        minWidth={175}
        whiteSpace="nowrap"
        data-cy="save-expense-btn"
        onClick={() => onSummarySubmit(state.editedExpense)}
        loading={state.isSubmitting}
        disabled={isDraft ? !loggedInAccount && !state.tos : mustConfirmOCR}
      >
        {isDraft && !loggedInAccount ? (
          <FormattedMessage id="Expense.JoinAndSubmit" defaultMessage="Join and Submit" />
        ) : (
          <FormattedMessage id="Expense.SaveExpense" defaultMessage="Save Expense" />
        )}
      </StyledButton>

      {showResetModal ? (
        <ConfirmationModal
          onClose={() => setShowResetModal(false)}
          header={
            isEditingExistingExpense
              ? intl.formatMessage(expenseFormMsg.cancelEditExpense)
              : intl.formatMessage(expenseFormMsg.clearExpenseForm)
          }
          body={
            isEditingExistingExpense
              ? intl.formatMessage(expenseFormMsg.confirmCancelEditExpense)
              : intl.formatMessage(expenseFormMsg.confirmClearExpenseForm)
          }
          continueHandler={() => {
            onCancel();
            setShowResetModal(false);
          }}
          {...(isEditingExistingExpense && {
            continueLabel: intl.formatMessage({ defaultMessage: 'Yes, cancel editing' }),
            cancelLabel: intl.formatMessage({ defaultMessage: 'No, continue editing' }),
          })}
        />
      ) : (
        <StyledButton
          type="button"
          buttonStyle="borderless"
          color="red.500"
          whiteSpace="nowrap"
          marginLeft="auto"
          onClick={() => setShowResetModal(true)}
        >
          <Undo size={11} />
          <Span mx={1}>
            {intl.formatMessage(
              isEditingExistingExpense ? expenseFormMsg.cancelEditExpense : expenseFormMsg.clearExpenseForm,
            )}
          </Span>
        </StyledButton>
      )}
    </Flex>
  );
  return (
    <Box ref={expenseTopRef}>
      <ExpenseHeader inDrawer={inDrawer}>
        {expense?.type && expense?.account ? (
          <FormattedMessage
            id="ExpenseTitle"
            defaultMessage="{type, select, CHARGE {Charge} INVOICE {Invoice} RECEIPT {Receipt} GRANT {Grant} SETTLEMENT {Settlement} other {Expense}} <LinkExpense>{id}</LinkExpense> to <LinkCollective>{collectiveName}</LinkCollective>"
            values={{
              type: expense?.type,
              id: expense?.legacyId,
              LinkExpense: text => {
                if (inDrawer) {
                  return (
                    <Link href={`/${expense?.account.slug}/expenses/${expense?.legacyId}`}>
                      <span>#{text}</span>
                    </Link>
                  );
                }
                return <span>#{text}</span>;
              },
              collectiveName: expense?.account.name,
              LinkCollective: text => <LinkCollective collective={expense?.account}>{text}</LinkCollective>,
            }}
          />
        ) : (
          <LoadingPlaceholder height={32} maxWidth={'200px'} />
        )}
      </ExpenseHeader>

      {state.error && (
        <MessageBox type="error" withIcon mb={4}>
          {formatErrorMessage(intl, state.error)}
        </MessageBox>
      )}
      {showTaxFormMsg && (
        <MessageBox type="warning" withIcon={true} mb={4}>
          <Container>
            <FormattedMessage
              id="expenseNeedsTaxFormMessage.msg"
              defaultMessage="We need your tax information before we can pay you. You will receive an email with a link to fill out a form. If you have not received the email within 24 hours, check your spam, then contact <I18nSupportLink>support</I18nSupportLink>. Questions? See <Link>help docs about taxes</Link>."
              values={{
                I18nSupportLink,
                Link: getI18nLink({
                  href: 'https://docs.opencollective.com/help/expenses-and-getting-paid/tax-information',
                  openInNewTab: true,
                }),
              }}
            />
          </Container>
          {LoggedInUser?.isRoot && (
            <Container pt={3} textAlign="right">
              <StyledButton
                buttonStyle="secondary"
                buttonSize="tiny"
                onClick={() => setState(state => ({ ...state, showTaxLinkModal: true }))}
              >
                <FormattedMessage defaultMessage="Add tax form" />
              </StyledButton>
            </Container>
          )}
        </MessageBox>
      )}
      {status === PAGE_STATUS.VIEW &&
        ((expense?.status === ExpenseStatus.UNVERIFIED && state.createdUser) || (isDraft && !isRecurring)) && (
          <ExpenseInviteNotificationBanner expense={expense} createdUser={state.createdUser} />
        )}
      {isMissingReceipt && (
        <ExpenseMissingReceiptNotificationBanner onEdit={status !== PAGE_STATUS.EDIT && onEditBtnClick} />
      )}
      {status !== PAGE_STATUS.EDIT && (
        <Box mb={3}>
          <ExpenseSummary
            expense={status === PAGE_STATUS.EDIT_SUMMARY ? editedExpense : expense}
            host={host}
            isLoading={loading || !expense}
            isEditing={status === PAGE_STATUS.EDIT_SUMMARY}
            isLoadingLoggedInUser={loadingLoggedInUser || isRefetchingDataForUser}
            collective={collective}
            onEdit={onEditBtnClick}
            onDelete={onDelete}
            canEditTags={get(expense, 'permissions.canEditTags', false)}
            showProcessButtons
            drawerActionsContainer={drawerActionsContainer}
            openFileViewer={openFileViewer}
          />

          {status !== PAGE_STATUS.EDIT_SUMMARY && (
            <React.Fragment>
              {expense?.privateMessage && (
                <Container mt={4} pb={4} borderBottom="1px solid #DCDEE0">
                  <H5 fontSize="16px" mb={3}>
                    <FormattedMessage id="expense.notes" defaultMessage="Notes" />
                  </H5>
                  <PrivateNoteLabel />
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
                      defaultMessage="You need to create an account to receive a payment from {collectiveName}, by clicking 'Join and Submit' you agree to create an account on {WebsiteName}."
                      values={{ collectiveName: collective.name, WebsiteName }}
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
                              <StyledLink href="/tos" openInNewTab onClick={e => e.stopPropagation()}>
                                <FormattedMessage id="tos" defaultMessage="terms of service" />
                              </StyledLink>
                            ),
                            privacylink: (
                              <StyledLink href="/privacypolicy" openInNewTab onClick={e => e.stopPropagation()}>
                                <FormattedMessage id="privacypolicy" defaultMessage="privacy policy" />
                              </StyledLink>
                            ),
                          }}
                        />
                      }
                      required
                      onChange={({ checked }) => {
                        setState({ ...state, tos: checked });
                      }}
                    />
                  </Box>
                  <Box mt={3}>
                    <StyledCheckbox
                      name="newsletterOptIn"
                      label={
                        <span>
                          <FormattedMessage defaultMessage="Subscribe to our monthly newsletter" />.
                        </span>
                      }
                      required
                      onChange={({ checked }) => {
                        setState(state => ({ ...state, newsletterOptIn: checked }));
                      }}
                    />
                  </Box>
                </Fragment>
              )}
              {!isDraft && <ExpenseNotesForm onChange={onNotesChanges} defaultValue={expense.privateMessage} />}
              {hasItemsWithOCR && (
                <ConfirmOCRValues
                  onConfirm={setConfirmedOCR}
                  items={state.editedExpense.items}
                  currency={state.editedExpense.currency}
                />
              )}
              {isRecurring && <ExpenseRecurringBanner expense={expense} />}
              {drawerActionsContainer ? (
                createPortal(confirmSaveButtons, drawerActionsContainer)
              ) : (
                <Flex flexWrap="wrap" mt="4">
                  {confirmSaveButtons}
                </Flex>
              )}
            </Box>
          )}
        </Box>
      )}
      {status === PAGE_STATUS.EDIT && (
        <Box mb={3}>
          {loading || loadingLoggedInUser ? (
            <LoadingPlaceholder width="100%" height={400} />
          ) : (
            <ExpenseForm
              collective={collective}
              host={host}
              loading={isRefetchingDataForUser}
              expense={editedExpense || expense}
              originalExpense={expense}
              payoutProfiles={payoutProfiles}
              loggedInAccount={loggedInAccount}
              onCancel={() => setState(state => ({ ...state, status: PAGE_STATUS.VIEW, editedExpense: null }))}
              onSubmit={editedExpense => {
                if (skipSummary) {
                  setState(state => ({
                    ...state,
                    editedExpense,
                  }));
                  onSummarySubmit(editedExpense);
                } else {
                  setState(state => ({
                    ...state,
                    editedExpense,
                    status: PAGE_STATUS.EDIT_SUMMARY,
                  }));
                }
              }}
              validateOnChange
              drawerActionsContainer={drawerActionsContainer}
            />
          )}
        </Box>
      )}
      {!(isEditing && inDrawer) && (
        <Fragment>
          <Box my={4}>
            <PrivateCommentsMessage
              isAllowed={expense?.permissions.canComment}
              isLoading={loadingLoggedInUser || isRefetchingDataForUser}
            />
          </Box>

          <Box mb={3} pt={3}>
            {loading ? (
              <LoadingPlaceholder width="100%" height="44px" />
            ) : expense ? (
              <Thread
                collective={collective}
                hasMore={expense.comments?.totalCount > threadItems.length}
                items={threadItems}
                fetchMore={fetchMoreComments}
                onCommentDeleted={onCommentDeleted}
                loading={loading}
                getClickedComment={setReplyingToComment}
              />
            ) : null}
          </Box>

          {expense?.permissions.canComment && (
            <Flex mt="40px">
              <Box display={['none', null, 'block']} flex="0 0" p={3}>
                <CommentIcon size={24} color="lightgrey" />
              </Box>
              <Box flex="1 1" maxWidth={[null, null, 'calc(100% - 56px)']}>
                <CommentForm
                  replyingToComment={replyingToComment}
                  id="new-comment-on-expense"
                  ExpenseId={expense && expense.id}
                  disabled={!expense}
                  onSuccess={onCommentAdded}
                  canUsePrivateNote={expense.permissions.canUsePrivateNote}
                  defaultType={expense.onHold ? CommentType.PRIVATE_NOTE : CommentType.COMMENT}
                />
              </Box>
            </Flex>
          )}
        </Fragment>
      )}

      {state.showTaxLinkModal && (
        <TaxFormLinkModal
          account={expense.payee}
          year={new Date(expense.createdAt).getFullYear()}
          onClose={() => setState(state => ({ ...state, showTaxLinkModal: false }))}
          refetchExpense={refetch}
        />
      )}

      {state.showFilesViewerModal && (
        <FilesViewerModal
          allowOutsideInteraction={isDrawer}
          files={files}
          parentTitle={intl.formatMessage(
            {
              defaultMessage: 'Expense #{expenseId} attachment',
            },
            { expenseId: expense.legacyId },
          )}
          openFileUrl={openUrl}
          onClose={() => setState(state => ({ ...state, showFilesViewerModal: false }))}
        />
      )}
    </Box>
  );
}

Expense.propTypes = {
  collectiveSlug: PropTypes.string,
  parentCollectiveSlug: PropTypes.string,
  legacyExpenseId: PropTypes.number,
  draftKey: PropTypes.string,
  edit: PropTypes.string,
  client: PropTypes.object,
  data: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.any,
  refetch: PropTypes.func,
  fetchMore: PropTypes.func,
  startPolling: PropTypes.func,
  stopPolling: PropTypes.func,
  isRefetchingDataForUser: PropTypes.bool,
  drawerActionsContainer: PropTypes.object,
  isDrawer: PropTypes.bool,
};

export default Expense;
