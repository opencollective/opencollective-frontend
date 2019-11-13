import { FormattedMessage } from 'react-intl';
import { Box } from '@rebass/grid';
import Location from '../../Location';
import SectionTitle from '../SectionTitle';
import ContainerSectionContent from '../ContainerSectionContent';

export default ({ collective: event }) => (
  <Box pt={[4, 5]}>
    <ContainerSectionContent pt={[4, 5]}>
      <SectionTitle textAlign="center">
        <FormattedMessage id="SectionLocation.Title" defaultMessage="Location" />
      </SectionTitle>
      <Location location={event.location} showTitle={false} />
    </ContainerSectionContent>
  </Box>
);
