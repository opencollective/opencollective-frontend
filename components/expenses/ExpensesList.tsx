import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { ChatBubbleBottomCenterIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import { cx } from 'class-variance-authority';
import dayjs from 'dayjs';
import FlipMove from 'react-flip-move';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';
import { Flipped, Flipper } from 'react-flip-toolkit';
import { DISABLE_ANIMATIONS } from '../../lib/animations';
import { i18nExpenseStatus, i18nExpenseType } from '../../lib/i18n/expense';
import ExpenseItem from './ExpenseItem';
import AmountWithExchangeRateInfo from '../AmountWithExchangeRateInfo';
import ExpenseBudgetItem from '../budget/ExpenseBudgetItem';
import ExpenseTable from '../ExpenseTable';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import StyledCard from '../StyledCard';
import { P } from '../Text';

import ExpenseDrawer from './ExpenseDrawer';
import NewExpenseDrawer, { ExpenseStatus } from './NewExpenseDrawer';
import { SettingsContext } from '../../lib/SettingsContext';

const ExpenseContainer = styled.div<{ isFirst?: boolean }>`
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
  loadingCount,
  context,
}) => {
  const [expenseInDrawer, setExpenseInDrawer] = React.useState(null);
  const [selectedId, setSelectedId] = React.useState(null);
  const [useNewDrawer, setUseNewDrawer] = React.useState(false);
  const { settings } = React.useContext(SettingsContext);

  // if (!expenses?.length && !isLoading) {
  //   return null;
  // }

  const expandExpense = expense => {
    // if the command key is held down, open the expense in a new tab
    // if (window?.event?.metaKey) {
    //   setUseNewDrawer(false);
    // } else {
    // setUseNewDrawer(true);
    // // }
    setExpenseInDrawer(expense);
    setSelectedId(expense.id);
  };

  return (
    <div className="mt-0 w-full ">
      {!isLoading && !expenses.length ? (
        <div className="w-full text-xl text-gray-400 h-36 flex justify-center items-center text-center">
          <span>No results matching your query.</span>
        </div>
      ) : (
        <Fragment>
          {' '}
          {settings.tables ? (
            <ExpenseTable
              isLoading={isLoading}
              loadingCount={loadingCount}
              expenses={expenses || []}
              host={host}
              expandExpense={expandExpense}
              context={context}
            />
          ) : (
            <React.Fragment>
              <StyledCard>
                {isLoading ? (
                  [...new Array(nbPlaceholders)].map((_, idx) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <ExpenseContainer key={idx}>
                      <ExpenseBudgetItem isLoading />
                    </ExpenseContainer>
                  ))
                ) : (
                  <FlipMove enterAnimation="fade" leaveAnimation="fade" disableAllAnimations={DISABLE_ANIMATIONS}>
                    {expenses.map(expense => {
                      return (
                        <ExpenseContainer key={expense.id} data-cy={`expense-${expense.status}`}>
                          <ExpenseBudgetItem
                            isInverted={isInverted}
                            expense={expense}
                            host={host}
                            showProcessActions
                            view={view}
                            onDelete={onDelete}
                            onProcess={onProcess}
                            suggestedTags={suggestedTags}
                            selected={selectedId === expense.id}
                            expandExpense={() => expandExpense(expense)}
                          />
                        </ExpenseContainer>
                      );
                    })}
                  </FlipMove>
                )}
                {!isLoading && (
                  <FooterContainer>
                    <Flex
                      flexDirection={['row', 'column']}
                      mt={[3, 0]}
                      flexWrap="wrap"
                      alignItems={['center', 'flex-end']}
                    >
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
                          <FormattedMessage
                            id="expense.page.description"
                            defaultMessage="Payment processor fees may apply."
                          />
                        </P>
                      </Flex>
                    </Flex>
                  </FooterContainer>
                )}
              </StyledCard>
            </React.Fragment>
          )}
        </Fragment>
      )}

      <NewExpenseDrawer
        open={useNewDrawer && Boolean(selectedId)}
        handleClose={() => setSelectedId(null)}
        expense={expenseInDrawer}
      />
      <ExpenseDrawer
        open={!useNewDrawer && Boolean(selectedId)}
        handleClose={() => setSelectedId(null)}
        expense={expenseInDrawer}
      />
    </div>
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
  settings: PropTypes.object,
  loadingCount: PropTypes.number,
  context: PropTypes.string,
};

ExpensesList.defaultProps = {
  nbPlaceholders: 10,
  view: 'public',
  expenseFieldForTotalAmount: 'amountInAccountCurrency',
};

export default ExpensesList;
