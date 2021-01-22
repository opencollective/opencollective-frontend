import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { isEmptyCollectiveLocation } from '../../../lib/collective.lib';

import { Box } from '../../Grid';
import LocationComponent from '../../Location';
import ContainerSectionContent from '../ContainerSectionContent';
import SectionTitle from '../SectionTitle';

const Location = ({ collective: event }) =>
  isEmptyCollectiveLocation(event) ? null : (
    <Box pb={4}>
      <ContainerSectionContent pb={4}>
        <SectionTitle textAlign="center">
          <FormattedMessage id="SectionLocation.Title" defaultMessage="Location" />
        </SectionTitle>
        <LocationComponent location={event.location} showTitle={false} />
      </ContainerSectionContent>
    </Box>
  );

Location.propTypes = {
  collective: PropTypes.shape({
    location: PropTypes.object,
  }).isRequired,
};

export default Location;
