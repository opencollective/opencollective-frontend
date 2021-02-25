import React from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/feather/ChevronDown';
import { ChevronUp } from '@styled-icons/feather/ChevronUp';
import { MessageSquare } from '@styled-icons/feather/MessageSquare';
import { truncate } from 'lodash';
import { FormattedDate, FormattedMessage } from 'react-intl';

import { TransactionTypes } from '../../lib/constants/transactions';
import { formatCurrency } from '../../lib/currency-utils';

import Avatar from '../Avatar';
import { CreditItem, DebitItem } from '../budget/DebitCreditList';
import Container from '../Container';
import DefinedTerm, { Terms } from '../DefinedTerm';
import ExpenseModal from '../expenses/ExpenseModal';
import ExpenseStatusTag from '../expenses/ExpenseStatusTag';
import ExpenseTags from '../expenses/ExpenseTags';
import { Box, Flex } from '../Grid';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import LinkCollective from '../LinkCollective';
import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';
import { P, Span } from '../Text';
import TransactionSign from '../TransactionSign';
import TransactionStatusTag from '../TransactionStatusTag';
import { useUser } from '../UserProvider';

import TransactionDetails from './TransactionDetails';

/** To separate individual information below description */
const INFO_SEPARATOR = ' • ';

const TransactionItem = ({ displayActions, collective, transaction, onMutationSuccess }) => {
  const {
    toAccount,
    fromAccount,
    giftCardEmitterAccount,
    order,
    expense,
    type,
    amount,
    netAmount,
    description,
    createdAt,
    isRefunded,
    isRefund,
    isOrderRejected,
  } = transaction;
  const { LoggedInUser } = useUser();
  const [isExpanded, setExpanded] = React.useState(false);
  const hasOrder = order !== null;
  const hasExpense = expense !== null;
  const isCredit = type === TransactionTypes.CREDIT;
  const Item = isCredit ? CreditItem : DebitItem;
  const isOwnUserProfile = LoggedInUser && LoggedInUser.CollectiveId === collective.id;

  const avatarCollective = hasOrder ? (isCredit ? fromAccount : toAccount) : isCredit ? fromAccount : toAccount;

  const isRoot = LoggedInUser && LoggedInUser.isRoot();
  const isHostAdmin = LoggedInUser && LoggedInUser.isHostAdmin(fromAccount);
  const isFromCollectiveAdmin = LoggedInUser && LoggedInUser.canEditCollective(fromAccount);
  const isToCollectiveAdmin = LoggedInUser && LoggedInUser.canEditCollective(toAccount);
  const canDownloadInvoice = isRoot || isHostAdmin || isFromCollectiveAdmin || isToCollectiveAdmin;
  let displayedAmount =
    (isCredit && hasOrder) || // Credit from donations should display the full amount donated by the user
    (!isCredit && !hasOrder) // Expense Debits should display the Amount without Payment Method fees
      ? amount
      : netAmount;
  // The refunded transaction logic because it's a bit messy, the conditional was conceived by trial
  if (isRefunded) {
    displayedAmount = (fromAccount.slug == collective.slug && !isRefund) || (isRefund && isCredit) ? netAmount : amount;
  }

  return (
    <Item data-cy="transaction-item">
      <Box px={[16, 27]} py={16}>
        <Flex flexWrap="wrap" justifyContent="space-between">
          <Flex flex="1" minWidth="60%" mr={3}>
            <Box mr={3}>
              <LinkCollective collective={avatarCollective}>
                <Avatar collective={avatarCollective} radius={40} />
              </LinkCollective>
            </Box>
            <Box>
              <P
                data-cy="transaction-description"
                fontWeight="500"
                fontSize="14px"
                lineHeight="21px"
                color={description ? 'black.900' : 'black.500'}
                cursor={!hasOrder ? 'pointer' : 'initial'}
                onClick={() => !hasOrder && setExpanded(true)}
              >
                <Span title={description}>
                  {description ? (
                    truncate(description, { length: 60 })
                  ) : (
                    <FormattedMessage id="NoDescription" defaultMessage="No description provided" />
                  )}
                </Span>
                {isOwnUserProfile && transaction.fromAccount?.isIncognito && (
                  <Span ml={1} css={{ verticalAlign: 'text-bottom' }}>
                    <PrivateInfoIcon color="#969BA3">
                      <FormattedMessage
                        id="PrivateTransaction"
                        defaultMessage="This incognito transaction is only visible to you"
                      />
                    </PrivateInfoIcon>
                  </Span>
                )}
              </P>
              <P mt="5px" fontSize="12px" lineHeight="16px" color="black.700" data-cy="transaction-details">
                {hasOrder ? (
                  <FormattedMessage
                    id="Transaction.from"
                    defaultMessage="from {name}"
                    values={{ name: <StyledLink as={LinkCollective} collective={fromAccount} colorShade={600} /> }}
                  />
                ) : (
                  <FormattedMessage
                    id="CreatedBy"
                    defaultMessage="by {name}"
                    values={{ name: <StyledLink as={LinkCollective} collective={toAccount} colorShade={600} /> }}
                  />
                )}
                {giftCardEmitterAccount && (
                  <React.Fragment>
                    &nbsp;
                    <FormattedMessage
                      id="transaction.usingGiftCardFrom"
                      defaultMessage="using a {giftCard} from {collective}"
                      values={{
                        giftCard: <DefinedTerm term={Terms.GIFT_CARD} textTransform="lowercase" />,
                        collective: (
                          <StyledLink as={LinkCollective} collective={giftCardEmitterAccount} colorShade={600} />
                        ),
                      }}
                    />
                  </React.Fragment>
                )}
                {INFO_SEPARATOR}
                <span data-cy="transaction-date">
                  <time>
                    <FormattedDate value={createdAt} year="numeric" month="long" day="2-digit" />
                  </time>
                </span>
                {hasExpense && expense.comments?.totalCount > 0 && (
                  <React.Fragment>
                    {INFO_SEPARATOR}
                    <span>
                      <MessageSquare size="16px" />
                      &nbsp;
                      {expense.comments.totalCount}
                    </span>
                  </React.Fragment>
                )}
              </P>
            </Box>
          </Flex>
          <Flex flexDirection={['row', 'column']} mt={[3, 0]} flexWrap="wrap" alignItems={['center', 'flex-end']}>
            <Container
              display="flex"
              my={2}
              mr={[3, 0]}
              minWidth={100}
              justifyContent="flex-end"
              data-cy="transaction-amount"
              fontSize="16px"
              ml="auto"
            >
              <TransactionSign isCredit={isCredit} />
              <Span fontWeight="bold" color="black.900" mr={1}>
                {formatCurrency(Math.abs(displayedAmount.valueInCents), displayedAmount.currency)}
              </Span>
              <Span color="black.700" textTransform="uppercase">
                {displayedAmount.currency}
              </Span>
            </Container>
            {hasOrder && (
              <TransactionStatusTag
                isRefund={isRefund}
                isRefunded={isRefunded}
                isOrderRejected={isOrderRejected}
                fontSize="9px"
                px="6px"
                py="2px"
              />
            )}{' '}
            {hasExpense && <ExpenseStatusTag status={expense.status} fontSize="9px" px="6px" py="2px" />}
          </Flex>
        </Flex>
        {hasOrder && (
          <Container borderTop={['1px solid #E8E9EB', 'none']} mt={3} pt={[2, 0]}>
            <StyledButton
              data-cy="transaction-details"
              buttonSize="tiny"
              buttonStyle="secondary"
              isBorderless
              onClick={() => setExpanded(!isExpanded)}
            >
              <Span whiteSpace="nowrap">
                {isExpanded ? (
                  <React.Fragment>
                    <FormattedMessage id="closeDetails" defaultMessage="Close Details" />
                    &nbsp;
                    <ChevronUp size="1em" />
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <Span whiteSpace="nowrap">
                      <FormattedMessage id="viewDetails" defaultMessage="View Details" />
                      &nbsp;
                      <ChevronDown size="1em" />
                    </Span>
                  </React.Fragment>
                )}
              </Span>
            </StyledButton>
          </Container>
        )}
        {hasExpense && (
          <Container mt={3} pt={[2, 0]}>
            <ExpenseTags expense={expense} />
          </Container>
        )}
      </Box>
      {isExpanded && hasOrder && (
        <TransactionDetails
          displayActions={displayActions}
          transaction={transaction}
          onMutationSuccess={onMutationSuccess}
        />
      )}
      {isExpanded && hasExpense && (
        <ExpenseModal
          expense={transaction.expense}
          permissions={{ canSeeInvoiceInfo: canDownloadInvoice }}
          onClose={() => setExpanded(false)}
          show={true}
        />
      )}
    </Item>
  );
};

