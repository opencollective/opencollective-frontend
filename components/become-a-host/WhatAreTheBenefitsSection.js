import React from 'react';
import { FormattedMessage } from 'react-intl';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import Illustration from '../home/HomeIllustration';
import { H2, H3, P } from '../Text';

const WhatAreTheBenefits = () => {
  return (
    <Flex my="80px" flexDirection="column">
      <Container display="flex" flexDirection="column" alignItems="center" mx={3}>
        <Box mb={2}>
          <H2
            fontSize={['24px', '32px', null, null, '40px']}
            lineHeight={['32px', '40px', null, null, '48px']}
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
          >
            <FormattedMessage
              id="becomeAHost.whatAreTheBenefits.description"
              defaultMessage="Money management made simple, plus great tools for community engagement, budget reporting, and fiscal sponsorship."
            />
          </P>
        </Box>
      </Container>
      <Flex
        mx={3}
        flexDirection={['column', null, 'row']}
        justifyContent="center"
        alignItems="center"
        mt={['24px', '48px', null, null, '80px']}
      >
        <Container
          display="flex"
          flexDirection={['column', 'row', 'column']}
          alignItems={['flex-start', 'center']}
          mb={4}
          mr={[null, null, '40px', null, '103px']}
        >
          <Box
            width={['120px', '132px', null, null, '140px']}
            height={['120px', '132px', null, null, '140px']}
            mb={[2, null, '21px', null, '51px']}
            mr={[null, 4, 0]}
          >
            <Illustration src={`/static/images/home/documentation-illustration.png`} alt={`illustration`} />
          </Box>
          <Box width={[null, '472px', '250px', null, '289px']}>
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
          alignItems={['flex-start', 'center']}
          mb={4}
          mr={[null, null, '40px', null, '103px']}
        >
          <Box
            width={['120px', '132px', null, null, '140px']}
            height={['120px', '132px', null, null, '140px']}
            mb={[2, null, '21px', null, '51px']}
            mr={[null, 4, 0]}
          >
            <Illustration src={`/static/images/home/documentation-illustration.png`} alt={`illustration`} />
          </Box>
          <Box width={[null, '472px', '250px', null, '289px']}>
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
          alignItems={['flex-start', 'center']}
          mb={4}
        >
          <Box
            width={['120px', '132px', null, null, '140px']}
            height={['120px', '132px', null, null, '140px']}
            mb={[2, null, '21px', null, '51px']}
            mr={[null, 4, 0]}
          >
            <Illustration src={`/static/images/home/documentation-illustration.png`} alt={`illustration`} />
          </Box>
          <Box width={[null, '472px', '250px', null, '289px']}>
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
      <Flex mx={2} mt={[2, 4, null, null, '80px']} flexDirection="column" alignItems="center">
        <Container display="flex" flexDirection={['column', 'row-reverse']} alignItems="center">
          <Box mb="24px" display={[null, 'none']}>
            <H2 fontSize={['24px']} lineHeight={['32px']} letterSpacing="-0.008em" color="black.900" textAlign="center">
              <FormattedMessage id="becomeAHost.benefit.keepTrack" defaultMessage="Keep track of all the budgets" />
            </H2>
          </Box>
          <Box
            width={['304px', '322px', '478px', null, '558px']}
            height={['229px', '280px', '355px', null, '420px']}
            mb={['24px', 0]}
          >
            <Illustration
              alt="Keep track of all budgets Illustration"
              src="/static/images/home/collectmoney-illustration-lg.png"
            />
          </Box>
          <Box
            width={['304px', '288px', '437px', null, '408px']}
            mr={[null, '25px', '41px', null, '134px']}
            textAlign={['center', 'left']}
          >
            <H2
              fontSize={['24px', null, null, null, '30px']}
              lineHeight={['32px', null, null, null, '40px']}
              letterSpacing="-0.008em"
              color="black.900"
              display={['none', 'block']}
              mb={3}
            >
              <FormattedMessage id="becomeAHost.benefit.keepTrack" defaultMessage="Keep track of all the budgets" />
            </H2>
            <P
              fontSize={['16px', null, null, null, '18px']}
              lineHeight={['24px', null, null, null, '26px']}
              color="black.800"
              fontWeight="500"
            >
              <FormattedMessage
                id="becomeAHost.benefit.keepTrack.description"
                defaultMessage="Create Collectives for as many projects as you need, in a few clicks, at no extra cost. Each has its own page for fundraising, budget tracking, and community engagement. Incoming payments are added to the balance of the right Collective. No spreadsheets required!"
              />
            </P>
          </Box>
        </Container>
      </Flex>
    </Flex>
  );
};

export default WhatAreTheBenefits;
