import React from 'react';
import PropTypes from 'prop-types';
import { FormattedDate, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import AutosizeText from '../AutosizeText';
import Avatar from '../Avatar';
import ExpenseStatusTag from '../expenses/ExpenseStatusTag';
import ExpenseTags from '../expenses/ExpenseTags';
import ProcessExpenseButtons, { DEFAULT_PROCESS_EXPENSE_BTN_PROPS } from '../expenses/ProcessExpenseButtons';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import LinkExpense from '../LinkExpense';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { H3, P, Span } from '../Text';
import TransactionSign from '../TransactionSign';

const ButtonsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;

  &:not(:hover) {
    opacity: 0.3;
  }

  & > *:last-child {
    margin-right: 0;
  }
`;

const ExpenseBudgetItem = ({ isLoading, isInverted, showAmountSign, collective, expense, showProcessActions }) => {
  const featuredProfile = isInverted ? collective : expense?.payee;
  return (
    <Box p="16px 27px">
      <Flex justifyContent="space-between" flexWrap="wrap">
        <Flex flex="1" minWidth="max(60%, 300px)" maxWidth={[null, '70%']}>
          <Box mr={3}>
            {isLoading ? (
              <LoadingPlaceholder width={40} height={40} />
            ) : (
              <LinkCollective collective={featuredProfile}>
                <Avatar collective={featuredProfile} radius={40} />
              </LinkCollective>
            )}
          </Box>
          {isLoading ? (
            <LoadingPlaceholder height={60} />
          ) : (
            <Box>
              <LinkExpense collective={collective} expense={expense} data-cy="expense-link">
                <AutosizeText
                  value={expense.description}
                  maxLength={255}
                  minFontSizeInPx={12}
                  maxFontSizeInPx={14}
                  lengthThreshold={72}
                >
                  {({ value, fontSize }) => (
                    <H3
                      fontWeight="500"
                      lineHeight="1.5em"
                      textDecoration="none"
                      color="black.900"
                      fontSize={`${fontSize}px`}
                      data-cy="expense-title"
                    >
                      {value}
                    </H3>
                  )}
                </AutosizeText>
              </LinkExpense>
              <P mt="5px" fontSize="12px" color="black.600">
                <FormattedMessage
                  id="Expense.By"
                  defaultMessage="by {name}"
                  values={{ name: <LinkCollective collective={expense.createdByAccount} /> }}
                />
                {' • '}
                <FormattedDate value={expense.createdAt} />
              </P>
            </Box>
          )}
        </Flex>
        <Flex flexDirection={['row', 'column']} mt={[3, 0]} flexWrap="wrap" alignItems={['center', 'flex-end']}>
          <Flex my={2} mr={[3, 0]} minWidth={100} justifyContent="flex-end" data-cy="transaction-amount">
            {isLoading ? (
              <LoadingPlaceholder height={19} width={120} />
            ) : (
              <React.Fragment>
                {showAmountSign && <TransactionSign isCredit={isInverted} />}
                <Span color="black.500" fontSize="15px">
                  <FormattedMoneyAmount amount={expense.amount} currency={expense.currency} precision={2} />
                </Span>
              </React.Fragment>
            )}
          </Flex>
          {isLoading ? (
            <LoadingPlaceholder height={20} width={140} />
          ) : (
            <ExpenseStatusTag status={expense.status} fontSize="9px" lineHeight="14px" p="3px 8px" />
          )}
        </Flex>
      </Flex>
      <Flex flexWrap="wrap" justifyContent="space-between" alignItems="center" mt={2}>
        <Box mt={2}>
          <ExpenseTags expense={expense} />
        </Box>
        {showProcessActions && expense?.permissions && (
          <ButtonsContainer>
            <ProcessExpenseButtons
              collective={collective}
              expense={expense}
              permissions={expense.permissions}
              buttonProps={{ ...DEFAULT_PROCESS_EXPENSE_BTN_PROPS, mx: 1, py: 2 }}
            />
          </ButtonsContainer>
        )}
      </Flex>
    </Box>
  );
};

ExpenseBudgetItem.propTypes = {
  isLoading: PropTypes.bool,
  /** Set this to true to invert who's displayed (payee or collective) */
  isInverted: PropTypes.bool,
  showAmountSign: PropTypes.bool,
  showProcessActions: PropTypes.bool,
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    parent: PropTypes.shape({
      slug: PropTypes.string.isRequired,
    }),
  }),
  expense: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    legacyId: PropTypes.number,
    type: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    tags: PropTypes.arrayOf(PropTypes.string),
    amount: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    permissions: PropTypes.object,
    payee: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      type: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      imageUrl: PropTypes.string.isRequired,
    }),
    createdByAccount: PropTypes.shape({
      type: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
    }),
  }),
};

export default ExpenseBudgetItem;
