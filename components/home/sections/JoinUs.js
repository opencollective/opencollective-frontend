import React from 'react';
import PropTypes from 'prop-types';
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
  background: ${props =>
    props.page && props.page === 'becomeAHost'
      ? `url('/static/images/home/joinus-green-bg-sm.png')`
      : `url('/static/images/home/joinus-pink-bg-sm.png')`};
  background-size: 100% 100%;

  a {
    color: #fff;
  }

  .linkWrapper:hover {
    background-color: #ffffff;
  }

  @media screen and (min-width: 64em) {
    background: ${props =>
      props.page && props.page === 'becomeAHost'
        ? `url('/static/images/home/joinus-green-bg-md.png')`
        : `url('/static/images/home/joinus-pink-bg-md.png')`};
    background-size: 100% 100%;
  }

  @media screen and (min-width: 88em) {
    background: ${props =>
      props.page && props.page === 'becomeAHost'
        ? `url('/static/images/home/joinus-green-bg-lg.png')`
        : `url('/static/images/home/joinus-pink-bg-lg.png')`};
    background-size: 100% 100%;
  }
`;

const Wrapper = styled(Container)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  padding: 16px;
  background-color: rgba(255, 255, 255, 0.7);

  @media screen and (min-width: 52em) {
    padding: 24px 32px;
  }

  &:focus-within {
    background-color: #ffffff;
  }
`;

const JoinUs = ({ page }) => (
  <SectionWrapper py={[5, null, null, 4]} width={1} page={page}>
    <Flex
      mx={[3, 4]}
      flexDirection={['column', null, null, 'row']}
      color="black.900"
      alignItems={'center'}
      justifyContent="center"
    >
      <Box my={[2, 3, null, 5]} width={[null, '648px', '569px', '335px', '309px']} mr={[null, null, null, 5]}>
        <H1
          mb={2}
          mt={[5, null, null, 0]}
          fontSize={['32px', '40px', null, '52px']}
          lineHeight={['40px', '48px', null, '56px']}
          letterSpacing={['-1.2px', '-1.6px', null, '-2px']}
        >
          <FormattedMessage id="home.joinUsSection.title" defaultMessage="Join the movement" />
        </H1>
        <Box my={(null, null, null, null, 3)} width={['288px', 1, null, '335px']}>
          <SectionSubtitle
            fontSize={['20px', null, null, '24px']}
            lineHeight={['28px', null, null, '32px']}
            letterSpacing={['-0.6px', null, null, '-0.8px']}
            color={['black.800', null, null, 'black.900']}
          >
            {page === 'becomeAHost' ? (
              <FormattedMessage
                id="becomeAHost.joinUsSection.subtitle"
                defaultMessage="Open Collective makes fiscal sponsorship shine. Grantees and project participants will love the simplicity and accessibility, and you’ll love the huge reduction of overheads."
              />
            ) : (
              <FormattedMessage
                id="home.joinUsSection.subtitle"
                defaultMessage="Be part of the new generation of communities."
              />
            )}
          </SectionSubtitle>
        </Box>
      </Box>

      <Container ml={[null, null, null, 3, 6]}>
        <Link href={page === 'becomeAHost' ? '/organizations/new' : '/create'}>
          <Wrapper
            color="black.900"
            className="linkWrapper"
            my={[1, null, 4]}
            width={['288px', '648px', '569px', null, '594px']}
          >
            <Box width={['192px', 1]}>
              <H3
                fontSize={['24px', '32px']}
                textAlign="left"
                lineHeight={['25px', '40px']}
                letterSpacing={['-0.08px', '-1.2px']}
                mb={2}
                fontWeight="bold"
              >
                {page === 'becomeAHost' ? (
                  <FormattedMessage id="becomeAHost.create" defaultMessage="Join as a Fiscal Host" />
                ) : (
                  <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
                )}
              </H3>
              <P fontSize="15px" color="black.700" lineHeight="23px" letterSpacing="-0.12px">
                <FormattedMessage id="home.joinUsSection.getStarted" defaultMessage="Get started now!" />
              </P>
            </Box>
            <Box className="arrowWrapper" color="black.900" fontWeight="bold">
              <ArrowRight2 size={'24'} />
            </Box>
          </Wrapper>
        </Link>

        <Link href="/hiring">
          <Wrapper color="black.900" my={4} width={['288px', '648px', '569px', null, '594px']} className="linkWrapper">
            <Container mb={2} width={['192px', 1]}>
              <H3
                fontSize={['24px', '32px']}
                textAlign="left"
                lineHeight={['25px', '40px']}
                letterSpacing={['-0.08px', '-1.2px']}
                mb={2}
                fontWeight="bold"
              >
                <FormattedMessage id="ReadOurStories" defaultMessage="Read our stories" />
              </H3>
              <Box width={[null, '460px']}>
                <P fontSize="15px" lineHeight="23px" letterSpacing="-0.12px" color="black.700" display={[null, 'none']}>
                  <FormattedMessage id="home.joinUsSection.joinTeam" defaultMessage="Learn more about our impact." />
                </P>
                <P
                  fontSize="15px"
                  lineHeight="23px"
                  letterSpacing="-0.12px"
                  color="black.700"
                  display={['none', 'block']}
                >
                  <FormattedMessage
                    id="home.joinUsSection.ourStories"
                    defaultMessage="Open Collective aims to foster transparency and sustainability in communities around the world. See how you can participate."
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
          color="black.900"
          my={4}
          width={['288px', '648px', '569px', null, '594px']}
          className="newsletterWrapper"
        >
          <Container>
            <H3
              fontSize={['24px', '32px']}
              textAlign="left"
              lineHeight={['25px', '40px']}
              letterSpacing={['-0.08px', '-1.2px']}
              mb={2}
              fontWeight="bold"
            >
              <FormattedMessage id="home.joinUsSection.newsletter" defaultMessage="Subscribe to our newsletter" />
            </H3>
            <Box mb={3}>
              <P
                fontSize={['15px', null, '15px']}
                lineHeight={['23px', null, '25px']}
                letterSpacing="-0.12px"
                color="black.700"
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

JoinUs.propTypes = {
  page: PropTypes.string,
};

export default JoinUs;
