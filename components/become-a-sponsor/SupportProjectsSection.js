import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import Illustration from '../home/HomeIllustration';
import Link from '../Link';
import StyledButton from '../StyledButton';
import { H1, P, Span } from '../Text';

const Sponsor = styled(Box)`
  max-width: 100%;
  max-height: 100%;
  filter: drop-shadow(0px 1px 33px rgba(26, 27, 31, 0.25));
  -webkit-filter: drop-shadow(0px 1px 33px rgba(26, 27, 31, 0.25));
`;

const SponsorWrapper = styled(Container)`
  position: absolute;
  &:hover {
    transform: scale(1.3, 1.3);
    background-color: transparent;
    box-shadow: 0px 1px 33px rgba(26, 27, 31, 0.25);
    border-radius: 80px;
    transition: transform 300ms ease-out;
  }
`;

const SponsorBoxShadowWrapper = styled(SponsorWrapper)`
  background-color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 80px;
  box-shadow: 0px 1px 33px rgba(26, 27, 31, 0.25);
`;

const SupportProjects = () => (
  <Flex flexDirection={['column', 'row-reverse']} alignItems="center" justifyContent="center" mx={3} mt="32px">
    <Container
      position="relative"
      width={['304px', '342px', '518px', null, '558px']}
      height={[null, '363px', '488px', null, '414px']}
      ml={[null, null, null, null, '36px']}
    >
      <Link route="/webflow">
        <SponsorWrapper
          size={['46px', '62px', '75px', null, '80px']}
          left={['9%', '38px', '65px', null, '43px']}
          top={[null, '39px', '66px', null, '7px']}
        >
          <Sponsor as="img" src="/static/images/become-a-sponsor/webflow.png" alt="Webflow logo" />
        </SponsorWrapper>
      </Link>
      <Link route="/airbnb">
        <SponsorWrapper
          size={['37px', '50px', '70px', null, '64px']}
          left={['34.42%', '133px', '186px', null, '388px']}
          top={[null, '39px', '54px', null, '141px']}
        >
          <Sponsor as="img" src="/static/images/become-a-sponsor/airbnb.png" alt="Airbnb logo" />
        </SponsorWrapper>
      </Link>
      <Link route="/fbopensource">
        <SponsorWrapper
          size={['37px', '50px', '70px', null, '64px']}
          left={['0', null, null, null, '19px']}
          top={['45%', '155px', '216px', null, '171px']}
        >
          <Sponsor
            as="img"
            src="/static/images/become-a-sponsor/facebook-opensource.png"
            alt="Facebook Opensource logo"
          />
        </SponsorWrapper>
      </Link>
      <Link route="/shopify">
        <SponsorBoxShadowWrapper
          size={['48px', '65px', '83px', null, '84px']}
          left={['27%', '105px', '156px', null, '155px']}
          top={['65%', '248px', '329px', null, '262px']}
        >
          <Sponsor
            as="img"
            src="/static/images/become-a-sponsor/shopify.svg"
            width={['25.34px', '34px', '43px', null, '52px']}
            alt="Shopify logo"
          />
        </SponsorBoxShadowWrapper>
      </Link>
      <Link route="/trivago">
        <SponsorBoxShadowWrapper
          size={['46px', '62px', '77px', null, '80px']}
          right={['5.91%', '0']}
          left={[null, '280px', '438px', null, '462px']}
          top={['-1.4%', '0', '87px', null, '29px']}
        >
          <Sponsor
            as="img"
            src="/static/images/become-a-sponsor/trivago.png"
            width={['36.07px', '49px', '60px', null, '63px']}
            alt="Trivago logo"
          />
        </SponsorBoxShadowWrapper>
      </Link>
      <Link route="/salesforce">
        <SponsorBoxShadowWrapper
          size={['48px', '55px', '77px', null, '84px']}
          right={['4.93%', '0']}
          left={[null, '286px', '402px', null, '460px']}
          top={['26.5%', '155px', '200px', null, '276px']}
        >
          <Sponsor
            as="img"
            src="/static/images/become-a-sponsor/salesforce.svg"
            width={['36.17px', '40px', '56px', null, '62px']}
            alt="Sales Force logo"
          />
        </SponsorBoxShadowWrapper>
      </Link>
      <Box
        width={[1, '324px', '478px', null, 1]}
        height={['229px', '311px', '423px', null, '100%']}
        mb="24px"
        mt={[null, '52px', '51px', null, 0]}
        ml={[null, '37px', '40px', null, 0]}
      >
        <Illustration
          display={[null, 'none']}
          src="/static/images/become-a-sponsor/folk-illustration-xs.png"
          alt="Folks Illustration"
        />
        <Illustration
          display={['none', 'block', 'none']}
          src="/static/images/become-a-sponsor/folk-illustration-sm.png"
          alt="Folks Illustration"
        />
        <Illustration
          display={['none', null, 'block', null, 'none']}
          src="/static/images/become-a-sponsor/folk-illustration-md.png"
          alt="Folks Illustration"
        />
        <Illustration
          display={['none', null, null, null, 'block']}
          src="/static/images/become-a-sponsor/folk-illustration-lg.png"
          alt="Folks Illustration"
        />
      </Box>
    </Container>

    <Flex flexDirection="column" alignItems={['center', 'flex-start']}>
      <Box width={['304px', '306px', '438px', null, '555px']}>
        <H1
          fontSize={['24px', '40px', null, null, '52px']}
          lineHeight={['32px', '48px', null, null, '56px']}
          letterSpacing={['-1.2px', '-0.04em']}
          color="black.900"
          mb={3}
          textAlign={['center', 'left']}
        >
          <FormattedMessage
            id="becomeASponsor.supportProjects"
            defaultMessage="Support projects & communities on Open Collective."
          />
        </H1>
      </Box>
      <Box mb="25px" width={['304px', '306px', null, null, '558px']} textAlign={['center', 'left']}>
        <P
          fontSize={['14px', '16px', null, null, '18px']}
          lineHeight={['23px', '24px', null, null, '26px']}
          letterSpacing={['-0.12px', 'normal']}
          color="black.800"
          fontWeight="500"
        >
          <Span display={[null, 'none']}>
            <FormattedMessage
              id="becomeASponsor.supportProjects.description.short"
              defaultMessage="Join these great founders and sponsors supporting Collectives."
            />
          </Span>
          <Span display={['none', 'block']}>
            <FormattedMessage
              id="becomeASponsor.supportProjects.description.full"
              defaultMessage="Join these great founders and sponsors and support amazing initiatives. Transparent contributions and all the tools you need to get rid of the paperwork. All in one place."
            />
          </Span>
        </P>
      </Box>
      <Link route="/discover">
        <StyledButton
          minWidth={['185px', '167px', null, null, '185px']}
          my={[2, null, 0]}
          buttonStyle="dark"
          whiteSpace="nowrap"
        >
          <FormattedMessage id="home.discoverCollectives" defaultMessage="Discover Collectives" />
        </StyledButton>
      </Link>
    </Flex>
  </Flex>
);

export default SupportProjects;
