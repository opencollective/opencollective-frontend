import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { Flex, Box } from '@rebass/grid';
import { ArrowRight } from '@styled-icons/feather/ArrowRight';

import { H1, P } from '../../Text';
import Container from '../../Container';
import Newsletter from '../Newsletter';
import SectionSubtitle from '../SectionSubtitle';
import Link from '../../Link';

const SectionWrapper = styled(Container)`
  background: url('/static/images/joinus-bg-sm.png');
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
    background: url('/static/images/joinus-bg-md.png');
    background-size: 100% 100%;
  }

  @media screen and (min-width: 88em) {
    background: url('/static/images/joinus-bg-lg.png');
    background-size: 100% 100%;
  }
`;

const Wrapper = styled(Container)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 16px;

  @media screen and (min-width: 64em) {
    padding: 24px 32px;
  }
`;

const JoinUs = () => (
  <SectionWrapper py={[5, null, 4]} width={1}>
    <Flex mx={[3, 4]} flexDirection={['column', null, 'row']} color="white.full">
      <Box
        my={[2, null, 5]}
        width={[null, null, '288px', null, '309px']}
        ml={[null, null, null, null, 6]}
        mr={[null, null, 4, null, 5]}
      >
        <H1
          color="white.full"
          mb={2}
          textAlign="left"
          fontSize={['H4', null, 'H1']}
          lineHeight={['H4', null, 'H1']}
          fontWeight="bold"
        >
          <FormattedMessage id="home.joinUsSection.title" defaultMessage="Join us" />
        </H1>
        <Box width={['208px', null, null]}>
          <SectionSubtitle color="white.full">
            <FormattedMessage
              id="home.joinUsSection.subtitle"
              defaultMessage="Be part of the community and spread the word!"
            />
          </SectionSubtitle>
        </Box>
      </Box>

      <Container>
        <Link route="/create">
          <Wrapper className="linkWrapper" my={[1, null, 4]} width={[1, null, '607px', null, '500px']}>
            <Box>
              <H1
                fontSize={['15px', null, 'H3']}
                textAlign="left"
                lineHeight={['25px', null, '40px']}
                letterSpacing={['-0.008em', null, '-0.4px']}
                mb={2}
                fontWeight="bold"
              >
                <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
              </H1>
              <P fontSize={['Caption', null, '15px']} lineHeight={['19px', null, '25px']} letterSpacing="-0.016em">
                <FormattedMessage id="home.joinUsSection.getStarted" defaultMessage="Get started now!" />
              </P>
            </Box>
            <Box className="arrowWrapper" color="black.500">
              <ArrowRight size={'20'} />
            </Box>
          </Wrapper>
        </Link>

        <Link route="/hiring">
          <Wrapper my={4} width={[1, null, '607px', null, '500px']} className="linkWrapper">
            <Container mb={2}>
              <H1
                fontSize={['15px', null, 'H3']}
                textAlign="left"
                lineHeight={['25px', null, '40px']}
                letterSpacing={['-0.008em', null, '-0.4px']}
                mb={2}
                fontWeight="bold"
              >
                <FormattedMessage id="home.joinUsSection.team" defaultMessage="Join our team" />
              </H1>
              <Box width={[null, null, '400px']}>
                <P fontSize={['Caption', null, '15px']} lineHeight={['19px', null, '25px']} letterSpacing="-0.016em">
                  <FormattedMessage
                    id="home.joinUsSection.joinTeam"
                    defaultMessage="We are citizens from around the world. We don’t have an office. We are all remote. We don’t bite."
                  />
                </P>
              </Box>
            </Container>
            <Box className="arrowWrapper" color="black.500">
              <ArrowRight size={'20'} />
            </Box>
          </Wrapper>
        </Link>

        <Wrapper my={4} width={[1, null, '607px', null, '500px']}>
          <Container>
            <H1
              fontSize={['15px', null, 'H3']}
              textAlign="left"
              lineHeight={['25px', null, '40px']}
              letterSpacing={['-0.008em', null, '-0.4px']}
              mb={2}
              fontWeight="bold"
            >
              <FormattedMessage id="home.joinUsSection.newsletter" defaultMessage="Subscribe our newsletter" />
            </H1>
            <Box mb={3}>
              <P fontSize={['Caption', null, '15px']} lineHeight={['19px', null, '25px']} letterSpacing="-0.016em">
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
