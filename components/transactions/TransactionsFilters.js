import React from 'react';
import PropTypes from 'prop-types';
import { omitBy } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import AmountFilter from '../budget/filters/AmountFilter';
import PeriodFilter from '../budget/filters/PeriodFilter';
import { Box, Flex } from '../Grid';

import TransactionsTypeFilter from './filters/TransactionsTypeFilter';

const FilterContainer = styled(Box)`
  margin-bottom: 8px;
`;

const FilterLabel = styled.label`
  font-weight: 600;
  font-size: 9px;
  line-height: 14px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #9d9fa3;
`;

const TransactionsFilters = ({ collective, filters, onChange }) => {
  const getFilterProps = name => ({
    inputId: `transactions-filter-${name}`,
    value: filters?.[name],
    onChange: value => {
      const obj = { ...filters, [name]: value === 'ALL' ? null : value };
      onChange(omitBy(obj, value => !value));
    },
  });

  return (
    <Flex flexDirection={['column', 'row']} flexGrow={[1, 0.5]}>
      <FilterContainer mr={[0, '8px']} mb={['8px', 0]} flexGrow={1}>
        <FilterLabel htmlFor="transactions-filter-type">
          <FormattedMessage id="transactions.type" defaultMessage="Type" />
        </FilterLabel>
        <TransactionsTypeFilter {...getFilterProps('type')} />
      </FilterContainer>
      <FilterContainer mr={[0, '8px']} mb={['8px', 0]} flexGrow={1}>
        <FilterLabel htmlFor="transactions-filter-period">
          <FormattedMessage id="Period" defaultMessage="Period" />
        </FilterLabel>
        <PeriodFilter {...getFilterProps('period')} />
      </FilterContainer>
      <FilterContainer mr={[0, '8px']} mb={['8px', 0]} flexGrow={1}>
        <FilterLabel htmlFor="transactions-filter-amount">
          <FormattedMessage id="Fields.amount" defaultMessage="Amount" />
        </FilterLabel>
        <AmountFilter currency={collective.currency} {...getFilterProps('amount')} />
      </FilterContainer>
    </Flex>
  );
};

TransactionsFilters.propTypes = {
  onChange: PropTypes.func,
  filters: PropTypes.object,
  collective: PropTypes.shape({
    currency: PropTypes.string.isRequired,
  }).isRequired,
};

export default React.memo(TransactionsFilters);
