import React, { useState } from 'react';
import styled from 'styled-components';
import themeGet from '@styled-system/theme-get';
import { display } from 'styled-system';
import { Flex, Box } from '@rebass/grid';
import { FormattedMessage } from 'react-intl';

import { Link } from '../../../server/pages';
import { P, H3, H4 } from '../../Text';
import Illustration from '../HomeIllustration';
import { HomePrimaryLink } from '../HomeLinks';
import Container from '../../Container';
import SectionTitle from '../SectionTitle';
import SectionSubTitle from '../SectionSubtitle';

const Wrapper = styled(Box)`
  background-image: ${props =>
    props.hovering
      ? "url('/static/images/home/create-collective-bg-illustration-hover-sm.png')"
      : "url('/static/images/home/create-collective-bg-illustration-sm.png')"};
  background-size: 100% 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  @media screen and (min-width: 52em) {
    background-image: ${props =>
      props.hovering
        ? "url('/static/images/home/create-collective-bg-illustration-hover.png')"
        : "url('/static/images/home/create-collective-bg-illustration.png')"};
    background-size: 100% 100%;
  }
`;

const Title = styled(H3)`
  font-size: 15px;
  line-height: 25px;
  letter-spacing: -0.008em;
  font-weight: bold;
  margin-bottom: 16px;
  margin-top: 16px;
  color: ${themeGet('colors.black.800')};
  ${display}

  @media screen and (min-width: 64em) {
    font-size: ${props => props.theme.fontSizes.H4}px;
    line-height: ${props => props.theme.lineHeights.H4};
    letter-spacing: -0.2px;
  }
`;

const Description = styled(P)`
  font-size: ${props => props.theme.fontSizes.Caption}px;
  line-height: 19px;
  letter-spacing: -0.016em;
  color: ${themeGet('colors.black.600')};
  ${display}

  @media screen and (min-width: 52em) {
    font-size: ${props => props.theme.fontSizes.LeadParagraph}px;
    line-height: 26px;
    letter-spacing: -0.016em;
  }
`;

