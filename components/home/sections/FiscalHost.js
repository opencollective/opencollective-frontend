import React from 'react';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { background, display } from 'styled-system';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import Link from '../../Link';
import StyledButton from '../../StyledButton';
import StyledLink from '../../StyledLink';
import { H2, H3, H5, P, Span } from '../../Text';
import Illustration from '../HomeIllustration';
import SectionTitle from '../SectionTitle';

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

const LineBreak = styled.br`
  ${display}
`;

const FiscalHostCard = styled(Container)`
  width: 288px;
  height: 160px;
  border: 1px solid #e8e9eb;
  box-sizing: border-box;
  border-radius: 8px;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 10px 12px;

  @media screen and (min-width: 40em) {
    width: 208px;
    height: 226px;
  }

  @media screen and (min-width: 52em) {
    width: 408px;
    height: 96px;
    flex-direction: row;
    align-items: center;
    padding: 12px 15px;
  }

  ${background}
`;

const FiscalHost = () => (
  <Wrapper mb={5} pt={4} mt={[null, null, null, null, 7]}>
    <Flex
      mx={[3, 4]}
      flexDirection={['column', null, 'row']}
      alignItems="center"
      justifyContent={[null, null, 'space-around', null, 'center']}
    >
      <Container
        display="flex"
        flexDirection="column"
        width={1}
        textAlign="left"
        color="black.900"
        mr={[null, null, 3, null, 4]}
        ml={[null, null, null, null, 4]}
      >
        <Box width={['268px', '648px', '456px', null, '657px']} textAlign={['left']}>
          <SectionTitle
            display={[null, null, null, null, 'none']}
            color="black.900"
            fontSize={['32px', '40px']}
            lineHeight={['40px', '48px']}
            letterSpacing={['-1.2px', '-1.6px']}
          >
            <FormattedMessage
              id="home.fiscalHostSection.title"
              defaultMessage="Do you need a fiscal host for your community?"
            />
          </SectionTitle>
          <H2
            display={['none', null, null, null, 'block']}
            color="black.900"
            fontSize={['32px', '40px', null, null, '52px']}
            lineHeight={['40px', '48px', null, null, '56px']}
            letterSpacing={['-1.2px', '-1.6px', null, null, '-2px']}
          >
            <FormattedMessage id="home.fiscalHostSection.title.xl" defaultMessage="Do you need a fiscal host?" />
          </H2>
        </Box>
        <Box width={['288px', '377px', '456px', null, '444px']}>
          <P
            display={[null, null, null, null, 'none']}
            color="black.800"
            mt={3}
            mb={[2, 4]}
            fontWeight="500"
            fontSize={['15px', '20px']}
            lineHeight={['23px', '28px']}
            letterSpacing={['-2px']}
          >
            <FormattedMessage
              id="home.fiscalHostSection.explanation1"
              defaultMessage="Are you looking for somewhere to put financial resources and use them in projects or private initiatives?"
            />
            <LineBreak display={[null, 'none']} />
            <LineBreak display={[null, 'none', 'block']} />
            <Span>
              {' '}
              <FormattedMessage id="home.fiscalHostSection.weCanHelp" defaultMessage="We can help you!" />
            </Span>
          </P>
          <P
            display={['none', null, null, null, 'block']}
            color="black.800"
            mt={3}
            mb={[2, 4]}
            fontWeight="500"
            fontSize={'24px'}
            lineHeight={'32px'}
            letterSpacing={'-0.8px'}
          >
            <FormattedMessage
              id="home.fiscalHostSection.explanation2"
              defaultMessage="Need help holding money on behalf of your project? Fiscal hosts handle taxes, accounting, and payments for you."
            />
          </P>
        </Box>
      </Container>
      <Flex flexDirection="column" mt={3} width={1} ml={[null, null, 3, null, 5]}>
        <H5
          display={[null, null, null, null, 'none']}
          my={2}
          textAlign="left"
          color="black.900"
          fontSize={['20px']}
          lineHeight={['28px']}
          letterSpacing={['-0.6px']}
        >
          <FormattedMessage id="home.OC.fiscalHosts" defaultMessage="There are our fiscal hosts:" />
        </H5>
        <H5
          display={['none', null, null, null, 'block']}
          my={2}
          textAlign="left"
          color="black.800"
          fontWeight="bold"
          fontSize={['20px']}
          lineHeight={['28px']}
          letterSpacing={['-0.6px']}
        >
          <FormattedMessage id="home.OC.fiscalHosts.xl" defaultMessage="Find the right fiscal host for you:" />
        </H5>
        <Container display="flex" flexDirection={['column', 'row', 'column']}>
          <FiscalHostCard mr={[null, 2, 0]} my={2} background={[null, null, 'rgba(255, 255, 255, 0.7)']}>
            <Box width={['48px', null, '72px']} height={['48px', null, '72px']} my={2} mr={[null, null, 3]}>
              <Illustration src="/static/images/home/fiscalhost-cat.png" alt="Cat" />
            </Box>
            <Container
              display={[null, null, 'flex']}
              flexDirection={[null, null, 'column']}
              width={[null, null, '292px']}
            >
              <H3 fontSize={['20px']} lineHeight={['28px']} letterSpacing={['-0.6px']}>
                <FormattedMessage id="home.fiscalHostSection.OCF" defaultMessage="Open Collective Foundation" />
              </H3>
              <Container
                display="flex"
                alignItems="center"
                justifyContent={['space-between', null, 'normal']}
                width={1}
                mt={[null, 3, 1]}
              >
                <Box
                  fontSize={['14px']}
                  lineHeight={['21px']}
                  letterSpacing={['-0.1px']}
                  color="black.800"
                  fontWeight="500"
                  mr={[null, null, 3]}
                >
                  <FormattedMessage
                    id="home.fiscalHostSection.OCF.description"
                    defaultMessage="For US charity initiatives"
                  />
                </Box>
                <Box my={[3, null, 0]}>
                  <StyledLink
                    href="#"
                    whiteSpace="nowrap"
                    fontSize={['14px']}
                    lineHeight={['21px']}
                    letterSpacing={['-0.1px']}
                    color="#DC5F7D"
                    fontWeight="500"
                  >
                    <FormattedMessage
                      id="home.fiscalHostSection.apply"
                      defaultMessage="Apply {arrowIcon}"
                      values={{
                        arrowIcon: <ArrowRight2 size="14" />,
                      }}
                    />
                  </StyledLink>
                </Box>
              </Container>
            </Container>
          </FiscalHostCard>
          <FiscalHostCard mx={[null, 2, 0]} my={2} background={[null, 'rgba(255, 255, 255, 0.7)']}>
            <Box width={['48px', null, '72px']} height={['48px', null, '72px']} my={2} mr={[null, null, 3]}>
              <Illustration src="/static/images/home/fiscalhost-cat.png" alt="Cat" />
            </Box>
            <Container display={[null, null, 'flex']} flexDirection={[null, null, 'column']} width={[1, null, '292px']}>
              <H3 fontSize={['20px']} lineHeight={['28px']} letterSpacing={['-0.6px']}>
                <FormattedMessage id="home.fiscalHostSection.OSC" defaultMessage="Open Source Collective" />
              </H3>
              <Container
                display="flex"
                alignItems="center"
                justifyContent={['space-between', null, 'normal']}
                width={1}
                mt={[null, 3, 1]}
              >
                <Box
                  fontSize={['14px']}
                  lineHeight={['21px']}
                  letterSpacing={['-0.1px']}
                  color="black.800"
                  fontWeight="500"
                  mr={[null, null, 3]}
                >
                  <FormattedMessage
                    id="home.fiscalHostSection.OSC.description"
                    defaultMessage="For open source projects"
                  />
                </Box>
                <Box my={[3, null, 0]}>
                  <StyledLink
                    href="#"
                    whiteSpace="nowrap"
                    fontSize={['14px']}
                    lineHeight={['21px']}
                    letterSpacing={['-0.1px']}
                    color="#DC5F7D"
                    fontWeight="500"
                  >
                    <FormattedMessage
                      id="home.fiscalHostSection.apply"
                      defaultMessage="Apply {arrowIcon}"
                      values={{
                        arrowIcon: <ArrowRight2 size="14" />,
                      }}
                    />
                  </StyledLink>
                </Box>
              </Container>
            </Container>
          </FiscalHostCard>
          <FiscalHostCard ml={[null, 2, 0]} my={2} background={[null, 'rgba(255, 255, 255, 0.7)', '#fff']}>
            <Box width={['48px', null, '72px']} height={['48px', null, '72px']} my={2} mr={[null, null, 3]}>
              <Illustration src="/static/images/home/fiscalhost-cat.png" alt="Cat" />
            </Box>
            <Container display={[null, null, 'flex']} flexDirection={[null, null, 'column']} width={[1, null, '292px']}>
              <H3 fontSize={['20px']} lineHeight={['28px']} letterSpacing={['-0.6px']}>
                <FormattedMessage id="home.fiscalHostSection.OCE" defaultMessage="Open Collective Europe" />
              </H3>
              <Container
                display="flex"
                alignItems="center"
                justifyContent={['space-between', null, 'normal']}
                width={1}
                mt={[null, 3, 1]}
              >
                <Box
                  fontSize={['14px']}
                  lineHeight={['21px']}
                  letterSpacing={['-0.1px']}
                  color="black.800"
                  fontWeight="500"
                  mr={[null, null, 3]}
                >
                  <FormattedMessage id="home.fiscalHostSection.OCE.description" defaultMessage="For EU-based groups" />
                </Box>
                <Box my={[3, null, 0]}>
                  <StyledLink
                    href="#"
                    whiteSpace="nowrap"
                    fontSize={['14px']}
                    lineHeight={['21px']}
                    letterSpacing={['-0.1px']}
                    color="#DC5F7D"
                    fontWeight="500"
                  >
                    <FormattedMessage
                      id="home.fiscalHostSection.apply"
                      defaultMessage="Apply {arrowIcon}"
                      values={{
                        arrowIcon: <ArrowRight2 size="14" />,
                      }}
                    />
                  </StyledLink>
                </Box>
              </Container>
            </Container>
          </FiscalHostCard>
        </Container>
        <Box my={2} alignSelf={[null, 'center', null, 'flex-start']}>
          <StyledLink
            href="#"
            fontSize={['15px']}
            lineHeight={['23px']}
            letterSpacing={['-0.12px']}
            color="#1A1E43"
            fontWeight="500"
          >
            <FormattedMessage
              id="home.fiscalHostSection.discoverMore"
              defaultMessage="Discover more {arrowIcon}"
              values={{
                arrowIcon: <ArrowRight2 size="15" />,
              }}
            />
          </StyledLink>
        </Box>
      </Flex>
    </Flex>
    <Flex
      mt={4}
      p={2}
      backgroundColor="rgba(49, 50, 51, 0.6)"
      alignItems="center"
      justifyContent={['space-around', null, null, null, 'flex-start']}
    >
      <Box
        width={['72px', '81px']}
        height={['48px', '54px']}
        ml={[null, null, null, null, 5]}
        mr={[2, null, null, null, 4]}
      >
        <Illustration src="/static/images/home/umbrella-illustration.png" alt="Umbrella" />
      </Box>
      <Container display={['block', 'flex']} alignItems={[null, 'center']}>
        <Container display={[null, null, 'flex']} mr={[null, 3]} alignItems={[null, null, 'center']}>
          <H3
            my={2}
            mr={[null, null, 3]}
            fontSize={['20px', null, '24px']}
            lineHeight={['28px', null, '32px']}
            letterSpacing={['-0.6px', null, '-0.8px']}
            color="white.full"
          >
            <FormattedMessage id="home.becomeFiscalHost" defaultMessage="Become a Fiscal Host" />
          </H3>
          <Box width={['197px', '322px', '462px']} ml={[null, null, 3]}>
            <P
              mb={2}
              fontSize={['13px', null, '14px']}
              lineHeight={['19px', null, '21px']}
              letterSpacing={['-0.08px', null, '-0.1px']}
              color="white.full"
            >
              <FormattedMessage
                id="home.becomeFiscalHost.description"
                defaultMessage="Support your community with fundholding and fiscal sponsorship services. "
              />
              <LineBreak display={[null, 'none']} />
              <StyledLink href="#" color="#1A1E43">
                <FormattedMessage id="becomeFiscalHost.learnMore" defaultMessage="Learn More" />
              </StyledLink>
            </P>
          </Box>
        </Container>
        <Link route="#">
          <StyledButton
            my={2}
            ml={[null, 3]}
            border="1px solid #C4C7CC"
            padding="12px 20px"
            borderRadius="100px"
            color="black.700"
          >
            <FormattedMessage id="home.knowMore" defaultMessage="Know more" />
          </StyledButton>
        </Link>
      </Container>
    </Flex>
  </Wrapper>
);

export default FiscalHost;
