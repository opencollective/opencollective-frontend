import React from 'react';
import PropTypes from 'prop-types';

import LoadingPlaceholder from './LoadingPlaceholder';

/**
 * Displays a location object
 */
const LocationAddress = ({ location, isLoading }) => {
  if (isLoading) {
    return (
      <div>
        <LoadingPlaceholder height="1em" mb="0.5em" />
        <LoadingPlaceholder height="1em" mb="0.5em" />
        <LoadingPlaceholder height="1em" />
      </div>
    );
  } else if (!location) {
    return null;
  }

  return (
    <React.Fragment>
      {location.address}
      {location.address && location.country && <br />}
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
};

export default LocationAddress;
