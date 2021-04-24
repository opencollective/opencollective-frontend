import React from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';

import { CollectiveType } from '../../../../../lib/constants/collectives';

import { CUSTOM_OPTIONS_POSITION } from '../../../../CollectivePicker';
import CollectivePickerAsync from '../../../../CollectivePickerAsync';

function MerchantFilter({ inputId, onChange }) {
  const router = useRouter();

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
      value={
        router.query.merchant
          ? { label: router.query.merchant, value: router.query.merchant }
          : { label: 'All Merchants', value: 'ALL' }
      }
      emptyCustomOptions={[{ label: 'All Merchants', value: 'ALL' }]}
      customOptionsPosition={CUSTOM_OPTIONS_POSITION.TOP}
    />
  );
}

MerchantFilter.propTypes = {
  inputId: PropTypes.string,
  onChange: PropTypes.func,
};

export default MerchantFilter;
