import React from 'react';
import { ArrowLeft2 } from '@styled-icons/icomoon/ArrowLeft2';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import { FormattedMessage } from 'react-intl';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import Illustration from '../home/HomeIllustration';
import Link from '../Link';
import StyledButton from '../StyledButton';
import { H1, P } from '../Text';

import OCFPrimaryButton from './OCFPrimaryButton';

const AboutOurFees = () => (
  <Flex flexDirection="column" alignItems="center" justifyContent="center" mt={['24px', '48px']}>
    <Flex flexDirection={['column', 'row']} alignItems="center" justifyContent="center" mb={[null, 3]}>
      <Box width={'160px'} height={'160px'} mb="24px">
        <Illustration
          alt="About our fees illustration"
          src="/static/images/ocf-host-application/aboutOurFees-illustration.png"
        />
      </Box>
      <Box textAlign={['center', 'left']} width={['288px', '404px']} mb={4} ml={[null, '24px']}>
        <H1
          fontSize="32px"
          lineHeight="40px"
          letterSpacing="-0.008em"
          color="black.900"
          textAlign={['center', 'left']}
          mb="14px"
        >
          <FormattedMessage id="OCFHostApplication.aboutOurFees" defaultMessage="About our fees" />
        </H1>
        <P fontSize="16px" lineHeight="24px" fontWeight="500" color="black.700">
          <FormattedMessage
            id="OCFHostApplication.aboutOurFees.description"
            defaultMessage="In order to support you better, we use the Open Collective Platform to manage your initiative."
          />
        </P>
      </Box>
    </Flex>
    <Flex justifyContent="center" alignItems="center" my={3} flexDirection={['column', 'row']}>
      <Container
        width="248px"
        height="172px"
        borderRadius="8px"
        border="1px solid #C4C7CC"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        padding="24px"
        mb={['24px', 0]}
        mr={[null, '48px']}
      >
        <P color="#05464A" fontSize="28px" lineHeight="36px" fontWeight="500" mb={2}>
          5%
        </P>
        <P color="black.900" fontSize="15px" lineHeight="22px" fontWeight="500" mb={2}>
          <FormattedMessage id="OCFHostApplication.crowdFunding" defaultMessage="Crowdfunding" />
        </P>
        <Box width="201px">
          <P textAlign="center" color="black.600" fontSize="13px" lineHeight="16px">
            <FormattedMessage
              id="OCFHostApplication.crowdFunding.description"
              defaultMessage="On each incoming donation made via the Open Collective Platform"
            />
          </P>
        </Box>
      </Container>
      <Container
        width="248px"
        height="172px"
        borderRadius="8px"
        border="1px solid #C4C7CC"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        padding="24px"
      >
        <P color="#05464A" fontSize="28px" lineHeight="36px" fontWeight="500" mb={2}>
          4-8%
        </P>
        <P color="black.900" fontSize="15px" lineHeight="22px" fontWeight="500" mb={2}>
          <FormattedMessage id="OCFHostApplication.bankTransfer" defaultMessage="Bank Transfer or Check" />
        </P>
        <Box width="201px">
          <P textAlign="center" color="black.600" fontSize="13px" lineHeight="16px">
            <FormattedMessage
              id="OCFHostApplication.bankTransfer.description"
              defaultMessage="**Based on amount raised"
            />
          </P>
        </Box>
      </Container>
    </Flex>
    <Flex my={[4, 2]} justifyContent="center" alignItems="center">
      <Box width={['288px', '396px']} textAlign="center">
        <P fontSize="12px" lineHeight="18px" color="#050505" mb="24px">
          <FormattedMessage
            id="OCFHostApplication.aboutOurFees.note"
            defaultMessage="*Third-party payment processors (like Stripe and Paypal) charge separate fees on each transaction made using their service. Learn more here."
          />
        </P>
        <P fontSize="12px" lineHeight="18px" color="#050505">
          <FormattedMessage
            id="OCFHostApplication.aboutOurFees.otherFees"
            defaultMessage="{boldEightPercent} Up to 500k raised. {boldSixPercent} Up to 1 Million raised. {boldFourPercent} Over a Million raised"
            values={{
              boldEightPercent: <strong>**8%</strong>,
              boldSixPercent: <strong>- 6%</strong>,
              boldFourPercent: <strong>- 4%</strong>,
            }}
          />
        </P>
      </Box>
    </Flex>
    <Flex flexDirection={['column', 'row']} alignItems="center" justifyContent="center" mb="40px" mt={[null, '48px']}>
      <Link route="/ocf/apply/fees">
        <StyledButton mb={[3, 0]} width={['286px', '100px']} mr={[null, 3]}>
          <FormattedMessage
            id="OCFHostApplication.backBtn"
            defaultMessage="{arrowLeft} Back"
            values={{
              arrowLeft: <ArrowLeft2 size="14px" />,
            }}
          />
        </StyledButton>
      </Link>
      <Link route="/ocf/apply/form">
        <OCFPrimaryButton width={['286px', '100px']}>
          <FormattedMessage
            id="OCFHostApplication.nextBtn"
            defaultMessage="Next {arrowRight}"
            values={{
              arrowRight: <ArrowRight2 size="14px" />,
            }}
          />
        </OCFPrimaryButton>
      </Link>
    </Flex>
  </Flex>
);

export default AboutOurFees;
