import React from 'react';
import PropTypes from 'prop-types';

import { CollectiveType } from '../../../../lib/constants/collectives';

import CollectivePickerAsync from '../../../CollectivePickerAsync';

const ActivityAccountFilter = ({ account, onChange }) => {
  return (
    <CollectivePickerAsync
      inputId="activity-filter-account"
      isMulti
      preload
      useCompactMode
      isLoading={!account}
      disabled={!account}
      types={[CollectiveType.COLLECTIVE, CollectiveType.EVENT, CollectiveType.PROJECT, CollectiveType.FUND]}
      hostCollectiveIds={account?.isHost ? [account?.legacyId] : null}
      parentCollectiveIds={!account?.isHost ? [account?.legacyId] : null}
      onChange={filterAccounts => onChange(filterAccounts.map(filterAccount => filterAccount.value.id).toString())}
    />
  );
};

ActivityAccountFilter.propTypes = {
  account: PropTypes.shape({
    legacyId: PropTypes.number,
    isHost: PropTypes.bool,
  }),
  onChange: PropTypes.func.isRequired,
};

export default ActivityAccountFilter;
