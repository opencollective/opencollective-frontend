import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import LoadingPlaceholder from './LoadingPlaceholder';
import { Span } from './Text';

/** If using I18nAddressFields component, address will be stringified JSON */
const isAddressJson = address => {
  let addressObject;
  try {
    addressObject = JSON.parse(address);
  } catch (e) {
    return false;
  }
  return addressObject;
};

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

  const addressJSON = isAddressJson(location.address);

  return (
    <React.Fragment>
      {addressJSON ? (
        <React.Fragment>
          {Object.entries(addressJSON).map(([addressLineKey, addressLineValue], idx) => (
            <React.Fragment key={addressLineKey}>
              {idx !== 0 && <br />}
              {addressLineValue}
            </React.Fragment>
          ))}
        </React.Fragment>
      ) : (
        <React.Fragment>{location.address}</React.Fragment>
      )}
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
  showMessageIfEmpty: PropTypes.bool,
};

export default LocationAddress;
