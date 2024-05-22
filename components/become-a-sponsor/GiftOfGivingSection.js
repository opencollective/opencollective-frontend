import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import NextIllustration from '../collectives/HomeNextIllustration';
import { Box, Flex } from '../Grid';
import { SectionDescription, SectionTitle } from '../marketing/Text';
import StyledButton from '../StyledButton';

const SectionWrapper = styled(Flex)`
  background: url('/static/images/become-a-sponsor/giftOfGiving-bg-xs.png');
  background-size: cover;
  background-repeat: no-repeat;

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
    <Flex flexDirection="column" alignItems={['center', null, 'flex-start']}>
      <Box width={[null, '283px', '344px']}>
        <SectionTitle mb="24px" textAlign={['center', null, 'left']}>
          <FormattedMessage id="becomeASponsor.giftOfGiving.title" defaultMessage="Give the gift of giving" />
        </SectionTitle>
      </Box>

      <Box
        ml={[null, '29px', '38px', null, '68px']}
        width={['288px', '307px', '408px', null, '409px']}
        height={['216px', '230px', '306px']}
        mt={[3, 0]}
        display={[null, null, 'none']}
      >
        <NextIllustration
          src="/static/images/become-a-sponsor/giftCard-illustration-sm.png"
          alt="Gift Card Illustration"
          width={409}
          height={306}
        />
      </Box>

      <Box width={[null, '706px', '377px', null, '499px']}>
        <SectionDescription textAlign={['center', null, 'left']} mb={['27px', null, '30px']}>
          <FormattedMessage
            id="becomeASponsor.giftOfGiving.description"
            defaultMessage="Create gift cards—for employees, clients, recruitment candidates, event attendees—so your community can be empowered to support the Collectives they care about, with your Organization as the recognized funder."
          />
        </SectionDescription>
      </Box>
      <Box alignSelf={['center', null, 'flex-start']}>
        <a href="https://docs.opencollective.com/help/financial-contributors/organizations/gift-cards">
          <StyledButton whiteSpace="nowrap" letterSpacing="normal">
            <FormattedMessage defaultMessage="Learn More" id="7DIW6+" />
          </StyledButton>
        </a>
      </Box>
    </Flex>

    <Box
      ml={[null, '29px', '38px', null, '68px']}
      width={['288px', '307px', '408px', null, '409px']}
      height={['216px', '230px', '306px']}
      mt={[3, 0]}
      display={['none', null, 'block']}
    >
      <NextIllustration
        src="/static/images/become-a-sponsor/giftCard-illustration-sm.png"
        alt="Gift Card Illustration"
        width={409}
        height={306}
      />
    </Box>
  </SectionWrapper>
);

export default GiftOFGiving;
