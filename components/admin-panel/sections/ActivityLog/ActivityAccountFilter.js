import React from 'react';
import PropTypes from 'prop-types';

import { CollectiveType } from '../../../../lib/constants/collectives';

import CollectivePickerAsync from '../../../CollectivePickerAsync';

const ActivityAccountFilter = ({ account, onChange, childAccounts }) => {
  return (
    <CollectivePickerAsync
      inputId="activity-filter-account"
      isMulti
      useCompactMode
      types={[CollectiveType.COLLECTIVE, CollectiveType.EVENT, CollectiveType.PROJECT, CollectiveType.FUND]}
      hostCollectiveIds={account?.isHost ? [account?.legacyId] : null}
      filterResults={collectives =>
        account?.isHost
          ? null
          : collectives.filter(collective =>
              childAccounts.some(childAccount => childAccount.legacyId === collective.id),
            )
      }
      onChange={filterAccounts => onChange(filterAccounts.map(filterAccount => filterAccount.value.id).toString())}
    />
  );
};

ActivityAccountFilter.propTypes = {
  account: PropTypes.shape({
    legacyId: PropTypes.number,
    isHost: PropTypes.bool,
  }),
  childAccounts: PropTypes.object,
  onChange: PropTypes.func.isRequired,
};

export default ActivityAccountFilter;
