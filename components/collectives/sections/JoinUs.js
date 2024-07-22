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

export const JoinUsWrapper = styled(Container)`
  background: ${props =>
    props.page && props.page === 'becomeAHost'
      ? `url('/static/images/home/joinus-green-bg-sm.png')`
      : props.page && props.page === 'fiscalHosting'
        ? `url('/static/images/home/fiscalhost-blue-bg-sm.png')`
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
        : props.page && props.page === 'fiscalHosting'
          ? `url('/static/images/home/fiscalhost-blue-bg-md.png')`
          : `url('/static/images/home/joinus-pink-bg-md.png')`};
    background-size: 100% 100%;
  }

  @media screen and (min-width: 88em) {
    background: ${props =>
      props.page && props.page === 'becomeAHost'
        ? `url('/static/images/home/joinus-green-bg-lg.png')`
        : props.page && props.page === 'fiscalHosting'
          ? `url('/static/images/home/fiscalhost-blue-bg-lg.png')`
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

export const JoinUsActionContainer = ({ title, description, link }) => {
  return (
    <Link href={link}>
      <Wrapper
        color="black.900"
        className="linkWrapper"
        my={[1, 3, 4]}
        width={['288px', '436px', '569px', null, '594px']}
      >
        <Box width={['192px', 1]}>
          <H3
            fontSize={['24px', null, '32px']}
            textAlign="left"
            lineHeight={['25px', null, '40px']}
            letterSpacing={['-0.08px', null, '-1.2px']}
            mb={2}
            fontWeight="bold"
            color="primary.900"
          >
            {title}
          </H3>
          <P fontSize="15px" color="black.700" lineHeight="23px" letterSpacing="-0.12px">
            {description}
          </P>
        </Box>
        <Box className="arrowWrapper" color="black.900" fontWeight="bold">
          <ArrowRight2 size={'24'} />
        </Box>
      </Wrapper>
    </Link>
  );
};

JoinUsActionContainer.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node,
  link: PropTypes.string,
};

const JoinUs = ({ page }) => (
  <JoinUsWrapper py={[5, null, null, 4]} width={1} page={page}>
    <Flex
      mx={[3, 4]}
      flexDirection={['column', null, null, 'row']}
      color="black.900"
      alignItems={'center'}
      justifyContent="center"
    >
      <Box my={[2, 3, null, 5]} width={[null, '438px', '569px', '335px', '309px']} mr={[null, null, null, 5]}>
        <H1
          mb={2}
          mt={[5, null, null, 0]}
          fontSize={['32px', '40px', null, '52px']}
          lineHeight={['40px', '48px', null, '56px']}
          letterSpacing={['-1.2px', '-1.6px', null, '-2px']}
          color="primary.900"
          textAlign={['center', null, 'left']}
        >
          <FormattedMessage id="home.joinUsSection.title" defaultMessage="Join the movement" />
        </H1>
        <Box my={[null, null, null, null, 3]} width={['288px', '438px', null, '335px']}>
          <SectionSubtitle
            fontSize={['20px', null, null, '24px']}
            lineHeight={['28px', null, null, '32px']}
            letterSpacing={['-0.6px', null, null, '-0.8px']}
            color={['black.800', null, null, 'black.900']}
            textAlign={['center', null, 'left']}
          >
            {page === 'becomeAHost' ? (
              <FormattedMessage
                id="becomeAHost.joinUsSection.subtitle"
                defaultMessage="Open Collective makes fiscal sponsorship shine. Grantees and project participants will love the simplicity and accessibility, and you’ll love the huge reduction of overheads."
              />
            ) : (
              <FormattedMessage
                defaultMessage="Collective finances. Collective technology. Collective power."
                id="Jzh8eo"
              />
            )}
          </SectionSubtitle>
        </Box>
      </Box>

      <Container ml={[null, null, null, 3, 6]}>
        <JoinUsActionContainer
          link={page === 'becomeAHost' ? '/organizations/new' : '/create'}
          title={
            page === 'becomeAHost' ? (
              <FormattedMessage defaultMessage="Join as a Fiscal Host" id="Y0G9KM" />
            ) : (
              <FormattedMessage defaultMessage="Get started now free!" id="uw0ZU2" />
            )
          }
          description={<FormattedMessage id="home.joinUsSection.getStarted" defaultMessage="Get started now!" />}
        />
        <JoinUsActionContainer
          link="https://blog.opencollective.com/tag/case-studies/"
          title={<FormattedMessage id="ReadOurStories" defaultMessage="Read our stories" />}
          description={
            <FormattedMessage
              id="home.joinUsSection.ourStories"
              defaultMessage="Open Collective aims to foster transparency and sustainability in communities around the world, see how you could."
            />
          }
        />
        <Wrapper color="black.900" width={['288px', '436px', '569px', null, '594px']} className="newsletterWrapper">
          <Container>
            <H3
              fontSize={['24px', null, '32px']}
              textAlign="left"
              lineHeight={['25px', null, '40px']}
              letterSpacing={['-0.08px', null, '-1.2px']}
              mb={2}
              fontWeight="bold"
              color="primary.900"
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
  </JoinUsWrapper>
);

JoinUs.propTypes = {
  page: PropTypes.string,
};

export default JoinUs;
