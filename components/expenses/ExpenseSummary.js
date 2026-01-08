import React, { Fragment } from 'react';
import { themeGet } from '@styled-system/theme-get';
import { includes } from 'lodash';
import { Download, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/router';
import { createPortal } from 'react-dom';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { styled } from 'styled-components';

import expenseTypes from '../../lib/constants/expenseTypes';
import { i18nGraphqlException } from '../../lib/errors';
import { ExpenseStatus } from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '../../lib/preview-features';
import { cn, parseToBoolean } from '../../lib/utils';
import { shouldDisplayExpenseCategoryPill } from './lib/accounting-categories';
import { expenseTypeSupportsAttachments } from './lib/attachments';
import { expenseItemsMustHaveFiles, getExpenseItemAmountV2FromNewAttrs } from './lib/items';
import { getExpenseExchangeRateWarningOrError } from './lib/utils';
import { isFeatureEnabled } from '@/lib/allowed-features';
import { ExpenseType } from '@/lib/graphql/types/v2/schema';

import { AccountHoverCard } from '../AccountHoverCard';
import AmountWithExchangeRateInfo from '../AmountWithExchangeRateInfo';
import Avatar from '../Avatar';
import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import HTMLContent from '../HTMLContent';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import LinkCollective from '../LinkCollective';
import LoadingPlaceholder from '../LoadingPlaceholder';
import StyledCard from '../StyledCard';
import StyledHr from '../StyledHr';
import Tags from '../Tags';
import { H1, P, Span } from '../Text';
import TruncatedTextWithTooltip from '../TruncatedTextWithTooltip';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';
import UploadedFilePreview from '../UploadedFilePreview';

import EditExpenseDialog from './EditExpenseDialog';
import { ExpenseAccountingCategoryPill } from './ExpenseAccountingCategoryPill';
import ExpenseAmountBreakdown from './ExpenseAmountBreakdown';
import ExpenseAttachedFiles from './ExpenseAttachedFiles';
import ExpenseInvoiceDownloadHelper from './ExpenseInvoiceDownloadHelper';
import ExpenseMoreActionsButton from './ExpenseMoreActionsButton';
import ExpenseStatusTag from './ExpenseStatusTag';
import ExpenseSummaryAdditionalInformation from './ExpenseSummaryAdditionalInformation';
import ExpenseTypeTag from './ExpenseTypeTag';
import ProcessExpenseButtons, { hasProcessButtons } from './ProcessExpenseButtons';

export const SummaryHeader = styled(H1)`
  > a {
    color: inherit;
    text-decoration: underline;

    &:hover {
      color: ${themeGet('colors.black.600')};
    }
  }
`;

const CreatedByUserLink = ({ account }) => {
  return (
    <LinkCollective collective={account} noTitle>
      <span className="font-medium text-foreground underline hover:text-primary">
        {account ? account.name : <FormattedMessage id="profile.incognito" defaultMessage="Incognito" />}
      </span>
    </LinkCollective>
  );
};

const Spacer = () => <Span mx="6px">{'•'}</Span>;

const prepareDraftItems = (items, expenseCurrency) => {
  if (!items) {
    return [];
  }

  return items.map(item => {
    const amountV2 = getExpenseItemAmountV2FromNewAttrs(item, expenseCurrency);
    return { ...item, amountV2 };
  });
};

/**
 * Last step of the create expense flow, shows the summary of the expense with
 * the ability to submit it.
 */
const ExpenseSummary = ({
  expense,
  collective,
  host,
  isLoading,
  isLoadingLoggedInUser,
  isEditing,
  borderless = undefined,
  canEditTags,
  showProcessButtons,
  onClose = undefined,
  onDelete,
  onEdit,
  drawerActionsContainer,
  openFileViewer,
  enableKeyboardShortcuts,
  openedItemId,
  onCloneModalOpenChange = undefined,
  ...props
}) => {
  const intl = useIntl();
  const { toast } = useToast();
  const router = useRouter();
  const isReceipt = expense?.type === expenseTypes.RECEIPT;
  const isCreditCardCharge = expense?.type === expenseTypes.CHARGE;
  const isGrant = expense?.type === expenseTypes.GRANT;
  const isDraft = expense?.status === ExpenseStatus.DRAFT;
  const isPaid = expense?.status === ExpenseStatus.PAID;
  const existsInAPI = expense && (expense.id || expense.legacyId);
  const createdByAccount =
    (isDraft ? expense?.requestedByAccount || expense?.createdByAccount : expense?.createdByAccount) || {};
  const expenseItems =
    expense?.items?.length > 0 ? expense.items : prepareDraftItems(expense?.draft?.items, expense?.currency);
  const expenseTaxes = expense?.taxes?.length > 0 ? expense.taxes : expense?.draft?.taxes || [];
  const isMultiCurrency =
    expense?.amountInAccountCurrency && expense.amountInAccountCurrency.currency !== expense.currency;
  const { LoggedInUser } = useLoggedInUser();
  const isLoggedInUserExpenseHostAdmin = LoggedInUser?.isHostAdmin(expense?.account);
  const isLoggedInUserExpenseAdmin = LoggedInUser?.isAdminOfCollective(expense?.account);
  const isViewingExpenseInHostContext = isLoggedInUserExpenseHostAdmin && !isLoggedInUserExpenseAdmin;
  const { canEditTitle, canEditType, canEditItems, canUsePrivateNote } = LoggedInUser?.hasPreviewFeatureEnabled(
    PREVIEW_FEATURE_KEYS.INLINE_EDIT_EXPENSE,
  )
    ? expense?.permissions || {}
    : {};
  const invoiceFile = React.useMemo(
    () => expense?.invoiceFile || expense?.draft?.invoiceFile,
    [expense?.invoiceFile, expense?.draft?.invoiceFile],
  );
  const attachedFiles = React.useMemo(
    () => (expense?.attachedFiles?.length ? expense.attachedFiles : (expense?.draft?.attachedFiles ?? [])),
    [expense?.attachedFiles, expense?.draft?.attachedFiles],
  );
  const hasNewEditFlow =
    LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.NEW_EXPENSE_FLOW) &&
    !parseToBoolean(router.query.forceLegacyFlow);

  const processButtons = (
    <Flex
      display="flex"
      flex={1}
      justifyContent="space-between"
      flexDirection={['column-reverse', 'row']}
      alignItems={['flex-end', 'center']}
      gridGap={[2, 3]}
    >
      <ExpenseMoreActionsButton
        onEdit={hasNewEditFlow ? undefined : onEdit}
        onCloneModalOpenChange={onCloneModalOpenChange}
        expense={expense}
        isViewingExpenseInHostContext={isViewingExpenseInHostContext}
        enableKeyboardShortcuts={enableKeyboardShortcuts}
        disabled={isLoading}
        hasAttachedInvoiceFile={Boolean(invoiceFile)}
        onDelete={() => {
          onDelete?.(expense);
          onClose?.();
        }}
      />
      {Boolean(showProcessButtons && existsInAPI && collective && hasProcessButtons(expense?.permissions)) && (
        <Flex flexWrap="wrap" gridGap={[2, 3]}>
          <ProcessExpenseButtons
            expense={expense}
            isMoreActions
            isViewingExpenseInHostContext={isViewingExpenseInHostContext}
            permissions={expense?.permissions}
            collective={collective}
            host={host}
            disabled={isLoading}
            onDelete={() => {
              onDelete?.(expense);
              onClose?.();
            }}
            enableKeyboardShortcuts={enableKeyboardShortcuts}
            displayMarkAsIncomplete
          />
        </Flex>
      )}
    </Flex>
  );

  return (
    <StyledCard
      p={borderless ? 0 : [16, 24, 32]}
      mb={borderless ? [4, 0] : 0}
      borderStyle={borderless ? 'none' : 'solid'}
      {...props}
    >
      <Flex
        flexDirection={['column-reverse', 'row']}
        alignItems={['stretch', 'center']}
        justifyContent="space-between"
        data-cy="expense-title"
        mb={3}
      >
        <div className="mr-0 flex items-center gap-4 sm:mr-2">
          <h4 className="text-xl font-medium" data-cy="expense-description">
            {!expense?.description && isLoading ? (
              <LoadingPlaceholder height={32} minWidth={250} />
            ) : (
              expense.description
            )}
          </h4>
          {canEditTitle && (
            <EditExpenseDialog
              expense={expense}
              field="title"
              title={intl.formatMessage({ defaultMessage: 'Edit expense title', id: 'expense.editTitle' })}
            />
          )}
        </div>
        <Flex mb={[3, 0]} justifyContent={['space-between', 'flex-end']} alignItems="center">
          {expense?.status && (
            <Box>
              <ExpenseStatusTag
                display="block"
                status={
                  expense.onHold
                    ? 'ON_HOLD'
                    : expense.type === ExpenseType.PLATFORM_BILLING && expense.status === ExpenseStatus.APPROVED
                      ? 'PAYMENT_DUE'
                      : expense.status
                }
                letterSpacing="0.8px"
                fontWeight="bold"
                fontSize="12px"
                showTaxFormTag={includes(expense.requiredLegalDocuments, 'US_TAX_FORM')}
                payee={expense.payee}
              />
            </Box>
          )}
        </Flex>
      </Flex>
      {expense?.type && (
        <div className="mb-3 flex items-center gap-1">
          <ExpenseTypeTag type={expense.type} legacyId={expense.legacyId} isLoading={isLoading} />

          {canEditType && (
            <EditExpenseDialog
              field="type"
              title={intl.formatMessage({ defaultMessage: 'Edit expense type', id: 'expense.editType' })}
              expense={expense}
              dialogContentClassName="sm:max-w-2xl"
            />
          )}
        </div>
      )}

      <div className="flex items-baseline gap-2">
        {shouldDisplayExpenseCategoryPill(LoggedInUser, expense, collective, host) && (
          <React.Fragment>
            <ExpenseAccountingCategoryPill
              host={host}
              account={expense.account}
              expense={expense}
              canEdit={
                isFeatureEnabled(host, 'CHART_OF_ACCOUNTS') && Boolean(expense.permissions?.canEditAccountingCategory)
              }
              allowNone={!isLoggedInUserExpenseHostAdmin}
              showCodeInSelect={isLoggedInUserExpenseHostAdmin}
            />
          </React.Fragment>
        )}
        <Tags expense={expense} canEdit={canEditTags} />
      </div>
      <Flex alignItems="center" mt="12px">
        {isLoading && !expense ? (
          <LoadingPlaceholder height={24} width={200} />
        ) : (
          <React.Fragment>
            <LinkCollective collective={createdByAccount}>
              <Avatar collective={createdByAccount} size={24} />
            </LinkCollective>
            <Container ml={2} lineHeight="16px" fontSize="14px" color="black.700" data-cy="expense-author">
              {isDraft && expense.requestedByAccount ? (
                <FormattedMessage
                  id="Expense.RequestedBy"
                  defaultMessage="Invited by {name}"
                  values={{
                    name: (
                      <AccountHoverCard
                        key="name"
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
                        key="name"
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
                          key="name"
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
            </Container>
          </React.Fragment>
        )}
      </Flex>
      <Flex alignItems="center" mt="12px">
        {isLoading && !expense ? (
          <LoadingPlaceholder height={24} width={200} />
        ) : (
          <P fontSize="14px" color="black.700" data-cy="expense-author">
            <FormattedDate value={expense.createdAt} dateStyle="medium" />
            {expense.merchantId && (
              <React.Fragment>
                <Spacer />
                <FormattedMessage
                  id="Expense.MerchantId"
                  defaultMessage="Merchant ID: {id}"
                  values={{ id: expense.merchantId }}
                />
              </React.Fragment>
            )}
            {expense.reference && (
              <React.Fragment>
                <Spacer />
                <FormattedMessage
                  id="ReferenceValue"
                  defaultMessage="Ref: {reference}"
                  values={{
                    reference: (
                      <TruncatedTextWithTooltip
                        key="reference"
                        value={expense.reference}
                        length={10}
                        truncatePosition="middle"
                      />
                    ),
                  }}
                />
              </React.Fragment>
            )}
            {expense.comments && (
              <React.Fragment>
                <Spacer />
                <MessageSquare size="16px" style={{ display: 'inline-block' }} />
                &nbsp;
                {expense.comments.totalCount}
              </React.Fragment>
            )}
          </P>
        )}
      </Flex>
      {isGrant && expense.longDescription && (
        <Fragment>
          <Flex alignItems="center" mt={4}>
            <Span fontWeight="bold" fontSize="16px">
              <FormattedMessage id="Expense.RequestDescription" defaultMessage="Request Description" />
            </Span>
            <StyledHr flex="1 1" borderColor="black.300" ml={2} />
          </Flex>
          <P mt={4}>{expense.longDescription}</P>
        </Fragment>
      )}

      <div className="my-8 rounded-lg border p-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">
            <FormattedMessage defaultMessage="Expense Details" id="+5Kafe" />
          </h3>
          {canEditItems && (
            <EditExpenseDialog
              expense={expense}
              dialogContentClassName="sm:max-w-2xl"
              field="expenseDetails"
              title={intl.formatMessage({ defaultMessage: 'Edit expense details', id: 'expense.editDetails' })}
            />
          )}
        </div>
        <Flex mt={4} mb={2} alignItems="center" gridGap={2}>
          {!expense && isLoading ? (
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
          <StyledHr flex="1 1" borderColor="black.300" />
        </Flex>
        {!expense && isLoading ? (
          <LoadingPlaceholder height={68} mb={3} />
        ) : (
          <div data-cy="expense-summary-items">
            {expenseItems.map((attachment, attachmentIdx) => (
              <React.Fragment key={attachment.id || attachmentIdx}>
                <div
                  data-cy="expense-summary-item"
                  className={cn(
                    'my-2 flex flex-wrap border-l-2 border-l-transparent py-4',
                    openedItemId === attachment.id &&
                      '-mr-2 -ml-6 rounded-r-lg border-l-blue-500 bg-blue-100 pr-2 pl-6',
                  )}
                >
                  {attachment.url && expenseItemsMustHaveFiles(expense.type) && (
                    <Box mr={3} mb={3} width={['100%', 'auto']}>
                      <UploadedFilePreview
                        url={attachment.url}
                        isLoading={isLoading || isLoadingLoggedInUser}
                        isPrivate={!attachment.url && !isLoading}
                        size={[64, 48]}
                        maxHeight={48}
                        openFileViewer={openFileViewer}
                      />
                    </Box>
                  )}
                  <Flex justifyContent="space-between" minWidth="0" alignItems="flex-start" flex="1">
                    <Flex flexDirection="column" minWidth="0" justifyContent="center" flexGrow="1">
                      {attachment.description ? (
                        <HTMLContent
                          content={attachment.description}
                          fontSize="14px"
                          color="black.900"
                          collapsable
                          fontWeight="500"
                          maxCollapsedHeight={100}
                          collapsePadding={22}
                          data-cy="expense-summary-item-description"
                        />
                      ) : (
                        <Span color="black.600" fontStyle="italic" data-cy="expense-summary-item-description">
                          <FormattedMessage id="NoDescription" defaultMessage="No description provided" />
                        </Span>
                      )}
                      {!isGrant && (
                        <Span mt={1} fontSize="12px" color="black.700">
                          <FormattedMessage
                            id="withColon"
                            defaultMessage="{item}:"
                            values={{
                              item: <FormattedMessage key="item" id="expense.incurredAt" defaultMessage="Date" />,
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
                </div>
                <StyledHr borderStyle="dotted" />
              </React.Fragment>
            ))}
          </div>
        )}
        <Flex flexDirection="column" alignItems="flex-end" mt={4} mb={2}>
          <Flex alignItems="center">
            {!expense && isLoading ? (
              <LoadingPlaceholder height={18} width={150} />
            ) : (
              <ExpenseAmountBreakdown
                currency={expense.currency}
                items={expenseItems}
                taxes={expenseTaxes}
                expenseTotalAmount={isEditing ? null : expense.amount}
              />
            )}
          </Flex>
          {isMultiCurrency && (
            <div className="mt-2 flex flex-wrap items-center justify-end gap-2 text-sm text-muted-foreground">
              <span>
                <FormattedMessage
                  defaultMessage="Accounted as ({currency}):"
                  id="4Wdhe4"
                  values={{
                    currency:
                      isPaid && expense.amountInHostCurrency
                        ? expense.amountInHostCurrency.currency
                        : expense.amountInAccountCurrency.currency,
                  }}
                />
              </span>
              <span>
                <AmountWithExchangeRateInfo
                  amount={
                    isPaid && expense.amountInHostCurrency
                      ? expense.amountInHostCurrency
                      : expense.amountInAccountCurrency
                  }
                />
              </span>
            </div>
          )}
        </Flex>
        {expense?.type === expenseTypes.INVOICE && expense.permissions?.canSeeInvoiceInfo && (
          <React.Fragment>
            <Flex my={4} alignItems="center" gridGap={2}>
              {!expense && isLoading ? (
                <LoadingPlaceholder height={20} maxWidth={150} />
              ) : (
                <Span fontWeight="bold" fontSize="16px">
                  <FormattedMessage defaultMessage="Invoice" id="Expense.Type.Invoice" />
                </Span>
              )}
              <StyledHr flex="1 1" borderColor="black.300" />
            </Flex>
            {invoiceFile ? (
              <ExpenseAttachedFiles files={[invoiceFile]} openFileViewer={openFileViewer} />
            ) : (
              <ExpenseInvoiceDownloadHelper
                expense={expense}
                collective={expense.account}
                onError={e =>
                  toast({
                    variant: 'error',
                    message: i18nGraphqlException(intl, e),
                  })
                }
              >
                {({ isLoading, downloadInvoice }) => (
                  <Button
                    variant="outline"
                    loading={isLoading}
                    onClick={downloadInvoice}
                    data-cy="download-expense-invoice-btn"
                  >
                    <Download size="16px" />
                    <FormattedMessage defaultMessage="Download generated invoice" id="OBGGNj" />
                  </Button>
                )}
              </ExpenseInvoiceDownloadHelper>
            )}
          </React.Fragment>
        )}
        {expenseTypeSupportsAttachments(expense?.type) && attachedFiles.length > 0 && (
          <React.Fragment>
            <Flex my={4} alignItems="center" gridGap={2}>
              {!expense && isLoading ? (
                <LoadingPlaceholder height={20} maxWidth={150} />
              ) : (
                <Span fontWeight="bold" fontSize="16px">
                  <FormattedMessage id="Expense.Attachments" defaultMessage="Attachments" />
                </Span>
              )}
              <StyledHr flex="1 1" borderColor="black.300" />
            </Flex>
            <ExpenseAttachedFiles files={attachedFiles} openFileViewer={openFileViewer} />
          </React.Fragment>
        )}
      </div>

      <Flex mt={4} mb={3} alignItems="center">
        <Span fontWeight="bold" fontSize="16px">
          <FormattedMessage defaultMessage="Additional Information" id="laUK3e" />
        </Span>
        <StyledHr flex="1 1" borderColor="black.300" ml={2} />
      </Flex>

      {expense?.privateMessage && (
        <Box mb={3} p={3} borderRadius="8px" backgroundColor="#f9fafb" border="1px solid" borderColor="black.200">
          <Flex alignItems="center" mb={2} justifyContent="space-between">
            <Flex alignItems="center" gap={6}>
              <Span fontSize="13px" fontWeight="500" color="black.700" lineHeight="16px" textTransform="uppercase">
                <FormattedMessage defaultMessage="Additional notes" id="xqG0ln" />
              </Span>
              <PrivateInfoIcon size={12}>
                <FormattedMessage
                  defaultMessage="This will only be visible to you, the Collective admins and its Fiscal Host"
                  id="734IeW"
                />
              </PrivateInfoIcon>
            </Flex>
            {canUsePrivateNote && (
              <EditExpenseDialog
                field="privateMessage"
                expense={expense}
                title={intl.formatMessage({ defaultMessage: 'Edit notes', id: 'expense.editNotes' })}
              />
            )}
          </Flex>
          <HTMLContent content={expense.privateMessage} fontSize="13px" color="black.800" />
        </Box>
      )}

      <ExpenseSummaryAdditionalInformation
        isLoading={isLoading}
        host={host}
        expense={expense}
        collective={collective}
        isDraft={!isEditing && expense?.status === ExpenseStatus.DRAFT}
      />
      {!isEditing &&
        (drawerActionsContainer ? (
          createPortal(processButtons, drawerActionsContainer)
        ) : showProcessButtons ? (
          <Fragment>
            <StyledHr flex="1" mt={4} mb={3} borderColor="black.300" />
            {processButtons}
          </Fragment>
        ) : null)}
    </StyledCard>
  );
};

export default ExpenseSummary;
