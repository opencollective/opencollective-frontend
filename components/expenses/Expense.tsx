import React, { Fragment, useEffect, useRef, useState } from 'react';
import type { ApolloClient } from '@apollo/client';
import type { FetchMoreFunction } from '@apollo/client/react/hooks/useSuspenseQuery';
import { themeGet } from '@styled-system/theme-get';
import dayjs from 'dayjs';
import { cloneDeep, get, includes, orderBy, uniqBy, update } from 'lodash';
import { useRouter } from 'next/router';
import { createPortal } from 'react-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { css, styled } from 'styled-components';

import { getCollectiveTypeForUrl } from '../../lib/collective';
import CommentType from '../../lib/constants/commentTypes';
import expenseTypes from '../../lib/constants/expenseTypes';
import { getFilesFromExpense } from '../../lib/expenses';
import type { Account, AccountWithHost, Expense as ExpenseType } from '../../lib/graphql/types/v2/graphql';
import { ExpenseStatus } from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { useWindowResize, VIEWPORTS } from '../../lib/hooks/useWindowResize';
import { isFeatureEnabled } from '@/lib/allowed-features';
import { getCollectivePageRoute } from '@/lib/url-helpers';

import CommentForm from '../conversations/CommentForm';
import Thread from '../conversations/Thread';
import { useDrawerActionsContainer } from '../Drawer';
import FilesViewerModal from '../FilesViewerModal';
import { Box, Flex } from '../Grid';
import CommentIcon from '../icons/CommentIcon';
import Link from '../Link';
import LinkCollective from '../LinkCollective';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { SubmitExpenseFlow } from '../submit-expense/SubmitExpenseFlow';
import { H1 } from '../Text';

import { expensePageQuery } from './graphql/queries';
import ExpenseInviteNotificationBanner from './ExpenseInviteNotificationBanner';
import ExpenseInviteWelcome from './ExpenseInviteWelcome';
import ExpenseMissingReceiptNotificationBanner from './ExpenseMissingReceiptNotificationBanner';
import ExpenseSummary from './ExpenseSummary';
import PrivateCommentsMessage from './PrivateCommentsMessage';
import TaxFormMessage from './TaxFormMessage';

