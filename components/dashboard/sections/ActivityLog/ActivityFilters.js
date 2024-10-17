import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { encodeDateInterval } from '../../../../lib/date-utils';

import Container from '../../../Container';
import PeriodFilter from '../../../filters/PeriodFilter';
import { Box, Flex } from '../../../Grid';

import ActivityAccountFilter from './ActivityAccountFilter';
import ActivityTypeFilter from './ActivityTypeFilter';

const FilterContainer = styled(Box)`
  margin-bottom: 24px;
`;

const FilterLabel = styled.label`
  font-weight: 600;
  font-size: 9px;
  line-height: 14px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #9d9fa3;
`;

const ActivityFilters = ({ filters, onChange, account }) => {
  const getFilterProps = (name, valueModifier) => {
    return {
      inputId: `activity-filter-${name}`,
      value: filters?.[name],
      onChange: value => {
        const preparedValue = valueModifier ? valueModifier(value) : value;
        onChange({ ...filters, [name]: value === 'ALL' ? null : preparedValue });
      },
    };
  };

  return (
    <Container>
      <Flex flexWrap="wrap">
        <FilterContainer width={[1, 1 / 3, 1 / 3]}>
          <FilterLabel htmlFor="activity-filter-period">
            <FormattedMessage id="Period" defaultMessage="Period" />
          </FilterLabel>
          <PeriodFilter {...getFilterProps('period', encodeDateInterval)} />
        </FilterContainer>
        <FilterContainer width={[1, 1 / 3, 1 / 3]} pl={[0, '19px']}>
          <FilterLabel htmlFor="activity-filter-type">
            <FormattedMessage defaultMessage="Activity" id="ZmlNQ3" />
          </FilterLabel>
          <ActivityTypeFilter account={account} {...getFilterProps('type')} />
        </FilterContainer>
        {(account?.isHost || account?.childrenAccounts?.totalCount > 0) && (
          <FilterContainer width={[1, 1 / 3, 1 / 3]} pl={[0, '19px']}>
            <FilterLabel htmlFor="activity-filter-account">
              <FormattedMessage defaultMessage="Account" id="TwyMau" />
            </FilterLabel>
            <ActivityAccountFilter account={account} {...getFilterProps('account')} />
          </FilterContainer>
        )}
      </Flex>
    </Container>
  );
};

ActivityFilters.propTypes = {
  onChange: PropTypes.func,
  filters: PropTypes.object,
  account: PropTypes.shape({
    isHost: PropTypes.bool,
    childrenAccounts: PropTypes.object,
  }),
};

export default React.memo(ActivityFilters);
