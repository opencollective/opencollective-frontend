import React from 'react';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import Link from '../../Link';
import { H1, H3, P } from '../../Text';
import Newsletter from '../Newsletter';
import SectionSubtitle from '../SectionSubtitle';

const SectionWrapper = styled(Container)`
  background: url('/static/images/home/joinus-bg-sm.png');
  background-size: 100% 100%;

  a {
    color: #fff;
  }

  .linkWrapper:hover {
    background-color: rgba(255, 255, 255, 0.3);

    .arrowWrapper {
      color: #fff;
    }
  }

  @media screen and (min-width: 64em) {
    background: url('/static/images/home/joinus-bg-md.png');
    background-size: 100% 100%;
  }

  @media screen and (min-width: 88em) {
    background: url('/static/images/home/joinus-bg-lg.png');
    background-size: 100% 100%;
  }
`;

const Wrapper = styled(Container)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  padding: 16px;

  @media screen and (min-width: 64em) {
    padding: 24px 32px;
  }
`;

const JoinUs = () => (
  <SectionWrapper py={[5, null, 4]} width={1}>
    <Flex mx={[3, 4]} flexDirection={['column', null, 'row']} color="black.900" alignItems={[null, null, 'center']}>
      <Box
        my={[2, 3, 5]}
        width={[null, null, '335px', null, '309px']}
        ml={[null, null, null, null, 6]}
        mr={[null, null, 4, null, 5]}
      >
        <H1
          mb={2}
          textAlign="left"
          fontSize={['32px', '40px', '52px']}
          lineHeight={['40px', '48px', '56px']}
          letterSpacing={['-1.2px', '-1.6px', '-2px']}
        >
          <FormattedMessage id="home.joinUsSection.title" defaultMessage="Join the movement" />
        </H1>
        <Box width={['288px', 1, null]}>
          <SectionSubtitle
            fontSize={['20px', null, '24px']}
            lineHeight={['28px', null, '32px']}
            letterSpacing={['-0.6px', null, '-0.8px']}
          >
            <FormattedMessage
              id="home.joinUsSection.subtitle"
              defaultMessage="Be part of the new generation of communities."
            />
          </SectionSubtitle>
        </Box>
      </Box>

      <Container ml={[null, null, 3]}>
        <Link route="/create">
          <Wrapper
            color="black.900"
            backgroundColor={['white.full', null, 'rgba(255, 255, 255, 0.7)']}
            className="linkWrapper"
            my={[1, null, 4]}
            width={['288px', '648px', '569px', null, '594px']}
          >
            <Box width={['192px', 1]}>
              <H3
                fontSize={['24px', '32px', null]}
                textAlign="left"
                lineHeight={['25px', '40px', null]}
                letterSpacing={['-0.08px', '-1.2px', null]}
                mb={2}
                fontWeight="bold"
              >
                <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
              </H3>
              <P
                fontSize={['15px', null, null]}
                color="black.800"
                lineHeight={['23px', null, null]}
                letterSpacing={['-0.12px']}
              >
                <FormattedMessage id="home.joinUsSection.getStarted" defaultMessage="Get started now!" />
              </P>
            </Box>
            <Box className="arrowWrapper" color="black.900" fontWeight="bold">
              <ArrowRight2 size={'24'} />
            </Box>
          </Wrapper>
        </Link>

        <Link route="/hiring">
          <Wrapper
            backgroundColor="rgba(255, 255, 255, 0.7)"
            color="black.900"
            my={4}
            width={['288px', '648px', '569px', null, '594px']}
            className="linkWrapper"
          >
            <Container mb={2} width={['192px', 1]}>
              <H3
                fontSize={['24px', '32px', null]}
                textAlign="left"
                lineHeight={['25px', '40px', null]}
                letterSpacing={['-0.08px', '-1.2px', null]}
                mb={2}
                fontWeight="bold"
              >
                <FormattedMessage id="home.joinUsSection.team" defaultMessage="Read our stories" />
              </H3>
              <Box width={[null, null, '460px']}>
                <P
                  fontSize={['15px', null, null]}
                  lineHeight={['23px', null, null]}
                  letterSpacing="-0.12px"
                  color="black.700"
                  display={[null, 'none']}
                >
                  <FormattedMessage id="home.joinUsSection.joinTeam" defaultMessage="Know more about our impact." />
                </P>
                <P
                  fontSize={['15px', null, null]}
                  lineHeight={['23px', null, null]}
                  letterSpacing="-0.12px"
                  color="black.700"
                  display={['none', 'block']}
                >
                  <FormattedMessage
                    id="home.joinUsSection.ourStories"
                    defaultMessage="Open Collective aims to foster transparency and sustainability in communities around the world, see how you could participate."
                  />
                </P>
              </Box>
            </Container>
            <Box className="arrowWrapper" color="black.900">
              <ArrowRight2 size={'24'} />
            </Box>
          </Wrapper>
        </Link>

        <Wrapper
          backgroundColor={['rgba(255, 255, 255, 0.7)', null, 'white.full']}
          color="black.900"
          my={4}
          width={['288px', '648px', '569px', null, '594px']}
        >
          <Container>
            <H3
              fontSize={['24px', '32px', null]}
              textAlign="left"
              lineHeight={['25px', '40px', null]}
              letterSpacing={['-0.08px', '-1.2px', null]}
              mb={2}
              fontWeight="bold"
            >
              <FormattedMessage id="home.joinUsSection.newsletter" defaultMessage="Subscribe our newsletter" />
            </H3>
            <Box mb={3}>
              <P
                fontSize={['15px', null, '15px']}
                lineHeight={['23px', null, '25px']}
                letterSpacing="-0.12px"
                color="black.800"
              >
                <FormattedMessage id="home.joinUsSection.weNeedUpdate" defaultMessage="We send updates once a month." />
              </P>
            </Box>
            <Newsletter />
          </Container>
        </Wrapper>
      </Container>
    </Flex>
  </SectionWrapper>
);

export default JoinUs;
