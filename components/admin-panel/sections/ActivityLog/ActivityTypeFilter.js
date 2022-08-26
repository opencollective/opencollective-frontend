import React from 'react';
import PropTypes from 'prop-types';
import { defineMessage, useIntl } from 'react-intl';

import { isIndividualAccount } from '../../../../lib/collective.lib';

import { StyledSelectFilter } from '../../../StyledSelectFilter';

// Activities shared between all account types
const COMMON_OPTIONS = [
  {
    value: 'ALL',
    label: defineMessage({ id: 'Amount.AllShort', defaultMessage: 'All' }),
  },
  {
    type: 'COLLECTIVE',
    value: 'ACCOUNTS',
    label: defineMessage({ defaultMessage: 'Accounts' }),
  },
  {
    value: 'EXPENSES',
    type: 'EXPENSES',
    label: defineMessage({ id: 'Expenses', defaultMessage: 'Expenses' }),
  },
  {
    value: 'CONTRIBUTIONS',
    type: 'CONTRIBUTIONS',
    label: defineMessage({ id: 'Contributions', defaultMessage: 'Contributions' }),
  },
  {
    value: 'UPDATES',
    type: 'ACTIVITIES_UPDATES',
    label: defineMessage({ defaultMessage: 'Updates & Conversations' }),
  },
  {
    value: 'VIRTUAL_CARDS',
    type: 'VIRTUAL_CARDS',
    label: defineMessage({ id: 'VirtualCards.Title', defaultMessage: 'Virtual Cards' }),
  },
  {
    value: 'GIFT_CARDS',
    type: ['USER_CARD_INVITED', 'USER_CARD_CLAIMED'],
    label: defineMessage({ id: 'editCollective.menu.giftCards', defaultMessage: 'Gift Cards' }),
  },
];

// Activities specific to the user account
const USER_OPTIONS = [
  ...COMMON_OPTIONS,
  {
    value: 'USER',
    type: ['USER_NEW_TOKEN', 'OAUTH_APPLICATION_AUTHORIZED', 'USER_CHANGE_EMAIL'],
    label: defineMessage({ defaultMessage: 'User Account' }),
  },
];

export const getActivityTypeFilterValuesFromKey = key => {
  return USER_OPTIONS.find(option => option.value === key)?.type || null;
};

const getOptionsForAccount = account => {
  if (!account || !isIndividualAccount(account)) {
    return COMMON_OPTIONS;
  } else {
    return USER_OPTIONS;
  }
};

const ActivityTypeFilter = ({ account, onChange, value, ...props }) => {
  const intl = useIntl();
  const options = getOptionsForAccount(account);
  return (
    <StyledSelectFilter
      inputId="activity-type-filter"
      onChange={({ value }) => onChange(value)}
      isLoading={!account}
      disabled={!account}
      options={options}
      value={options.find(option => option.value === value) || options[0]}
      formatOptionLabel={option => intl.formatMessage(option.label)}
      {...props}
    />
  );
};

ActivityTypeFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  account: PropTypes.shape({ type: PropTypes.string }),
};

export default ActivityTypeFilter;
