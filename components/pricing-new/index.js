import React from 'react';
import { ArrowDown } from '@styled-icons/remix-line/ArrowDown';
import themeGet from '@styled-system/theme-get';
import { throttle } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled, { createGlobalStyle } from 'styled-components';

import Container from '../Container';
import PricingFAQ from '../faqs/PricingFAQ';
import { Box, Flex } from '../Grid';
import Illustration from '../home/HomeIllustration';
import { getI18nLink, I18nBold } from '../I18nFormatters';
import Link from '../Link';
import StyledButton from '../StyledButton';
import StyledHR from '../StyledHr';
import { H1, H4, P } from '../Text';

import ForCollectiveCard from './ForCollectiveCard';
import ForFiscalHosts from './ForFiscalHostCard';
import Tabs from './Tabs';

const GlobalStyles = createGlobalStyle`
  html {
    scroll-behavior: smooth;
  }
`;

const TopBackgroundIllustration = styled(Box)`
  background: url('/static/images/pricing/pricing-page-top-bg.png') no-repeat;
  background-size: 100%;
  position: absolute;
  top: -110px;
  z-index: -99;
  width: 100%;
  height: 434px;

  @media screen and (min-width: 40em) {
    background: url('/static/images/pricing/pricing-page-top-sm-bg.png') no-repeat;
    background-size: 100%;
  }

  @media screen and (min-width: 64em) {
    background: url('/static/images/pricing/pricing-page-top-md-bg.png') no-repeat;
    background-size: 100%;
    top: -90px;
    height: 500px;
  }

  @media screen and (min-width: 88em) {
    background: url('/static/images/pricing/pricing-page-top-lg-bg.png') no-repeat;
    background-size: 100%;
    top: -110px;
    height: 600px;
    width: 1200px;
    background-position: center;
    left: 0;
    right: 0;
    margin-right: auto;
    margin-left: auto;
  }
`;

const ListWrapper = styled(Box)`
  list-style: none;
  padding-left: 10px;
`;

const ListItem = styled.li`
  font-weight: 500;
  font-size: 15px;
  line-height: 22px;
  color: ${themeGet('colors.black.900')};
  margin-top: 16px;
  margin-bottom: 16px;

  ::before {
    content: '•';
    color: ${themeGet('colors.blue.700')};
    display: inline-block;
    width: 1em;
    margin-left: -1em;
  }
`;

