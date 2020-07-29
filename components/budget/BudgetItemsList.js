import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import styled, { css } from 'styled-components';

import { TransactionTypes } from '../../lib/constants/transactions';

import DebitCreditList, { CreditItem, DebitItem } from './DebitCreditList';
import ExpenseBudgetItem from './ExpenseBudgetItem';
import OrderBudgetItem from './OrderBudgetItem';
import OrderBudgetItemDetails from './OrderBudgetItemDetails';

/** A fragment to use for `ExpenseType` items */
export const budgetItemExpenseTypeFragment = gql`
  fragment BudgetItemExpenseTypeFragment on ExpenseType {
    id
    amount
    description
    createdAt
    tags
    currency
    type
    status
    user {
      id
      collective {
        id
        type
        name
        slug
      }
    }
    fromCollective {
      id
      slug
      name
      type
      imageUrl
      isIncognito
      host {
        id
        slug
        name
      }
    }
    collective {
      id
      slug
      name
      type
      imageUrl
      isIncognito
      host {
        id
        slug
        name
      }
    }
  }
`;

/** A fragment to use for `Expense` items */
export const budgetItemExpenseFragment = gql`
  fragment BudgetItemExpenseFragment on Expense {
    id
    uuid
    amount
    netAmountInCollectiveCurrency
    description
    type
    createdAt
    currency
    hostFeeInHostCurrency
    platformFeeInHostCurrency
    paymentProcessorFeeInHostCurrency
    taxAmount
    refundTransaction {
      id
    }
    paymentMethod {
      id
      type
    }
    fromCollective {
      id
      slug
      name
      type
      imageUrl
      isIncognito
      host {
        id
        slug
        name
      }
    }
    collective {
      slug
      name
      type
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
export const budgetItemOrderFragment = gql`
  fragment BudgetItemOrderFragment on Order {
    id
    uuid
    amount
    netAmountInCollectiveCurrency
    description
    type
    createdAt
    currency
    hostFeeInHostCurrency
    platformFeeInHostCurrency
    paymentProcessorFeeInHostCurrency
    taxAmount
    order {
      id
      status
    }
    refundTransaction {
      id
    }
    paymentMethod {
      id
      type
    }
    fromCollective {
      id
      slug
      name
      type
      imageUrl
      isIncognito
      host {
        id
        slug
        name
      }
    }
    usingVirtualCardFromCollective {
      id
      slug
      name
      type
    }
  }
`;

const DetailsContainer = styled.div`
  background: #f7f8fa;
  box-shadow: 0px 3px 6px -5px #868686 inset;
  font-size: 12px;
  padding: 16px 24px 16px 80px;

  ${props =>
    props.isCompact &&
    css`
      padding: 16px 24px 16px 24px;
    `}

  @media (max-width: 40em) {
    padding: 8px;
  }
`;

/**
 * A single item
 */
const BudgetItem = ({ item, isInverted, isCompact, canDownloadInvoice }) => {
  const [isExpanded, setExpanded] = React.useState(false);

  if (item.__typename === 'ExpenseType') {
    const ItemContainer = isInverted ? CreditItem : DebitItem;
    return (
      <ItemContainer data-cy="budget-item">
        <ExpenseBudgetItem
          showAmountSign
          isInverted={isInverted}
          collective={item.collective}
          expense={{ ...item, payee: item.fromCollective, createdByAccount: item.user?.collective }}
        />
      </ItemContainer>
    );
  } else {
    const isCredit = item.type === TransactionTypes.CREDIT;
    const isViewedAsCreditTransaction = isInverted ? !isCredit : isCredit;
    const ItemContainer = isViewedAsCreditTransaction ? CreditItem : DebitItem;
    return (
      <React.Fragment>
        <ItemContainer data-cy="budget-item">
          <OrderBudgetItem
            fromCollective={item.fromCollective}
            collective={item.collective}
            transaction={item}
            isInverted={isInverted}
            isExpanded={isExpanded}
            setExpanded={setExpanded}
            order={item.order}
          />
        </ItemContainer>
        {isExpanded && (
          <DetailsContainer isCompact={isCompact}>
            <OrderBudgetItemDetails
              collective={item.collective || item.fromCollective}
              canDownloadInvoice={canDownloadInvoice}
              isInverted={isInverted}
              transaction={item}
            />
          </DetailsContainer>
        )}
      </React.Fragment>
    );
  }
};

BudgetItem.propTypes = {
  /** The actual item to display */
  item: PropTypes.shape({
    __typename: PropTypes.oneOf(['ExpenseType', 'Order', 'Expense']),
    id: PropTypes.number.isRequired,
  }),

  /** If true, debit and credit will be inverted. Useful to adapt based on who's viewing */
  isInverted: PropTypes.bool,

  /** Use this if the place where the component is rendered isn't that big to compact it */
  isCompact: PropTypes.bool,

  /** If true, a button to download invoice will be displayed when possible */
  canDownloadInvoice: PropTypes.bool,
};

/**
 * Based on `DebitCreditList`, this will display transactions/expenses regardless of their
 * types. You must provide items fetched from GraphQL, as the component will use the
 * `__typename` to know how to display item.
 */
const BudgetItemsList = ({ items, isInverted, isCompact, canDownloadInvoice }) => {
  return !items || items.length === 0 ? null : (
    <DebitCreditList>
      {items.map(item => (
        <BudgetItem
          key={`${item.__typename}_${item.id}`}
          item={item}
          isInverted={isInverted}
          isCompact={isCompact}
          canDownloadInvoice={canDownloadInvoice}
        />
      ))}
    </DebitCreditList>
  );
};

BudgetItemsList.propTypes = {
  /** The actual items to display */
  items: PropTypes.arrayOf(
    PropTypes.shape({
      __typename: PropTypes.oneOf(['ExpenseType', 'Order', 'Expense']),
      id: PropTypes.number.isRequired,
    }),
  ),

  /** If true, debit and credit will be inverted. Useful to adapt based on who's viewing */
  isInverted: PropTypes.bool,

  /** Use this if the place where the component is rendered isn't that big to compact it */
  isCompact: PropTypes.bool,

  /** If true, a button to download invoice will be displayed when possible */
  canDownloadInvoice: PropTypes.bool,

  /** Use this if you want to change how Platform Fees are displayed */
  isFeesOnTop: PropTypes.bool,
};

BudgetItemsList.defaultProps = {
  isInverted: false,
  canDownloadInvoice: false,
};

export default React.memo(BudgetItemsList);
