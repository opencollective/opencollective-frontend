import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { themeGet } from '@styled-system/theme-get';
import { includes } from 'lodash';
import { FormattedDate, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import expenseStatus from '../../lib/constants/expense-status';
import expenseTypes from '../../lib/constants/expenseTypes';
import { PayoutMethodType } from '../../lib/constants/payout-method';
import { AmountPropTypeShape } from '../../lib/prop-types';

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
import UploadedFilePreview from '../UploadedFilePreview';

import ExpenseAmountBreakdown from './ExpenseAmountBreakdown';
import ExpenseMoreActionsButton from './ExpenseMoreActionsButton';
import ExpensePayeeDetails from './ExpensePayeeDetails';
import ExpenseStatusTag from './ExpenseStatusTag';
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
    <LinkCollective collective={account}>
      <Span color="black.800" fontWeight={500} textDecoration="none">
        {account ? account.name : <FormattedMessage id="profile.incognito" defaultMessage="Incognito" />}
      </Span>
    </LinkCollective>
  );
};

CreatedByUserLink.propTypes = {
  account: PropTypes.object,
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
  borderless,
  canEditTags,
  suggestedTags,
  showProcessButtons,
  onClose,
  onDelete,
  onEdit,
  ...props
}) => {
  const isReceipt = expense?.type === expenseTypes.RECEIPT;
  const isCreditCardCharge = expense?.type === expenseTypes.CHARGE;
  const isGrant = expense?.type === expenseTypes.GRANT;
  const existsInAPI = expense && (expense.id || expense.legacyId);
  const createdByAccount = expense?.requestedByAccount || expense?.createdByAccount || {};
  const expenseItems = expense?.items.length > 0 ? expense.items : expense?.draft?.items || [];
  const expenseTaxes = expense?.taxes?.length > 0 ? expense.taxes : expense?.draft?.taxes || [];
  const isMultiCurrency =
    expense?.amountInAccountCurrency && expense.amountInAccountCurrency.currency !== expense.currency;

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
            {isLoading ? <LoadingPlaceholder height={32} minWidth={250} /> : expense.description}
          </H4>
        </Flex>
        <Flex mb={[3, 0]} justifyContent={['space-between', 'flex-end']} alignItems="center">
          {expense?.status && (
            <Box>
              <ExpenseStatusTag
                display="block"
                status={expense.status}
                letterSpacing="0.8px"
                fontWeight="600"
                fontSize="10px"
                showTaxFormTag={includes(expense.requiredLegalDocuments, 'US_TAX_FORM')}
                showTaxFormMsg={expense.payee.isAdmin}
              />
            </Box>
          )}
        </Flex>
      </Flex>
      <Tags expense={expense} isLoading={isLoading} canEdit={canEditTags} suggestedTags={suggestedTags} />
      <Flex alignItems="center" mt={3}>
        {isLoading ? (
          <LoadingPlaceholder height={24} width={200} />
        ) : (
          <React.Fragment>
            <LinkCollective collective={createdByAccount}>
              <Avatar collective={createdByAccount} size={24} />
            </LinkCollective>
            <P ml={2} fontSize="12px" color="black.600" data-cy="expense-author">
              {expense.requestedByAccount ? (
                <FormattedMessage
                  id="Expense.RequestedByOnDate"
                  defaultMessage="Invited by {name} on {date, date, long}"
                  values={{
                    name: <CreatedByUserLink account={createdByAccount} />,
                    date: new Date(expense.createdAt),
                  }}
                />
              ) : expense.createdAt ? (
                <FormattedMessage
                  id="Expense.SubmittedByOnDate"
                  defaultMessage="Submitted by {name} on {date, date, long}"
                  values={{
                    name: <CreatedByUserLink account={createdByAccount} />,
                    date: new Date(expense.createdAt),
                  }}
                />
              ) : (
                <FormattedMessage
                  id="Expense.SubmittedBy"
                  defaultMessage="Submitted by {name}"
                  values={{ name: <CreatedByUserLink account={createdByAccount} /> }}
                />
              )}
            </P>
          </React.Fragment>
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

      <Flex my={4} alignItems="center">
        {isLoading ? (
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
      {isLoading ? (
        <LoadingPlaceholder height={68} mb={3} />
      ) : (
        <div data-cy="expense-summary-items">
          {expenseItems.map(attachment => (
            <React.Fragment key={attachment.id}>
              <Flex my={24} flexWrap="wrap">
                {(isReceipt || attachment.url) && (
                  <Box mr={3} mb={3} width={['100%', 'auto']}>
                    <UploadedFilePreview
                      url={attachment.url}
                      isLoading={isLoading || isLoadingLoggedInUser}
                      isPrivate={!attachment.url && !isLoading}
                      size={[640, 48]}
                      maxHeight={48}
                    />
                  </Box>
                )}
                <Flex justifyContent="space-between" alignItems="baseline" flex="1">
                  <Flex flexDirection="column" justifyContent="center" flexGrow="1">
                    {attachment.description ? (
                      <HTMLContent
                        content={attachment.description}
                        fontSize="12px"
                        color="black.900"
                        collapsable
                        fontWeight="500"
                        maxCollapsedHeight={100}
                        collapsePadding={22}
                      />
                    ) : (
                      <Span color="black.500" fontStyle="italic">
                        <FormattedMessage id="NoDescription" defaultMessage="No description provided" />
                      </Span>
                    )}
                    {!isGrant && (
                      <Span mt={1} fontSize="12px" color="black.500">
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
          {isLoading ? (
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
      <ExpensePayeeDetails
        isLoading={isLoading}
        host={host}
        expense={expense}
        collective={collective}
        isDraft={!isEditing && expense?.status === expenseStatus.DRAFT}
      />
      {!isEditing && (
        <Container
          display="flex"
          width={1}
          justifyContent="space-between"
          flexDirection={['column-reverse', null, 'row']}
          alignItems="flex-end"
          borderTop="1px solid #DCDEE0"
          mt={4}
          pt={12}
        >
          <ExpenseMoreActionsButton
            onEdit={onEdit}
            expense={expense}
            mt={['16px', null, '8px']}
            onDelete={() => {
              onDelete?.(expense);
              onClose?.();
            }}
          />
          {Boolean(showProcessButtons && existsInAPI && collective && hasProcessButtons(expense?.permissions)) && (
            <Flex flexWrap="wrap">
              <ProcessExpenseButtons
                expense={expense}
                isMoreActions
                permissions={expense?.permissions}
                collective={collective}
                host={host}
                onDelete={() => {
                  onDelete?.(expense);
                  onClose?.();
                }}
                displayMarkAsIncomplete
              />
            </Flex>
          )}
        </Container>
      )}
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
    description: PropTypes.string.isRequired,
    longDescription: PropTypes.string,
    amount: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    invoiceInfo: PropTypes.string,
    createdAt: PropTypes.string,
    status: PropTypes.oneOf(Object.values(expenseStatus)),
    type: PropTypes.oneOf(Object.values(expenseTypes)).isRequired,
    tags: PropTypes.arrayOf(PropTypes.string),
    requiredLegalDocuments: PropTypes.arrayOf(PropTypes.string),
    amountInAccountCurrency: AmountPropTypeShape,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        incurredAt: PropTypes.string,
        description: PropTypes.string,
        amount: PropTypes.number.isRequired,
        url: PropTypes.string,
      }).isRequired,
    ).isRequired,
    taxes: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        rate: PropTypes.number,
      }).isRequired,
    ).isRequired,
    payee: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      isAdmin: PropTypes.bool,
    }).isRequired,
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
      ).isRequired,
    }),
    permissions: PropTypes.shape({
      canSeeInvoiceInfo: PropTypes.bool,
      canDelete: PropTypes.bool,
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
  /** Passed down from pages/expense.js */
  onEdit: PropTypes.func,
  /** Passed down from either ExpenseModal or pages/expense.js */
  onDelete: PropTypes.func,
};

export default ExpenseSummary;
