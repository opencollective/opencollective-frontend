import React from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';

import { CollectiveType } from '../../../../../lib/constants/collectives';

import CollectivePicker, { CUSTOM_OPTIONS_POSITION } from '../../../../CollectivePicker';

function MerchantFilter({ inputId, onChange, virtualCardMerchants }) {
  const router = useRouter();

  return (
    <CollectivePicker
      id={inputId}
      inputId={inputId}
      types={[CollectiveType.VENDOR]}
      maxMenuHeight={200}
      placeholder="Search for Merchants"
      limit={10}
      onChange={({ value }) => onChange(value.slug)}
      value={
        router.query.merchant
          ? { label: router.query.merchant, value: router.query.merchant }
          : { label: 'All Merchants', value: 'ALL' }
      }
      customOptions={[{ label: 'All Merchants', value: 'ALL' }]}
      customOptionsPosition={CUSTOM_OPTIONS_POSITION.TOP}
      collectives={virtualCardMerchants}
    />
  );
}

MerchantFilter.propTypes = {
  inputId: PropTypes.string,
  virtualCardMerchants: PropTypes.array,
  onChange: PropTypes.func,
};

export default MerchantFilter;
