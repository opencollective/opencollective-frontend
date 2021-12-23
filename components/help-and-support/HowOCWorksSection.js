import React from 'react';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import { FormattedMessage } from 'react-intl';

import { Box, Flex } from '../Grid';
import NextIllustration from '../home/HomeNextIllustration';
import Link from '../Link';
import { H2, P, Span } from '../Text';

const HowOCWorks = () => (
  <Flex flexDirection="column" px={3} alignItems="center" my="58px">
    <Box textAlign="center" mb={3} width={['304px', '660px', '768px']}>
      <H2
        fontSize={['32px', '40px']}
        lineHeight={['40px', '48px']}
        letterSpacing={['-0.008em', '-0.04em']}
        mb={3}
        color="black.900"
      >
        <FormattedMessage id="helpAndSupport.howOCWorks" defaultMessage="This is how Open Collective works" />
      </H2>
    </Box>
    <Box textAlign="center" width={['288px', '660px', '768px']}>
      <P mb="24px" fontSize={['16px', '24px']} lineHeight={['24px', '32px']} color="black.700" fontWeight="500">
        <FormattedMessage
          id="helpAndSupport.howOCWorks.description"
          defaultMessage="Open Collective enables all kinds of collaborative groups, initiatives, and projects to raise, manage, and spend money transparently."
        />
      </P>
      <Link href="/how-it-works">
        <Span color="ocBrandColors.600" fontSize="16px" lineHeight="24px">
          <FormattedMessage defaultMessage="How it works" id="howItWorks" />
        </Span>
        <Span ml="8px">
          <ArrowRight2 color="#1869F5" size="18" />
        </Span>
      </Link>
    </Box>
    <Box display={['none', 'block', null, null, 'none']} mt="16px">
      <NextIllustration
        src="/static/images/help-and-support/transparency-illustration.png"
        alt="How open collective illustration"
        width={660}
        height={390}
      />
    </Box>
    <Box display={['none', null, null, null, 'block']} mt="16px">
      <NextIllustration
        src="/static/images/help-and-support/transparency-illustration-lg.png"
        alt="How open collective illustration"
        width={862}
        height={441}
      />
    </Box>
    <Flex flexDirection={['column', null, 'row']} alignItems="center" my={['56px', null, '127px']}>
      <Box order={[null, 1]} display={[null, null, 'none']}>
        <H2
          fontSize={['32px', '40px']}
          lineHeight={['40px', '48px']}
          letterSpacing={['-0.008em', '-0.04em']}
          mb={3}
          color="black.900"
        >
          <FormattedMessage id="helpAndSupport.getToKnowUs" defaultMessage="Get to know us!" />
        </H2>
      </Box>
      <Box mt="16px" order={[null, 3]} width={['216px', '320px', '448px']}>
        <NextIllustration
          src="/static/images/help-and-support/getToKnowUs-illustration.png"
          alt="How open collective illustration"
          width={448}
          height={365}
        />
      </Box>
      <Box
        textAlign={['center', null, 'left']}
        width={['288px', '660px', '417px']}
        order={[null, 2]}
        mr={[null, null, '72px']}
      >
        <H2
          fontSize={['32px', '40px']}
          lineHeight={['40px', '48px']}
          letterSpacing={['-0.008em', '-0.04em']}
          mb={3}
          color="black.900"
          display={['none', null, 'block']}
        >
          <FormattedMessage id="helpAndSupport.getToKnowUs" defaultMessage="Get to know us!" />
        </H2>
        <P
          mb={['16px', '24px']}
          fontSize={['16px', '24px']}
          lineHeight={['24px', '32px']}
          color="black.700"
          fontWeight="500"
        >
          <FormattedMessage
            id="helpAndSupport.getToKnowUs.description"
            defaultMessage="We know making the case up the chain is not always easy. For all you heroes inside companies, we put together some resources to help you succeed."
          />
        </P>
        <Link href="/how-it-works">
          <Span color="ocBrandColors.600" fontSize="16px" lineHeight="24px">
            <FormattedMessage defaultMessage="Know more about us" id="knowMoreAboutUs" />
          </Span>
          <Span ml="8px">
            <ArrowRight2 color="#1869F5" size="18" />
          </Span>
        </Link>
      </Box>
    </Flex>
  </Flex>
);

export default HowOCWorks;
