import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import Illustration from '../home/HomeIllustration';
import { H2, H3, P } from '../Text';

const ScreenShotWrapper = styled(Illustration)`
  max-height: none;
`;

const WhatAreTheBenefits = () => {
  return (
    <Flex mt={['96px', '80px', null, null, '104px']} mb="80px" flexDirection="column">
      <Container display="flex" flexDirection="column" alignItems="center" mx={3}>
        <Box mb={[2, 3]} width={['288px', 1]}>
          <H2
            fontSize={['28px', '32px', null, null, '40px']}
            lineHeight={['36px', '40px', null, null, '48px']}
            letterSpacing={['-0.008em', null, null, '-0.04em']}
            color={['black.900', null, null, null, 'black.800']}
            textAlign="center"
          >
            <FormattedMessage
              id="becomeAHost.whatAreTheBenefits"
              defaultMessage="What are the benefits to host with us?"
            />
          </H2>
        </Box>
        <Box width={['288px', '548px', null, null, '755px']}>
          <P
            fontSize={['16px', '20px', null, null, '24px']}
            lineHeight={['24px', '28px', null, null, '32px']}
            letterSpacing="-0.008em"
            textAlign="center"
            color="black.700"
            fontWeight="500"
          >
            <FormattedMessage
              id="becomeAHost.whatAreTheBenefits.description"
              defaultMessage="Accept donations and sponsorship, celebrate your supporters, pay expenses, and keep everyone up to date — all in one place."
            />
          </P>
        </Box>
      </Container>
      <Flex
        mx={3}
        flexDirection={['column', null, 'row']}
        justifyContent="center"
        alignItems={['center', null, 'baseline']}
        mt={['24px', '48px', null, null, '80px']}
      >
        <Container
          display="flex"
          flexDirection={['column', 'row', 'column']}
          alignItems={['flex-start', 'center', 'flex-start']}
          mb={4}
          mr={[null, null, '40px', null, '103px']}
        >
          <Box
            width={['132px', null, null, null, '208px']}
            height={['132px', null, null, null, '208px']}
            mb={[2, null, '17px', null, '51px']}
            mr={[null, 4, 0]}
          >
            <Illustration src="/static/images/become-a-host/reduceOverhead-icon.png" alt="Reduce Overhead Icon" />
          </Box>
          <Box width={['288px', '472px', '250px', null, '289px']}>
            <H3
              fontSize={['20px', null, null, null, '24px']}
              lineHeight={['28px', null, null, null, '32px']}
              letterSpacing="-0.008em"
              color="black.800"
              mb={[2, 3]}
            >
              <FormattedMessage id="becomeAHost.reduceOverhead" defaultMessage="Reduce overhead" />
            </H3>
            <P fontSize={['15px', '18px']} lineHeight={['22px', '26px']} color="black.700" fontWeight="400">
              <FormattedMessage
                id="becomeAHost.reduceOverhead.description"
                defaultMessage="When you’re managing funds for multiple projects or groups, it's easy to get overwhelmed by complex spreadsheets and countless email threads. Open Collective automates budget tracking, reporting, expense processing, and payments, making your job a lot easier."
              />
            </P>
          </Box>
        </Container>
        <Container
          display="flex"
          flexDirection={['column', 'row', 'column']}
          alignItems={['flex-start', 'center', 'flex-start']}
          mb={4}
          mr={[null, null, '40px', null, '103px']}
        >
          <Box
            width={['132px', null, null, null, '208px']}
            height={['132px', null, null, null, '208px']}
            mb={[2, null, '17px', null, '51px']}
            mr={[null, 4, 0]}
          >
            <Illustration src="/static/images/become-a-host/increaseCapacity-icon.png" alt="Increase Capacity Icon" />
          </Box>
          <Box width={['288px', '472px', '250px', null, '289px']}>
            <H3
              fontSize={['20px', null, null, null, '24px']}
              lineHeight={['28px', null, null, null, '32px']}
              letterSpacing="-0.008em"
              color="black.800"
              mb={[2, 3]}
            >
              <FormattedMessage id="becomeAHost.increaseCapacity" defaultMessage="Increase capacity" />
            </H3>
            <P fontSize={['15px', '18px']} lineHeight={['22px', '26px']} color="black.700" fontWeight="400">
              <FormattedMessage
                id="becomeAHost.increaseCapacity.description"
                defaultMessage="Open Collective makes it possible for you to offer more services to more projects in less time. Large numbers of transactions won’t overwhelm you, because the platform automates most of the work, and also collects any fund holding fees you set."
              />
            </P>
          </Box>
        </Container>
        <Container
          display="flex"
          flexDirection={['column', 'row', 'column']}
          alignItems={['flex-start', 'center', 'flex-start']}
          mb={4}
        >
          <Box
            width={['132px', null, null, null, '208px']}
            height={['132px', null, null, null, '208px']}
            mb={[2, null, '17px', null, '51px']}
            mr={[null, 4, 0]}
          >
            <Illustration
              src="/static/images/become-a-host/ABetterExperience-icon.png"
              alt="A Better Experience Icon"
            />
          </Box>
          <Box width={['288px', '472px', '250px', null, '289px']}>
            <H3
              fontSize={['20px', null, null, null, '24px']}
              lineHeight={['28px', null, null, null, '32px']}
              letterSpacing="-0.008em"
              color="black.800"
              mb={[2, 3]}
            >
              <FormattedMessage id="becomeAHost.aBetterExperience" defaultMessage="A better experience" />
            </H3>
            <P fontSize={['15px', '18px']} lineHeight={['22px', '26px']} color="black.700" fontWeight="400">
              <FormattedMessage
                id="becomeAHost.aBetterExperience.description"
                defaultMessage="Reporting is automatic and real-time, so everyone can see the up to date budget at any time. Projects can have more direct control over their funds, while fiscal sponsors can ensure everything is done according to their policies. "
              />
            </P>
          </Box>
        </Container>
      </Flex>
      <Flex mx={2} mt={[2, '48px', null, null, '80px']} flexDirection="column" alignItems="center">
        <Container
          display="flex"
          flexDirection={['column', 'row-reverse']}
          alignItems="center"
          position="relative"
          mr={[null, null, null, null, '178px']}
        >
          <Container
            width={['83px', '79px', '115px', null, '147px']}
            height={['68px', '65px', '94px', null, '120px']}
            position="absolute"
            top={[null, 0, '265px', null, '290px']}
            left={['0', '215px', '330px', null, '350px']}
          >
            <Illustration src="/static/images/become-a-host/keepTrackBird.png" alt="Bird illustration" />
          </Container>
          <Box width="304px" mb="24px" display={[null, 'none']} mt="27px">
            <H2 fontSize="24px" lineHeight="32px" letterSpacing="-0.008em" color="black.900" textAlign="center">
              <FormattedMessage
                id="becomeAHost.benefit.keepTrack"
                defaultMessage="Keep track {lineBreak} of all the budgets"
                values={{ lineBreak: <br /> }}
              />
            </H2>
          </Box>
          <Box
            mb={['24px', 0]}
            overflow="auto"
            maxWidth={['304px', '324px', '478px', null, '558px']}
            maxHeight={['229px', '281px', '355px', null, '420px']}
          >
            <ScreenShotWrapper
              alt="Keep track of all budgets Illustration"
              src="/static/images/become-a-host/keepTrackOfBudget-xs.png"
              display={[null, 'none']}
            />
            <ScreenShotWrapper
              alt="Keep track of all budgets Illustration"
              src="/static/images/become-a-host/keepTrackOfBudget-sm.png"
              display={['none', 'block', 'none']}
            />
            <ScreenShotWrapper
              alt="Keep track of all budgets Illustration"
              src="/static/images/become-a-host/keepTrackOfBudget-md.png"
              display={['none', null, 'block', null, 'none']}
            />
            <ScreenShotWrapper
              alt="Keep track of all budgets Illustration"
              src="/static/images/become-a-host/keepTrackOfBudget-lg.png"
              display={['none', null, null, null, 'block']}
            />
          </Box>
          <Box
            width={['304px', '288px', '437px', null, '408px']}
            mr={[null, '24px', '41px', null, '134px']}
            textAlign={['center', 'left']}
          >
            <H2
              fontSize={['24px', null, null, null, '30px']}
              lineHeight={['32px', null, null, null, '40px']}
              letterSpacing="-0.008em"
              color="black.900"
              display={['none', 'block']}
              mb={3}
            >
              <FormattedMessage
                id="becomeAHost.benefit.keepTrack"
                defaultMessage="Keep track {lineBreak} of all the budgets"
                values={{ lineBreak: <br /> }}
              />{' '}
            </H2>
            <P
              fontSize={['16px', null, null, null, '18px']}
              lineHeight={['24px', null, null, null, '26px']}
              color="black.800"
              fontWeight="500"
            >
              <FormattedMessage
                id="becomeAHost.benefit.keepTrack.description"
                defaultMessage="Create Collectives for as many projects as you need, in a few clicks, at no extra cost. Each has its own page for fundraising, budget tracking, and community engagement. Incoming payments are added to the balance of the right Collective. No spreadsheets required!"
              />
            </P>
          </Box>
        </Container>
        <Container
          mt={['64px', '48px', '58px', null, '94px']}
          display="flex"
          flexDirection={['column', 'row']}
          alignItems={['center', 'flex-start', 'center']}
          position="relative"
        >
          <Container
            width={['71px', '85px', '115px', null, '126px']}
            height={['44px', '52px', '71px', null, '78px']}
            position="absolute"
            right={['0', null, '124px', null, '28px']}
            top={[null, null, '65px']}
          >
            <Illustration src="/static/images/become-a-host/easyExpenseBird.png" alt="Bird illustration" />
          </Container>
          <Box width="304px" mb="24px" display={[null, 'none']} mr={['10px', 0]}>
            <H2 fontSize="24px" lineHeight="32px" letterSpacing="-0.008em" color="black.900" textAlign="center">
              <FormattedMessage
                id="becomeAHost.benefit.easyExpense"
                defaultMessage="Easy expense {lineBreak} management"
                values={{ lineBreak: <br /> }}
              />
            </H2>
          </Box>
          <Box
            mb={['24px', 0]}
            overflow="auto"
            maxWidth={['304px', '324px', '478px', null, '558px']}
            maxHeight={['229px', '281px', '355px', null, '420px']}
          >
            <ScreenShotWrapper
              alt="Easy expense management Illustration"
              src="/static/images/become-a-host/easyExpense-xs.png"
              display={[null, 'none']}
            />
            <ScreenShotWrapper
              alt="Easy expense management Illustration"
              src="/static/images/become-a-host/easyExpense-sm.png"
              display={['none', 'block', 'none']}
            />
            <ScreenShotWrapper
              alt="Easy expense management Illustration"
              src="/static/images/become-a-host/easyExpense-md.png"
              display={['none', null, 'block', null, 'none']}
            />
            <ScreenShotWrapper
              alt="Easy expense management Illustration"
              src="/static/images/become-a-host/easyExpense-lg.png"
              display={['none', null, null, null, 'block']}
            />
          </Box>
          <Box
            width={['304px', '288px', '437px', null, '408px']}
            ml={[null, '24px', '41px', null, '96px']}
            textAlign={['center', 'left']}
          >
            <H2
              fontSize={['24px', null, null, null, '30px']}
              lineHeight={['32px', null, null, null, '40px']}
              letterSpacing="-0.008em"
              color="black.900"
              display={['none', 'block']}
              mb={3}
            >
              <FormattedMessage
                id="becomeAHost.benefit.easyExpense"
                defaultMessage="Easy expense {lineBreak} management"
                values={{ lineBreak: <br /> }}
              />
            </H2>
            <P
              fontSize={['16px', null, null, null, '18px']}
              lineHeight={['24px', null, null, null, '26px']}
              color="black.800"
              fontWeight="500"
            >
              <FormattedMessage
                id="becomeAHost.benefit.easyExpense.description"
                defaultMessage="To withdraw funds, payees submit expenses through the platform, with associated invoices and receipts. Easily view and approve expenses through your admin dashboard—payment via bank transfer or Paypal is built-in, so you can pay in a single click."
              />
            </P>
          </Box>
        </Container>
        <Container
          mt={['35px', '48px', '58px', null, '94px']}
          display="flex"
          flexDirection={['column', 'row-reverse']}
          alignItems="center"
          position="relative"
          mr={[null, null, null, null, '178px']}
        >
          <Container
            width={['88px', '105px', '122px', null, '156px']}
            height={['44px', '52px', '61px', null, '78px']}
            position="absolute"
            left={['0', '150px', '200px']}
            top={[null, '-10px', '35px']}
          >
            <Illustration src="/static/images/become-a-host/combineFundingBird.png" alt="Bird illustration" />
          </Container>
          <Box width="304px" mb="24px" display={[null, 'none']} mt={['27px', 0]}>
            <H2 fontSize="24px" lineHeight="32px" letterSpacing="-0.008em" color="black.900" textAlign="center">
              <FormattedMessage
                id="becomeAHost.benefit.combineFunding"
                defaultMessage="Combine {lineBreak} funding sources"
                values={{ lineBreak: <br /> }}
              />
            </H2>
          </Box>
          <Box
            mb={['24px', 0]}
            overflow="auto"
            maxWidth={['304px', '324px', '478px', null, '558px']}
            maxHeight={['229px', '281px', '355px', null, '420px']}
          >
            <ScreenShotWrapper
              alt="Combine Funding sources Illustration"
              src="/static/images/become-a-host/combineFunding-xs.png"
              display={[null, 'none']}
            />
            <ScreenShotWrapper
              alt="Combine Funding sources Illustration"
              src="/static/images/become-a-host/combineFunding-sm.png"
              display={['none', 'block', 'none']}
            />
            <ScreenShotWrapper
              alt="Combine Funding sources Illustration"
              src="/static/images/become-a-host/combineFunding-md.png"
              display={['none', null, 'block', null, 'none']}
            />
            <ScreenShotWrapper
              alt="Combine Funding sources Illustration"
              src="/static/images/become-a-host/combineFunding-lg.png"
              display={['none', null, null, null, 'block']}
            />
          </Box>
          <Box
            width={['304px', '288px', '437px', null, '408px']}
            mr={[null, '24px', '41px', null, '134px']}
            textAlign={['center', 'left']}
          >
            <H2
              fontSize={['24px', null, null, null, '30px']}
              lineHeight={['32px', null, null, null, '40px']}
              letterSpacing="-0.008em"
              color="black.900"
              display={['none', 'block']}
              mb={3}
            >
              <FormattedMessage
                id="becomeAHost.benefit.combineFunding"
                defaultMessage="Combine {lineBreak} funding sources"
                values={{ lineBreak: <br /> }}
              />
            </H2>
            <P
              fontSize={['16px', null, null, null, '18px']}
              lineHeight={['24px', null, null, null, '26px']}
              color="black.800"
              fontWeight="500"
            >
              <FormattedMessage
                id="becomeAHost.benefit.combineFunding.description"
                defaultMessage="Collectives can seek support through diverse channels while tracking everything in one budget. Crowdfunding, credit card payments, and event ticket sales are built-in, and you can easily credit funds coming in by any other means to the right budget."
              />
            </P>
          </Box>
        </Container>
        <Container
          mt={['35px', '48px', '58px', null, '94px']}
          display="flex"
          flexDirection={['column', 'row']}
          alignItems="center"
          position="relative"
        >
          <Container
            width={['77px', '91px', '106px', null, '136px']}
            height={['31px', '37px', '43px', null, '55px']}
            position="absolute"
            left={['49px', '380px', '550px', null, '660px']}
            bottom="0"
          >
            <Illustration src="/static/images/become-a-host/indepthReportBird1.png" alt="Bird illustration" />
          </Container>
          <Container
            width={['78px', '93px', '108px', null, '138px']}
            height={['38px', '47px', '53px', null, '68px']}
            position="absolute"
            right={['42px', 0, '98px', null, 0]}
            bottom="0"
          >
            <Illustration src="/static/images/become-a-host/indepthReportBird2.png" alt="Bird illustration" />
          </Container>
          <Box width="304px" mb="24px" display={[null, 'none']}>
            <H2 fontSize="24px" lineHeight="32px" letterSpacing="-0.008em" color="black.900" textAlign="center">
              <FormattedMessage id="becomeAHost.benefit.inDepthReports" defaultMessage="In-depth reports" />
            </H2>
          </Box>
          <Box
            mb={['24px', 0]}
            overflow="auto"
            maxWidth={['304px', '324px', '478px', null, '558px']}
            maxHeight={['229px', '281px', '355px', null, '420px']}
          >
            <ScreenShotWrapper
              alt="In-depth Reports Illustration"
              src="/static/images/become-a-host/indepth-report-xs.png"
              display={[null, 'none']}
            />
            <ScreenShotWrapper
              alt="In-depth Reports Illustration"
              src="/static/images/become-a-host/indepth-report-sm.png"
              display={['none', 'block', 'none']}
            />
            <ScreenShotWrapper
              alt="In-depth Reports Illustration"
              src="/static/images/become-a-host/indepth-report-md.png"
              display={['none', null, 'block', null, 'none']}
            />
            <ScreenShotWrapper
              alt="In-depth Reports Illustration"
              src="/static/images/become-a-host/indepth-report-lg.png"
              display={['none', null, null, null, 'block']}
            />
          </Box>
          <Box
            width={['304px', '288px', '437px', null, '408px']}
            ml={[null, '24px', '41px', null, '96px']}
            textAlign={['center', 'left']}
            mb={['50px', null, 0]}
          >
            <H2
              fontSize={['24px', null, null, null, '30px']}
              lineHeight={['32px', null, null, null, '40px']}
              letterSpacing="-0.008em"
              color="black.900"
              display={['none', 'block']}
              mb={3}
            >
              <FormattedMessage id="becomeAHost.benefit.inDepthReports" defaultMessage="In-depth reports" />
            </H2>
            <P
              fontSize={['16px', null, null, null, '18px']}
              lineHeight={['24px', null, null, null, '26px']}
              color="black.800"
              fontWeight="500"
            >
              <FormattedMessage
                id="becomeAHost.benefit.inDepthReports.description"
                defaultMessage="No need to spend time creating reports for funders—it’s all documented automatically and transparently as you go. In addition, you'll receive a consolidated report every month with all transactions and documentation included. Your accountant will thank you!"
              />
            </P>
          </Box>
        </Container>
      </Flex>
    </Flex>
  );
};

export default WhatAreTheBenefits;
