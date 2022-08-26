import React from 'react';
import PropTypes from 'prop-types';
import { omit } from 'lodash';
import { useIntl } from 'react-intl';

import { ActivityAttribution } from '../../../../lib/constants/activities';
import { ActivityAttributionI18n } from '../../../../lib/i18n/activities';

import { StyledSelectFilter } from '../../../StyledSelectFilter';

const getAcceptableAttributionValues = account => {
  if (account?.isHost) {
    return ['ALL', ...Object.values(ActivityAttribution)];
  } else {
    return ['ALL', ...Object.values(omit(ActivityAttribution, 'HOSTED_ACCOUNTS'))];
  }
};

export const isSupportedAttributionFilter = (account, filter) => {
  return !filter || getAcceptableAttributionValues(account).includes(filter);
};

const ActivityAttributionFilter = ({ account, onChange, value, ...props }) => {
  const intl = useIntl();
  const getOption = value => ({ label: intl.formatMessage(ActivityAttributionI18n[value]), value });
  const allOptions = React.useMemo(() => getAcceptableAttributionValues(account).map(getOption), [intl, account]);

  return (
    <StyledSelectFilter
      inputId="activity-type-filter"
      onChange={({ value }) => onChange(value)}
      value={allOptions.find(option => option.value === value) || allOptions[0]}
      options={allOptions}
      isLoading={!account}
      disabled={!account}
      {...props}
    />
  );
};

ActivityAttributionFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  account: PropTypes.shape({
    isHost: PropTypes.bool,
  }),
};

export default ActivityAttributionFilter;
