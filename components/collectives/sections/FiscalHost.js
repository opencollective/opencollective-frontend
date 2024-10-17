import React from 'react';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';
import { background, display } from 'styled-system';

import Avatar from '../../Avatar';
import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import Link from '../../Link';
import { SectionDescription, SectionTitle } from '../../marketing/Text';
import StyledButton from '../../StyledButton';
import StyledLink from '../../StyledLink';
import { H3, H5, P, Span } from '../../Text';
import NextIllustration from '../HomeNextIllustration';

const Wrapper = styled(Container)`
  background-image: url('/static/images/home/fiscalhost-blue-bg-sm.png');
  background-size: 100% 100%;

  @media screen and (min-width: 52em) {
    background-image: url('/static/images/home/fiscalhost-blue-bg-md.png');
    background-size: 100% 100%;
  }

  @media screen and (min-width: 88em) {
    background-image: url('/static/images/home/fiscalhost-blue-bg-lg.png');
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

  @media screen and (min-width: 64em) {
    width: 408px;
    height: 96px;
    flex-direction: row;
    align-items: center;
    padding: 12px 15px;
  }

  ${background}
`;

const DiscoverLink = styled(StyledLink)`
  &:hover {
    color: #1a1e43;
    text-decoration: underline !important;
  }
`;

const CollectHostPageLink = styled(StyledLink)`
  color: #141414;

  &:hover {
    text-decoration: underline !important;
    color: #141414;
  }
`;

const messages = defineMessages({
  OSC: {
    id: 'OSC.description',
    defaultMessage: 'For open source projects',
  },
  OCE: {
    id: 'OCE.description',
    defaultMessage: 'For EU-based groups',
  },
});

const featuredHosts = [
  {
    id: 'OSC',
    name: 'Open Source Collective',
    collectivePageLink: '/opensource',
    imageUrl: 'https://images.opencollective.com/opensource/426badd/logo/256.png',
  },
  {
    id: 'OCE',
    name: 'Open Collective Europe',
    collectivePageLink: '/europe',
    imageUrl: 'https://images.opencollective.com/europe/019a512/logo/256.png',
  },
];

