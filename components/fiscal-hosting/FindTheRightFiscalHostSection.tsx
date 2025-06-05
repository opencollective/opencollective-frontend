import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import Illustration from '../collectives/HomeIllustration';
import Container from '../Container';
import { Box, Flex, Grid } from '../Grid';
import { SectionDescription, SectionTitle } from '../marketing/Text';
import StyledCarousel from '../StyledCarousel';
import { H3, P } from '../Text';

import { HOST_CONSIDERATIONS } from './constants';

const messages = defineMessages({
  'fiscalHosting.missionAlignment': {
    id: 'fiscalHosting.missionAlignment',
    defaultMessage: 'Mission alignment',
  },
  'fiscalHosting.missionAlignment.description': {
    id: 'fiscalHosting.missionAlignment.description',
    defaultMessage:
      'Fiscal hosts usually have specific topics or areas they are designed to serve. When it comes to the application process, their acceptance criteria will fit in that scope.',
  },
  'fiscalHosting.location': {
    id: 'SectionLocation.Title',
    defaultMessage: 'Location',
  },
  'fiscalHosting.location.description': {
    id: 'fiscalHosting.location.description',
    defaultMessage:
      'Which country a fiscal host is based in will determine the currency you your money will be accounted in, and where you are located in a legal sense, e.g., if you are applying for an EU grant, you might need a fiscal host based in the EU.',
  },
  'fiscalHosting.legalStructure': {
    id: 'fiscalHosting.legalStructure',
    defaultMessage: 'Legal structure',
  },
  'fiscalHosting.legalStructure.description': {
    id: 'fiscalHosting.legalStructure.description',
    defaultMessage:
      'Do you want your host to be a charity, a company, a cooperative, or something else? E.g. a charity structure can enable tax-deductible donations, but may also have more restrictions on allowed activities.',
  },
  'fiscalHosting.serviceOffered': {
    id: 'fiscalHosting.serviceOffered',
    defaultMessage: 'Services offered',
  },
  'fiscalHosting.serviceOffered.description': {
    defaultMessage:
      'Some Fiscal Hosts are very light-touch, while others provide significant support or programming and options like employment and insurance. Fiscal Hosts with a specific focus, such as open source projects or climate movement groups, may offer services specifically tailored to that community.',
    id: 'AeQQjn',
  },
  'fiscalHosting.fees': {
    id: 'fiscalHosting.fees',
    defaultMessage: 'Fees',
  },
  'fiscalHosting.fees.description': {
    id: 'fiscalHosting.fees.description',
    defaultMessage:
      'Fiscal hosts often charge a fee for the service they provide. Some hosts keep fees low and offer a lightweight service, while others have higher fees and provide more support. Some fiscal hosts don’t charge fees at all.',
  },
  'fiscalHosting.operations': {
    id: 'fiscalHosting.operations',
    defaultMessage: 'Operations',
  },
  'fiscalHosting.operations.description': {
    id: 'fiscalHosting.operations.description',
    defaultMessage:
      'There are a few different models of fiscal sponsorship (depending on country as well). Check to see that you are using the one that is best for your project. Also look into the sponsor’s company culture & history of expertise in the field to ensure your fiscal sponsorship relationship aligns with your needs.',
  },
});

const Consideration = ({ consideration }) => {
  const intl = useIntl();
  return (
    <Container
      display="flex"
      flexDirection={['column', 'row', 'column']}
      alignItems={['center', null, null, null, 'flex-start']}
      textAlign={['center', 'left', 'center', null, 'left']}
      key={consideration}
    >
      <Box width="140px" height="140px" mb={[2, 0, '24px']} mr={[null, 4, 0]}>
        <Illustration src={`/static/images/fiscal-hosting/${consideration}.png`} alt="Icon" />
      </Box>
      <Box width={['288px', '472px', '250px', null, '289px']}>
        <H3
          fontSize={['20px', null, null, null, '24px']}
          lineHeight={['28px', null, null, null, '32px']}
          letterSpacing="-0.008em"
          color="black.800"
          mb={[2, 3]}
        >
          {intl.formatMessage(messages[`fiscalHosting.${consideration}`])}
        </H3>
        <P fontSize={['15px', '18px']} lineHeight={['22px', '26px']} color="black.700" fontWeight="400">
          {intl.formatMessage(messages[`fiscalHosting.${consideration}.description`])}
        </P>
      </Box>
    </Container>
  );
};

Consideration.propTypes = {
  consideration: PropTypes.string,
};

const FindTheRightFiscalHost = () => {
  return (
    <Flex
      mt={['96px', '80px', null, null, '104px']}
      mb="80px"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Container display="flex" flexDirection="column" alignItems="center" mx={3}>
        <Box mb={2} width={['288px', 1]}>
          <SectionTitle textAlign="center">
            <FormattedMessage
              id="fiscalHosting.findingRightFiscalHost"
              defaultMessage="Finding the right fiscal host for you"
            />
          </SectionTitle>
        </Box>
        <Box width={['288px', '548px', null, null, '755px']}>
          <SectionDescription textAlign="center">
            <FormattedMessage
              id="fiscalHosting.findingRightFiscalHost.description"
              defaultMessage="Some key things to consider when looking for the right fit"
            />
          </SectionDescription>
        </Box>
      </Container>
      <Container width={1} display={['display', 'none']} justifyContent="center" alignItems="center" mt="56px">
        <StyledCarousel display={[null, 'none']} width={1}>
          {HOST_CONSIDERATIONS.map(consideration => (
            <Consideration key={consideration} consideration={consideration} />
          ))}
        </StyledCarousel>
      </Container>
      <Grid
        mx={3}
        gridTemplateColumns={[null, null, 'repeat(3, 1fr)']}
        gridGap={[null, '32px', '56px 48px', null, '56px 96px']}
        placeSelf="center"
        alignItems={['center', null, null, 'flex-start']}
        mt="56px"
        display={['none', 'grid']}
        maxWidth="1200px"
      >
        {HOST_CONSIDERATIONS.map(consideration => (
          <Consideration key={consideration} consideration={consideration} />
        ))}
      </Grid>
    </Flex>
  );
};

export default FindTheRightFiscalHost;
