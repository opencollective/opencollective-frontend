import React from 'react';
import PropTypes from 'prop-types';
import FlipMove from 'react-flip-move';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';

import { DISABLE_ANIMATIONS } from '../../lib/animations';

import ExpenseBudgetItem from '../budget/ExpenseBudgetItem';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import StyledCard from '../StyledCard';
import { P } from '../Text';

const ExpenseContainer = styled.div`
  ${props =>
    !props.isFirst &&
    css`
      border-top: 1px solid #e6e8eb;
    `}
`;

const FooterContainer = styled.div`
  padding: 16px 27px;
  border-top: 1px solid #e6e8eb;
`;

const FooterLabel = styled.span`
  font-size: 15px;
  margin-right: 5px;
  text-transform: uppercase;
`;

const ExpensesTotal = ({ collective, host, expenses, expenseFieldForTotalAmount }) => {
  const { total, isApproximate } = React.useMemo(() => {
    let isApproximate = false;
    let total = 0;
    for (const expense of expenses) {
      total += expense[expenseFieldForTotalAmount]?.valueInCents || expense.amount;
      if (expense[expenseFieldForTotalAmount]?.exchangeRate?.isApproximate) {
        isApproximate = true;
      }
    }

    return { total, isApproximate };
  }, [expenses]);

  return (
    <React.Fragment>
      {isApproximate && `~ `}
      <FormattedMoneyAmount amount={total} currency={collective?.currency || host?.currency} precision={2} />
    </React.Fragment>
  );
};

ExpensesTotal.propTypes = {
  collective: PropTypes.object,
  host: PropTypes.object,
  expenses: PropTypes.array,
  expenseFieldForTotalAmount: PropTypes.string,
};

const ExpensesList = ({
  collective,
  host,
  expenses,
  isLoading,
  nbPlaceholders,
  isInverted,
  suggestedTags,
  view,
  onDelete,
  onProcess,
  expenseFieldForTotalAmount,
}) => {
  if (!expenses?.length && !isLoading) {
    return null;
  }

  return (
    <StyledCard>
      {isLoading ? (
        [...new Array(nbPlaceholders)].map((_, idx) => (
          // eslint-disable-next-line react/no-array-index-key
          <ExpenseContainer key={idx} isFirst={!idx}>
            <ExpenseBudgetItem isLoading />
          </ExpenseContainer>
        ))
      ) : (
        <FlipMove enterAnimation="fade" leaveAnimation="fade" disableAllAnimations={DISABLE_ANIMATIONS}>
          {expenses.map((expense, idx) => (
            <ExpenseContainer key={expense.id} isFirst={!idx} data-cy={`expense-${expense.status}`}>
              <ExpenseBudgetItem
                isInverted={isInverted}
                expense={expense}
                host={host}
                showProcessActions
                view={view}
                onDelete={onDelete}
                onProcess={onProcess}
                suggestedTags={suggestedTags}
              />
            </ExpenseContainer>
          ))}
        </FlipMove>
      )}
      {!isLoading && (
        <FooterContainer>
          <Flex flexDirection={['row', 'column']} mt={[3, 0]} flexWrap="wrap" alignItems={['center', 'flex-end']}>
            <Flex
              my={2}
              mr={[3, 0]}
              minWidth={100}
              justifyContent="flex-end"
              data-cy="transaction-amount"
              flexDirection="column"
            >
              <Box alignSelf="flex-end">
                <FooterLabel color="black.500">
                  <FormattedMessage id="expense.page.total" defaultMessage="Page Total" />:
                </FooterLabel>
                <FooterLabel color="black.500">
                  <ExpensesTotal
                    expenses={expenses}
                    collective={collective}
                    host={host}
                    expenseFieldForTotalAmount={expenseFieldForTotalAmount}
                  />
                </FooterLabel>
              </Box>
              <P fontSize="12px" color="black.600">
                <FormattedMessage id="expense.page.description" defaultMessage="Payment processor fees may apply." />
              </P>
            </Flex>
          </Flex>
        </FooterContainer>
      )}
    </StyledCard>
  );
};

ExpensesList.propTypes = {
  isLoading: PropTypes.bool,
  /** Set this to true to invert who's displayed (payee or collective) */
  isInverted: PropTypes.bool,
  /** When `isLoading` is true, this sets the number of "loadin" items displayed */
  nbPlaceholders: PropTypes.number,
  host: PropTypes.object,
  view: PropTypes.oneOf(['public', 'admin', 'submitter']),
  suggestedTags: PropTypes.arrayOf(PropTypes.string),
  onDelete: PropTypes.func,
  onProcess: PropTypes.func,
  /** Defines the field in `expense` that holds the amount. Useful to display the right one based on the context for multi-currency expenses. */
  expenseFieldForTotalAmount: PropTypes.string,
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    parent: PropTypes.shape({
      slug: PropTypes.string.isRequired,
    }),
    currency: PropTypes.string,
  }),
  expenses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      legacyId: PropTypes.number.isRequired,
    }),
  ),
  totalAmount: PropTypes.number,
};

ExpensesList.defaultProps = {
  nbPlaceholders: 10,
  view: 'public',
  expenseFieldForTotalAmount: 'amountInAccountCurrency',
};

export default ExpensesList;
