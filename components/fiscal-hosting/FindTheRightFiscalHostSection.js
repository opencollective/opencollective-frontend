import React from 'react';
import { FormattedMessage } from 'react-intl';

import Container from '../Container';
import { Box, Flex, Grid } from '../Grid';
import Illustration from '../home/HomeIllustration';
import { H2, H3, P } from '../Text';

const FindTheRightFiscalHost = () => {
  return (
    <Flex mt={['96px', '80px', null, null, '104px']} mb="80px" flexDirection="column">
      <Container display="flex" flexDirection="column" alignItems="center" mx={3}>
        <Box mb={[2, 3]} width={['288px', 1]}>
          <H2
            fontSize={['28px', '32px', null, null, '40px']}
            lineHeight={['36px', '40px', null, null, '48px']}
            letterSpacing={['-0.008em', null, null, '-0.04em']}
            color={['black.900', null, null, null, 'black.800']}
            textAlign="center"
          >
            <FormattedMessage
              id="fiscalHosting.findingRightFiscalHost"
              defaultMessage="Finding the right fiscal host for you"
            />
          </H2>
        </Box>
        <Box width={['288px', '548px', null, null, '755px']}>
          <P
            fontSize={['16px', '20px', null, null, '24px']}
            lineHeight={['24px', '28px', null, null, '32px']}
            letterSpacing="-0.008em"
            textAlign="center"
            color="black.700"
            fontWeight="500"
          >
            <FormattedMessage
              id="fiscalHosting.findingRightFiscalHost.description"
              defaultMessage="Some key things to consider when looking for the right fit"
            />
          </P>
        </Box>
      </Container>
      <Grid
        mx={3}
        gridTemplateColumns={[null, null, 'repeat(3, 1fr)']}
        columnGap="48px"
        placeSelf="center"
        alignItems="center"
        mt={['24px', '48px', null, null, '80px']}
      >
        <Container
          display="flex"
          flexDirection={['column', 'row', 'column']}
          alignItems="center"
          mb={4}
          textAlign={['center', 'left', 'center']}
        >
          <Box
            width={['132px', null, null, null, '208px']}
            height={['132px', null, null, null, '208px']}
            mb={[2, null, '17px', null, '51px']}
            mr={[null, 4, 0]}
          >
            <Illustration src="/static/images/become-a-host/increaseCapacity-icon.png" alt="Mission alignment Icon" />
          </Box>
          <Box width={['288px', '472px', '250px', null, '289px']}>
            <H3
              fontSize={['20px', null, null, null, '24px']}
              lineHeight={['28px', null, null, null, '32px']}
              letterSpacing="-0.008em"
              color="black.800"
              mb={[2, 3]}
            >
              <FormattedMessage id="fiscalHosting.missionAlignment" defaultMessage="Mission alignment" />
            </H3>
            <P fontSize={['15px', '18px']} lineHeight={['22px', '26px']} color="black.700" fontWeight="400">
              <FormattedMessage
                id="fiscalHosting.missionAlignment.description"
                defaultMessage="Fiscal hosts usually have specific topics or areas they are designed to serve. When it comes to the application process, their acceptance criteria will fit in that scope."
              />
            </P>
          </Box>
        </Container>
        <Container
          display="flex"
          flexDirection={['column', 'row', 'column']}
          alignItems="center"
          mb={4}
          textAlign={['center', 'left', 'center']}
        >
          <Box
            width={['132px', null, null, null, '208px']}
            height={['132px', null, null, null, '208px']}
            mb={[2, null, '17px', null, '51px']}
            mr={[null, 4, 0]}
          >
            <Illustration src="/static/images/become-a-host/reduceOverhead-icon.png" alt="Location Icon" />
          </Box>
          <Box width={['288px', '472px', '250px', null, '289px']}>
            <H3
              fontSize={['20px', null, null, null, '24px']}
              lineHeight={['28px', null, null, null, '32px']}
              letterSpacing="-0.008em"
              color="black.800"
              mb={[2, 3]}
            >
              <FormattedMessage id="fiscalHosting.location" defaultMessage="Location" />
            </H3>
            <P fontSize={['15px', '18px']} lineHeight={['22px', '26px']} color="black.700" fontWeight="400">
              <FormattedMessage
                id="fiscalHosting.location.description"
                defaultMessage="Which country a fiscal host is based in will determine the currency you your money will be accounted in, and where you are located in a legal sense, e.g. if you are applying for an EU grant, you might need a fiscal host based in the EU."
              />
            </P>
          </Box>
        </Container>

        <Container
          display="flex"
          flexDirection={['column', 'row', 'column']}
          alignItems="center"
          mb={4}
          textAlign={['center', 'left', 'center']}
        >
          <Box
            width={['132px', null, null, null, '208px']}
            height={['132px', null, null, null, '208px']}
            mb={[2, null, '17px', null, '51px']}
            mr={[null, 4, 0]}
          >
            <Illustration src="/static/images/become-a-host/ABetterExperience-icon.png" alt="Legal structure Icon" />
          </Box>
          <Box width={['288px', '472px', '250px', null, '289px']}>
            <H3
              fontSize={['20px', null, null, null, '24px']}
              lineHeight={['28px', null, null, null, '32px']}
              letterSpacing="-0.008em"
              color="black.800"
              mb={[2, 3]}
            >
              <FormattedMessage id="fiscalHosting.legalStructure" defaultMessage="Legal Structure" />
            </H3>
            <P fontSize={['15px', '18px']} lineHeight={['22px', '26px']} color="black.700" fontWeight="400">
              <FormattedMessage
                id="fiscalHosting.legalStructure.description"
                defaultMessage="Do you want your host to be a charity, a company, a cooperative, or something else? E.g. a charity structure can enable tax-deductible donations, but may also have more restrictions on allowed activities."
              />
            </P>
          </Box>
        </Container>
        <Container
          display="flex"
          flexDirection={['column', 'row', 'column']}
          alignItems="center"
          mb={4}
          textAlign={['center', 'left', 'center']}
        >
          <Box
            width={['132px', null, null, null, '208px']}
            height={['132px', null, null, null, '208px']}
            mb={[2, null, '17px', null, '51px']}
            mr={[null, 4, 0]}
          >
            <Illustration src="/static/images/become-a-host/ABetterExperience-icon.png" alt="Services offered Icon" />
          </Box>
          <Box width={['288px', '472px', '250px', null, '289px']}>
            <H3
              fontSize={['20px', null, null, null, '24px']}
              lineHeight={['28px', null, null, null, '32px']}
              letterSpacing="-0.008em"
              color="black.800"
              mb={[2, 3]}
            >
              <FormattedMessage id="fiscalHosting.servicesOffered" defaultMessage="Services offered" />
            </H3>
            <P fontSize={['15px', '18px']} lineHeight={['22px', '26px']} color="black.700" fontWeight="400">
              <FormattedMessage
                id="fiscalHosting.servicesOffered.description"
                defaultMessage="Some hosts also have other offerings, such as HR and payroll, accepting donations in bitcoin or public stock, access to advice from lawyers and accountants, mentorship and capacity building, industry initiatives and expertise, partnerships with funders, etc."
              />
            </P>
          </Box>
        </Container>
        <Container
          display="flex"
          flexDirection={['column', 'row', 'column']}
          alignItems="center"
          mb={4}
          textAlign={['center', 'left', 'center']}
        >
          <Box
            width={['132px', null, null, null, '208px']}
            height={['132px', null, null, null, '208px']}
            mb={[2, null, '17px', null, '51px']}
            mr={[null, 4, 0]}
          >
            <Illustration src="/static/images/become-a-host/ABetterExperience-icon.png" alt="Fees Icon" />
          </Box>
          <Box width={['288px', '472px', '250px', null, '289px']}>
            <H3
              fontSize={['20px', null, null, null, '24px']}
              lineHeight={['28px', null, null, null, '32px']}
              letterSpacing="-0.008em"
              color="black.800"
              mb={[2, 3]}
            >
              <FormattedMessage id="fiscalHosting.fees" defaultMessage="Fees" />
            </H3>
            <P fontSize={['15px', '18px']} lineHeight={['22px', '26px']} color="black.700" fontWeight="400">
              <FormattedMessage
                id="fiscalHosting.fees.description"
                defaultMessage="Fiscal hosts often charge a fee for the service they provide. Some hosts keep fees low and offer a lightweight service, while others have higher fees and provide more support. Some fiscal hosts don’t charge fees at all."
              />
            </P>
          </Box>
        </Container>
        <Container
          display="flex"
          flexDirection={['column', 'row', 'column']}
          alignItems="center"
          mb={4}
          textAlign={['center', 'left', 'center']}
        >
          <Box
            width={['132px', null, null, null, '208px']}
            height={['132px', null, null, null, '208px']}
            mb={[2, null, '17px', null, '51px']}
            mr={[null, 4, 0]}
          >
            <Illustration src="/static/images/become-a-host/ABetterExperience-icon.png" alt="Operation Icon" />
          </Box>
          <Box width={['288px', '472px', '250px', null, '289px']}>
            <H3
              fontSize={['20px', null, null, null, '24px']}
              lineHeight={['28px', null, null, null, '32px']}
              letterSpacing="-0.008em"
              color="black.800"
              mb={[2, 3]}
            >
              <FormattedMessage id="fiscalHosting.operations" defaultMessage="Operations" />
            </H3>
            <P fontSize={['15px', '18px']} lineHeight={['22px', '26px']} color="black.700" fontWeight="400">
              <FormattedMessage
                id="fiscalHosting.operations.description"
                defaultMessage="There are a few different models of fiscal sponsorship (depending on country as well). Check to see that you are using the one that is best for your project. Also look into the sponsor’s company culture & history of expertise in the field to ensure your fiscal sponsorship relationship aligns with your needs. "
              />
            </P>
          </Box>
        </Container>
      </Grid>
    </Flex>
  );
};

export default FindTheRightFiscalHost;
