import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { getCountryDisplayName } from '@/lib/i18n/countries';

import LoadingPlaceholder from './LoadingPlaceholder';
import { Span } from './Text';

/**
 * Displays a location object
 */
const LocationAddress = ({ location, isLoading = false, showMessageIfEmpty = false, singleLine = false }) => {
  const intl = useIntl();
  if (isLoading) {
    return (
      <div>
        <LoadingPlaceholder height="1em" mb="0.5em" />
        <LoadingPlaceholder height="1em" mb="0.5em" />
        <LoadingPlaceholder height="1em" />
      </div>
    );
  } else if (!location || (!location.address && !location.country)) {
    return !showMessageIfEmpty ? null : (
      <Span fontStyle="italic">
        <FormattedMessage id="LocationAddress.empty" defaultMessage="No address configured yet" />
      </Span>
    );
  }

  return (
    <React.Fragment>
      {location.address}
      {!singleLine ? location.address ? <br /> : null : ', '}
      {location.country ? getCountryDisplayName(intl, location.country) : null}
    </React.Fragment>
  );
};

export default LocationAddress;
