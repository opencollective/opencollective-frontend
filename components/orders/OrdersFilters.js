import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { encodeDateInterval } from '../../lib/date-utils';

import AmountFilter from '../budget/filters/AmountFilter';
import PeriodFilter from '../filters/PeriodFilter';
import { Flex } from '../Grid';

import OrderStatusFilter from './OrderStatusFilter';

const FilterContainer = styled.div`
  margin-bottom: 8px;
  flex: 1 1 120px;
  &:not(:last-child) {
    margin-right: 18px;
  }
`;

const FilterLabel = styled.label`
  font-weight: 600;
  font-size: 9px;
  line-height: 14px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #9d9fa3;
`;

const OrdersFilters = ({ currency, filters, hasStatus, onChange }) => {
  const getFilterProps = (name, valueModifier) => ({
    inputId: `orders-filter-${name}`,
    value: filters?.[name],
    onChange: value => {
      const preparedValue = valueModifier ? valueModifier(value) : value;
      onChange({ ...filters, [name]: value === 'ALL' ? null : preparedValue });
    },
  });

  return (
    <Flex flexWrap="wrap">
      <FilterContainer>
        <FilterLabel htmlFor="orders-filter-period">
          <FormattedMessage id="Period" defaultMessage="Period" />
        </FilterLabel>
        <PeriodFilter {...getFilterProps('period', encodeDateInterval)} />
      </FilterContainer>
      <FilterContainer>
        <FilterLabel htmlFor="orders-filter-amount">
          <FormattedMessage id="Fields.amount" defaultMessage="Amount" />
        </FilterLabel>
        <AmountFilter currency={currency} {...getFilterProps('amount')} />
      </FilterContainer>
      {hasStatus && (
        <FilterContainer>
          <FilterLabel htmlFor="orders-filter-status">
            <FormattedMessage id="order.status" defaultMessage="Status" />
          </FilterLabel>
          <OrderStatusFilter {...getFilterProps('status')} />
        </FilterContainer>
      )}
    </Flex>
  );
};

OrdersFilters.propTypes = {
  onChange: PropTypes.func,
  filters: PropTypes.object,
  currency: PropTypes.string,
  hasStatus: PropTypes.bool,
};

export default React.memo(OrdersFilters);
