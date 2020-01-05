import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { Flex, Box } from '@rebass/grid';
import { ArrowRight } from '@styled-icons/feather/ArrowRight';

import { H1, P } from '../../Text';
import Container from '../../Container';
import NewsletterContainer from '../../NewsletterContainer';
import SectionTitle from '../SectionTitle';
import SectionSubtitle from '../SectionSubtitle';

const SectionWrapper = styled(Container)`
  background: url('/static/images/joinus-section-mobile-bg.png');
  background-size: 100% 100%;

  @media screen and (min-width: 64em) {
    background: url('/static/images/joinus-section-bg-1x.png');
    background-size: 100% 100%;
  }

  @media screen and (min-width: 88em) {
    background: url('/static/images/joinus-section-bg-2x.png');
    background-size: 100% 100%;
  }
`;

const StyledArrowRight = styled(ArrowRight)`
  @media screen and (min-width: 64em) {
    height: 24px;
    width: 24px;
    position: relative;
    left: 25px;
    top: 25px;
  }
`;

const JoinUs = () => (
  <SectionWrapper py={4} width={1}>
    <Flex mx={[3, 4]} flexDirection={['column', null, 'row']} color="white.full">
      <Box
        my={[3, null, 5]}
        width={[null, null, '288px', null, '309px']}
        ml={[null, null, null, null, 6]}
        mr={[null, null, 4, null, 5]}
      >
        <SectionTitle color="white.full" mb={2} textAlign="left">
          <FormattedMessage id="home.joinUsSection.title" defaultMessage="Join us" />
        </SectionTitle>
        <SectionSubtitle lineHeight={'22px'} color="white.full">
          <FormattedMessage
            id="home.joinUsSection.subtitle"
            defaultMessage="Be part of the community and spread the word!"
          />
        </SectionSubtitle>
      </Box>

      <Container width={[null, null, '300px', null, '500px']}>
        <Box my={4}>
          <Container display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <H1
              fontSize={['H5', null, 'H4', null, 'H3']}
              textAlign="left"
              lineHeight={['28px', null, 'H3', null, '40px']}
              lineSpacing={['-0.2px', null, '-0.2px', null, '-0.4px']}
            >
              <FormattedMessage id="home.create" defaultMessage="Create a collective" />
            </H1>
            <StyledArrowRight size={'20'} />
          </Container>
          <P
            fontSize={['13px', null, null, null, '15px']}
            lineHeight={['19px', null, null, null, '25px']}
            lineSpacing={'-0.012em'}
          >
            <FormattedMessage
              id="home.joinUsSection.discover"
              defaultMessage="Discover how how to create an open collective, how to use our software, our API and much more."
            />
          </P>
        </Box>

        <Box my={4}>
          <Container display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <H1
              fontSize={['H5', null, 'H4', null, 'H3']}
              textAlign="left"
              lineHeight={['28px', null, 'H3', null, '40px']}
              lineSpacing={['-0.2px', null, '-0.2px', null, '-0.4px']}
            >
              <FormattedMessage id="home.joinUsSection.team" defaultMessage="Join our Team" />
            </H1>
            <StyledArrowRight size={'20'} />
          </Container>
          <P
            fontSize={['13px', null, null, null, '15px']}
            lineHeight={['19px', null, null, null, '25px']}
            lineSpacing={'-0.012em'}
          >
            <FormattedMessage
              id="home.joinUsSection.discover"
              defaultMessage="Discover how how to create an open collective, how to use our software, our API and much more."
            />
          </P>
        </Box>

        <Box mt={4} mb={5}>
          <Container display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <H1
              fontSize={['H5', null, 'H4', null, 'H3']}
              textAlign="left"
              lineHeight={['28px', null, 'H3', null, '40px']}
              lineSpacing={['-0.2px', null, '-0.2px', null, '-0.4px']}
            >
              <FormattedMessage id="home.joinUsSection.newsletter" defaultMessage="Subscribe our newsletter" />
            </H1>
            <StyledArrowRight size={'20'} />
          </Container>
          <NewsletterContainer />
        </Box>
      </Container>
    </Flex>
  </SectionWrapper>
);

export default JoinUs;
