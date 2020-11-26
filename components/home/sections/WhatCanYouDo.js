import React from 'react';
import themeGet from '@styled-system/theme-get';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { display } from 'styled-system';

import { Box, Flex } from '../../Grid';
import { H3, P } from '../../Text';
import Illustration from '../HomeIllustration';
import SectionSubTitle from '../SectionSubtitle';
import SectionTitle from '../SectionTitle';

const Title = styled(H3)`
  font-size: 20px;
  line-height: 28px;
  letter-spacing: -0.6px;
  font-weight: bold;
  margin-bottom: 16px;
  margin-top: 16px;
  color: ${themeGet('colors.black.800')};
  ${display}

  @media screen and (min-width: 40em) {
    font-size: 24px;
    line-height: 32px;
    letter-spacing: -0.8px;
  }
`;

const Description = styled(P)`
  font-size: 15px;
  line-height: 23px;
  letter-spacing: -0.12px;
  color: ${themeGet('colors.black.700')};
  font-weight: 500;
  margin-top: 10px;
  ${display}

  @media screen and (min-width: 40em) {
    font-size: 16px;
    line-height: 24px;
    letter-spacing: -0.16px;
  }
  @media screen and (min-width: 88em) {
    font-size: 18px;
    line-height: 27px;
    letter-spacing: -0.2px;
  }
`;

const WhatCanYouDo = () => {
  return (
    <Flex mx={[3, 4]} my={4} flexDirection="column" alignItems="center" textAlign="center">
      <SectionTitle>
        <FormattedMessage id="home.whatCanYouDoSection.title" defaultMessage="What can you do on Open Collective?" />
      </SectionTitle>
      <Box width={['288px', '548px', '708px', null, '755px']} textAlign="center">
        <SectionSubTitle
          display={['none', 'block']}
          fontSize={[null, '20px']}
          lineHeight={[null, '28px']}
          letterSpacing={[null, '-0.6px']}
          color="black.700"
        >
          <FormattedMessage
            id="home.whatCanYouDoSection.subTitle"
            defaultMessage="Accept donations and sponsorships, celebrate your supporters, pay expenses, and keep everyone up to date — all in one place."
          />
        </SectionSubTitle>
        <SectionSubTitle display={[null, 'none']}>
          <FormattedMessage
            id="home.whatIsGreatAboutOC.description"
            defaultMessage="Money management made simple, plus great tools for community engagement, budget reporting, and fiscal sponsorship."
          />
        </SectionSubTitle>
      </Box>
      <Flex
        my="32px"
        flexDirection={['column', 'row']}
        alignItems="center"
        justifyContent={[null, 'space-between', null, 'center']}
        width={1}
      >
        <Title textAlign="center" display={['block', 'none']}>
          <FormattedMessage id="home.whatCanYouDoSection.collectMoney" defaultMessage="Collect Money" />
        </Title>
        <Box width={[null, '390px', '488px', null, '558px']} mr={[null, null, 3, null, 5]}>
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
        <Box width={[null, '224px', '274px', null, '408px']} textAlign="left" ml={[null, 2, null, 5]}>
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
        my="32px"
        flexDirection={['column', 'row-reverse']}
        alignItems="center"
        justifyContent={[null, 'space-between', null, 'center']}
        width={1}
      >
        <Title textAlign="center" display={['block', 'none']}>
          <FormattedMessage id="home.whatCanYouDoSection.spendMoney" defaultMessage="Spend Money" />
        </Title>
        <Box width={[null, '390px', '488px', null, '558px']} ml={[null, null, 3, null, 5]}>
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
        <Box width={[null, '224px', '274px', null, '408px']} textAlign="left" mr={[null, 2, null, 5]}>
          <Title display={['none', 'block']}>
            <FormattedMessage id="home.whatCanYouDoSection.spendMoney" defaultMessage="Spend Money" />
          </Title>
          <Description>
            <FormattedMessage
              id="home.whatCanYouDoSection.spendMoney.longDescription"
              defaultMessage="Anyone in your community can submit expenses. Once approved, pay in one click with Paypal or bank transfer. All transactions are public in your transparent budget (with personal information kept private)."
            />
          </Description>
        </Box>
      </Flex>
      <Flex
        my="32px"
        flexDirection={['column', 'row']}
        alignItems="center"
        justifyContent={[null, 'space-between', null, 'center']}
        width={1}
      >
        <Title textAlign="center" display={['block', 'none']}>
          <FormattedMessage id="home.whatCanYouDoSection.manageMoney" defaultMessage="Manage Money" />
        </Title>
        <Box width={[null, '390px', '488px', null, '558px']} mr={[null, null, 3, null, 5]}>
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
        <Box width={[null, '224px', '274px', null, '408px']} textAlign="left" ml={[null, 4, 0, 5]}>
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
    </Flex>
  );
};
export default WhatCanYouDo;
