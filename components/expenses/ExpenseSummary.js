import React from 'react';
import PropTypes from 'prop-types';
import { includes } from 'lodash';
import { FormattedDate, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import expenseStatus from '../../lib/constants/expense-status';
import expenseTypes from '../../lib/constants/expenseTypes';
import { PayoutMethodType } from '../../lib/constants/payout-method';

import Avatar from '../Avatar';
import Container from '../Container';
import FormattedMoneyAmount, { DEFAULT_AMOUNT_STYLES } from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import LinkCollective from '../LinkCollective';
import LoadingPlaceholder from '../LoadingPlaceholder';
import LocationAddress from '../LocationAddress';
import StyledCard from '../StyledCard';
import StyledHr from '../StyledHr';
import StyledLink from '../StyledLink';
import { H4, P, Span } from '../Text';
import UploadedFilePreview from '../UploadedFilePreview';

import ExpenseItemsTotalAmount from './ExpenseItemsTotalAmount';
import ExpenseStatusTag from './ExpenseStatusTag';
import ExpenseTags from './ExpenseTags';
import PayoutMethodData from './PayoutMethodData';
import PayoutMethodTypeWithIcon from './PayoutMethodTypeWithIcon';
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

const PrivateInfoColumn = styled(Box).attrs({ mx: [0, '8px'], flexBasis: [0, '200px'] })`
  border-top: 1px solid #e8e9eb;
  padding-top: 16px;
  margin-top: 16px;
  flex: 1 1;
  min-width: 150px;
`;

const PrivateInfoColumnHeader = styled(H4).attrs({
  fontSize: 'Tiny',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  color: 'black.500',
  mb: 2,
  letterSpacing: 0,
})``;

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
  showProcessActions,
  borderless,
  ...props
}) => {
  const { payee, createdByAccount, payeeLocation } = expense || {};
  const isReceipt = expense?.type === expenseTypes.RECEIPT;
  const existsInAPI = expense && (expense.id || expense.legacyId);
  const showProcessButtons = showProcessActions && existsInAPI && collective && hasProcessButtons(permissions);

  return (
    <StyledCard p={borderless ? 0 : [16, 24, 32]} borderStyle={borderless ? 'none' : 'solid'} {...props}>
      <Flex justifyContent="space-between" alignItems="center">
        <H4 my={2} mr={2} fontWeight="500">
          {isLoading ? <LoadingPlaceholder height={32} minWidth={250} /> : expense.description}
        </H4>
        {expense?.status && (
          <ExpenseStatusTag
            display="block"
            status={expense.status}
            letterSpacing="0.8px"
            fontWeight="600"
            fontSize="Tiny"
            showTaxFormTag={includes(expense.requiredLegalDocuments, 'US_TAX_FORM')}
            showTaxFormMsg={expense.payee.isAdmin}
          />
        )}
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
            <P ml={2} fontSize="Caption" color="black.600">
              {expense.createdAt ? (
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
      <Flex my={4} alignItems="center">
        {isLoading ? (
          <LoadingPlaceholder height={20} maxWidth={150} />
        ) : (
          <Span fontWeight="bold" fontSize="LeadParagraph">
            {isReceipt ? (
              <FormattedMessage id="Expense.AttachedReceipts" defaultMessage="Attached receipts" />
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
          {expense.items.map(attachment => (
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
                <Flex justifyContent="space-between" alignItems="flex-start" flex="1">
                  <Flex flexDirection="column" justifyContent="center">
                    <Span color="black.900" fontWeight="500">
                      {attachment.description || (
                        <Span color="black.500" fontStyle="italic">
                          <FormattedMessage id="NoDescription" defaultMessage="No description provided" />
                        </Span>
                      )}
                    </Span>
                    <Span mt={1} fontSize="Caption" color="black.500">
                      <FormattedMessage
                        id="withColon"
                        defaultMessage="{item}:"
                        values={{
                          item: <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />,
                        }}
                      />{' '}
                      <FormattedDate value={attachment.incurredAt} />
                    </Span>
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
          <Container fontSize="Caption" fontWeight="500" mr={3} whiteSpace="nowrap">
            <FormattedMessage id="ExpenseFormAttachments.TotalAmount" defaultMessage="Total amount:" />
          </Container>
          {isLoading ? (
            <LoadingPlaceholder height={18} width={100} />
          ) : (
            <ExpenseItemsTotalAmount currency={expense.currency} items={expense.items} />
          )}
        </Flex>
      </Flex>

      {isLoading ? (
        <LoadingPlaceholder height={150} mt={3} />
      ) : (
        <Flex flexDirection={['column', 'row']} alignItems={['stretch', 'flex-start']}>
          <PrivateInfoColumn data-cy="expense-summary-payee">
            <PrivateInfoColumnHeader>
              <FormattedMessage id="Expense.PayTo" defaultMessage="Pay to" />
            </PrivateInfoColumnHeader>
            <LinkCollective collective={payee}>
              <Flex alignItems="center">
                <Avatar collective={payee} radius={24} />
                <Span ml={2} color="black.900" fontSize="Caption" fontWeight="bold" truncateOverflow>
                  {payee.name}
                </Span>
              </Flex>
            </LinkCollective>
            <Container whiteSpace="pre-wrap" fontSize="11px" lineHeight="16px" mt={2}>
              <LocationAddress location={payeeLocation} isLoading={isLoading || isLoadingLoggedInUser} />
            </Container>
            {payee.website && (
              <P mt={2} fontSize="11px">
                <StyledLink href={payee.website} openInNewTab>
                  {payee.website}
                </StyledLink>
              </P>
            )}
          </PrivateInfoColumn>
          <PrivateInfoColumn mr={0}>
            <PrivateInfoColumnHeader>
              <FormattedMessage id="expense.payoutMethod" defaultMessage="payout method" />
            </PrivateInfoColumnHeader>
            <Container fontSize="Caption" color="black.600">
              <Box mb={3} data-cy="expense-summary-payout-method-type">
                <PayoutMethodTypeWithIcon type={expense.payoutMethod?.type} />
              </Box>
              <div data-cy="expense-summary-payout-method-data">
                <PayoutMethodData payoutMethod={expense.payoutMethod} isLoading={isLoading || isLoadingLoggedInUser} />
              </div>
              {expense.invoiceInfo && (
                <Box mt={3} data-cy="expense-summary-invoice-info">
                  <Container fontSize="11px" fontWeight="500" mb={2}>
                    <FormattedMessage id="ExpenseForm.InvoiceInfo" defaultMessage="Additional invoice information" />
                    &nbsp;&nbsp;
                    <PrivateInfoIcon color="#969BA3" />
                  </Container>
                  <P fontSize="11px" lineHeight="16px" whiteSpace="pre-wrap">
                    {expense.invoiceInfo}
                  </P>
                </Box>
              )}
            </Container>
          </PrivateInfoColumn>
          {host && (
            <PrivateInfoColumn data-cy="expense-summary-host">
              <PrivateInfoColumnHeader>
                <FormattedMessage id="Fiscalhost" defaultMessage="Fiscal Host" />
              </PrivateInfoColumnHeader>
              <LinkCollective collective={host}>
                <Flex alignItems="center">
                  <Avatar collective={host} radius={24} />
                  <Span ml={2} color="black.900" fontSize="Caption" fontWeight="bold" truncateOverflow>
                    {host.name}
                  </Span>
                </Flex>
              </LinkCollective>
              {host.location && (
                <P whiteSpace="pre-wrap" fontSize="11px" mt={2}>
                  {host.location.address}
                </P>
              )}
              {host.website && (
                <P mt={2} fontSize="11px">
                  <StyledLink href={host.website} openInNewTab>
                    {host.website}
                  </StyledLink>
                </P>
              )}
            </PrivateInfoColumn>
          )}
        </Flex>
      )}
      {showProcessButtons && (
        <Container borderTop="1px solid #DCDEE0" mt={4} pt={12}>
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
    payoutMethod: PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.oneOf(Object.values(PayoutMethodType)),
      data: PropTypes.object,
    }),
  }),
  /** Wether process actions (pay, approve, etc.) should be displayed */
  showProcessActions: PropTypes.bool,
  /** The account where the expense has been submitted, required to display the process actions */
  collective: PropTypes.object,
  /** To know which process buttons to display (if any) */
  permissions: PropTypes.object,
  /** Disable border and paiding in styled card, usefull for modals */
  borderless: PropTypes.bool,
};

export default ExpenseSummary;
