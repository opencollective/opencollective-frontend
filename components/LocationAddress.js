import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import LoadingPlaceholder from './LoadingPlaceholder';
import { Span } from './Text';

/**
 * Displays a location object
 */
const LocationAddress = ({ location, isLoading, showMessageIfEmpty }) => {
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
      <br />
      {location.country}
    </React.Fragment>
  );
};

LocationAddress.propTypes = {
  location: PropTypes.shape({
    address: PropTypes.string,
    country: PropTypes.string,
  }),
  isLoading: PropTypes.bool,
  showMessageIfEmpty: PropTypes.bool,
};

export default LocationAddress;
