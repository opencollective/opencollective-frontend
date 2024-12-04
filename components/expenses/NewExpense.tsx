import React from 'react';
import DrawerHeader from '../DrawerHeader';
import { i18nExpenseStatus } from '../../lib/i18n/expense';
import { Badge } from '../ui/Badge';
import { CommentType, ExpenseStatus } from '../../lib/graphql/types/v2/graphql';
import { createPortal } from 'react-dom';

import { getExpenseStatusMsgType } from './ExpenseStatusTag';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { ArrowRightLeft, Ban, Copy, Flag, Landmark, Pause, Pen } from 'lucide-react';
import { CopyID } from '../CopyId';
import LoadingPlaceholder from '../LoadingPlaceholder';
import LinkCollective from '../LinkCollective';
import Avatar from '../Avatar';
import { AccountHoverCard } from '../AccountHoverCard';
import { SheetBody } from '../ui/Sheet';
import Thread from '../conversations/Thread';
import { Box, Flex } from '../Grid';
import CommentForm from '../conversations/CommentForm';
import PrivateCommentsMessage from './PrivateCommentsMessage';
import { cloneDeep, get, orderBy, uniqBy, update } from 'lodash';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { expensePageQuery } from './graphql/queries';
import ExpenseAttachedFiles from './ExpenseAttachedFiles';
import StyledHr from '../StyledHr';
import { Span } from '../Text';
import { expenseItemsMustHaveFiles, getExpenseItemAmountV2FromNewAttrs } from './lib/items';
import dayjs from '../../lib/dayjs';
import UploadedFilePreview from '../UploadedFilePreview';
import FilesViewerModal from '../FilesViewerModal';
import { getFilesFromExpense } from '../../lib/expenses';
import { VIEWPORTS, useWindowResize } from '../../lib/hooks/useWindowResize';
import HTMLContent from '../HTMLContent';
import expenseTypes from '../../lib/constants/expenseTypes';
import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import AmountWithExchangeRateInfo from '../AmountWithExchangeRateInfo';
import { getExpenseExchangeRateWarningOrError } from './lib/utils';
import ExpenseAmountBreakdown from './ExpenseAmountBreakdown';
import { expenseTypeSupportsAttachments } from './lib/attachments';
import { ExpenseAccountingCategoryPill } from './ExpenseAccountingCategoryPill';
import { shouldDisplayExpenseCategoryPill } from './lib/accounting-categories';
import Tags from '../Tags';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { InfoList, InfoListItem } from '../ui/InfoList';
const CreatedByUserLink = ({ account }) => {
  return (
    <LinkCollective collective={account} noTitle>
      <span className="font-medium text-foreground underline hover:text-primary">
        {account ? account.name : <FormattedMessage id="profile.incognito" defaultMessage="Incognito" />}
      </span>
    </LinkCollective>
  );
};
const Spacer = () => <span className="mx-1.5">{'•'}</span>;
const prepareDraftItems = (items, expenseCurrency) => {
  if (!items) {
    return [];
  }

  return items.map(item => {
    const amountV2 = getExpenseItemAmountV2FromNewAttrs(item, expenseCurrency);
    return { ...item, amountV2 };
  });
};
function ExpenseStatusBadge({ status }) {
  const intl = useIntl();
  if (!status) {
    return null;
  }
  const type = getExpenseStatusMsgType(status);
  return <Badge type={type}>{i18nExpenseStatus(intl, status)}</Badge>;
}

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

