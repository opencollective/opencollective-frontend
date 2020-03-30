import { Box, Flex } from '@rebass/grid';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, useIntl, FormattedDate } from 'react-intl';
import styled from 'styled-components';

import expenseTypes from '../../lib/constants/expenseTypes';
import expenseStatus from '../../lib/constants/expense-status';
import { PayoutMethodType } from '../../lib/constants/payout-method';
import { i18nExpenseType } from '../../lib/i18n-expense';
import i18nPayoutMethodType from '../../lib/i18n-payout-method-type';
import Avatar from '../Avatar';
import Container from '../Container';
import FormattedMoneyAmount, { DEFAULT_AMOUNT_STYLES } from '../FormattedMoneyAmount';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import LinkCollective from '../LinkCollective';
import StyledHr from '../StyledHr';
import StyledTag from '../StyledTag';
import { H4, P, Span } from '../Text';
import AttachmentsTotalAmount from './AttachmentsTotalAmount';
import PayoutMethodData from './PayoutMethodData';
import LoadingPlaceholder from '../LoadingPlaceholder';
import ExternalLink from '../ExternalLink';
import ExpenseStatusTag from './ExpenseStatusTag';

const ImageContainer = styled.div`
  border: 1px solid #dcdee0;
  padding: 8px;
  margin-right: 16px;
  height: 88px;
  width: 88px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  img {
    width: 100%;
    height: 100%;
  }
`;

/**
 * Last step of the create expense flow, shows the summary of the expense with
 * the ability to submit it.
 */
