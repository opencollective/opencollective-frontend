import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { encodeDateInterval } from '../../../../lib/date-utils';

import PeriodFilter from '../../../budget/filters/PeriodFilter';
import Container from '../../../Container';
import { Box, Flex } from '../../../Grid';

import ActivityAttributionFilter from './ActivityAttributionFilter';
import ActivityTypeFilter from './ActivityTypeFilter';

const FilterContainer = styled(Box)`
  margin-bottom: 24px;
  width: 210px;
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
        <FilterContainer>
          <FilterLabel htmlFor="activity-filter-period">
            <FormattedMessage id="Period" defaultMessage="Period" />
          </FilterLabel>
          <PeriodFilter {...getFilterProps('period', encodeDateInterval)} />
        </FilterContainer>
        <FilterContainer ml={[0, '19px']}>
          <FilterLabel htmlFor="activity-filter-type">
            <FormattedMessage id="webhooks.types.label" defaultMessage="Activity" />
          </FilterLabel>
          <ActivityTypeFilter account={account} {...getFilterProps('type')} />
        </FilterContainer>
        <FilterContainer ml={[0, '19px']}>
          <FilterLabel htmlFor="activity-filter-attribution">
            <FormattedMessage id="Activity.Attribution" defaultMessage="Attribution" />
          </FilterLabel>
          <ActivityAttributionFilter account={account} {...getFilterProps('attribution')} />
        </FilterContainer>
      </Flex>
    </Container>
  );
};

ActivityFilters.propTypes = {
  onChange: PropTypes.func,
  filters: PropTypes.object,
  account: PropTypes.shape({
    isHost: PropTypes.bool,
  }),
};

export default React.memo(ActivityFilters);
