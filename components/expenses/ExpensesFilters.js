import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import expenseStatus from '../../lib/constants/expense-status';
import { encodeDateInterval } from '../../lib/date-utils';

import AmountFilter from '../budget/filters/AmountFilter';
import PeriodFilter from '../filters/PeriodFilter';
import { Box, Flex } from '../Grid';
import StyledFilters from '../StyledFilters';

import { ExpensesDirection } from './filters/ExpensesDirection';
import ExpensesOrder from './filters/ExpensesOrder';
import ExpensesPayoutTypeFilter from './filters/ExpensesPayoutTypeFilter';
import ExpensesStatusFilter from './filters/ExpensesStatusFilter';
import ExpensesTypeFilter from './filters/ExpensesTypeFilter';

const FilterContainer = styled.div`
  margin-bottom: 8px;
  flex: 1 1 120px;
`;

const FilterLabel = styled.label`
  font-weight: 600;
  font-size: 9px;
  line-height: 14px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #9d9fa3;
`;

const MVP_TYPE = 2;

const ExpensesFilters = ({ collective, filters, onChange, ignoredExpenseStatus, showDirectionFilter, wrap = true }) => {
  const getFilterProps = (name, valueModifier) => ({
    inputId: `expenses-filter-${name}`,
    value: filters?.[name],
    onChange: value => {
      const preparedValue = valueModifier ? valueModifier(value) : value;
      onChange({ ...filters, [name]: value === 'ALL' ? null : preparedValue });
    },
  });

  return (
    <div>
      {showDirectionFilter && MVP_TYPE === 1 && (
        <Box mb={3}>
          <FilterContainer>
            <StyledFilters
              filters={['RECEIVED', 'SUBMITTED']}
              selected={filters?.direction}
              onChange={direction => onChange({ ...filters, direction })}
              getLabel={value => {
                return value === 'RECEIVED' ? (
                  <FormattedMessage id="ExpensesFilter.Received" defaultMessage="Received" />
                ) : (
                  <FormattedMessage id="ExpensesFilter.Submitted" defaultMessage="Submitted" />
                );
              }}
            />
          </FilterContainer>
        </Box>
      )}
      <Flex flexWrap={['wrap', null, wrap ? 'wrap' : 'nowrap']} gap="18px">
        <FilterContainer>
          <FilterLabel htmlFor="expenses-filter-type">
            <FormattedMessage id="expense.type" defaultMessage="Type" />
          </FilterLabel>
          <ExpensesTypeFilter {...getFilterProps('type')} />
        </FilterContainer>
        <FilterContainer>
          <FilterLabel htmlFor="expenses-filter-payout">
            <FormattedMessage id="Payout" defaultMessage="Payout" />
          </FilterLabel>
          <ExpensesPayoutTypeFilter {...getFilterProps('payout')} />
        </FilterContainer>
        <FilterContainer>
          <FilterLabel htmlFor="expenses-filter-period">
            <FormattedMessage id="Period" defaultMessage="Period" />
          </FilterLabel>
          <PeriodFilter {...getFilterProps('period', encodeDateInterval)} minDate={collective.createdAt} />
        </FilterContainer>
        <FilterContainer>
          <FilterLabel htmlFor="expenses-filter-amount">
            <FormattedMessage id="Fields.amount" defaultMessage="Amount" />
          </FilterLabel>
          <AmountFilter currency={collective.currency} {...getFilterProps('amount')} />
        </FilterContainer>
        <FilterContainer>
          <FilterLabel htmlFor="expenses-filter-status">
            <FormattedMessage id="expense.status" defaultMessage="Status" />
          </FilterLabel>
          <ExpensesStatusFilter {...getFilterProps('status')} ignoredExpenseStatus={ignoredExpenseStatus} />
        </FilterContainer>
        <FilterContainer>
          <FilterLabel htmlFor="expenses-order">
            <FormattedMessage id="expense.order" defaultMessage="Order" />
          </FilterLabel>
          <ExpensesOrder {...getFilterProps('orderBy')} />
        </FilterContainer>
        {showDirectionFilter && MVP_TYPE === 2 && (
          <FilterContainer>
            <FilterLabel htmlFor="expenses-filter-direction">
              <FormattedMessage defaultMessage="Direction" />
            </FilterLabel>
            <ExpensesDirection {...getFilterProps('direction')} />
          </FilterContainer>
        )}
      </Flex>
    </div>
  );
};

ExpensesFilters.propTypes = {
  onChange: PropTypes.func,
  filters: PropTypes.object,
  showDirectionFilter: PropTypes.bool,
  collective: PropTypes.shape({
    currency: PropTypes.string.isRequired,
    createdAt: PropTypes.string,
  }).isRequired,
  wrap: PropTypes.bool,
  ignoredExpenseStatus: PropTypes.arrayOf(PropTypes.oneOf(Object.values(expenseStatus))),
};

export default React.memo(ExpensesFilters);
