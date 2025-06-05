import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import Container from '../../Container';
import { StyledSelectFilter } from '../../StyledSelectFilter';

const FilterLabel = styled.label`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #4e5052;
  margin-bottom: 10px;
`;

const labels = defineMessages({
  'most-recent': {
    id: 'Collectives.MostRecent',
    defaultMessage: 'Most recent',
  },
  oldest: {
    id: 'Collectives.Oldest',
    defaultMessage: 'Oldest',
  },
});

const UpdateOrderByFilter = ({ value, onChange, ...props }) => {
  const intl = useIntl();
  const getOption = value => ({ label: intl.formatMessage(labels[value]), value });
  const options = [getOption('most-recent'), getOption('oldest')];

  return (
    <Container>
      <FilterLabel htmlFor="update-filter-sort-by">
        <FormattedMessage id="Update.SortBy" defaultMessage="Sort By" />
      </FilterLabel>
      <StyledSelectFilter
        inputId="update-filter-sort-by"
        value={labels[value] ? getOption(value) : options[0]}
        onChange={({ value }) => onChange(value)}
        options={options}
        {...props}
      />
    </Container>
  );
};

UpdateOrderByFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default React.memo(UpdateOrderByFilter);
