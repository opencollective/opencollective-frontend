import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { VIRTUAL_CARD_STATUS } from '../../../../../lib/constants/virtual-card-status';
import { i18nVirtualCardStatusType } from '../../../../../lib/i18n/virtual-card-status';

import { StyledSelectFilter } from '../../../../StyledSelectFilter';

const StatusFilter = ({ onChange, value, ...props }) => {
  const intl = useIntl();
  const getOption = value => ({ label: i18nVirtualCardStatusType(intl, value), value });

  return (
    <StyledSelectFilter
      inputId="status-filter"
      isSearchable={false}
      onChange={({ value }) => onChange(value)}
      value={getOption(value || 'ALL')}
      options={[
        getOption('ALL'),
        getOption(VIRTUAL_CARD_STATUS.OPEN),
        getOption(VIRTUAL_CARD_STATUS.CLOSED),
        getOption(VIRTUAL_CARD_STATUS.PAUSED),
        getOption(VIRTUAL_CARD_STATUS.PENDING_ACTIVATION),
        getOption(VIRTUAL_CARD_STATUS.PENDING_FULFILLMENT),
      ]}
      {...props}
    />
  );
};

StatusFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default StatusFilter;