const getVariableFromProps = props => {
  const firstOfCurrentYear = dayjs(new Date(new Date().getFullYear(), 0, 1))
    .utc(true)
    .toISOString();
  return {
    legacyExpenseId: props.legacyExpenseId,
    draftKey: props.draftKey || null,
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

    &:hover {
      color: ${themeGet('colors.black.600')};
    }
  }
`;

interface ExpenseProps {
  collectiveSlug?: string;
  parentCollectiveSlug?: string;
  legacyExpenseId?: number;
  draftKey?: string;
  client?: ApolloClient<object>;
  loading?: boolean;
  error?: any;
  refetch?: () => void;
  fetchMore?: FetchMoreFunction<unknown, unknown>;
  onClose?: () => void;
  isRefetchingDataForUser?: boolean;
  drawerActionsContainer?: object;
  isDrawer?: boolean;
  enableKeyboardShortcuts?: boolean;
  data?: {
    loggedInAccount: Pick<Account, 'id' | 'slug' | 'type'>;
    expense: React.ComponentProps<typeof ExpenseInviteWelcome> &
      React.ComponentProps<typeof ExpenseInviteNotificationBanner> &
      React.ComponentProps<typeof ExpenseInviteWelcome> &
      Pick<
        ExpenseType,
        | 'id'
        | 'legacyId'
        | 'type'
        | 'account'
        | 'status'
        | 'permissions'
        | 'items'
        | 'comments'
        | 'activities'
        | 'privateMessage'
        | 'onHold'
        | 'recurringExpense'
        | 'requiredLegalDocuments'
        | 'draft'
      > & {
        account: Pick<AccountWithHost, 'host'>;
      };
  };
}

function Expense(props: ExpenseProps) {
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
    enableKeyboardShortcuts,
    onClose,
  } = props;
  const { loadingLoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const router = useRouter();

  const [isSubmissionFlowOpen, setIsSubmissionFlowOpen] = React.useState(false);

  const onContinueSubmissionClick = React.useCallback(() => {
    if (([expenseTypes.GRANT] as string[]).includes(data?.expense?.type)) {
      router.push({
        pathname: `${getCollectivePageRoute(data?.expense?.account)}/grants/new`,
        query: {
          expenseId: data?.expense?.legacyId,
          draftKey,
        },
      });
      return;
    }

    setIsSubmissionFlowOpen(true);
  }, [data?.expense?.account, data?.expense?.legacyId, data?.expense?.type, draftKey, router]);

  const [state, setState] = useState({
    showFilesViewerModal: false,
  });
  const [openUrl, setOpenUrl] = useState(router.query.attachmentUrl as string);
  const [replyingToComment, setReplyingToComment] = useState(null);

  const drawerActionsContainer = useDrawerActionsContainer();

  // Update error state when error prop changes (from Expense query)
  useEffect(() => {
    setState(state => ({ ...state, error }));
  }, [error]);

  const expenseTopRef = useRef(null);
  const { viewport } = useWindowResize(null, { useMinWidth: true });
  const isDesktop = viewport === VIEWPORTS.LARGE;

  const expense = data?.expense;
  const collective = expense?.account;
  const host = expense?.host ?? collective?.host;
  const isDraft = expense?.status === ExpenseStatus.DRAFT;
  const isMissingReceipt =
    [ExpenseStatus.PAID, ExpenseStatus.PROCESSING].includes(expense?.status) &&
    expense?.type === expenseTypes.CHARGE &&
    expense?.permissions?.canEdit &&
    expense?.items?.every(item => !item.url);
  const isRecurring = expense?.recurringExpense;
  const inDrawer = Boolean(drawerActionsContainer);

  const threadItems = React.useMemo(() => {
    const comments = expense?.comments?.nodes || [];
    const activities = expense?.activities || [];
    return orderBy([...comments, ...activities], 'createdAt', 'asc');
  }, [expense]);

  const showTaxFormMsg =
    isFeatureEnabled(expense?.account, 'TAX_FORMS') && includes(expense?.requiredLegalDocuments, 'US_TAX_FORM');

  const clonePageQueryCacheData = () => {
    const { client } = props;
    const query = expensePageQuery;
    const variables = getVariableFromProps(props);
    const data = cloneDeep(client.readQuery({ query, variables }));
    return [data, query, variables];
  };

  const onDelete = async expense => {
    const collective = expense.account;
    const parentCollectiveSlugRoute = collective.parent?.slug ? `${collective.parent?.slug}/` : '';
    const collectiveType = collective.parent ? getCollectiveTypeForUrl(collective) : undefined;
    const collectiveTypeRoute = collectiveType ? `${collectiveType}/` : '';
    return router.replace(`${parentCollectiveSlugRoute}${collectiveTypeRoute}${collective.slug}/expenses`);
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
      updateQuery: (prev: unknown, { fetchMoreResult }) => {
        if (!fetchMoreResult) {
          return prev;
        }

        const resultExpense = fetchMoreResult['expense'] as { comments: { nodes: Comment[] } };
        const newValues = {
          expense: {
            ...prev['expense'],
            comments: {
              ...resultExpense.comments,
              nodes: [...prev['expense'].comments.nodes, ...resultExpense.comments.nodes],
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

  const files = React.useMemo(() => getFilesFromExpense(expense, intl), [expense, intl]);

  useEffect(() => {
    const showFilesViewerModal = isDrawer && isDesktop && files?.length > 0;
    setState(state => ({ ...state, showFilesViewerModal }));
    setOpenUrl(files?.[0]?.url || null);
  }, [files, isDesktop, isDrawer]);

  return (
    <Box ref={expenseTopRef}>
      <ExpenseHeader inDrawer={inDrawer}>
        {expense?.type && expense?.account ? (
          <FormattedMessage
            id="ExpenseTitle"
            defaultMessage="{type, select, CHARGE {Charge} INVOICE {Invoice} RECEIPT {Receipt} GRANT {Grant} SETTLEMENT {Settlement} PLATFORM_BILLING {Platform bill} other {Expense}} <LinkExpense>{id}</LinkExpense> to <LinkCollective>{collectiveName}</LinkCollective>"
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

      {showTaxFormMsg && <TaxFormMessage expense={expense} refetch={refetch} />}
      {isDraft && !isRecurring && !draftKey && <ExpenseInviteNotificationBanner expense={expense} />}
      {isMissingReceipt && <ExpenseMissingReceiptNotificationBanner expense={expense} />}

      <Box mb={3}>
        {(expense?.permissions?.canDeclineExpenseInvite ||
          (expense?.status === ExpenseStatus.DRAFT && !isRecurring && draftKey && expense?.draft?.recipientNote)) && (
          <ExpenseInviteWelcome
            onContinueSubmissionClick={onContinueSubmissionClick}
            className="mb-6"
            expense={expense}
            draftKey={draftKey}
          />
        )}
        <ExpenseSummary
          expense={expense}
          host={host}
          isLoading={loading || !expense}
          isLoadingLoggedInUser={loadingLoggedInUser || isRefetchingDataForUser}
          collective={collective}
          onDelete={onDelete}
          canEditTags={get(expense, 'permissions.canEditTags', false)}
          showProcessButtons
          drawerActionsContainer={drawerActionsContainer}
          openFileViewer={openFileViewer}
          enableKeyboardShortcuts={enableKeyboardShortcuts}
          openedItemId={openUrl && state.showFilesViewerModal && files?.find?.(file => file.url === openUrl)?.id}
        />
      </Box>

      <Fragment>
        <Box my={4}>
          <PrivateCommentsMessage
            expenseType={expense?.type}
            isAllowed={expense?.permissions.canComment}
            isLoading={loadingLoggedInUser || isRefetchingDataForUser}
          />
        </Box>

        {!inDrawer ? (
          <React.Fragment>
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
          </React.Fragment>
        ) : (
          <Thread
            variant="small"
            items={threadItems}
            collective={host}
            hasMore={expense?.comments?.totalCount > threadItems.length}
            fetchMore={fetchMoreComments}
            onCommentDeleted={onCommentDeleted}
            loading={loading}
            CommentEntity={{
              ExpenseId: expense && expense.id,
            }}
            onCommentCreated={onCommentAdded}
            canComment={expense?.permissions.canComment}
            canUsePrivateNote={expense?.permissions?.canUsePrivateNote}
            defaultType={expense?.onHold ? CommentType.PRIVATE_NOTE : CommentType.COMMENT}
          />
        )}
      </Fragment>

      {isSubmissionFlowOpen && (
        <SubmitExpenseFlow
          onClose={submitted => {
            setIsSubmissionFlowOpen(false);
            if (submitted) {
              refetch();
            }
          }}
          expenseId={legacyExpenseId}
          draftKey={draftKey}
          submitExpenseTo={collective?.slug}
          endFlowButtonLabel={<FormattedMessage defaultMessage="View expense" id="CaE5Oi" />}
        />
      )}

      {state.showFilesViewerModal &&
        expense &&
        createPortal(
          <FilesViewerModal
            allowOutsideInteraction={isDrawer}
            files={files}
            parentTitle={intl.formatMessage(
              {
                defaultMessage: 'Expense #{expenseId} attachment',
                id: 'At2m8o',
              },
              { expenseId: expense.legacyId },
            )}
            openFileUrl={openUrl}
            setOpenFileUrl={setOpenUrl}
            onClose={
              isDrawer && isDesktop ? onClose : () => setState(state => ({ ...state, showFilesViewerModal: false }))
            }
            hideCloseButton={isDrawer && isDesktop}
          />,
          document.body,
        )}
    </Box>
  );
}

export default Expense;
