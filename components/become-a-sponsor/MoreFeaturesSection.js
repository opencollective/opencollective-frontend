import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Box, Flex } from '../Grid';
import Illustration from '../home/HomeIllustration';
import Link from '../Link';
import { H2, H3, P, Span } from '../Text';

const SectionWrapper = styled(Flex)`
  padding: 0 16px;

  @media screen and (min-width: 425px) {
    padding: 0 25px;
  }
`;

const MoreFeatures = () => (
  <SectionWrapper flexDirection="column" alignItems="center" px={['16px']} mb="47px" mt="64px">
    <Box textAlign="center">
      <H2
        fontSize={['24px', '32px', null, null, '40px']}
        lineHeight={['32px', '40px', null, null, '48px']}
        letterSpacing={['-0.8px', '-0.008em', null, null, '-1.6px']}
        color="black.900"
        mb={[2, 3]}
      >
        <FormattedMessage id="becomeASponsor.moreFeatures.title" defaultMessage="More features" />
      </H2>
      <P
        fontSize={['16px', '20px']}
        lineHeight={['24px', '28px']}
        fontWeight="500"
        letterSpacing={[null, '-0.008em', null, null, '-0.6px']}
        color="black.600"
      >
        <FormattedMessage
          id="becomeASponsor.moreFeatures.description"
          defaultMessage="Discover the possibilities of our features."
        />
      </P>
    </Box>
    <Flex
      flexDirection={['column', 'row']}
      justifyContent="center"
      alignItems={['center', 'flex-start']}
      px="4px"
      mt={['36px', '47px']}
      mb={[null, '46px']}
    >
      <Flex
        flexDirection="column"
        alignItems={['center', 'flex-start']}
        textAlign={['center', 'left']}
        mb="57px"
        mr={[null, '63px', '94px', null, '111px']}
      >
        <Box width={['160px']} height={['160px']} mb="24px">
          <Illustration
            src="/static/images/become-a-sponsor/bulkPayment-illustration.png"
            alt="Bulk Payments Illustration"
          />
        </Box>
        <H3 fontSize="24px" lineHeight="32px" color="black.800" mb="12px">
          <FormattedMessage id="becomeASponsor.bulkPayments" defaultMessage="Bulk Payments" />
        </H3>
        <Box width={[null, '290px', '401px']}>
          <P fontSize="18px" lineHeight="32px" fontWeight="400" letterSpacing="-0.16px" color="black.600">
            <FormattedMessage
              id="becomeASponsor.bulkPayments.description"
              defaultMessage="Instead of paying by credit card to each Collective, you can send a single payment to the fiscal host for credit to your organization on the platform. Then you can use this balance to fund as many Collectives as you wish."
            />
          </P>
        </Box>
      </Flex>
      <Flex flexDirection="column" alignItems={['center', 'flex-start']} textAlign={['center', 'left']} mb="36px">
        <Box width={['160px']} height={['160px']} mb="24px">
          <Illustration
            src="/static/images/become-a-sponsor/backYourStack-illustration.png"
            alt="BackYourStack Illustration"
          />
        </Box>
        <H3 fontSize="24px" lineHeight="32px" color="black.800" mb="12px">
          <FormattedMessage id="becomeASponsor.backYourStack" defaultMessage="BackYourStack" />
        </H3>
        <Box width={[null, '290px', '312px']}>
          <P fontSize="18px" lineHeight="32px" fontWeight="400" letterSpacing="-0.16px" color="black.600">
            <FormattedMessage
              id="becomeASponsor.backYourStack.description"
              defaultMessage="Discover your Open Source dependencies and support them."
            />
          </P>
        </Box>
      </Flex>
    </Flex>
    <Flex flexDirection={['column', 'row']} alignItems="center">
      <Box mb={['14px', 0]} width={[null, '305px', '341px', null, '536px']}>
        <H2
          fontSize={['32px', '40px', null, null, '30px']}
          lineHeight={['40px', '48px']}
          color={['black.800', null, null, null, 'black.900']}
          letterSpacing={['-0.008em', '-1.6px']}
          mb={['24px', 4, '48px', null, 3]}
          textAlign={['center', 'left']}
        >
          <FormattedMessage id="becomeASponsor.sustainersKit" defaultMessage="Sustainers kit:" />
        </H2>
        <P
          fontSize={['18px']}
          lineHeight="32px"
          fontWeight="400"
          letterSpacing="-0.16px"
          color={['black.600', null, null, null, 'black.800']}
        >
          <FormattedMessage
            id="becomeASponsor.sustainersKit.description"
            defaultMessage="We know making the case up the chain is not always easy. For all you heroes inside companies, we put together {resourcesLink}"
            values={{
              resourcesLink: (
                <Link route="#">
                  <Span color="rgb(220, 95, 125)">some resources to help you succeed.</Span>
                </Link>
              ),
            }}
          />
        </P>
      </Box>
      <Box
        ml={[null, '35px', '111px']}
        width={['194px', '304px', '337px', null, '575px']}
        height={['163px', '256px', '274px', null, '404px']}
      >
        <Illustration
          display={[null, 'none']}
          src="/static/images/become-a-sponsor/sustainerKit-illustration-xs.png"
          alt="Sustainers Kit Illustration"
        />
        <Illustration
          display={['none', 'block', null, null, 'none']}
          src="/static/images/become-a-sponsor/sustainerKit-illustration-md.png"
          alt="Sustainers Kit Illustration"
        />
        <Illustration
          display={['none', null, null, null, 'block']}
          src="/static/images/become-a-sponsor/sustainersKit-illustration-lg.png"
          alt="Sustainers Kit Illustration"
        />
      </Box>
    </Flex>
  </SectionWrapper>
);

export default MoreFeatures;
