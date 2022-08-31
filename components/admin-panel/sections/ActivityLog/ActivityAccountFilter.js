import React from 'react';
import PropTypes from 'prop-types';

import { CollectiveType } from '../../../../lib/constants/collectives';

import CollectivePickerAsync from '../../../CollectivePickerAsync';

const ActivityAccountFilter = ({ account, onChange }) => {
  const childAccounts = account?.isHost
    ? account?.memberOf?.nodes.map(node => node.account)
    : account?.childrenAccounts?.nodes;

  return (
    <CollectivePickerAsync
      inputId="activity-filter-account"
      isMulti
      useCompactMode
      types={[CollectiveType.COLLECTIVE, CollectiveType.EVENT, CollectiveType.PROJECT, CollectiveType.FUND]}
      filterResults={collectives =>
        collectives.filter(collective => childAccounts.some(childAccount => childAccount.legacyId === collective.id))
      }
      onChange={filterAccounts =>
        onChange(filterAccounts.map(filterAccount => filterAccount.legacyId || filterAccount.value.id).toString())
      }
    />
  );
};

ActivityAccountFilter.propTypes = {
  account: PropTypes.shape({
    isHost: PropTypes.bool,
    memberOf: PropTypes.object,
    childrenAccounts: PropTypes.object,
  }),
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
};

export default ActivityAccountFilter;
