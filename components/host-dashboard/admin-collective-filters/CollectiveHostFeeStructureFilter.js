import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { HOST_FEE_STRUCTURE } from '../../../lib/constants/host-fee-structure';
import { formatHostFeeStructure } from '../../../lib/i18n/host-fee-structure';

import { StyledSelectFilter } from '../../StyledSelectFilter';

const CollectiveHostFeeStructureFilter = ({ value, onChange, ...props }) => {
  const intl = useIntl();
  const getOption = value => ({ label: formatHostFeeStructure(intl, value), value });
  const optionAll = getOption('ALL');
  const options = [optionAll, getOption(HOST_FEE_STRUCTURE.DEFAULT), getOption(HOST_FEE_STRUCTURE.CUSTOM_FEE)];

  return (
    <StyledSelectFilter
      inputId="fee-structure-filter"
      value={value ? getOption(value) : optionAll}
      onChange={({ value }) => onChange(value)}
      options={options}
      {...props}
    />
  );
};

CollectiveHostFeeStructureFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default CollectiveHostFeeStructureFilter;
