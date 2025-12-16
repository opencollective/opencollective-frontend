import React from 'react';
import { ArrowDown } from '@styled-icons/remix-line/ArrowDown';
import { themeGet } from '@styled-system/theme-get';
import { throttle } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled, { createGlobalStyle } from 'styled-components';

import { getEnvVar } from '@/lib/env-utils';
import { parseToBoolean } from '@/lib/utils';

import NextIllustration from '../collectives/HomeNextIllustration';
import Container from '../Container';
import PricingFAQ from '../faqs/PricingFAQ';
import { Box, Flex } from '../Grid';
import I18nFormatters, { getI18nLink, I18nBold } from '../I18nFormatters';
import Link from '../Link';
import { MainDescription, MainTitle } from '../marketing/Text';
import StyledButton from '../StyledButton';
import StyledHR from '../StyledHr';
import { H4, P } from '../Text';

import ForCollectiveCard from './ForCollectiveCard';
import ForFiscalHosts from './ForFiscalHostCard';
import PlatformTip from './PlatformTip';
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

  &::before {
    content: '•';
    color: ${themeGet('colors.blue.700')};
    display: inline-block;
    width: 1em;
    margin-left: -1em;
  }
`;

const Card = styled(Container)`
  width: 288px;
  padding: 24px;

  @media screen and (min-width: 40em) {
    width: 308px;
  }

  @media screen and (min-width: 52em) {
    width: 380px;
  }

  @media screen and (min-width: 64em) {
    width: 468px;
    padding: 32px 36px;
  }

  @media screen and (min-width: 88em) {
    width: 486px;
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
    window.addEventListener('scroll', handleOnScroll, { passive: true });
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
          width={['288px', '636px', '956px', null, '992px']}
        >
          {parseToBoolean(getEnvVar('NEW_PRICING')) && (
            <div className="mb-12 flex items-center justify-center">
              <div className="rounded-full bg-blue-50 px-6 py-3 text-sm text-blue-800">
                <span>
                  <FormattedMessage
                    defaultMessage="We've updated our platform pricing to support our long-term sustainability. <LinkNewPricing>View new pricing</LinkNewPricing>."
                    id="pricing.newModel.onLegacyPricing"
                    values={{
                      LinkNewPricing: parts => (
                        <Link href="/organizations/pricing" className="font-medium underline hover:text-blue-900">
                          {parts}
                        </Link>
                      ),
                    }}
                  />
                </span>
              </div>
            </div>
          )}

          <MainTitle mb="14px">
            <FormattedMessage id="pricing.title" defaultMessage="Our Pricing Structure" />
          </MainTitle>
          <Box width={['288px', '404px']}>
            <MainDescription color="black.700">
              <FormattedMessage
                id="pricing.description"
                defaultMessage="The platform supports sustainability for communities, and communities support sustainability for the platform."
              />
            </MainDescription>
          </Box>
        </Container>
      </Flex>

      <Container
        display="flex"
        px="16px"
        mb="20px"
        flexDirection={['column', 'row']}
        alignItems={['center', 'baseline', 'flex-start']}
        justifyContent="center"
      >
        <Card
          border="1px solid #DCDEE0"
          borderRadius="8px"
          mb={['20px', 0]}
          mr={[null, '10px']}
          minHeight="525px"
          background="white"
        >
          <Flex flexDirection={['column', 'row']} alignItems="center">
            <Box width="144px" height="144px" display={['none', null, 'block']} mr={[null, null, '24px']}>
              <NextIllustration
                src="/static/images/pricing/for-collective-illustration.png"
                alt="For Collective"
                width={144}
                height={144}
              />
            </Box>
            <Box width={[null, null, '228px', null, '246px']}>
              <P
                fontSize={['18px', '20px']}
                lineHeight={['26px', '28px']}
                letterSpacing={[null, '-0.008em']}
                fontWeight="500"
                color="primary.900"
                mb="8px"
              >
                <FormattedMessage id="pricing.forCollective" defaultMessage="For Collectives" />
              </P>
              <StyledHR />
              <Box width="144px" height="144px" my="8px" display={[null, null, 'none']}>
                <NextIllustration
                  src="/static/images/pricing/for-collective-illustration.png"
                  alt="For Collective"
                  width={144}
                  height={144}
                />
              </Box>
              <Box mt="8px" mb="16px">
                <P fontSize="14px" lineHeight="20px" fontWeight="400" color="black.800">
                  <FormattedMessage
                    id="pricing.collectiveCard.description"
                    defaultMessage="<strong>Collect, spend, and manage money transparently for a group, project, or initiative.</strong> Collectives do not have a legal entity of their own and must apply to a <FiscalHostLink>Fiscal Host</FiscalHostLink> to operate under their legal entity."
                    values={{
                      ...I18nFormatters,
                      FiscalHostLink: getI18nLink({
                        href: 'https://opencollective.com/fiscal-hosting',
                        openInNewTab: true,
                      }),
                    }}
                  />
                </P>
              </Box>
            </Box>
          </Flex>
          <Box minHeight={['252px', null, '150px']} mb={[null, null, '24px']} mt={[null, null, '24px', '40px']}>
            <H4 fontSize="24px" lineHeight="32px" letterSpacing="-0.008em" color="primary.900" fontWeight="500">
              <FormattedMessage id="Amount.Free" defaultMessage="Free" />
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
                <FormattedMessage id="pricing.collectiveCard.hostFees" defaultMessage="Fiscal Host fees may apply" />
              </ListItem>
            </ListWrapper>
          </Box>
          <Container display="flex" flexDirection={['column', null, 'row']} alignItems={['center', null, 'flex-start']}>
            <Link href="/signup/collective">
              <StyledButton
                buttonStyle="primary"
                width={['224px', null, '160px']}
                py="8px"
                px={[null, null, 3]}
                my="8px"
                whiteSpace="nowrap"
                mr={[null, null, 3]}
              >
                <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
              </StyledButton>
            </Link>
            <Link href="#collective">
              <StyledButton width={['224px', null, '139px']} py="8px" my="8px">
                <FormattedMessage defaultMessage="Learn more" id="TdTXXf" /> <ArrowDown size="13px" />{' '}
              </StyledButton>
            </Link>
          </Container>
        </Card>
        <Card border="1px solid #DCDEE0" borderRadius="8px" ml={[null, '10px']} minHeight="525px" background="white">
          <Flex flexDirection={['column', null, 'row']}>
            <Box width="144px" height="144px" display={['none', null, 'block']} mr={[null, null, '24px']}>
              <NextIllustration
                src="/static/images/pricing/for-fiscalHost-illustration.png"
                alt="For FiscalHost"
                width={144}
                height={144}
              />
            </Box>

            <Box width={[null, null, '228px', null, '246px']}>
              <P
                fontSize={['18px', '20px']}
                lineHeight={['26px', '28px']}
                letterSpacing={[null, '-0.008em']}
                fontWeight="500"
                color="primary.900"
                mb="8px"
              >
                <FormattedMessage defaultMessage="For Organizations" id="X7kjxh" />
              </P>
              <StyledHR />
              <Box width="144px" height="144px" my="8px" display={[null, null, 'none']}>
                <NextIllustration
                  src="/static/images/pricing/for-fiscalHost-illustration.png"
                  alt="For FiscalHost"
                  width={144}
                  height={144}
                />
              </Box>
              <Box mt="8px" mb="16px">
                <P fontSize="14px" lineHeight="20px" fontWeight="400" color="black.800">
                  <FormattedMessage
                    id="pricing.fiscalHostCard.description"
                    defaultMessage="Hold funds for your own legal entity and/or act as a <FiscalHostLink>Fiscal Host</FiscalHostLink> by holding funds on behalf of Collectives. When hosting, you decide what fees to charge, if any, and share revenue with the platform."
                    values={{
                      strong: I18nBold,
                      FiscalHostLink: getI18nLink({
                        href: 'https://opencollective.com/become-a-fiscal-host',
                        openInNewTab: true,
                      }),
                    }}
                  />
                </P>
              </Box>
            </Box>
          </Flex>

          <Box minHeight={['252px', null, '150px']} mb={[null, null, '24px']} mt={[null, null, '24px', '40px']}>
            <H4 fontSize="24px" lineHeight="32px" letterSpacing="-0.008em" color="primary.900" fontWeight="500">
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
                  defaultMessage="Host unlimited Collectives and access all features"
                />
              </ListItem>
              <ListItem>
                <FormattedMessage id="pricing.fiscalHost.noFees" defaultMessage="FREE if you don't charge Host Fees" />
              </ListItem>
              <ListItem>
                <FormattedMessage
                  id="pricing.fiscalHost.hostFees"
                  defaultMessage="15% share with the platform if you charge Host Fees"
                />
              </ListItem>
            </ListWrapper>
          </Box>
          <Container display="flex" flexDirection={['column', null, 'row']} alignItems={['center', null, 'flex-start']}>
            <Link href="/signup/organization?active=true">
              <StyledButton
                buttonStyle="primary"
                width={['224px', null, '160px']}
                py="8px"
                px={[null, null, 3]}
                my="8px"
                whiteSpace="nowrap"
                mr={[null, null, 3]}
              >
                <FormattedMessage id="host.organization.create" defaultMessage="Create an Organization" />
              </StyledButton>
            </Link>
            <Link href="#fiscalHost">
              <StyledButton width={['224px', null, '139px']} py="8px" my="8px">
                <FormattedMessage defaultMessage="Learn more" id="TdTXXf" /> <ArrowDown size="13px" />{' '}
              </StyledButton>
            </Link>
          </Container>
        </Card>
      </Container>
      <Container display="flex" justifyContent="center">
        <PlatformTip width={['300px', '640px', '780px', '960px', '1000px']} />
      </Container>
      <Flex
        flexDirection={['column', null, null, 'row-reverse']}
        justifyContent="center"
        alignItems={[null, null, 'center', 'flex-start']}
      >
        <Container
          zIndex="999"
          position="sticky"
          top="0"
          display="flex"
          justifyContent="center"
          borderBottom={['1px solid rgba(49, 50, 51, 0.1)', null, null, 'none']}
          ref={tabRef}
          width={[1, null, null, 'fit-content']}
          background="white"
        >
          <Tabs activeTab={activeTab} />
        </Container>
        <Box ref={sectionContainerRef}>
          <Container
            id="collective"
            pt={['64px', null, null, 3]}
            display="flex"
            px="16px"
            flexDirection="column"
            alignItems="center"
          >
            <ForCollectiveCard />
          </Container>
          <Container
            id="fiscalHost"
            pt={['64px', null, null, 3]}
            display="flex"
            px="16px"
            flexDirection="column"
            alignItems="center"
            my={[null, null, null, 4]}
          >
            <ForFiscalHosts />
          </Container>
          <Container
            id="faq"
            pt={['64px', null, null, 3]}
            display="flex"
            px="16px"
            alignItems="center"
            justifyContent="center"
            mb={['72px', null, null, '120px']}
            width={['288px', '636px', '700px', '832px', '862px']}
            marginLeft="auto"
            marginRight="auto"
          >
            <PricingFAQ />
          </Container>
        </Box>
      </Flex>
    </React.Fragment>
  );
};

export default Pricing;
