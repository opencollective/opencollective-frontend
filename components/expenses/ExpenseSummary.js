import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { themeGet } from '@styled-system/theme-get';
import { includes } from 'lodash';
import { MessageSquare } from 'lucide-react';
import { createPortal } from 'react-dom';
import { FormattedDate, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import expenseTypes from '../../lib/constants/expenseTypes';
import { PayoutMethodType } from '../../lib/constants/payout-method';
import { ExpenseStatus } from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { AmountPropTypeShape } from '../../lib/prop-types';
import { shouldDisplayExpenseCategoryPill } from './lib/accounting-categories';
import { expenseTypeSupportsAttachments } from './lib/attachments';
import { expenseItemsMustHaveFiles } from './lib/items';

import { AccountHoverCard } from '../AccountHoverCard';
import AmountWithExchangeRateInfo from '../AmountWithExchangeRateInfo';
import Avatar from '../Avatar';
import Container from '../Container';
import FormattedMoneyAmount, { DEFAULT_AMOUNT_STYLES } from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import HTMLContent from '../HTMLContent';
import LinkCollective from '../LinkCollective';
import LoadingPlaceholder from '../LoadingPlaceholder';
import StyledCard from '../StyledCard';
import StyledHr from '../StyledHr';
import Tags from '../Tags';
import { H1, H4, P, Span } from '../Text';
import { Separator } from '../ui/Separator';
import UploadedFilePreview from '../UploadedFilePreview';

import { AccountingCategoryPill } from './AccountingCategoryPill';
import ExpenseAmountBreakdown from './ExpenseAmountBreakdown';
import ExpenseAttachedFiles from './ExpenseAttachedFiles';
import ExpenseMoreActionsButton from './ExpenseMoreActionsButton';
import ExpenseStatusTag from './ExpenseStatusTag';
import ExpenseSummaryAdditionalInformation from './ExpenseSummaryAdditionalInformation';
import ProcessExpenseButtons, { hasProcessButtons } from './ProcessExpenseButtons';

export const SummaryHeader = styled(H1)`
  > a {
    color: inherit;
    text-decoration: underline;

    :hover {
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

CreatedByUserLink.propTypes = {
  account: PropTypes.object,
};

const Spacer = () => <Span mx="6px">{'•'}</Span>;

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
  suggestedTags,
  showProcessButtons,
  onClose = undefined,
  onDelete,
  onEdit,
  drawerActionsContainer,
  openFileViewer,
  ...props
}) => {
  const isReceipt = expense?.type === expenseTypes.RECEIPT;
  const isCreditCardCharge = expense?.type === expenseTypes.CHARGE;
  const isGrant = expense?.type === expenseTypes.GRANT;
  const isDraft = expense?.status === ExpenseStatus.DRAFT;
  const existsInAPI = expense && (expense.id || expense.legacyId);
  const createdByAccount =
    (isDraft ? expense?.requestedByAccount || expense?.createdByAccount : expense?.createdByAccount) || {};
  const expenseItems = expense?.items?.length > 0 ? expense.items : expense?.draft?.items || [];
  const expenseTaxes = expense?.taxes?.length > 0 ? expense.taxes : expense?.draft?.taxes || [];
  const isMultiCurrency =
    expense?.amountInAccountCurrency && expense.amountInAccountCurrency.currency !== expense.currency;
  const { LoggedInUser } = useLoggedInUser();
  const isLoggedInUserExpenseHostAdmin = LoggedInUser?.isHostAdmin(expense?.account);
  const isLoggedInUserExpenseAdmin = LoggedInUser?.isAdminOfCollective(expense?.account);
  const isViewingExpenseInHostContext = isLoggedInUserExpenseHostAdmin && !isLoggedInUserExpenseAdmin;

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
        onEdit={onEdit}
        expense={expense}
        isViewingExpenseInHostContext={isViewingExpenseInHostContext}
        disabled={isLoading}
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
        <Flex mr={[0, 2]}>
          <H4 fontWeight="500" data-cy="expense-description">
            {!expense?.description && isLoading ? (
              <LoadingPlaceholder height={32} minWidth={250} />
            ) : (
              expense.description
            )}
          </H4>
        </Flex>
        <Flex mb={[3, 0]} justifyContent={['space-between', 'flex-end']} alignItems="center">
          {expense?.status && (
            <Box>
              <ExpenseStatusTag
                display="block"
                status={expense.onHold ? 'ON_HOLD' : expense.status}
                letterSpacing="0.8px"
                fontWeight="bold"
                fontSize="12px"
                showTaxFormTag={includes(expense.requiredLegalDocuments, 'US_TAX_FORM')}
                showTaxFormMsg={expense.payee.isAdmin}
              />
            </Box>
          )}
        </Flex>
      </Flex>
      <div className="flex gap-2 align-middle">
        {shouldDisplayExpenseCategoryPill(LoggedInUser, expense, collective, host) && (
          <React.Fragment>
            <AccountingCategoryPill
              host={host}
              expense={expense}
              canEdit={Boolean(expense.permissions?.canEditAccountingCategory)}
              allowNone={!isLoggedInUserExpenseHostAdmin}
              showCodeInSelect={isLoggedInUserExpenseHostAdmin}
            />
            <Separator orientation="vertical" className="h-[24px] w-[2px]" />
          </React.Fragment>
        )}
        <Tags expense={expense} isLoading={isLoading} canEdit={canEditTags} suggestedTags={suggestedTags} />
      </div>
      <Flex alignItems="center" mt="12px">
        {isLoading && !expense ? (
          <LoadingPlaceholder height={24} width={200} />
        ) : (
          <React.Fragment>
            <LinkCollective collective={createdByAccount}>
              <Avatar collective={createdByAccount} size={24} />
            </LinkCollective>
            <P ml={2} lineHeight="16px" fontSize="14px" color="black.700" data-cy="expense-author">
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
            </P>
          </React.Fragment>
        )}
      </Flex>
      <Flex alignItems="center" mt="12px">
        {isLoading && !expense ? (
          <LoadingPlaceholder height={24} width={200} />
        ) : (
          <P fontSize="14px" color="black.700" data-cy="expense-author">
            <FormattedDate value={expense.createdAt} dateStyle="medium" />
            {expense?.comments && (
              <React.Fragment>
                <Spacer />
                <MessageSquare size="16px" style={{ display: 'inline-block' }} />
                &nbsp;
                {expense.comments.totalCount}
              </React.Fragment>
            )}
            {expense?.merchantId && (
              <React.Fragment>
                <Spacer />
                <FormattedMessage
                  id="Expense.MerchantId"
                  defaultMessage="Merchant ID: {id}"
                  values={{ id: expense.merchantId }}
                />
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

      <Flex mt={4} mb={2} alignItems="center">
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
        <StyledHr flex="1 1" borderColor="black.300" ml={2} />
      </Flex>
      {!expense && isLoading ? (
        <LoadingPlaceholder height={68} mb={3} />
      ) : (
        <div data-cy="expense-summary-items">
          {expenseItems.map((attachment, attachmentIdx) => (
            <React.Fragment key={attachment.id || attachmentIdx}>
              <Flex my={24} flexWrap="wrap">
                {attachment.url && expenseItemsMustHaveFiles(expense.type) && (
                  <Box mr={3} mb={3} width={['100%', 'auto']}>
                    <UploadedFilePreview
                      url={attachment.url}
                      isLoading={isLoading || isLoadingLoggedInUser}
                      isPrivate={!attachment.url && !isLoading}
                      size={[640, 48]}
                      maxHeight={48}
                      openFileViewer={openFileViewer}
                    />
                  </Box>
                )}
                <Flex justifyContent="space-between" alignItems="baseline" flex="1">
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
                  <P fontSize={15} color="black.600" mt={2} textAlign="right" ml={3}>
                    <FormattedMoneyAmount
                      amount={attachment.amount}
                      currency={expense.currency}
                      amountStyles={{ ...DEFAULT_AMOUNT_STYLES, fontWeight: '500' }}
                      precision={2}
                    />
                  </P>
                </Flex>
              </Flex>
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
          <Flex alignItems="center" mt={2}>
            <Container fontSize="12px" fontWeight="500" mr={3} whiteSpace="nowrap" color="black.600">
              <FormattedMessage
                defaultMessage="Accounted as ({currency}):"
                values={{ currency: expense.amountInAccountCurrency.currency }}
              />
            </Container>
            <Container color="black.600">
              <AmountWithExchangeRateInfo amount={expense.amountInAccountCurrency} />
            </Container>
          </Flex>
        )}
      </Flex>
      {expenseTypeSupportsAttachments(expense?.type) && expense?.attachedFiles?.length > 0 && (
        <React.Fragment>
          <Flex my={4} alignItems="center">
            {!expense && isLoading ? (
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

      <Flex mt={4} mb={3} alignItems="center">
        <Span fontWeight="bold" fontSize="16px">
          <FormattedMessage defaultMessage="Additional Information" />
        </Span>
        <StyledHr flex="1 1" borderColor="black.300" ml={2} />
      </Flex>

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
        ) : (
          <Fragment>
            <StyledHr flex="1" mt={4} mb={3} borderColor="black.300" />
            {processButtons}
          </Fragment>
        ))}
    </StyledCard>
  );
};

ExpenseSummary.propTypes = {
  /** Set this to true if the expense is not loaded yet */
  isLoading: PropTypes.bool,
  /** Set this to true if the logged in user is currenltly loading */
  isLoadingLoggedInUser: PropTypes.bool,
  host: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    website: PropTypes.string,
    location: PropTypes.shape({
      address: PropTypes.string,
      country: PropTypes.string,
    }),
  }),
  /** Must be provided if isLoading is false */
  expense: PropTypes.shape({
    id: PropTypes.string,
    legacyId: PropTypes.number,
    accountingCategory: PropTypes.object,
    description: PropTypes.string.isRequired,
    longDescription: PropTypes.string,
    amount: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    invoiceInfo: PropTypes.string,
    merchantId: PropTypes.string,
    createdAt: PropTypes.string,
    status: PropTypes.oneOf(Object.values(ExpenseStatus)),
    onHold: PropTypes.bool,
    type: PropTypes.oneOf(Object.values(expenseTypes)).isRequired,
    tags: PropTypes.arrayOf(PropTypes.string),
    requiredLegalDocuments: PropTypes.arrayOf(PropTypes.string),
    amountInAccountCurrency: AmountPropTypeShape,
    account: PropTypes.shape({
      id: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      host: PropTypes.shape({
        id: PropTypes.string.isRequired,
      }),
      parent: PropTypes.shape({
        id: PropTypes.string.isRequired,
      }),
    }).isRequired,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        incurredAt: PropTypes.string,
        description: PropTypes.string,
        amount: PropTypes.number.isRequired,
        url: PropTypes.string,
      }).isRequired,
    ),
    attachedFiles: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        url: PropTypes.string.isRequired,
      }).isRequired,
    ),
    taxes: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        rate: PropTypes.number,
      }).isRequired,
    ),
    payee: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      isAdmin: PropTypes.bool,
    }).isRequired,
    approvedBy: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        slug: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        isAdmin: PropTypes.bool,
      }),
    ),
    payeeLocation: PropTypes.shape({
      address: PropTypes.string,
      country: PropTypes.string,
    }),
    createdByAccount: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
    }),
    requestedByAccount: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
    }),
    payoutMethod: PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.oneOf(Object.values(PayoutMethodType)),
      data: PropTypes.object,
    }),
    draft: PropTypes.shape({
      items: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          incurredAt: PropTypes.string,
          description: PropTypes.string,
          amount: PropTypes.number.isRequired,
          url: PropTypes.string,
        }),
      ),
      taxes: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.string,
          rate: PropTypes.number,
        }).isRequired,
      ),
    }),
    permissions: PropTypes.shape({
      canSeeInvoiceInfo: PropTypes.bool,
      canDelete: PropTypes.bool,
      canEditAccountingCategory: PropTypes.bool,
    }),
    comments: PropTypes.shape({
      totalCount: PropTypes.number,
    }),
  }),
  /** Whether current user can edit the tags */
  canEditTags: PropTypes.bool,
  /** If canEdit is true, this array is used to display suggested tags */
  suggestedTags: PropTypes.arrayOf(PropTypes.string),
  /** Whether or not this is being displayed for an edited Expense */
  isEditing: PropTypes.bool,
  /** Whether to show the process buttons (Approve, Pay, etc) */
  showProcessButtons: PropTypes.bool,
  /** The account where the expense has been submitted, required to display the process actions */
  collective: PropTypes.object,
  /** Disable border and paiding in styled card, usefull for modals */
  borderless: PropTypes.bool,
  /** Passed down from ExpenseModal */
  onClose: PropTypes.func,
  /** Passed down from Expense */
  onEdit: PropTypes.func,
  /** Passed down from either ExpenseModal or Expense */
  onDelete: PropTypes.func,
  /** Passwed down from Expense */
  openFileViewer: PropTypes.func,
  /** Reference to the actions container element in the Expense Drawer */
  drawerActionsContainer: PropTypes.object,
};

export default ExpenseSummary;
