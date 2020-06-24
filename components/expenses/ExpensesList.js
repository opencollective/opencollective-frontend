import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';

import AutosizeText from '../AutosizeText';
import Avatar from '../Avatar';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import LinkExpense from '../LinkExpense';
import LoadingPlaceholder from '../LoadingPlaceholder';
import StyledCard from '../StyledCard';
import { H3, P, Span } from '../Text';

import ExpenseStatusTag from './ExpenseStatusTag';
import ExpenseTags from './ExpenseTags';

const ExpenseContainer = styled.div`
  display: flex;
  padding: 15px;

  ${props =>
    !props.isFirst &&
    css`
      border-top: 1px solid #e6e8eb;
    `}
`;

const ExpensesList = ({ collective, expenses, isLoading, nbPlaceholders }) => {
  expenses = !isLoading ? expenses : [...new Array(nbPlaceholders)];

  if (!expenses?.length) {
    return null;
  }

  return (
    <StyledCard>
      {expenses.map((expense, idx) => (
        <ExpenseContainer key={expense?.id || idx} isFirst={!idx} data-cy="single-expense">
          <Box mr={3}>
            {isLoading ? (
              <LoadingPlaceholder width={40} height={40} />
            ) : (
              <LinkCollective collective={expense.payee}>
                <Avatar collective={expense.payee} radius={40} />
              </LinkCollective>
            )}
          </Box>
          <Box flex="1">
            <Flex flexWrap="wrap" justifyContent="space-between" alignItems="flex-start" width="100%">
              {isLoading ? (
                <LoadingPlaceholder height={70} width="70%" />
              ) : (
                <Box maxWidth="70%">
                  <LinkExpense collective={collective} expense={expense} isV2 data-cy="expense-link">
                    <AutosizeText
                      value={expense.description}
                      maxLength={255}
                      minFontSizeInPx={13}
                      maxFontSizeInPx={16}
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
                  <P mt={2} fontSize="12px" color="black.600">
                    <FormattedMessage
                      id="Expense.SubmittedByOnDate"
                      defaultMessage="Submitted by {name} on {date, date, long}"
                      values={{
                        date: new Date(expense.createdAt),
                        name: <LinkCollective collective={expense.createdByAccount} />,
                      }}
                    />
                  </P>
                </Box>
              )}
              {isLoading ? (
                <LoadingPlaceholder height={28} width={140} />
              ) : (
                <Flex alignItems="center">
                  <Box mr={3}>
                    <ExpenseStatusTag status={expense.status} />
                  </Box>
                  <Span color="black.500" fontSize="16px">
                    <FormattedMoneyAmount amount={expense.amount} currency={expense.currency} />
                  </Span>
                </Flex>
              )}
            </Flex>
            <Box mt={3}>
              <ExpenseTags expense={expense} isLoading={isLoading} />
            </Box>
          </Box>
        </ExpenseContainer>
      ))}
    </StyledCard>
  );
};

ExpensesList.propTypes = {
  isLoading: PropTypes.bool,
  /** When `isLoading` is true, this sets the number of "loadin" items displayed */
  nbPlaceholders: PropTypes.number,
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    parentCollective: PropTypes.shape({
      slug: PropTypes.string.isRequired,
    }),
  }),
  expenses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      legacyId: PropTypes.number.isRequired,
      type: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      createdAt: PropTypes.string.isRequired,
      tags: PropTypes.arrayOf(PropTypes.string),
      amount: PropTypes.number.isRequired,
      currency: PropTypes.string.isRequired,
      payee: PropTypes.shape({
        id: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        slug: PropTypes.string.isRequired,
        imageUrl: PropTypes.string.isRequired,
      }),
      createdByAccount: PropTypes.shape({
        id: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        slug: PropTypes.string.isRequired,
      }),
    }),
  ),
};

ExpensesList.defaultProps = {
  nbPlaceholders: 10,
};

export default ExpensesList;