const ExpenseSummary = ({ expense, host, isLoading, isLoadingLoggedInUser }) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const { payee, createdByAccount } = expense || {};

  return (
    <div>
      <Flex justifyContent="space-between">
        <StyledTag
          fontSize="Caption"
          textTransform="none"
          display="inline-block"
          letterSpacing="0.1em"
          color="black.700"
        >
          {isLoading ? <LoadingPlaceholder height={12} width={65} /> : i18nExpenseType(intl, expense.type)}
        </StyledTag>
        {expense?.status && (
          <ExpenseStatusTag status={expense.status} letterSpacing="0.8px" fontWeight="600" fontSize="Tiny" />
        )}
      </Flex>
      <H4 mb={3} mt={2}>
        {isLoading ? <LoadingPlaceholder height={32} /> : expense.description}
      </H4>
      <Flex alignItems="center">
        {isLoading ? (
          <LoadingPlaceholder height={40} width={150} />
        ) : (
          <React.Fragment>
            <LinkCollective collective={createdByAccount}>
              <Avatar collective={createdByAccount} size={40} />
            </LinkCollective>
            <Flex flexDirection="column" justifyContent="center" ml={3}>
              <LinkCollective collective={createdByAccount}>
                <Span color="black.800" fontWeight={500} textDecoration="none">
                  {createdByAccount ? (
                    createdByAccount.name
                  ) : (
                    <FormattedMessage id="profile.incognito" defaultMessage="Incognito" />
                  )}
                </Span>
              </LinkCollective>
            </Flex>
          </React.Fragment>
        )}
      </Flex>
      <StyledHr mt={4} borderColor="black.300" />
      {isLoading ? (
        <LoadingPlaceholder height={100} mt={4} />
      ) : (
        <Flex width="100%" justifyContent="space-between" flexWrap="wrap">
          <Flex flexDirection="column" minWidth={250} mt={4}>
            <Span fontWeight="bold" mb={2}>
              <FormattedMessage id="Expense.Payee" defaultMessage="Payee" />
            </Span>
            <LinkCollective collective={payee} data-cy="expense-summary-payee">
              <Span color="black.600" fontSize="Caption" fontWeight="bold">
                {payee.name}
              </Span>
            </LinkCollective>
            {payee.location && payee.location.address && (
              <React.Fragment>
                <Span fontSize="Caption" fontWeight="bold" color="black.700" mb={2} mt={3}>
                  <FormattedMessage id="PrivateAddress" defaultMessage="Private address" />
                  &nbsp;&nbsp;
                  <PrivateInfoIcon color="#969BA3" />
                </Span>
                <P whiteSpace="pre-wrap" fontSize="Caption" color="black.600">
                  {payee.location.address}
                </P>
              </React.Fragment>
            )}
          </Flex>
          {host && (
            <Flex flexDirection="column" minWidth={250} mt={4}>
              <Span fontWeight="bold" mb={2}>
                <FormattedMessage id="Fiscalhost" defaultMessage="Fiscal Host" />
              </Span>
              <LinkCollective collective={host} data-cy="expense-summary-host">
                <Span color="black.600" fontSize="Caption" fontWeight="bold">
                  {host.name}
                </Span>
              </LinkCollective>
              {host.location && (
                <P whiteSpace="pre-wrap" fontSize="Caption" color="black.600" mt={2}>
                  {host.location.address}
                </P>
              )}
            </Flex>
          )}
        </Flex>
      )}
      <StyledHr my={4} borderColor="black.300" />

      {isLoading && <LoadingPlaceholder height={100} mt={4} />}
      {!isLoading && expense.payoutMethod && (
        <React.Fragment>
          <P fontWeight="bold">
            <FormattedMessage id="PayoutOption" defaultMessage="Payout option" />
          </P>
          <Flex justifyContent="space-between" flexWrap="wrap">
            <Box minWidth={250} mt={3}>
              <Container fontSize="Caption" lineHeight="Caption" fontWeight="bold" color="black.600" mb={2}>
                <FormattedMessage id="ExpenseSummary.PayoutDetails" defaultMessage="Payout details:" />
                &nbsp;&nbsp;
                <PrivateInfoIcon color="#969BA3" />
              </Container>
              {!expense.payoutMethod?.data && isLoadingLoggedInUser ? (
                <LoadingPlaceholder height={20} width={200} />
              ) : (
                <P fontSize="Caption" color="black.600" data-cy="expense-summary-payout-method-data">
                  <PayoutMethodData payoutMethod={expense.payoutMethod} />
                </P>
              )}
            </Box>
            <Box minWidth={250} mt={3}>
              <P fontSize="Caption" lineHeight="Caption" fontWeight="bold" color="black.600" mb={2}>
                <FormattedMessage id="ExpenseSummary.PayoutMethod" defaultMessage="Payout method:" />
              </P>
              <P fontSize="Caption" color="black.600" data-cy="expense-summary-payout-method-type">
                {i18nPayoutMethodType(formatMessage, expense.payoutMethod.type)}
              </P>
            </Box>
          </Flex>
          <StyledHr my={4} borderColor="black.300" />
        </React.Fragment>
      )}
      {isLoading ? (
        <LoadingPlaceholder height={100} my={4} />
      ) : (
        <React.Fragment>
          <P fontWeight="bold" mb={3}>
            {expense.type === expenseTypes.INVOICE ? (
              <FormattedMessage id="InvoiceItems" defaultMessage="Invoice items" />
            ) : (
              <FormattedMessage id="ReceiptItems" defaultMessage="Expense receipts" />
            )}
          </P>
          <div data-cy="expense-summary-attachments">
            {expense.attachments.map((attachment, idx) => (
              <React.Fragment key={attachment.id}>
                <Flex justifyContent="space-between" alignItems="center" my={24}>
                  {expense.type === expenseTypes.RECEIPT ? (
                    <Flex>
                      {attachment.url ? (
                        <ImageContainer>
                          <ExternalLink openInNewTab href={attachment.url}>
                            <img src={attachment.url} alt={`Receipt file for ${attachment.description}`} />
                          </ExternalLink>
                        </ImageContainer>
                      ) : (
                        <ImageContainer>
                          {isLoading || isLoadingLoggedInUser ? (
                            <LoadingPlaceholder />
                          ) : (
                            <PrivateInfoIcon color="#dcdee0" size={42} />
                          )}
                        </ImageContainer>
                      )}
                      <Flex flexDirection="column">
                        <Span mt={2} color="black.900" fontWeight="500">
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
                    </Flex>
                  ) : (
                    <P fontWeight="500" color="black.900">
                      {attachment.description || (
                        <Span color="black.500" fontStyle="italic">
                          <FormattedMessage id="NoDescription" defaultMessage="No description provided" />
                        </Span>
                      )}
                    </P>
                  )}
                  <P fontSize={15} color="black.600" mt={2} textAlign="right" ml={3}>
                    <FormattedMoneyAmount
                      amount={attachment.amount}
                      currency={expense.currency}
                      amountStyles={{ ...DEFAULT_AMOUNT_STYLES, fontWeight: '500' }}
                      precision={2}
                    />
                  </P>
                </Flex>
                {idx + 1 !== expense.attachments.length && <StyledHr borderStyle="dotted" />}
              </React.Fragment>
            ))}
          </div>
        </React.Fragment>
      )}
      <StyledHr borderColor="black.300" />
      <Flex justifyContent="flex-end" my={3}>
        <Flex width={220} justifyContent="space-between" alignItems="center">
          <Container fontSize="Caption" fontWeight="bold" mr={2}>
            <FormattedMessage id="ExpenseFormAttachments.TotalAmount" defaultMessage="Total amount:" />
          </Container>
          {isLoading ? (
            <LoadingPlaceholder height={18} width={100} />
          ) : (
            <AttachmentsTotalAmount currency={expense.currency} attachments={expense.attachments} />
          )}
        </Flex>
      </Flex>
      <StyledHr mb={4} borderColor="black.300" />
    </div>
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
    location: PropTypes.shape({
      address: PropTypes.string,
      country: PropTypes.string,
    }),
  }),
  /** Must be provided if isLoading is false */
  expense: PropTypes.shape({
    description: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    status: PropTypes.oneOf(Object.values(expenseStatus)),
    type: PropTypes.oneOf(Object.values(expenseTypes)).isRequired,
    tags: PropTypes.arrayOf(PropTypes.string),
    attachments: PropTypes.arrayOf(
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
      location: PropTypes.shape({
        address: PropTypes.string,
        country: PropTypes.string,
      }),
    }).isRequired,
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
};

export default ExpenseSummary;
