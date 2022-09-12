import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';

import { CollectiveType } from '../../../../lib/constants/collectives';

import { CUSTOM_OPTIONS_POSITION, FLAG_COLLECTIVE_PICKER_COLLECTIVE } from '../../../CollectivePicker';
import CollectivePickerAsync from '../../../CollectivePickerAsync';

const ActivityAccountFilter = ({ account, onChange }) => {
  const router = useRouter();
  const defaultValue = {
    value: { id: account?.legacyId, name: account?.name, slug: account?.slug, imageUrl: account?.imageUrl },
    label: account?.name,
    [FLAG_COLLECTIVE_PICKER_COLLECTIVE]: true,
  };
  const [selectedValue, setSelectedValue] = React.useState(defaultValue);

  useEffect(() => {
    if (router?.query?.account) {
      router.push(`${account.slug}/admin/activity-log`);
    }
  }, []);

  const getCustomOptions = () => {
    const customOptions = [{ value: { id: 'parentedAccounts' }, label: 'All children accounts' }];
    if (account?.isHost) {
      customOptions.push({
        value: { id: 'hostedAccounts' },
        label: 'All hosted accounts',
      });
    }
    return customOptions;
  };

  return (
    <CollectivePickerAsync
      inputId="activity-filter-account"
      isMulti
      preload
      useCompactMode
      isLoading={!account}
      disabled={!account}
      styles={{ control: baseStyles => ({ ...baseStyles, borderRadius: 5 }) }}
      types={[CollectiveType.COLLECTIVE, CollectiveType.EVENT, CollectiveType.PROJECT, CollectiveType.FUND]}
      hostCollectiveIds={account?.isHost ? [account?.legacyId] : null}
      parentCollectiveIds={!account?.isHost ? [account?.legacyId] : null}
      onChange={filterAccounts => {
        setSelectedValue(filterAccounts);
        onChange(filterAccounts.map(filterAccount => filterAccount.value.id).toString());
      }}
      customOptions={[defaultValue, ...getCustomOptions()]}
      customOptionsPosition={CUSTOM_OPTIONS_POSITION.TOP}
      value={selectedValue}
    />
  );
};

ActivityAccountFilter.propTypes = {
  account: PropTypes.shape({
    name: PropTypes.string,
    slug: PropTypes.string,
    imageUrl: PropTypes.string,
    legacyId: PropTypes.number,
    isHost: PropTypes.bool,
  }),
  onChange: PropTypes.func.isRequired,
};

export default ActivityAccountFilter;
