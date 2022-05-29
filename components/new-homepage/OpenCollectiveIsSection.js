import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Container from '../Container';
import { ApplyToHostGrid, ApplyToHostMobileCarousel } from '../fiscal-hosting/ApplyToFiscalHostSection';
import { Box, Flex } from '../Grid';
import NextIllustration from '../home/HomeNextIllustration';
import Link from '../Link';
import StyledLink from '../StyledLink';
import { H2, H3, P } from '../Text';

import NetworkOfCollectives from './NetworkOfCollecetives';

const OvalShapeWrapper = styled(Container)`
  background-image: url('/static/images/new-home/oval-bg.svg');
  background-repeat: no-repeat;
  background-size: cover;
  border-bottom-right-radius: 30px;
  border-bottom-left-radius: 30px;
  background-position-x: center;
`;

const OpenCollectiveIs = () => {
  return (
    <Flex flexDirection="column" alignItems="center" mt="48px">
      <Flex px="16px" justifyContent="center" alignItems="center">
        <Box width={['288px', 1]} mb="135px">
          <H2
            letterSpacing={['-0.008em', '-0.04em']}
            fontSize={['32px', '40px', '52px']}
            lineHeight={['40px', '48px', '56px']}
            textAlign="center"
            color="primary.900"
            fontWeight="700"
            mb={3}
          >
            <FormattedMessage id="home.OCIs" defaultMessage={'Open Collective is'} />
          </H2>
          <P
            fontSize={['18px', '20px']}
            letterSpacing={[null, '-0.008em']}
            lineHeight={['26px', '28px']}
            textAlign="center"
            color="black.800"
            fontWeight="500"
          >
            <FormattedMessage
              id="home.OCIs.description"
              defaultMessage={'…an open finances platform for communities.'}
            />
          </P>
        </Box>
      </Flex>
      <OvalShapeWrapper
        minHeight="500px"
        width="100%"
        position="relative"
        display="flex"
        flexDirection="column"
        alignItems="center"
        borderRadiusTop
        pb="48px"
      >
        <Container
          display="flex"
          flexDirection="column"
          alignItems="center"
          position="relative"
          textAlign="center"
          top="-87px"
        >
          <Container
            width="176px"
            height="176px"
            backgroundColor="white.full"
            display="flex"
            justifyContent="center"
            alignItems="center"
            padding="24px"
            borderRadius="100px"
            border="4px solid"
            borderColor="primary.900"
          >
            <NextIllustration width={128} height={128} src="/static/images/new-home/opencollective-logo.png" />
          </Container>
          <Box width={['288px', '588px', '760px']} textAlign="center" mt={4}>
            <P
              letterSpacing={['-0.008em', null, '-0.04em']}
              fontSize={['24px', '32px', '40px']}
              lineHeight={['32px', '40px', '48px']}
              textAlign="center"
              color="white.full"
              fontWeight="700"
            >
              <FormattedMessage
                defaultMessage={
                  'And a network of fiscal hosts that enable over 15,000 collectives around the world to spend and raise $35M a year.'
                }
              />
            </P>
          </Box>
        </Container>

        <Container position="relative" top="-40px">
          <NetworkOfCollectives />
        </Container>

        <Flex flexDirection="column" alignItems="center">
          <Box width={['288px', 1]}>
            <H3
              letterSpacing={['-0.008em', null, '-0.04em']}
              fontSize={['24px', '32px', '40px']}
              lineHeight={['32px', '40px', '48px']}
              textAlign="center"
              color="white.full"
              mb={4}
            >
              <FormattedMessage
                id="fiscalHosting.applyToFiscalHost"
                defaultMessage="Apply to one of our Fiscal Hosts"
              />
            </H3>
          </Box>
          <Box display={[null, 'none']} width="300px">
            <ApplyToHostMobileCarousel color="white.full" />
          </Box>
          <Box display={['none', 'block']} width="100%">
            <ApplyToHostGrid color="white.full" />
          </Box>
          <StyledLink as={Link} buttonStyle="standard" mt="48px" mb="64px" buttonSize="medium" href="/discover">
            <FormattedMessage id="home.discoverMoreHome" defaultMessage="Discover More Hosts" />
          </StyledLink>
        </Flex>
      </OvalShapeWrapper>
    </Flex>
  );
};

export default OpenCollectiveIs;
