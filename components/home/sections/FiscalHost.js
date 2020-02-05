import React from 'react';
import styled from 'styled-components';
import themeGet from '@styled-system/theme-get';
import { Flex, Box } from '@rebass/grid';
import { FormattedMessage } from 'react-intl';

import { P } from '../../Text';
import { Link } from '../../../server/pages';
import Container from '../../Container';
import { HomePrimaryLink } from '../HomeLinks';
import SectionTitle from '../SectionTitle';
import Illustration from '../HomeIllustration';

const Wrapper = styled(Container)`
  background-image: url('/static/images/fiscalhost-bg-sm.png');
  background-size: 100% 100%;

  @media screen and (min-width: 52em) {
    background-image: url('/static/images/fiscalhost-bg-md.png');
    background-size: 100% 100%;
  }

  @media screen and (min-width: 88em) {
    background-image: url('/static/images/fiscalhost-bg-lg.png');
    background-size: 100% 100%;
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
            <HomePrimaryLink
              mb={[3, 0]}
              fontSize={['Paragraph', '13px']}
              lineHeight={['Caption', '16px']}
              width={'197px'}
              mr={[null, 3]}
              border="none"
              background="#fff"
              color="black.700"
              fontWeight="500"
              css={`
                &:hover {
                  border-color: 1px solid #8fc7ff;
                  background: #fff;
                  color: ${themeGet('colors.black.700')};
                }
                &:visited {
                  background: #fff;
                  color: ${themeGet('colors.black.700')};
                }
              `}
            >
              <FormattedMessage id="home.fiscalHost.becomeHostBtn" defaultMessage="Become a fiscal host" />
            </HomePrimaryLink>
          </Link>
          <Link route="#" passHref>
            <HomePrimaryLink
              css={`
                &:hover {
                  background: rgba(255, 255, 255, 0.3);
                }
              `}
              buttonStyle="standard"
              background="transparent"
              color="#fff"
              borderColor="#fff"
            >
              <FormattedMessage id="home.joinHost" defaultMessage="Join a fiscal host" />
            </HomePrimaryLink>
          </Link>
        </Box>
      </Container>
      <Container ml={[null, null, null, null, 4]}>
        <Illustration
          display={['block', null, 'none', null, 'none']}
          src="/static/images/fiscalhost-illustration-sm.png"
          alt="Fiscal Host"
        />
        <Illustration
          display={['none', null, 'block', null, 'none']}
          src="/static/images/fiscalhost-illustration.png"
          alt="Fiscal Host"
        />
        <Illustration
          display={['none', null, 'none', null, 'block']}
          src="/static/images/fiscalhost-illustration-lg.png"
          alt="Fiscal Host"
        />
      </Container>
    </Flex>
  </Wrapper>
);

export default FiscalHost;
