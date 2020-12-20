import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Box, Flex } from '../Grid';
import Illustration from '../home/HomeIllustration';
import Link from '../Link';
import StyledButton from '../StyledButton';
import { H2, P } from '../Text';

const SectionWrapper = styled(Flex)`
  background: url('/static/images/become-a-sponsor/giftOfGiving-bg-xs.png');
  background-size: cover;
  background-repeat: no-repeat;

  @media screen and (min-width: 720px) {
    background: url('/static/images/become-a-sponsor/giftOfGiving-bg-sm.png');
    background-size: 100%;
    background-position-y: 55px;
    background-repeat: no-repeat;
  }

  @media screen and (min-width: 88em) {
    background: url('/static/images/become-a-sponsor/giftOfGiving-bg-md.png');
    background-size: 100%;
    background-position-y: 40px;
    background-repeat: no-repeat;
  }
`;

const GiftOFGiving = () => (
  <SectionWrapper
    flexDirection={['column', 'row']}
    alignItems="center"
    px={[3, '37px']}
    pt={['96px', '120px']}
    pb="50px"
    justifyContent="center"
  >
    <Flex flexDirection="column">
      <Box width={[null, '283px', '344px']}>
        <H2 fontSize={['40px', '50px', '60px']} lineHeight="56px" letterSpacing="-2px" color="black.800" mb="24px">
          <FormattedMessage id="becomeASponsor.giftOfGiving.title" defaultMessage="Give the gift of giving" />
        </H2>
      </Box>
      <Box width={[null, '310px', '377px', null, '499px']}>
        <P
          fontSize={['16px', null, '18px', null, '24px']}
          lineHeight="32px"
          letterSpacing="-0.8px"
          color="black.800"
          textAlign="left"
          fontWeight="400"
          mb={['27px', null, '30px']}
        >
          <FormattedMessage
            id="becomeASponsor.giftOfGiving.description"
            defaultMessage="Create gift cards—for employees, clients, recruitment candidates, event attendees—so your community can be empowered to support the Collectives they care about, with your Organization as the recognized funder."
          />
        </P>
      </Box>
      <Box alignSelf={['center', 'flex-start']}>
        <Link route="https://docs.opencollective.com/help/financial-contributors/organizations/gift-cards">
          <StyledButton whiteSpace="nowrap" letterSpacing="normal">
            <FormattedMessage id="becomeASponsor.learnMore" defaultMessage="Learn More" />
          </StyledButton>
        </Link>
      </Box>
    </Flex>

    <Box
      ml={[null, '29px', '38px', null, '68px']}
      width={['288px', '307px', '408px', null, '409px']}
      height={['216px', '230px', '306px']}
      mt={[3, 0]}
    >
      <Illustration src="/static/images/become-a-sponsor/giftCard-illustration-sm.png" alt="Gift Card Illustration" />
    </Box>
  </SectionWrapper>
);

export default GiftOFGiving;