TransactionItem.propTypes = {
  /* Display Refund and Download buttons in transactions */
  displayActions: PropTypes.bool,
  transaction: PropTypes.shape({
    isRefunded: PropTypes.bool,
    isRefund: PropTypes.bool,
    isOrderRejected: PropTypes.bool,
    fromAccount: PropTypes.shape({
      id: PropTypes.string,
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      imageUrl: PropTypes.string,
      isIncognito: PropTypes.bool,
    }).isRequired,
    host: PropTypes.shape({
      id: PropTypes.string,
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      imageUrl: PropTypes.string,
    }),
    toAccount: PropTypes.shape({
      id: PropTypes.string,
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      imageUrl: PropTypes.string,
    }),
    giftCardEmitterAccount: PropTypes.shape({
      id: PropTypes.string,
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      imageUrl: PropTypes.string,
    }),
    order: PropTypes.shape({
      id: PropTypes.string,
      status: PropTypes.string,
    }),
    expense: PropTypes.shape({
      id: PropTypes.string,
      status: PropTypes.string,
      legacyId: PropTypes.number,
      comments: PropTypes.shape({
        totalCount: PropTypes.number,
      }),
    }),
    id: PropTypes.string,
    uuid: PropTypes.string,
    type: PropTypes.string,
    currency: PropTypes.string,
    description: PropTypes.string,
    createdAt: PropTypes.string,
    hostFeeInHostCurrency: PropTypes.number,
    platformFeeInHostCurrency: PropTypes.number,
    paymentProcessorFeeInHostCurrency: PropTypes.number,
    taxAmount: PropTypes.number,
    amount: PropTypes.shape({
      valueInCents: PropTypes.number,
      currency: PropTypes.string,
    }),
    netAmount: PropTypes.shape({
      valueInCents: PropTypes.number,
      currency: PropTypes.string,
    }),
    netAmountInCollectiveCurrency: PropTypes.number,
    refundTransaction: PropTypes.object,
    usingGiftCardFromCollective: PropTypes.object,
  }),
  collective: PropTypes.shape({
    id: PropTypes.number,
    slug: PropTypes.string.isRequired,
  }).isRequired,
  onMutationSuccess: PropTypes.func,
};

export default TransactionItem;
