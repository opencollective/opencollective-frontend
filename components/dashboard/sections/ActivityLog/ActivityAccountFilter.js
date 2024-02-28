import React from 'react';
import PropTypes from 'prop-types';
import { defineMessage, useIntl } from 'react-intl';

import { CollectiveType } from '../../../../lib/constants/collectives';

import { CUSTOM_OPTIONS_POSITION } from '../../../CollectivePicker';
import CollectivePickerAsync from '../../../CollectivePickerAsync';
import { getSelectFilterStyles } from '../../../StyledSelectFilter';

const SELECT_STYLES = getSelectFilterStyles();

const getCustomOptions = (intl, account) => {
  const options = [
    {
      value: account,
      isCustomOption: true,
      label: intl.formatMessage(defineMessage({ defaultMessage: 'Own account' })),
    },
  ];

  if (account?.childrenAccounts?.totalCount > 0) {
    options.push({
      id: '__CHILDREN_ACCOUNTS__',
      isCustomOption: true,
      label: intl.formatMessage(defineMessage({ defaultMessage: 'All children accounts' })),
    });
  }
  if (account?.isHost) {
    options.push({
      id: '__HOSTED_ACCOUNTS__',
      isCustomOption: true,
      label: intl.formatMessage(defineMessage({ defaultMessage: 'All hosted accounts' })),
    });
  }

  return options;
};

const encodeOptions = options => {
  return !Array.isArray(options) ? options.id : options.map(option => option.value.slug).join(',');
};

const decodeOption = (customOptions, value) => {
  if (!value) {
    return customOptions[0];
  } else if (value === '__CHILDREN_ACCOUNTS__') {
    return customOptions.find(option => option.id === '__CHILDREN_ACCOUNTS__');
  } else if (value === '__HOSTED_ACCOUNTS__') {
    return customOptions.find(option => option.id === '__HOSTED_ACCOUNTS__');
  } else {
    return value.split(',').map(slug => ({ value: { slug }, label: slug }));
  }
};

const ActivityAccountFilter = ({ account, value, onChange }) => {
  const intl = useIntl();
  const customOptions = React.useMemo(() => getCustomOptions(intl, account), [account]);
  const selectedOption = React.useMemo(() => decodeOption(customOptions, value), [customOptions, value]);
  const isMulti = Array.isArray(selectedOption);
  const dispatchOptionsChange = options => onChange(encodeOptions(options));

  // If selectedOption wasn't set while there's a value, it means that the value is invalid. In this case we reset to the default value.
  React.useEffect(() => {
    if (account && value && !selectedOption) {
      dispatchOptionsChange(customOptions[0]);
    }
  }, [account, value, selectedOption]);

  return (
    <CollectivePickerAsync
      inputId="activity-filter-account"
      isMulti={isMulti}
      preload
      useCompactMode
      isLoading={!account}
      disabled={!account}
      types={[CollectiveType.COLLECTIVE, CollectiveType.EVENT, CollectiveType.PROJECT, CollectiveType.FUND]}
      hostCollectiveIds={account?.isHost ? [account?.legacyId] : null}
      parentCollectiveIds={!account?.isHost ? [account?.legacyId] : null}
      customOptions={customOptions}
      customOptionsPosition={CUSTOM_OPTIONS_POSITION.TOP}
      value={selectedOption}
      fontSize="12px"
      lineHeight="14px"
      styles={SELECT_STYLES}
      onChange={(options, event) => {
        if (event.action === 'select-option') {
          const selectedOption = isMulti ? event.option : options;
          if (selectedOption.isCustomOption) {
            dispatchOptionsChange(selectedOption); // Switch back to single mode when selecting a custom option
          } else {
            dispatchOptionsChange(Array.isArray(options) ? options : [options]); // Switch to multi mode if we pick a collective
          }
        } else if (options.length === 0) {
          dispatchOptionsChange(customOptions[0]); // Switch back to single mode when clearing the selection
        } else {
          dispatchOptionsChange(options);
        }
      }}
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
  value: PropTypes.string,
};

export default ActivityAccountFilter;
