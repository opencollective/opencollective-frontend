import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { includes, pick } from 'lodash';
import { FormattedDate, FormattedMessage } from 'react-intl';

import expenseStatus from '../../lib/constants/expense-status';
import expenseTypes from '../../lib/constants/expenseTypes';
import { PayoutMethodType } from '../../lib/constants/payout-method';

import Avatar from '../Avatar';
import Container from '../Container';
import FormattedMoneyAmount, { DEFAULT_AMOUNT_STYLES } from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import HTMLContent from '../HTMLContent';
import LinkCollective from '../LinkCollective';
import LoadingPlaceholder from '../LoadingPlaceholder';
import StyledCard from '../StyledCard';
import StyledHr from '../StyledHr';
import { H4, P, Span } from '../Text';
import UploadedFilePreview from '../UploadedFilePreview';

import ExpenseAdminActions from './ExpenseAdminActions';
import ExpenseItemsTotalAmount from './ExpenseItemsTotalAmount';
import ExpensePayeeDetails from './ExpensePayeeDetails';
import ExpenseStatusTag from './ExpenseStatusTag';
import ExpenseTags from './ExpenseTags';
import ProcessExpenseButtons, { hasProcessButtons } from './ProcessExpenseButtons';

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
  permissions,
  isEditing,
  borderless,
  onClose,
  onDelete,
  onEdit,
  onError,
  ...props
}) => {
  const isReceipt = expense?.type === expenseTypes.RECEIPT;
  const isCreditCardCharge = expense?.type === expenseTypes.CHARGE;
  const isFundingRequest = expense?.type === expenseTypes.FUNDING_REQUEST;
  const existsInAPI = expense && (expense.id || expense.legacyId);
  const showProcessButtons = !isEditing && existsInAPI && collective && hasProcessButtons(permissions);
  const createdByAccount = expense?.requestedByAccount || expense?.createdByAccount || {};

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
          {!isLoading && expense.id && (
            <Box display={['flex', 'none']}>
              <ExpenseAdminActions
                collective={collective}
                expense={expense}
                permissions={pick(expense.permissions, ['canSeeInvoiceInfo', 'canDelete'])}
                buttonProps={{ size: 32, m: 1 }}
                linkAction="link"
                onDelete={() => {
                  onClose?.();
                  onDelete?.(expense);
                }}
              />
            </Box>
          )}
        </Flex>
      </Flex>
      <ExpenseTags expense={expense} isLoading={isLoading} />
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
                  defaultMessage="Requested by {name} on {date, date, long}"
                  values={{
                    name: <CreatedByUserLink account={createdByAccount} />,
                    date: new Date(expense.createdAt),
                  }}
                />
              ) : expense.createdAt ? (
                <FormattedMessage
                  id="Expense.SubmittedByOnDate"
                  defaultMessage="Submitted by {name} on {date, date, long}"
                  values={{ name: <CreatedByUserLink account={createdByAccount} />, date: new Date(expense.createdAt) }}
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
      {isFundingRequest && expense.longDescription && (
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
            ) : isFundingRequest ? (
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
          {(expense.items.length > 0 ? expense.items : expense.draft?.items || []).map(attachment => (
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
                      isFundingRequest ? (
                        <HTMLContent
                          content={attachment.description}
                          fontSize="12px"
                          data-cy="comment-body"
                          sanitize
                          collapsable
                          color="black.900"
                          fontWeight="500"
                        />
                      ) : (
                        <Span as="div" color="black.900" fontWeight="500">
                          {attachment.description}
                        </Span>
                      )
                    ) : (
                      <Span color="black.500" fontStyle="italic">
                        <FormattedMessage id="NoDescription" defaultMessage="No description provided" />
                      </Span>
                    )}
                    {!isFundingRequest && (
                      <Span mt={1} fontSize="12px" color="black.500">
                        <FormattedMessage
                          id="withColon"
                          defaultMessage="{item}:"
                          values={{
                            item: <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />,
                          }}
                        />{' '}
                        <FormattedDate value={attachment.incurredAt} />
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
      <Flex justifyContent="flex-end" mt={4} mb={2}>
        <Flex alignItems="center">
          <Container fontSize="12px" fontWeight="500" mr={3} whiteSpace="nowrap">
            <FormattedMessage id="ExpenseFormAttachments.TotalAmount" defaultMessage="Total amount:" />
          </Container>
          {isLoading ? (
            <LoadingPlaceholder height={18} width={100} />
          ) : (
            <ExpenseItemsTotalAmount currency={expense.currency} items={expense.items} />
          )}
        </Flex>
      </Flex>
      <ExpensePayeeDetails
        isLoading={isLoading}
        host={host}
        expense={expense}
        collective={collective}
        isDraft={!isEditing && expense?.status == expenseStatus.DRAFT}
      />
      {showProcessButtons && (
        <Container
          display="flex"
          width={1}
          justifyContent={['end', 'space-between', 'end']}
          alignItems="flex-end"
          borderTop="1px solid #DCDEE0"
          mt={4}
          pt={12}
        >
          <Box display={['none', 'flex', 'none']} alignItems="center">
            <ExpenseAdminActions
              collective={collective}
              expense={expense}
              permissions={expense?.permissions}
              buttonProps={{ size: 32, m: 1 }}
              linkAction="link"
              onDelete={() => {
                onClose();
                if (onDelete) {
                  onDelete(expense);
                }
              }}
              onError={error => onError({ error })}
              onEdit={onEdit}
            />
          </Box>
          <Flex flexWrap="wrap" justifyContent="flex-end">
            <ProcessExpenseButtons expense={expense} permissions={permissions} collective={collective} host={host} />
          </Flex>
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
    currency: PropTypes.string.isRequired,
    invoiceInfo: PropTypes.string,
    createdAt: PropTypes.string,
    status: PropTypes.oneOf(Object.values(expenseStatus)),
    type: PropTypes.oneOf(Object.values(expenseTypes)).isRequired,
    tags: PropTypes.arrayOf(PropTypes.string),
    requiredLegalDocuments: PropTypes.arrayOf(PropTypes.string),
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        incurredAt: PropTypes.string,
        description: PropTypes.string,
        amount: PropTypes.number.isRequired,
        url: PropTypes.string,
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
    }),
    permissions: PropTypes.shape({
      canSeeInvoiceInfo: PropTypes.bool,
      canDelete: PropTypes.bool,
    }),
  }),
  /** Wether or not this is being displayed for an edited Expense */
  isEditing: PropTypes.bool,
  /** The account where the expense has been submitted, required to display the process actions */
  collective: PropTypes.object,
  /** To know which process buttons to display (if any) */
  permissions: PropTypes.object,
  /** Disable border and paiding in styled card, usefull for modals */
  borderless: PropTypes.bool,
  /** Passed down from ExpenseModal */
  onClose: PropTypes.func,
  /** Passed down from pages/expense.js */
  onEdit: PropTypes.func,
  onError: PropTypes.func,
  /** Passed down from either ExpenseModal or pages/expense.js */
  onDelete: PropTypes.func,
};

export default ExpenseSummary;
