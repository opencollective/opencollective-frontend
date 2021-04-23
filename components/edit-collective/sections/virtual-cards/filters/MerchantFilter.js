import React from 'react';
import PropTypes from 'prop-types';

import { CollectiveType } from '../../../../../lib/constants/collectives';

import CollectivePickerAsync from '../../../../CollectivePickerAsync';

function MerchantFilter({ onChange }) {
  return (
    <CollectivePickerAsync
      inputId="virtual-card-merchant-filter"
      types={[CollectiveType.COLLECTIVE]}
      placeholder="Search for Merchants"
      preload={true}
      onChange={({ value }) => onChange(value.slug)}
    />
  );
}

MerchantFilter.propTypes = {
  onChange: PropTypes.func,
};

export default MerchantFilter;