const Pricing = () => {
  const [activeTab, setActiveTab] = React.useState('');
  const tabRef = React.useRef(null);
  const sectionContainerRef = React.useRef(null);

  const handleOnScroll = throttle(() => {
    if (!(tabRef.current && tabRef.current.getBoundingClientRect().top <= 0)) {
      return;
    }

    let currentTab = activeTab;
    const distanceThreshold = 200;
    const breakpoint = window.scrollY + distanceThreshold;
    for (const section of sectionContainerRef.current.children) {
      if (breakpoint >= section.offsetTop) {
        currentTab = section.id;
      }
    }

    if (activeTab !== currentTab) {
      setActiveTab(currentTab);
    }
  }, 100);

  React.useEffect(() => {
    window.addEventListener('scroll', handleOnScroll);
    return () => window.removeEventListener('scroll', handleOnScroll);
  });

  return (
    <React.Fragment>
      <GlobalStyles />
      <TopBackgroundIllustration />
      <Flex px="16px" pt="20px" pb={['40px', '20px']} justifyContent="center" alignItems="center">
        <Container
          textAlign="center"
          display="flex"
          flexDirection="column"
          alignItems="center"
          width={['288px', '404px']}
        >
          <H1
            fontSize={['24px', '28px', '32px']}
            lineHeight={['32px', '36px', '40px']}
            letterSpacing={['-0.008em']}
            color="black.900"
            mb="14px"
          >
            <FormattedMessage id="pricing.title" defaultMessage="Our Pricing Structure" />
          </H1>
          <P
            fontSize={['14px', '15px', '16px']}
            lineHeight={['20px', '22px', '24px']}
            fontWeight="500"
            color="black.700"
          >
            <FormattedMessage
              id="pricing.description"
              defaultMessage="We aim to transform the way we organize ourselves online in initiatives and communities. This is our sustainability model."
            />
          </P>
        </Container>
      </Flex>
      <Container
        display="flex"
        px="16px"
        mb="40px"
        flexDirection={['column', 'row']}
        alignItems={['center', 'baseline', 'flex-start']}
        justifyContent="center"
      >
        <Container
          width={['288px', '308px', '468px', null, '486px']}
          padding={['24px', null, '32px 36px']}
          border="1px solid #DCDEE0"
          borderRadius="8px"
          mb={['20px', 0]}
          mr={[null, '10px']}
          background="white"
        >
          <Flex flexDirection={['column', 'row']} alignItems="center">
            <Box width="144px" height="144px" display={['none', null, 'block']} mr={[null, null, '24px']}>
              <Illustration src="/static/images/pricing/for-collective-illustration.png" alt="For Collective" />
            </Box>
            <Box width={[null, null, '228px', null, '246px']}>
              <P
                fontSize={['18px', '20px']}
                lineHeight={['26px', '28px']}
                letterSpacing={[null, '-0.008em']}
                fontWeight="500"
                color="black.900"
                mb="8px"
              >
                <FormattedMessage id="pricing.collectiveCard" defaultMessage="For Collective" />
              </P>
              <StyledHR />
              <Box width="144px" height="144px" my="8px" display={[null, null, 'none']}>
                <Illustration src="/static/images/pricing/for-collective-illustration.png" alt="For Collective" />
              </Box>
              <Box mt="8px" mb="16px">
                <P fontSize="14px" lineHeight="20px" fontWeight="400" color="black.800">
                  <FormattedMessage
                    id="pricing.collectiveCard.description"
                    defaultMessage="<strong>Collect, spend and manage money transparently.</strong> Connect your bank account or apply to a Fiscal Host <br></br><a>Read more</a>"
                    values={{
                      a: getI18nLink({
                        href: 'https://docs.opencollective.com/help/collectives/quick-start-guide',
                        openInNewTab: true,
                      }),
                      // eslint-disable-next-line react/display-name
                      br: () => <br />,
                      strong: I18nBold,
                    }}
                  />
                </P>
              </Box>
            </Box>
          </Flex>
          <Box minHeight={['252px', null, '150px']} mb={[null, null, '24px']} mt={[null, null, '40px']}>
            <H4 fontSize="24px" lineHeight="32px" letterSpacing="-0.008em" color="blue.700" fontWeight="500">
              <FormattedMessage id="pricing.collectiveCard.free" defaultMessage="Free – forever" />
            </H4>
            <ListWrapper as="ul">
              <ListItem
                fontSize="15px"
                lineHeight="22px"
                fontWeight="500"
                color="black.900"
                my="8px"
                listStyle="circle"
              >
                <FormattedMessage
                  id="pricing.collectiveCard.unlimited"
                  defaultMessage="Unlimited access to all features"
                />
              </ListItem>
              <ListItem>
                <FormattedMessage
                  id="pricing.collectiveCard.noFees"
                  defaultMessage="No fees if you hold money in your own bank account"
                />
              </ListItem>
              <ListItem>
                <FormattedMessage
                  id="pricing.collectiveCard.hostFees"
                  defaultMessage="Host fees may apply depending on your host"
                />
              </ListItem>
            </ListWrapper>
          </Box>
          <Container display="flex" flexDirection={['column', null, 'row']} alignItems={['center', null, 'flex-start']}>
            <Link href="/create">
              <StyledButton
                buttonStyle="primary"
                width={['224px', null, '139px']}
                py="8px"
                px={[null, null, 3]}
                my="8px"
                whiteSpace="nowrap"
                mr={[null, null, 3]}
              >
                <FormattedMessage id="pricing.createCollective" defaultMessage="Create Collective" />
              </StyledButton>
            </Link>
            <Link href="#collective">
              <StyledButton width={['224px', null, '139px']} py="8px" my="8px">
                <FormattedMessage id="pricing.knowMore" defaultMessage="Know more" /> <ArrowDown size="13px" />{' '}
              </StyledButton>
            </Link>
          </Container>
        </Container>
        <Container
          width={['288px', '308px', '468px', null, '486px']}
          padding={['24px', null, '32px 36px']}
          border="1px solid #DCDEE0"
          borderRadius="8px"
          ml={[null, '10px']}
          background="white"
        >
          <Flex flexDirection={['column', null, 'row']}>
            <Box width="144px" height="144px" display={['none', null, 'block']} mr={[null, null, '24px']}>
              <Illustration src="/static/images/pricing/for-fiscalHost-illustration.png" alt="For FiscalHost" />
            </Box>

            <Box width={[null, null, '228px', null, '246px']}>
              <P
                fontSize={['18px', '20px']}
                lineHeight={['26px', '28px']}
                letterSpacing={[null, '-0.008em']}
                fontWeight="500"
                color="black.900"
                mb="8px"
              >
                <FormattedMessage id="pricing.fiscalHost" defaultMessage="For FiscalHost" />
              </P>
              <StyledHR />
              <Box width="144px" height="144px" my="8px" display={[null, null, 'none']}>
                <Illustration src="/static/images/pricing/for-fiscalHost-illustration.png" alt="For FiscalHost" />
              </Box>
              <Box mt="8px" mb="16px">
                <P fontSize="14px" lineHeight="20px" fontWeight="400" color="black.800">
                  <FormattedMessage
                    id="pricing.fiscalHostCard.description"
                    defaultMessage="<strong>You hold funds on behalf of Collectives.</strong>You decide which Collectives to accept and <strong>what (if any) fees to charge them.</strong>"
                    values={{
                      strong: I18nBold,
                    }}
                  />
                </P>
              </Box>
            </Box>
          </Flex>

          <Box minHeight={['252px', null, '150px']} mb={[null, null, '24px']} mt={[null, null, '40px']}>
            <H4 fontSize="24px" lineHeight="32px" letterSpacing="-0.008em" color="blue.700" fontWeight="500">
              <FormattedMessage id="pricing.fiscalHost.weSucceed" defaultMessage="We succeed if you succeed" />
            </H4>
            <ListWrapper as="ul">
              <ListItem
                fontSize="15px"
                lineHeight="22px"
                fontWeight="500"
                color="black.900"
                my="8px"
                listStyle="circle"
              >
                <FormattedMessage
                  id="pricing.fiscalHost.unlimited"
                  defaultMessage="Host unlimited Collectives and access to all features"
                />
              </ListItem>
              <ListItem>
                <FormattedMessage id="pricing.fiscalHost.noFees" defaultMessage="FREE if you don't charge Host fees" />
              </ListItem>
              <ListItem>
                <FormattedMessage
                  id="pricing.fiscalHost.hostFees"
                  defaultMessage="15% revenue share if you charge Host fees"
                />
              </ListItem>
            </ListWrapper>
          </Box>
          <Container display="flex" flexDirection={['column', null, 'row']} alignItems="center">
            <Link href="/organizations/new">
              <StyledButton
                buttonStyle="primary"
                width={['224px', null, '103px']}
                py="8px"
                px={[null, null, 3]}
                my="8px"
                whiteSpace="nowrap"
                mr={[null, null, 3]}
              >
                <FormattedMessage id="pricing.getStarted" defaultMessage="Get started" />
              </StyledButton>
            </Link>
            <Link href="#fiscalHost">
              <StyledButton width={['224px', null, '139px']} py="8px" my="8px">
                <FormattedMessage id="pricing.knowMore" defaultMessage="Know more" /> <ArrowDown size="13px" />{' '}
              </StyledButton>
            </Link>
          </Container>
        </Container>
      </Container>
      <Flex
        flexDirection={['column', null, 'row-reverse']}
        justifyContent="center"
        alignItems={[null, null, 'flex-start']}
      >
        <Container
          zIndex="999"
          position="sticky"
          top="0"
          display="flex"
          justifyContent="center"
          borderBottom={['1px solid rgba(49, 50, 51, 0.1)', null, 'none']}
          ref={tabRef}
        >
          <Tabs activeTab={activeTab} />
        </Container>
        <Box ref={sectionContainerRef}>
          <Container
            id="collective"
            pt={['64px', null, 3]}
            display="flex"
            px="16px"
            flexDirection="column"
            alignItems="center"
          >
            <ForCollectiveCard />
          </Container>
          <Container
            id="fiscalHost"
            pt={['64px', null, 3]}
            display="flex"
            px="16px"
            flexDirection="column"
            alignItems="center"
            my={[null, null, 4]}
          >
            <ForFiscalHosts />
          </Container>
          <Container
            id="faq"
            pt={['64px', null, 3]}
            display="flex"
            px="16px"
            flexDirection="column"
            alignItems="center"
            mb={['72px', null, '120px']}
          >
            <PricingFAQ />
          </Container>
        </Box>
      </Flex>
    </React.Fragment>
  );
};

export default Pricing;
