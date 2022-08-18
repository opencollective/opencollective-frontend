import React from 'react';
import PropTypes from 'prop-types';
import { omit } from 'lodash';
import { useIntl } from 'react-intl';

import { ActivityClasses } from '../../../../lib/constants/activities';
import { ActivityCategoryLabelI18n } from '../../../../lib/i18n/activities';

import { StyledSelectFilter } from '../../../StyledSelectFilter';

const ActivityTypeFilter = ({ onChange, value, ...props }) => {
  const intl = useIntl();
  const getOption = value => ({ label: intl.formatMessage(ActivityCategoryLabelI18n[value]), value });
  const ActivityTypeKeys = Object.keys(omit(ActivityClasses, ['REPORTS']));
  ActivityTypeKeys.unshift('ALL');

  return (
    <StyledSelectFilter
      inputId="activity-type-filter"
      onChange={({ value }) => onChange(value)}
      value={getOption(value || 'ALL')}
      options={ActivityTypeKeys.map(getOption)}
      {...props}
    />
  );
};

ActivityTypeFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default ActivityTypeFilter;
