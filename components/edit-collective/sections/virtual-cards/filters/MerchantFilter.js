import React from 'react';
import PropTypes from 'prop-types';

import { CollectiveType } from '../../../../../lib/constants/collectives';

import { CUSTOM_OPTIONS_POSITION } from '../../../../CollectivePicker';
import CollectivePickerAsync from '../../../../CollectivePickerAsync';

function MerchantFilter({ inputId, onChange }) {
  return (
    <CollectivePickerAsync
      id={inputId}
      inputId={inputId}
      types={[CollectiveType.COLLECTIVE]}
      maxMenuHeight={200}
      placeholder="Search for Merchants"
      preload={true}
      limit={10}
      onChange={({ value }) => onChange(value.slug)}
      emptyCustomOptions={[{ value: 'ALL', label: 'All Merchants' }]}
      customOptionsPosition={CUSTOM_OPTIONS_POSITION.TOP}
    />
  );
}

MerchantFilter.propTypes = {
  inputId: PropTypes.string,
  onChange: PropTypes.func,
};

export default MerchantFilter;
