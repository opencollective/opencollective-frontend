import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, FormattedDate } from 'react-intl';
import { Flex, Box } from '@rebass/grid';

import { TransactionTypes } from '../lib/constants/transactions';
import { formatCurrency } from './../lib/utils';
import { P, Span } from './Text';
import Container from './Container';
import DebitCreditList, { DebitItem, CreditItem } from './DebitCreditList';
import DefinedTerm, { Terms } from './DefinedTerm';
import LinkCollective from './LinkCollective';
import Avatar from './Avatar';
import StyledLink from './StyledLink';
import gql from 'graphql-tag';

/** A fragment to use for `ExpenseType` items */
export const BudgetItemExpenseTypeFragment = gql`
  fragment BudgetItemExpenseTypeFragment on ExpenseType {
    id
    amount
    description
    createdAt
    category
    currency
    transaction {
      id
    }
    fromCollective {
      id
      slug
      name
      type
      imageUrl
      isIncognito
    }
  }
`;

/** A fragment to use for `Expense` items */
export const BudgetItemExpenseFragment = gql`
  fragment BudgetItemExpenseFragment on Expense {
    id
    amount
    description
    type
    createdAt
    currency
    fromCollective {
      id
      slug
      name
      type
      imageUrl
      isIncognito
    }
    usingVirtualCardFromCollective {
      id
      slug
      name
      type
    }
  }
`;

/** A fragment to use for `Order` items */
export const BudgetItemOrderFragment = gql`
  fragment BudgetItemOrderFragment on Order {
    id
    amount
    description
    type
    createdAt
    currency
    fromCollective {
      id
      slug
      name
      type
      imageUrl
      isIncognito
    }
    usingVirtualCardFromCollective {
      id
      slug
      name
      type
    }
  }
`;

const isCreditItem = (item, isInverted) => {
  if (item.__typename === 'ExpenseType') {
    return isInverted;
  } else if (item.__typename === 'Order') {
    const isCreditTransaction = item.type === TransactionTypes.CREDIT;
    return !isInverted ? isCreditTransaction : !isCreditTransaction;
  }
};

/**
 * Based on `DebitCreditList`, this will display transactions/expenses regardless of their
 * types. You must provide items fetched from GraphQL, as the component will use the
 * `__typename` to know how to display item.
 */
const BudgetItemsList = ({ items, isInverted }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <DebitCreditList>
      {items.map(item => {
        const { __typename, id, fromCollective, description, createdAt } = item;
        const isCredit = isCreditItem(item, isInverted);
        const ItemContainer = isCredit ? CreditItem : DebitItem;

        return (
          <ItemContainer key={`${__typename}_${id}`}>
            <Container p={24} display="flex" justifyContent="space-between">
              <Flex>
                <Box mr={3}>
                  <Avatar collective={fromCollective} radius={40} />
                </Box>
                <Flex flexDirection="column" justifyContent="space-between">
                  <P color="black.900" fontWeight="600">
                    {description}
                  </P>
                  <Container color="black.500">
                    {item.usingVirtualCardFromCollective ? (
                      <FormattedMessage
                        id="Transactions.byWithGiftCard"
                        defaultMessage="by {collectiveName} with {collectiveGiftCardName} {giftCard} on {date}"
                        values={{
                          collectiveName: <StyledLink as={LinkCollective} collective={fromCollective} />,
                          date: <FormattedDate value={createdAt} weekday="long" day="numeric" month="long" />,
                          collectiveGiftCardName: item.usingVirtualCardFromCollective.name,
                          giftCard: <DefinedTerm term={Terms.GIFT_CARD} textTransform="lowercase" />,
                        }}
                      />
                    ) : (
                      <FormattedMessage
                        id="Transactions.by"
                        defaultMessage="by {collectiveName} on {date}"
                        values={{
                          collectiveName: <StyledLink as={LinkCollective} collective={fromCollective} />,
                          date: <FormattedDate value={createdAt} weekday="long" day="numeric" month="long" />,
                        }}
                      />
                    )}
                  </Container>
                </Flex>
              </Flex>
              <P fontSize="LeadParagraph">
                {isCredit ? (
                  <Span color="green.700" mr={2}>
                    +
                  </Span>
                ) : (
                  <Span color="red.700" mr={2}>
                    −
                  </Span>
                )}
                <Span fontWeight="bold" mr={1}>
                  {formatCurrency(Math.abs(item.amount), item.currency)}
                </Span>
                <Span color="black.400" textTransform="uppercase">
                  {item.currency}
                </Span>
              </P>
            </Container>
          </ItemContainer>
        );
      })}
    </DebitCreditList>
  );
};

BudgetItemsList.propTypes = {
  /** The actual items to display */
  items: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.shape({
        __typename: PropTypes.oneOf(['ExpenseType']),
        id: PropTypes.number.isRequired,
        amount: PropTypes.number.isRequired,
        description: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired,
        transaction: PropTypes.shape({
          id: PropTypes.number,
        }),
        fromCollective: PropTypes.shape({
          id: PropTypes.number,
          slug: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
        }).isRequired,
      }),
      PropTypes.shape({
        __typename: PropTypes.oneOf(['Order', 'Expense']),
        id: PropTypes.number,
        amount: PropTypes.number,
        type: PropTypes.oneOf(['CREDIT', 'DEBIT']),
        usingVirtualCardFromCollective: PropTypes.shape({
          id: PropTypes.number,
          slug: PropTypes.string,
          name: PropTypes.string,
        }),
        fromCollective: PropTypes.shape({
          id: PropTypes.number,
          slug: PropTypes.string,
          name: PropTypes.string,
        }),
      }),
    ]),
  ),
  /** If true, debit and credit will be inverted. Useful to adapt based on who's viewing */
  isInverted: PropTypes.bool,
};

BudgetItemsList.defaultProps = {
  isInverted: false,
};

export default BudgetItemsList;
