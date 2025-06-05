import React from 'react';
import PropTypes from 'prop-types';
import { groupBy, sortBy, truncate } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';

import Avatar from '../Avatar';
import CollectivePicker, { FLAG_COLLECTIVE_PICKER_COLLECTIVE, FLAG_NEW_COLLECTIVE } from '../CollectivePicker';
import { Flex } from '../Grid';
import { Span } from '../Text';

import { canUseIncognitoForContribution, INCOGNITO_ID } from './utils';

const { ORGANIZATION, COLLECTIVE, FUND, EVENT, PROJECT, INDIVIDUAL } = CollectiveType;

const formatAccountName = (intl, account) => {
  return account.isIncognito
    ? intl.formatMessage({ id: 'profile.incognito', defaultMessage: 'Incognito' })
    : truncate(account.name, { length: 40 });
};

const getProfileOptions = (intl, profiles, tier) => {
  const getOptionFromAccount = value => ({
    [FLAG_COLLECTIVE_PICKER_COLLECTIVE]: true,
    value: value.account,
    label: value.account.name,
  });
  const sortOptions = options => sortBy(options, 'value.name');
  const profileOptions = profiles.map(getOptionFromAccount);
  const profilesByType = groupBy(profileOptions, p => p.value.type);
  const myself = profilesByType[INDIVIDUAL] || [];
  const myOrganizations = sortOptions(profilesByType[ORGANIZATION] || []);

  // Add incognito profile entry if it doesn't exists
  const hasIncognitoProfile = profiles.some(p => p.account.type === CollectiveType.INDIVIDUAL && p.account.isIncognito);
  if (!hasIncognitoProfile && canUseIncognitoForContribution(tier)) {
    myself.push(
      getOptionFromAccount({
        account: {
          id: INCOGNITO_ID,
          type: CollectiveType.INDIVIDUAL,
          isIncognito: true,
          name: intl.formatMessage({ id: 'profile.incognito', defaultMessage: 'Incognito' }),
        },
      }),
    );
  }

  // Add an entry for creating a new organization
  myOrganizations.push({
    label: intl.formatMessage({ id: 'organization.create', defaultMessage: 'Create Organization' }), // Not displayed, but useful for searching
    value: null,
    isDisabled: true,
    [FLAG_NEW_COLLECTIVE]: true,
    types: [CollectiveType.ORGANIZATION],
    __background__: 'white',
  });

  const options = [
    { options: myself, label: intl.formatMessage({ defaultMessage: 'Myself', id: 'YjO/0+' }) },
    { options: myOrganizations, label: intl.formatMessage({ id: 'organization', defaultMessage: 'My Organizations' }) },
  ];

  if (profilesByType[COLLECTIVE]?.length) {
    options.push({
      options: sortOptions(profilesByType[COLLECTIVE]),
      label: intl.formatMessage({ id: 'collective', defaultMessage: 'My Collectives' }),
    });
  }
  if (profilesByType[FUND]?.length) {
    options.push({
      options: sortOptions(profilesByType[FUND]),
      label: intl.formatMessage({ id: 'funds', defaultMessage: 'My Funds' }),
    });
  }
  if (profilesByType[PROJECT]?.length) {
    options.push({
      options: sortOptions(profilesByType[PROJECT]),
      label: intl.formatMessage({ defaultMessage: 'My Projects', id: 'FVO2wx' }),
    });
  }
  if (profilesByType[EVENT]?.length) {
    options.push({
      options: sortOptions(profilesByType[EVENT]),
      label: intl.formatMessage({ id: 'events', defaultMessage: 'My Events' }),
    });
  }

  return options;
};

const formatProfileOption = (option, _, intl) => {
  const account = option.value;
  return (
    <Flex alignItems="center">
      <Avatar collective={account} radius={32} />
      <Flex flexDirection="column" ml={3} css={{ whiteSpace: 'initial' }}>
        <Span fontSize="14px" fontWeight="500" lineHeight="20px" color="black.900">
          {formatAccountName(intl, account)}
        </Span>
        {account.isIncognito ? (
          <Span fontSize="12px" lineHeight="18px" color="black.700">
            <FormattedMessage defaultMessage="Private contribution - Check privacy box for info" id="104ECN" />
          </Span>
        ) : (
          <Span fontSize="12px" lineHeight="18px" color="black.700">
            {account.type === CollectiveType.INDIVIDUAL && (
              <React.Fragment>
                <FormattedMessage id="ContributionFlow.PersonalProfile" defaultMessage="Personal profile" />
                {' - '}
              </React.Fragment>
            )}
            {account.slug ? `@${account.slug}` : account.email || ''}
          </Span>
        )}
      </Flex>
    </Flex>
  );
};

const ContributeProfilePicker = ({ profiles, tier, selectedProfile, onChange }) => {
  const intl = useIntl();
  const getOptionsArgs = [intl, profiles, tier];
  const options = React.useMemo(() => getProfileOptions(...getOptionsArgs), getOptionsArgs);
  return (
    <CollectivePicker
      data-cy="contribute-profile-picker"
      inputId="contribute-profile-picker"
      collective={selectedProfile}
      addLoggedInUserAsAdmin
      options={options}
      isSearchable={profiles.length > 8}
      creatable
      excludeAdminFields
      types={[CollectiveType.ORGANIZATION]}
      formatOptionLabel={formatProfileOption}
      onChange={({ value }) => onChange(value)}
      styles={{
        menu: { borderRadius: '16px' },
        menuList: { padding: '8px' },
        control: { padding: '14px 16px', borderRadius: '8px' },
      }}
    />
  );
};

ContributeProfilePicker.propTypes = {
  profiles: PropTypes.array,
  onChange: PropTypes.func,
  selectedProfile: PropTypes.object,
  tier: PropTypes.object,
};

export default ContributeProfilePicker;
