import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { PayoutMethodType } from '../../../lib/constants/payout-method';
import i18nPayoutMethodType from '../../../lib/i18n/payout-method-type';
import { sortSelectOptions } from '../../../lib/utils';

import { StyledSelectFilter } from '../../StyledSelectFilter';

const ExpensesPayoutTypeFilter = ({ onChange, value, ...props }) => {
  const intl = useIntl();
  const getOption = value => ({ label: i18nPayoutMethodType(intl, value), value });
  const options = [getOption('ALL'), ...Object.values(PayoutMethodType).map(getOption)];

  return (
    <StyledSelectFilter
      inputId="expenses-payout-type-filter"
      options={options.sort(sortSelectOptions)}
      onChange={({ value }) => onChange(value)}
      value={getOption(value || 'ALL')}
      {...props}
    />
  );
};

ExpensesPayoutTypeFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOf(Object.values(PayoutMethodType)),
};

export default ExpensesPayoutTypeFilter;
