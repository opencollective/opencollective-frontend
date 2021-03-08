import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';

import { StyledSelectFilter } from '../../StyledSelectFilter';

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

const CollectiveSortByFilter = ({ value, onChange, ...props }) => {
  const intl = useIntl();
  const getOption = value => ({ label: intl.formatMessage(labels[value]), value });
  const options = [getOption('most-recent'), getOption('oldest')];

  return (
    <StyledSelectFilter
      inputId="collective-sort-filter"
      value={labels[value] ? getOption(value) : options[0]}
      onChange={({ value }) => onChange(value)}
      options={options}
      {...props}
    />
  );
};

CollectiveSortByFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default CollectiveSortByFilter;