export default function Expense(props) {
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
  const { LoggedInUser, loadingLoggedInUser } = useLoggedInUser();
  const [openUrl, setOpenUrl] = React.useState(null);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const intl = useIntl();
  const [showFilesViewerModal, setShowFilesViewerModal] = React.useState(false);
  const expense = data?.expense;
  const { viewport } = useWindowResize(null, { useMinWidth: true });

  const isDesktop = viewport === VIEWPORTS.LARGE;

  const threadItems = React.useMemo(() => {
    const comments = expense?.comments?.nodes || [];
    const activities = expense?.activities || [];
    return orderBy([...comments, ...activities], 'createdAt', 'asc');
  }, [expense]);
  const clonePageQueryCacheData = () => {
    const { client } = props;

    const query = expensePageQuery;
    const variables = getVariableFromProps(props);
    const data = cloneDeep(client.readQuery({ query, variables }));
    return [data, query, variables];
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
    setShowFilesViewerModal(true);
  };

  const files = React.useMemo(() => getFilesFromExpense(expense, intl), [expense]);

  React.useEffect(() => {
    const showFilesViewerModal = isDrawer && isDesktop && files?.length > 0;
    setShowFilesViewerModal(showFilesViewerModal);
  }, [files, isDesktop, isDrawer]);

  const id = data?.expense?.legacyId;
  const collective = expense?.account;
  const host = expense?.host ?? collective?.host;

  const isDraft = expense?.status === ExpenseStatus.DRAFT;
  const isGrant = expense?.type === expenseTypes.GRANT;
  const isReceipt = expense?.type === expenseTypes.RECEIPT;
  const isCreditCardCharge = expense?.type === expenseTypes.CHARGE;

  const createdByAccount =
    (isDraft ? expense?.requestedByAccount || expense?.createdByAccount : expense?.createdByAccount) || {};
  const expenseItems =
    expense?.items?.length > 0 ? expense.items : prepareDraftItems(expense?.draft?.items, expense?.currency);
  const expenseTaxes = expense?.taxes?.length > 0 ? expense.taxes : expense?.draft?.taxes || [];
  const isMultiCurrency =
    expense?.amountInAccountCurrency && expense.amountInAccountCurrency.currency !== expense.currency;
  const isLoggedInUserExpenseHostAdmin = LoggedInUser?.isHostAdmin(expense?.account);
  const canEditTags = get(expense, 'permissions.canEditTags', false);
  return (
    <div>
      <DrawerHeader
        entityName={'Expense'}
        entityIdentifier={
          <CopyID value={id} tooltipLabel={<FormattedMessage defaultMessage="Copy expense ID" id="aB7VYK" />}>
            #{id}
          </CopyID>
        }
        entityLabel={<ExpenseStatusBadge status={data?.expense?.status} />}
        actions={{
          primary: [
            {
              label: 'Go to pay',
              Icon: Landmark,
              key: 'pay',
            },
            {
              label: 'Request re-approval',
              Icon: Ban,
              key: 'request-reapprove',
            },
          ],
          secondary: [
            {
              label: 'Mark as incomplete',
              Icon: Flag,
              key: 'incomplete',
            },
            {
              label: 'Put on Hold',
              Icon: Pause,
              key: 'hold',
            },
            {
              label: 'Copy link',
              Icon: Copy,
              key: 'copy',
            },
            {
              label: 'View transactions',
              Icon: ArrowRightLeft,
              key: 'view-transactions',
            },
          ],
        }}
      />
      <SheetBody className="space-y-4 pt-0">
        <InfoList className="mb-6 sm:grid-cols-2">
          {shouldDisplayExpenseCategoryPill(LoggedInUser, expense, collective, host) && (
            <InfoListItem
              className="border-b border-t-0"
              title={'Category'}
              value={
                <ExpenseAccountingCategoryPill
                  host={host}
                  account={expense?.account}
                  expense={expense}
                  canEdit={Boolean(expense.permissions?.canEditAccountingCategory)}
                  allowNone={!isLoggedInUserExpenseHostAdmin}
                  showCodeInSelect={isLoggedInUserExpenseHostAdmin}
                />
              }
            />
          )}
          <InfoListItem
            className="border-b border-t-0"
            title={'Tags'}
            value={<Tags expense={expense} isLoading={loading} canEdit={canEditTags} />}
          />
        </InfoList>
        {/* <div className="flex items-baseline gap-2">
          {shouldDisplayExpenseCategoryPill(LoggedInUser, expense, collective, host) && (
            <React.Fragment>
              <ExpenseAccountingCategoryPill
                host={host}
                account={expense.account}
                expense={expense}
                canEdit={Boolean(expense.permissions?.canEditAccountingCategory)}
                allowNone={!isLoggedInUserExpenseHostAdmin}
                showCodeInSelect={isLoggedInUserExpenseHostAdmin}
              />
            </React.Fragment>
          )}
          <Tags expense={expense} isLoading={loading} canEdit={canEditTags} />
        </div> */}
        <div className="flex items-center">
          {loading && !expense ? (
            <LoadingPlaceholder height={24} width={200} />
          ) : (
            <React.Fragment>
              <LinkCollective collective={createdByAccount}>
                <Avatar collective={createdByAccount} size={24} />
              </LinkCollective>
              <p className="ml-2 text-sm text-muted-foreground" data-cy="expense-author">
                {isDraft && expense.requestedByAccount ? (
                  <FormattedMessage
                    id="Expense.RequestedBy"
                    defaultMessage="Invited by {name}"
                    values={{
                      name: (
                        <AccountHoverCard
                          account={createdByAccount}
                          includeAdminMembership={{
                            accountSlug: expense.account?.slug,
                            hostSlug: host?.slug,
                          }}
                          trigger={
                            <span>
                              <CreatedByUserLink account={createdByAccount} />
                            </span>
                          }
                        />
                      ),
                    }}
                  />
                ) : (
                  <FormattedMessage
                    id="Expense.SubmittedBy"
                    defaultMessage="Submitted by {name}"
                    values={{
                      name: (
                        <AccountHoverCard
                          account={createdByAccount}
                          includeAdminMembership={{
                            accountSlug: expense.account?.slug,
                            hostSlug: host?.slug,
                          }}
                          trigger={
                            <span>
                              <CreatedByUserLink account={createdByAccount} />
                            </span>
                          }
                        />
                      ),
                    }}
                  />
                )}
                {expense.approvedBy?.length > 0 && (
                  <React.Fragment>
                    <Spacer />
                    <FormattedMessage
                      id="Expense.ApprovedBy"
                      defaultMessage="Approved by {name}"
                      values={{
                        name: (
                          <AccountHoverCard
                            account={expense.approvedBy.find(Boolean)}
                            includeAdminMembership={{
                              accountSlug: expense.account.slug,
                              hostSlug: host?.slug,
                            }}
                            trigger={
                              <span>
                                <CreatedByUserLink account={expense.approvedBy.find(Boolean)} />
                              </span>
                            }
                          />
                        ),
                      }}
                    />
                  </React.Fragment>
                )}
              </p>
            </React.Fragment>
          )}
        </div>
        <div className="overflow-hidden rounded-lg border">
          <div className="group px-6 pb-3 pt-6">
            <h4 className="text-xl font-medium" data-cy="expense-description">
              {!expense?.description && loading ? (
                <LoadingPlaceholder height={32} minWidth={250} />
              ) : (
                <div className="relative">
                  {expense.description}
                  <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={() => setEditModalOpen(true)}
                    className="absolute right-2 top-0"
                  >
                    <Pen size={16} />
                  </Button>
                </div>
              )}
            </h4>
          </div>
          {/* Expense items and attachments */}
          <div className="p-6 pt-2">
            <Flex mt={4} mb={2} alignItems="center">
              {!expense && loading ? (
                <LoadingPlaceholder height={20} maxWidth={150} />
              ) : (
                <Span fontWeight="bold" fontSize="16px">
                  {isReceipt || isCreditCardCharge ? (
                    <FormattedMessage id="Expense.AttachedReceipts" defaultMessage="Attached receipts" />
                  ) : isGrant ? (
                    <FormattedMessage id="Expense.RequestDetails" defaultMessage="Request Details" />
                  ) : (
                    <FormattedMessage id="Expense.InvoiceItems" defaultMessage="Invoice items" />
                  )}
                </Span>
              )}
              <StyledHr flex="1 1" borderColor="black.300" ml={2} />
            </Flex>
            {!expense && loading ? (
              <LoadingPlaceholder height={68} mb={3} />
            ) : (
              <div data-cy="expense-summary-items">
                {expenseItems.map((attachment, attachmentIdx) => (
                  <React.Fragment key={attachment.id || attachmentIdx}>
                    <Flex my={24} flexWrap="wrap" data-cy="expense-summary-item">
                      {attachment.url && expenseItemsMustHaveFiles(expense.type) && (
                        <Box mr={3} mb={3} width={['100%', 'auto']}>
                          <UploadedFilePreview
                            url={attachment.url}
                            loading={loading || loadingLoggedInUser}
                            isPrivate={!attachment.url && !loading}
                            size={[64, 48]}
                            maxHeight={48}
                            openFileViewer={openFileViewer}
                          />
                        </Box>
                      )}
                      <Flex justifyContent="space-between" alignItems="flex-start" flex="1">
                        <Flex flexDirection="column" justifyContent="center" flexGrow="1">
                          {attachment.description ? (
                            <HTMLContent
                              content={attachment.description}
                              fontSize="14px"
                              color="black.900"
                              collapsable
                              fontWeight="500"
                              maxCollapsedHeight={100}
                              collapsePadding={22}
                            />
                          ) : (
                            <Span color="black.600" fontStyle="italic">
                              <FormattedMessage id="NoDescription" defaultMessage="No description provided" />
                            </Span>
                          )}
                          {!isGrant && (
                            <Span mt={1} fontSize="12px" color="black.700">
                              <FormattedMessage
                                id="withColon"
                                defaultMessage="{item}:"
                                values={{
                                  item: <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />,
                                }}
                              />{' '}
                              {/* Using timeZone=UTC as we only store the date as a UTC string, without time */}
                              <FormattedDate value={attachment.incurredAt} dateStyle="long" timeZone="UTC" />{' '}
                            </Span>
                          )}
                        </Flex>
                        <Container
                          fontSize={15}
                          color="black.600"
                          mt={2}
                          textAlign="right"
                          ml={3}
                          data-cy="expense-summary-item-amount"
                        >
                          {attachment.amountV2?.exchangeRate ? (
                            <div>
                              <FormattedMoneyAmount
                                amount={Math.round(
                                  attachment.amountV2.valueInCents * attachment.amountV2.exchangeRate.value,
                                )}
                                currency={expense.currency}
                                amountClassName="font-medium text-foreground"
                                precision={2}
                              />
                              <div className="mt-[2px] text-xs">
                                <AmountWithExchangeRateInfo
                                  amount={attachment.amountV2}
                                  invertIconPosition
                                  {...getExpenseExchangeRateWarningOrError(
                                    intl,
                                    attachment.amountV2.exchangeRate,
                                    attachment.referenceExchangeRate,
                                  )}
                                />
                              </div>
                            </div>
                          ) : (
                            <FormattedMoneyAmount
                              amount={attachment.amountV2?.valueInCents || attachment.amount}
                              currency={attachment.amountV2?.currency || expense.currency}
                              amountClassName="font-medium text-foreground"
                              precision={2}
                            />
                          )}
                        </Container>
                      </Flex>
                    </Flex>
                    <StyledHr borderStyle="dotted" />
                  </React.Fragment>
                ))}
              </div>
            )}
            <Flex flexDirection="column" alignItems="flex-end" mt={4} mb={2}>
              <Flex alignItems="center">
                {!expense && loading ? (
                  <LoadingPlaceholder height={18} width={150} />
                ) : (
                  <ExpenseAmountBreakdown
                    currency={expense.currency}
                    items={expenseItems}
                    taxes={expenseTaxes}
                    expenseTotalAmount={expense.amount}
                  />
                )}
              </Flex>
              {isMultiCurrency && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Container fontWeight="500" mr={3} whiteSpace="nowrap">
                    <FormattedMessage
                      defaultMessage="Accounted as ({currency}):"
                      id="4Wdhe4"
                      values={{ currency: expense.amountInAccountCurrency.currency }}
                    />
                  </Container>
                  <Container>
                    <AmountWithExchangeRateInfo amount={expense.amountInAccountCurrency} />
                  </Container>
                </div>
              )}
            </Flex>
            {expenseTypeSupportsAttachments(expense?.type) && expense?.attachedFiles?.length > 0 && (
              <React.Fragment>
                <Flex my={4} alignItems="center">
                  {!expense && loading ? (
                    <LoadingPlaceholder height={20} maxWidth={150} />
                  ) : (
                    <Span fontWeight="bold" fontSize="16px">
                      <FormattedMessage id="Expense.Attachments" defaultMessage="Attachments" />
                    </Span>
                  )}
                  <StyledHr flex="1 1" borderColor="black.300" ml={2} />
                </Flex>
                <ExpenseAttachedFiles files={expense.attachedFiles} openFileViewer={openFileViewer} />
              </React.Fragment>
            )}
          </div>
        </div>
        <Box my={4}>
          <PrivateCommentsMessage
            isAllowed={expense?.permissions.canComment}
            isLoading={loadingLoggedInUser || isRefetchingDataForUser}
          />
        </Box>

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
      </SheetBody>
      {showFilesViewerModal &&
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
            onClose={isDrawer && isDesktop ? onClose : () => setShowFilesViewerModal(false)}
            hideCloseButton={isDrawer && isDesktop}
          />,
          document.body,
        )}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit expense title</DialogTitle>
          </DialogHeader>
          <Label>Title</Label>
          <Input defaultValue={expense?.description} />
          <DialogFooter>
            <Button variant="secondary">Close</Button>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
