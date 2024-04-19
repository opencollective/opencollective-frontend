import React from 'react';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import NextIllustration from '../collectives/HomeNextIllustration';
import { Box, Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import { SectionDescription, SectionTitle } from '../marketing/Text';
import StyledLink from '../StyledLink';
import { H3, P } from '../Text';

const SectionWrapper = styled(Flex)`
  padding: 0 16px;

  @media screen and (min-width: 425px) {
    padding: 0 25px;
  }
`;

const MoreFeatures = () => (
  <SectionWrapper flexDirection="column" alignItems="center" px={['16px']} mb="47px" mt="64px">
    <Box textAlign="center">
      <SectionTitle mb={[2, 3]}>
        <FormattedMessage id="becomeASponsor.moreFeatures.title" defaultMessage="More features" />
      </SectionTitle>
      <SectionDescription color="black.600">
        <FormattedMessage
          id="becomeASponsor.moreFeatures.description"
          defaultMessage="Discover the possibilities of our features."
        />
      </SectionDescription>
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
          <NextIllustration
            src="/static/images/become-a-sponsor/bulkPayment-illustration.png"
            alt="Bulk Payments Illustration"
            width={160}
            height={160}
          />
        </Box>
        <H3 fontSize="24px" lineHeight="32px" color="primary.900" mb="12px">
          <FormattedMessage id="becomeASponsor.bulkPayments" defaultMessage="Bulk Payments" />
        </H3>
        <Box width={[null, '290px', '401px']}>
          <P fontSize="18px" lineHeight="32px" fontWeight="400" letterSpacing="-0.16px" color="black.600">
            <FormattedMessage
              id="becomeASponsor.bulkPayments.description"
              defaultMessage="Instead of paying by credit card to each Collective, you can send a single payment to the Fiscal Host for credit to your Organization on the platform. Then you can use this balance to fund as many Collectives as you wish."
            />
          </P>
        </Box>
      </Flex>
      <Flex flexDirection="column" alignItems={['center', 'flex-start']} textAlign={['center', 'left']} mb="36px">
        <Box width={['160px']} height={['160px']} mb="24px">
          <NextIllustration
            src="/static/images/become-a-sponsor/backYourStack-illustration.png"
            alt="BackYourStack Illustration"
            width={160}
            height={160}
          />
        </Box>
        <H3 fontSize="24px" lineHeight="32px" color="primary.900" mb="12px">
          BackYourStack
        </H3>
        <Box width={[null, '290px', '312px']}>
          <P fontSize="18px" lineHeight="32px" fontWeight="400" letterSpacing="-0.16px" color="black.600">
            <FormattedMessage
              id="becomeASponsor.backYourStack.description"
              defaultMessage="Discover your Open Source dependencies and support them."
            />
            <StyledLink href="https://backyourstack.com" color="rgb(220, 95, 125)">
              <FormattedMessage defaultMessage="Learn more" id="TdTXXf" /> <ArrowRight2 size="18" />
            </StyledLink>
          </P>
        </Box>
      </Flex>
    </Flex>
    <Flex flexDirection={['column', 'row']} alignItems="center">
      <Box mb={['14px', 0]} width={[null, '305px', '341px', null, '536px']}>
        <SectionTitle mb={['24px', 4, '48px', null, 3]} textAlign={['center', 'left']}>
          <FormattedMessage id="becomeASponsor.sustainersKit" defaultMessage="Sustainers kit:" />
        </SectionTitle>
        <SectionDescription>
          <FormattedMessage
            id="becomeASponsor.sustainersKit.description"
            defaultMessage="We know making the case up the chain is not always easy. For all you heroes inside companies, we put together <Link>some resources to help you succeed</Link>."
            values={{
              Link: getI18nLink({
                href: 'https://docs.opencollective.com/help/financial-contributors/organizations/sustainer-resources',
                color: 'rgb(220, 95, 125)',
              }),
            }}
          />
        </SectionDescription>
      </Box>
      <Box
        ml={[null, '35px', '111px']}
        width={['194px', '304px', '337px', null, '575px']}
        height={['163px', '256px', '274px', null, '404px']}
      >
        <NextIllustration
          src="/static/images/become-a-sponsor/sustainersKit-illustration.png"
          alt="Sustainers Kit Illustration"
          width={575}
          height={404}
        />
      </Box>
    </Flex>
  </SectionWrapper>
);

export default MoreFeatures;