const WhatCanYouDo = () => {
  const [hoverCreateCollectiveButton, setHoverCreateCollectiveButton] = useState(false);

  return (
    <Flex mx={[3, 4]} my={4} flexDirection="column" alignItems="center" textAlign="center">
      <SectionTitle>
        <FormattedMessage id="home.whatCanYouDoSection.title" defaultMessage="What can you do on Open Collective?" />
      </SectionTitle>
      <Box width={['288px', 1, null, '672px']} textAlign="center">
        <SectionSubTitle>
          <FormattedMessage
            id="home.whatCanYouDoSection.subTitle"
            defaultMessage="Accept donations and sponsorships, celebrate your supporters, pay expenses, and keep everyone up to date — all in one place."
          />
        </SectionSubTitle>
      </Box>
      <Flex
        my={[3, 5]}
        flexDirection={['column', 'row']}
        alignItems="center"
        justifyContent={[null, 'space-between', null, 'center']}
        width={1}
      >
        <Title textAlign="center" display={['block', 'none']}>
          <FormattedMessage id="home.whatCanYouDoSection.collectMoney" defaultMessage="Collect Money" />
        </Title>
        <Box width={[null, '448px', null, null, '576px', '583px']} mr={[null, null, null, 5]}>
          <Illustration
            src="/static/images/home/collectmoney-illustration-md.png"
            display={['block', null, null, 'none']}
            alt="Collect money"
          />
          <Illustration
            src="/static/images/home/collectmoney-illustration-lg.png"
            display={['none', null, null, 'block']}
            alt="Collect money"
          />
        </Box>
        <Box width={[null, '352px', null, null, '368px', '408px']} textAlign="left" ml={[null, null, null, 5]}>
          <Title display={['none', 'block']}>
            <FormattedMessage id="home.whatCanYouDoSection.collectMoney" defaultMessage="Collect Money" />
          </Title>
          <Description>
            <FormattedMessage
              id="home.whatCanYouDoSection.collectMoney.longDescription"
              defaultMessage="Receive funds by credit card, Paypal, or bank transfer, and record everything in your transparent budget. Define different ways people can contribute with customizable tiers and rewards."
            />
          </Description>
        </Box>
      </Flex>
      <Flex
        my={[3, 5]}
        flexDirection={['column', 'row-reverse']}
        alignItems="center"
        justifyContent={[null, 'space-between', null, 'center']}
        width={1}
      >
        <Title textAlign="center" display={['block', 'none']}>
          <FormattedMessage id="home.whatCanYouDoSection.spendMoney" defaultMessage="Spend Money" />
        </Title>
        <Box width={[null, '448px', null, null, '576px', '583px']} ml={[null, null, null, 5]}>
          <Illustration
            src="/static/images/home/spendmoney-illustration-md.png"
            display={['block', null, null, 'none']}
            alt="Spend money"
          />
          <Illustration
            src="/static/images/home/spendmoney-illustration-lg.png"
            display={['none', null, null, 'block']}
            alt="Spend money"
          />
        </Box>
        <Box width={[null, '352px', null, null, '368px', '408px']} textAlign="left" mr={[null, null, null, 5]}>
          <Title display={['none', 'block']}>
            <FormattedMessage id="home.whatCanYouDoSection.spendMoney" defaultMessage="Spend Money" />
          </Title>
          <Description>
            <FormattedMessage
              id="home.whatCanYouDoSection.spendMoney.longDescription"
              defaultMessage="Anyone in your community can submit expenses. Once approved, pay in one click with Paypal or manually. All transactions are public in your transparent budget (with personal information kept private)."
            />
          </Description>
        </Box>
      </Flex>
      <Flex
        my={[3, 5]}
        flexDirection={['column', 'row']}
        alignItems="center"
        justifyContent={[null, 'space-between', null, 'center']}
        width={1}
      >
        <Title textAlign="center" display={['block', 'none']}>
          <FormattedMessage id="home.whatCanYouDoSection.manageMoney" defaultMessage="Manage Money" />
        </Title>
        <Box width={[null, '448px', null, null, '576px', '583px']} mr={[null, null, null, 5]}>
          <Illustration
            src="/static/images/home/managemoney-illustration-md.png"
            alt="Manage money"
            display={['block', null, null, 'none']}
          />
          <Illustration
            src="/static/images/home/managemoney-illustration-lg.png"
            alt="Manage money"
            display={['none', null, null, 'block']}
          />
        </Box>
        <Box width={[null, '352px', null, null, '368px', '408px']} textAlign="left" ml={[null, 4, 0, 5]}>
          <Title display={['none', 'block']}>
            <FormattedMessage id="home.whatCanYouDoSection.manageMoney" defaultMessage="Manage Money" />
          </Title>
          <Description>
            <FormattedMessage
              id="home.whatCanYouDoSection.manageMoney.longDescription"
              defaultMessage="Create Collectives for different projects for easy budget tracking. No need for messy spreadsheets! Automatic monthly reports make accounting a breeze."
            />
          </Description>
        </Box>
      </Flex>
      <Container
        mt={5}
        mb={4}
        display="flex"
        flexDirection={['column', 'row']}
        justifyContent="center"
        width={1}
        alignItems="center"
      >
        <Box width={[null, null, '286px']} mb={2} textAlign={['center', 'left']}>
          <H4 fontSize="H4" lineHeight="H4" letterSpacing="-0.2px" fontWeight="bold">
            <FormattedMessage
              id="home.whatCanYouDoSection.areYouReady"
              defaultMessage="Are you ready to make your community sustainable?"
            />
          </H4>
        </Box>
        <Wrapper width={['288px', '380px']} height={['288px', '375px']} hovering={hoverCreateCollectiveButton}>
          <Link route="/create" passHref>
            <HomePrimaryLink
              border="none"
              onMouseEnter={() => setHoverCreateCollectiveButton(true)}
              onMouseLeave={() => setHoverCreateCollectiveButton(false)}
            >
              <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
            </HomePrimaryLink>
          </Link>
        </Wrapper>
      </Container>
    </Flex>
  );
};
export default WhatCanYouDo;