const FiscalHost = () => {
  const intl = useIntl();

  return (
    <Wrapper mb={5} pt={4} mt={[null, null, null, null, 7]}>
      <Flex mx={[3, 4]} flexDirection="column" alignItems="center">
        <Flex
          flexDirection={['column', null, null, 'row']}
          alignItems="center"
          justifyContent={[null, null, 'space-around', null, 'center']}
        >
          <Container
            display="flex"
            flexDirection="column"
            textAlign="left"
            color="black.900"
            mr={[null, null, 3, null, 4]}
            ml={[null, null, null, null, 4]}
            alignItems={['center', null, null, null, 'flex-start']}
          >
            <Box width={['268px', '576px', null, '456px', '657px']}>
              <SectionTitle
                textAlign={['center', null, 'left']}
                display={[null, null, null, null, 'none']}
                mt={[5, null, null, 0]}
              >
                <FormattedMessage
                  id="home.fiscalHostSection.title"
                  defaultMessage="Do you need a Fiscal Host for your community?"
                />
              </SectionTitle>
              <SectionTitle display={['none', null, null, null, 'block']}>
                <FormattedMessage id="home.fiscalHostSection.title.xl" defaultMessage="Do you need a Fiscal Host?" />
              </SectionTitle>
            </Box>
            <Box width={['288px', '477px', null, '456px', '444px']}>
              <SectionDescription
                textAlign={['center', null, 'left']}
                display={[null, null, null, null, 'none']}
                mt={3}
                mb={[2, 3]}
              >
                <FormattedMessage
                  id="home.fiscalHostSection.explanation1"
                  defaultMessage="Are you looking for somewhere to hold and distribute money for your project?"
                />
                <LineBreak display={[null, 'none']} />
                <LineBreak display={[null, 'none', 'block']} />
                <Span>
                  {' '}
                  <FormattedMessage id="home.fiscalHostSection.weCanHelp" defaultMessage="We can help!" />
                </Span>
              </SectionDescription>
              <SectionDescription display={['none', null, null, null, 'block']} color="black.800" mt={3} mb={[2, 4]}>
                <FormattedMessage
                  id="home.fiscalHostSection.explanation2"
                  defaultMessage="Fiscal Hosts handle banking, taxes, accounting, legal, liability, and payments for you."
                />
              </SectionDescription>
            </Box>
          </Container>
          <Flex flexDirection="column" mt={3} width={1} ml={[null, null, 3, null, 5]}>
            <H5
              display={[null, null, null, null, 'none']}
              my={2}
              textAlign="left"
              color="black.900"
              fontSize="20px"
              lineHeight="28px"
              letterSpacing="-0.6px"
            >
              <FormattedMessage id="home.OC.fiscalHosts" defaultMessage="These are our Fiscal Hosts:" />
            </H5>
            <H5
              display={['none', null, null, null, 'block']}
              my={2}
              textAlign="left"
              color="black.800"
              fontWeight="bold"
              fontSize="20px"
              lineHeight="28px"
              letterSpacing="-0.6px"
            >
              <FormattedMessage id="home.OC.fiscalHosts.xl" defaultMessage="Find the right Fiscal Host for you:" />
            </H5>
            <Container display="flex" flexDirection={['column', 'row', null, 'column']}>
              {featuredHosts.map(host => (
                <FiscalHostCard mx={[null, 2, null, 0]} my={2} key={host.id}>
                  <Box
                    width={['48px', null, null, '72px']}
                    height={['48px', null, null, '72px']}
                    my={2}
                    mr={[null, null, null, 3]}
                  >
                    <Avatar src={host.imageUrl} name={host.name} backgroundColor="transparent" />
                  </Box>
                  <Container
                    display={[null, null, null, 'flex']}
                    flexDirection={[null, null, null, 'column']}
                    width={[1, null, null, '292px']}
                  >
                    <CollectHostPageLink as={Link} href={host.collectivePageLink}>
                      <H3 fontSize="20px" lineHeight="28px" letterSpacing="-0.6px">
                        {host.name}
                      </H3>
                    </CollectHostPageLink>
                    <Container
                      display="flex"
                      alignItems="center"
                      justifyContent={['space-between', null, null, 'normal']}
                      width={1}
                      mt={[null, 3, null, 1]}
                    >
                      <Box
                        fontSize="14px"
                        lineHeight="21px"
                        letterSpacing="-0.1px"
                        color="black.800"
                        fontWeight="500"
                        mr={[null, null, null, 3]}
                      >
                        {intl.formatMessage(messages[host.id])}
                      </Box>
                      <Box my={[3, null, null, 0]}>
                        <StyledLink
                          as={Link}
                          href={`${host.collectivePageLink}/apply`}
                          whiteSpace="nowrap"
                          fontSize="14px"
                          lineHeight="21px"
                          letterSpacing="-0.1px"
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
              ))}
            </Container>
            <Box my={2} alignSelf={[null, 'center', null, 'flex-start']}>
              <DiscoverLink
                as={Link}
                href="/search?isHost=true"
                fontSize="15px"
                lineHeight="23px"
                letterSpacing="-0.12px"
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
              </DiscoverLink>
            </Box>
          </Flex>
        </Flex>
      </Flex>
      <Flex mt={4} p={2} backgroundColor="rgba(49, 50, 51, 0.6)" justifyContent="center">
        <Flex alignItems="center" justifyContent={['space-around', null, null, null, 'flex-start']}>
          <Box
            width={['72px', '81px']}
            height={['48px', '54px']}
            ml={[null, null, null, null, 5]}
            mr={[3, null, null, 4]}
          >
            <NextIllustration
              width={81}
              height={54}
              src="/static/images/home/umbrella-Illustration.png"
              alt="Umbrella"
            />
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
              <Box width={['197px', '322px', null, '462px']} ml={[null, null, 3]}>
                <P
                  mb={2}
                  fontSize={['13px', null, '14px']}
                  lineHeight={['19px', null, '21px']}
                  letterSpacing={['-0.08px', null, '-0.1px']}
                  color="white.full"
                >
                  <FormattedMessage
                    id="home.learnMore.documentation"
                    defaultMessage="Support your community with fundholding and fiscal sponsorship services. "
                  />
                </P>
              </Box>
            </Container>
            <StyledLink openInNewTab href="https://docs.opencollective.com/help/fiscal-hosts/become-a-fiscal-host">
              <StyledButton
                my={2}
                ml={[null, 3]}
                border="1px solid #C4C7CC"
                padding="12px 20px"
                borderRadius="100px"
                color="black.700"
                whiteSpace="nowrap"
              >
                <FormattedMessage id="home.knowMore" defaultMessage="Know more" />
              </StyledButton>
            </StyledLink>
          </Container>
        </Flex>
      </Flex>
    </Wrapper>
  );
};

export default FiscalHost;
