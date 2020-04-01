import React from 'react';
import styled from 'styled-components';
import { Flex, Box } from '@rebass/grid';
import { FormattedMessage } from 'react-intl';

import { P } from '../../Text';
import { Link } from '../../../server/pages';
import Container from '../../Container';
import StyledButton from '../../StyledButton';
import SectionTitle from '../SectionTitle';
import Illustration from '../HomeIllustration';
import StyledLink from '../../StyledLink';

const Wrapper = styled(Container)`
  background-image: url('/static/images/home/fiscalhost-bg-sm.png');
  background-size: 100% 100%;

  @media screen and (min-width: 52em) {
    background-image: url('/static/images/home/fiscalhost-bg-md.png');
    background-size: 100% 100%;
  }

  @media screen and (min-width: 88em) {
    background-image: url('/static/images/home/fiscalhost-bg-lg.png');
    background-size: 100% 100%;
  }
`;

const JoinHostLink = styled(StyledLink)`
  color: #fff;
  background: transparent;
  border-color: #fff;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    color: #fff;
    border-color: #fff;
  }
`;

const FiscalHost = () => (
  <Wrapper mb={5} pt={[3, null, '124px']} pb={[2, null, '116px']}>
    <Flex
      mx={[3, 4]}
      flexDirection={['column-reverse', null, 'row']}
      alignItems="center"
      justifyContent={[null, null, 'space-around', null, 'center']}
    >
      <Container textAlign="left" color="#fff" mr={[null, null, null, null, 4]}>
        <Box width={['268px', 1, '372px']} textAlign={['center', 'left']}>
          <SectionTitle color="#fff">
            <FormattedMessage id="home.fiscalHostSection.title" defaultMessage="Open Collective for Fiscal Hosts" />
          </SectionTitle>
        </Box>
        <Box width={['288px', 1, '480px', null, '583px']}>
          <P mt={3} mb={[2, 4]} fontSize={['Caption', '15px']} fontWeight={['19px', '25px']} letterSpacing="-0.016em">
            <FormattedMessage
              id="home.fiscalHostSection.explanation1"
              defaultMessage="Some Collectives don’t have a bank account or legal entity set up to receive funds, and want help taking care of things like tax reporting and financial admin. We call organizations who provide this service (sometimes called fiscal sponsorship) Fiscal Hosts."
            />
          </P>
          <P my={[1, 3]} fontSize={['12px', '15px']} fontWeight={['19px', '25px']} letterSpacing="-0.016em">
            <FormattedMessage
              id="home.fiscalHostSection.explanation2"
              defaultMessage="Open Collective allows fiscal hosts to reduce overhead and easily manage budgets and expenses for multiple projects. Our automated reporting makes accounting a breeze. No more messy spreadsheets!"
            />
          </P>
        </Box>
        <Box my={5} display="flex" flexDirection={['column', 'row']} alignItems="center">
          <Link route="/become-a-fiscal-host" passHref>
            <StyledButton mb={[3, 0]} minWidth={232} mr={[null, 3]}>
              <FormattedMessage id="home.fiscalHost.becomeHostBtn" defaultMessage="Become a fiscal host" />
            </StyledButton>
          </Link>
          <Link route="/hosts" passHref>
            <JoinHostLink buttonStyle="standard" buttonSize="medium" minWidth={232}>
              <FormattedMessage id="home.joinHost" defaultMessage="Join a fiscal host" />
            </JoinHostLink>
          </Link>
        </Box>
      </Container>
      <Container ml={[null, null, null, null, 4]}>
        <Illustration
          display={['block', null, 'none', null, 'none']}
          src="/static/images/home/fiscalhost-illustration-sm.png"
          alt="Fiscal Host"
        />
        <Illustration
          display={['none', null, 'block', null, 'none']}
          src="/static/images/home/fiscalhost-illustration.png"
          alt="Fiscal Host"
        />
        <Illustration
          display={['none', null, 'none', null, 'block']}
          src="/static/images/home/fiscalhost-illustration-lg.png"
          alt="Fiscal Host"
        />
      </Container>
    </Flex>
  </Wrapper>
);

export default FiscalHost;
