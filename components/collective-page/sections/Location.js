import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { isEmptyCollectiveLocation } from '../../../lib/collective.lib';
import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import Container from '../../Container';
import { Box } from '../../Grid';
import LocationComponent from '../../Location';
import { P } from '../../Text';
import ContainerSectionContent from '../ContainerSectionContent';
import SectionTitle from '../SectionTitle';

const isEmptyOnlineLocation = event => {
  return event.location?.name === 'Online' && !event.location.address && !event.privateInstructions;
};

const Location = ({ collective: event, refetch }) => {
  const { LoggedInUser } = useLoggedInUser();
  const prevLoggedInUser = React.useRef(LoggedInUser);

  React.useEffect(() => {
    if (LoggedInUser && !prevLoggedInUser.current) {
      // To make sure user gets access to privateInstructions
      refetch();
      prevLoggedInUser.current = LoggedInUser;
    }
  }, [LoggedInUser]);

  if (isEmptyCollectiveLocation(event) || isEmptyOnlineLocation(event)) {
    return null;
  }

  return (
    <Box pb={4}>
      <ContainerSectionContent pb={4}>
        <SectionTitle textAlign="center">
          <FormattedMessage id="SectionLocation.Title" defaultMessage="Location" />
        </SectionTitle>
        <LocationComponent
          location={event.location}
          privateInstructions={event.privateInstructions}
          showTitle={false}
        />
        {event.privateInstructions && (
          <Container mt={4} textAlign="center">
            <P fontWeight="bold" fontSize="18px">
              <FormattedMessage id="event.privateInstructions.label" defaultMessage="Private instructions" />
            </P>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                fontSize: '14px',
                marginTop: 3,
                background: 'transparent',
                border: 'none',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {event.privateInstructions}
            </pre>
          </Container>
        )}
      </ContainerSectionContent>
    </Box>
  );
};
Location.propTypes = {
  refetch: PropTypes.func.isRequired,
  collective: PropTypes.shape({
    location: PropTypes.object,
    privateInstructions: PropTypes.string,
  }).isRequired,
};

export default Location;
