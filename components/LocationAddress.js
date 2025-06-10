import React from 'react';
import { FormattedMessage } from 'react-intl';

import LoadingPlaceholder from './LoadingPlaceholder';
import { Span } from './Text';

/**
 * Displays a location object
 */
const LocationAddress = ({ location, isLoading = false, showMessageIfEmpty = false, singleLine = false }) => {
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
      {!singleLine ? <br /> : ', '}
      {location.country}
    </React.Fragment>
  );
};

export default LocationAddress;
