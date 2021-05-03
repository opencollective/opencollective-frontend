import React from 'react';
import { FormattedMessage } from 'react-intl';

import Container from '../Container';
import { Box, Flex } from '../Grid';
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
              id="becomeAHost.whatAreTheBenefits"
              defaultMessage="What are the benefits to host with us?"
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
              id="becomeAHost.whatAreTheBenefits.description"
              defaultMessage="Accept donations and sponsorship, celebrate your supporters, pay expenses, and keep everyone up to date — all in one place."
            />
          </P>
        </Box>
      </Container>
      <Flex
        mx={3}
        flexDirection={['column', null, 'row']}
        justifyContent="center"
        alignItems={['center', null, 'baseline']}
        mt={['24px', '48px', null, null, '80px']}
      >
        <Container
          display="flex"
          flexDirection={['column', 'row', 'column']}
          alignItems={['flex-start', 'center', 'flex-start']}
          mb={4}
          mr={[null, null, '40px', null, '103px']}
        >
          <Box
            width={['132px', null, null, null, '208px']}
            height={['132px', null, null, null, '208px']}
            mb={[2, null, '17px', null, '51px']}
            mr={[null, 4, 0]}
          >
            <Illustration src="/static/images/become-a-host/reduceOverhead-icon.png" alt="Reduce Overhead Icon" />
          </Box>
          <Box width={['288px', '472px', '250px', null, '289px']}>
            <H3
              fontSize={['20px', null, null, null, '24px']}
              lineHeight={['28px', null, null, null, '32px']}
              letterSpacing="-0.008em"
              color="black.800"
              mb={[2, 3]}
            >
              <FormattedMessage id="becomeAHost.reduceOverhead" defaultMessage="Reduce overhead" />
            </H3>
            <P fontSize={['15px', '18px']} lineHeight={['22px', '26px']} color="black.700" fontWeight="400">
              <FormattedMessage
                id="becomeAHost.reduceOverhead.description"
                defaultMessage="When you’re managing funds for multiple projects or groups, it's easy to get overwhelmed by complex spreadsheets and countless email threads. Open Collective automates budget tracking, reporting, expense processing, and payments, making your job a lot easier."
              />
            </P>
          </Box>
        </Container>
        <Container
          display="flex"
          flexDirection={['column', 'row', 'column']}
          alignItems={['flex-start', 'center', 'flex-start']}
          mb={4}
          mr={[null, null, '40px', null, '103px']}
        >
          <Box
            width={['132px', null, null, null, '208px']}
            height={['132px', null, null, null, '208px']}
            mb={[2, null, '17px', null, '51px']}
            mr={[null, 4, 0]}
          >
            <Illustration src="/static/images/become-a-host/increaseCapacity-icon.png" alt="Increase Capacity Icon" />
          </Box>
          <Box width={['288px', '472px', '250px', null, '289px']}>
            <H3
              fontSize={['20px', null, null, null, '24px']}
              lineHeight={['28px', null, null, null, '32px']}
              letterSpacing="-0.008em"
              color="black.800"
              mb={[2, 3]}
            >
              <FormattedMessage id="becomeAHost.increaseCapacity" defaultMessage="Increase capacity" />
            </H3>
            <P fontSize={['15px', '18px']} lineHeight={['22px', '26px']} color="black.700" fontWeight="400">
              <FormattedMessage
                id="becomeAHost.increaseCapacity.description"
                defaultMessage="Open Collective makes it possible for you to offer more services to more projects in less time. Large numbers of transactions won’t overwhelm you, because the platform automates most of the work, and also collects any fund holding fees you set."
              />
            </P>
          </Box>
        </Container>
        <Container
          display="flex"
          flexDirection={['column', 'row', 'column']}
          alignItems={['flex-start', 'center', 'flex-start']}
          mb={4}
        >
          <Box
            width={['132px', null, null, null, '208px']}
            height={['132px', null, null, null, '208px']}
            mb={[2, null, '17px', null, '51px']}
            mr={[null, 4, 0]}
          >
            <Illustration
              src="/static/images/become-a-host/ABetterExperience-icon.png"
              alt="A Better Experience Icon"
            />
          </Box>
          <Box width={['288px', '472px', '250px', null, '289px']}>
            <H3
              fontSize={['20px', null, null, null, '24px']}
              lineHeight={['28px', null, null, null, '32px']}
              letterSpacing="-0.008em"
              color="black.800"
              mb={[2, 3]}
            >
              <FormattedMessage id="becomeAHost.aBetterExperience" defaultMessage="A better experience" />
            </H3>
            <P fontSize={['15px', '18px']} lineHeight={['22px', '26px']} color="black.700" fontWeight="400">
              <FormattedMessage
                id="becomeAHost.aBetterExperience.description"
                defaultMessage="Reporting is automatic and real-time, so everyone can see the up to date budget at any time. Projects can have more direct control over their funds, while fiscal sponsors can ensure everything is done according to their policies. "
              />
            </P>
          </Box>
        </Container>
      </Flex>
    </Flex>
  );
};

export default FindTheRightFiscalHost;
