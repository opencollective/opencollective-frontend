import React from 'react';
import PropTypes from 'prop-types';
import AddressFormatter from '@shopify/address';
import { pick } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';
import { isURL } from 'validator';

import Container from './Container';
import { Flex } from './Grid';
import Map from './Map';
import StyledLink from './StyledLink';
import { P } from './Text';

const addressFormatter = new AddressFormatter('EN');

const LocationSection = styled.section`
  text-align: center;
`;

function Location({ location, showTitle }) {
  const intl = useIntl();

  const { name, address, address1, address2, city, postalCode, zone, lat, long, country } = location || {};

  const legacyAddress = [address, country].filter(Boolean).join(', ');
  const [formattedAddress, setFormattedAddress] = React.useState(legacyAddress);

  React.useEffect(() => {
    if (intl.locale) {
      addressFormatter.updateLocale(intl.locale);
    }
  }, [intl.locale]);

  React.useEffect(() => {
    const formatAddress = async () => {
      const address = await addressFormatter.format({
        address1,
        address2,
        city,
        zip: postalCode,
        province: zone,
        country,
      });
      setFormattedAddress(address.filter(Boolean).join(', '));
    };

    // if legacy address is not present, format address
    if (
      !location?.address &&
      Object.values(pick(location, ['address1', 'address2', 'city', 'postalCode', 'zone', 'country'])).some(Boolean)
    ) {
      formatAddress();
    }
  }, [location]);

  if (!location) {
    return null;
  }

  if (name === 'Online') {
    if (address1 && isURL(address1)) {
      return (
        <Flex flexDirection="Column" alignItems="center">
          <P textAlign="center">
            <StyledLink openInNewTabNoFollow href={address1}>
              {address1}
            </StyledLink>
          </P>
        </Flex>
      );
    } else {
      return (
        <P textAlign="center">
          <FormattedMessage id="Location.online" defaultMessage="Online" />
        </P>
      );
    }
  } else if (!name && !address && !lat && !long && !country) {
    return null;
  }

  const openStreetMapLink =
    lat && long
      ? `https://www.openstreetmap.org/?mlat=${lat}&amp;mlon=${long}#map=16/${lat}/${long}`
      : `https://www.openstreetmap.org/search?query=${encodeURIComponent(formattedAddress)}`;

  return (
    <LocationSection id="location">
      <Container margin="30px 10px">
        {showTitle && <h1>Location</h1>}
        <Container font-size="1.7rem" margin="5px 0px">
          {name}
        </Container>
        <Container className="address" color="black.600">
          <StyledLink href={openStreetMapLink} openInNewTab>
            {formattedAddress}
          </StyledLink>
        </Container>
      </Container>
      {lat && long && (
        <div className="map">
          <Map lat={lat} long={long} />
        </div>
      )}
    </LocationSection>
  );
}

Location.propTypes = {
  location: PropTypes.object,
  showTitle: PropTypes.bool,
};

Location.defaultProps = {
  showTitle: true,
};

export default Location;
