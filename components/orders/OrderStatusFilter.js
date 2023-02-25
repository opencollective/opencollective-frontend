import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { ORDER_STATUS } from '../../lib/constants/order-status';
import i18nOrderStatus from '../../lib/i18n/order-status';
import { sortSelectOptions } from '../../lib/utils';

import { StyledSelectFilter } from '../StyledSelectFilter';

const OrderStatusFilter = ({ onChange, value, ...props }) => {
  const intl = useIntl();
  const getOption = value => ({ label: i18nOrderStatus(intl, value), value });
  const options = [getOption('ALL'), ...Object.values(ORDER_STATUS).map(getOption)];

  return (
    <StyledSelectFilter
      inputId="order-status-filter"
      isSearchable={false}
      onChange={({ value }) => onChange(value)}
      value={getOption(value || 'ALL')}
      options={options.sort(sortSelectOptions)}
      {...props}
    />
  );
};

OrderStatusFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default OrderStatusFilter;
