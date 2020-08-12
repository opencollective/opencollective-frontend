import React from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/feather/ChevronDown';
import { ChevronUp } from '@styled-icons/feather/ChevronUp';
import { truncate } from 'lodash';
import { FormattedDate, FormattedMessage } from 'react-intl';

import { ORDER_STATUS } from '../../lib/constants/order-status';
import { TransactionTypes } from '../../lib/constants/transactions';
import { formatCurrency } from '../../lib/currency-utils';

import Avatar from '../Avatar';
import Container from '../Container';
import DefinedTerm, { Terms } from '../DefinedTerm';
import { Box, Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import OrderStatusTag from '../OrderStatusTag';
import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';
import { P, Span } from '../Text';
import TransactionSign from '../TransactionSign';

/** To separate individual information below description */
const INFO_SEPARATOR = ' • ';

const OrderBudgetItem = ({ collective, fromCollective, isInverted, isExpanded, setExpanded, transaction, order }) => {
  const isCredit = transaction.type === TransactionTypes.CREDIT;
  const amount = transaction[isCredit ? 'amount' : 'netAmountInCollectiveCurrency'];
  if (isInverted) {
    [fromCollective, collective] = [collective, fromCollective];
  }

  return (
    <Box px={[16, 27]} py={16}>
      <Flex flexWrap="wrap" justifyContent="space-between">
        <Flex flex="1" minWidth="60%" mr={3}>
          <Box mr={3}>
            <LinkCollective collective={collective || fromCollective}>
              <Avatar collective={collective || fromCollective} radius={40} />
            </LinkCollective>
          </Box>
          <Box>
            <P
              data-cy="transaction-description"
              fontWeight="500"
              fontSize="14px"
              lineHeight="21px"
              color={transaction.description ? 'black.900' : 'black.500'}
              title={transaction.description}
            >
              {transaction.description ? (
                truncate(transaction.description, { length: 60 })
              ) : (
                <FormattedMessage id="NoDescription" defaultMessage="No description provided" />
              )}
            </P>
            <P mt="5px" fontSize="12px" lineHeight="16px" color="black.600" data-cy="transaction-details">
              <FormattedMessage
                id="Transaction.from"
                defaultMessage="from {name}"
                values={{ name: <LinkCollective collective={fromCollective} /> }}
              />
              {transaction.usingVirtualCardFromCollective && (
                <React.Fragment>
                  {INFO_SEPARATOR}
                  <FormattedMessage
                    id="transaction.usingGiftCardFrom"
                    defaultMessage="using a {giftCard} from {collective}"
                    values={{
                      giftCard: <DefinedTerm term={Terms.GIFT_CARD} textTransform="lowercase" />,
                      collective: (
                        <StyledLink as={LinkCollective} collective={transaction.usingVirtualCardFromCollective} />
                      ),
                    }}
                  />
                </React.Fragment>
              )}
              {INFO_SEPARATOR}
              <span data-cy="transaction-date">
                <FormattedDate value={transaction.createdAt} />
              </span>
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
            <Span fontWeight="bold" mr={1}>
              {formatCurrency(Math.abs(amount), transaction.currency)}
            </Span>
            <Span color="black.400" textTransform="uppercase">
              {transaction.currency}
            </Span>
          </Container>
          {order && (
            <OrderStatusTag
              status={order.status}
              isRefund={Boolean(transaction.refundTransaction)}
              fontSize="9px"
              px="6px"
              py="2px"
            />
          )}
        </Flex>
      </Flex>
      <Container borderTop={['1px solid #E8E9EB', 'none']} mt={3} pt={[2, 0]}>
        <StyledButton
          data-cy="transaction-details"
          buttonSize="tiny"
          buttonStyle="secondary"
          isBorderless
          onClick={() => setExpanded(!isExpanded)}
          ml={-14}
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
    </Box>
  );
};

OrderBudgetItem.propTypes = {
  isInverted: PropTypes.bool.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  setExpanded: PropTypes.func.isRequired,
  fromCollective: PropTypes.shape({
    id: PropTypes.number,
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    host: PropTypes.shape({
      id: PropTypes.number,
      slug: PropTypes.string.isRequired,
      name: PropTypes.string,
    }),
  }).isRequired,
  collective: PropTypes.shape({
    id: PropTypes.number,
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    host: PropTypes.shape({
      id: PropTypes.number,
      slug: PropTypes.string.isRequired,
      name: PropTypes.string,
    }),
  }),
  order: PropTypes.shape({
    id: PropTypes.number,
    status: PropTypes.oneOf(Object.values(ORDER_STATUS)),
  }),
  transaction: PropTypes.shape({
    id: PropTypes.number,
    uuid: PropTypes.string,
    type: PropTypes.string,
    currency: PropTypes.string,
    description: PropTypes.string,
    createdAt: PropTypes.string,
    hostFeeInHostCurrency: PropTypes.number,
    platformFeeInHostCurrency: PropTypes.number,
    paymentProcessorFeeInHostCurrency: PropTypes.number,
    taxAmount: PropTypes.number,
    amount: PropTypes.number,
    netAmountInCollectiveCurrency: PropTypes.number,
    refundTransaction: PropTypes.object,
    usingVirtualCardFromCollective: PropTypes.object,
  }),
};

export default OrderBudgetItem;
