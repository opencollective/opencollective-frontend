import React from 'react';
import { themeGet } from '@styled-system/theme-get';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { display } from 'styled-system';

import NextIllustration from '../collectives/HomeNextIllustration';
import { Box, Flex } from '../Grid';
import { SectionTitle } from '../marketing/Text';
import { H3, P } from '../Text';

const Title = styled(H3)`
  font-size: 20px;
  line-height: 28px;
  letter-spacing: -0.008em;
  font-weight: bold;
  margin-bottom: 16px;
  margin-top: 16px;
  color: ${themeGet('colors.primary.900')};
  ${display}

  @media screen and (min-width: 40em) {
    font-size: 24px;
    line-height: 32px;
  }

  @media screen and (min-width: 88em) {
    font-size: 32px;
    line-height: 40px;
  }
`;

const Description = styled(P)`
  font-size: 15px;
  line-height: 22px;
  letter-spacing: -0.12px;
  color: ${themeGet('colors.black.800')};
  font-weight: 500;
  ${display}

  @media screen and (min-width: 40em) {
    font-size: 18px;
    line-height: 26px;
  }
`;

const HowOCIsDifferent = () => {
  return (
    <Flex mx={[3, 4]} my={4} mt={['88px', null, '120px']} flexDirection="column" alignItems="center" textAlign="center">
      <Box width={['288px', '100%']}>
        <SectionTitle>
          <FormattedMessage id="howItWorks.HowOCIsDifferent.title" defaultMessage="Doohi Collective is different" />
        </SectionTitle>
      </Box>

      <Flex
        mt={['94px', null, '54px']}
        mb={['16px', null, null, null, '32px']}
        flexDirection={['column', 'row']}
        alignItems="center"
        justifyContent={[null, 'space-between', null, 'center']}
        width={1}
      >
        <Box width={['288px', '392px', null, null, '558px']} mr={[null, null, 3, null, 5]}>
          <NextIllustration
            width={558}
            height={418}
            src="/static/images/how-it-works/transparentByDesign-illustration.png"
            alt="Transparent by design"
          />
        </Box>
        <Box width={['288px', '264px', '358px', null, '472px']} textAlign={['center', 'left']} ml={[null, 2, null, 5]}>
          <Title>
            <FormattedMessage id="howItWorks.transparentByDesign" defaultMessage="Transparent by design" />
          </Title>
          <Description>
            <FormattedMessage
              id="howItWorks.transparentByDesign.description"
              defaultMessage="The first thing you’ll notice is transparency—everyone can see where money comes from and where it goes—but it doesn’t end there..."
            />
          </Description>
        </Box>
      </Flex>
      <Flex
        my={['16px', null, null, null, '32px']}
        flexDirection={['column', 'row-reverse']}
        alignItems="center"
        justifyContent={[null, 'space-between', null, 'center']}
        width={1}
      >
        <Box width={['288px', '392px', null, null, '558px']} ml={[null, null, 3, null, 5]}>
          <NextIllustration
            width={558}
            height={429}
            src="/static/images/how-it-works/builtWithResilient-illustration.png"
            alt="Built with resilience in mind"
          />
        </Box>
        <Box width={['288px', '264px', '358px', null, '472px']} textAlign={['center', 'left']} mr={[null, 2, null, 5]}>
          <Title>
            <FormattedMessage id="howItWorks.builtWithResilient" defaultMessage="Built with resilience in mind" />
          </Title>
          <Description>
            <FormattedMessage
              id="howItWorks.builtWithResilient.description"
              defaultMessage="Unlike other crowdfunding platforms, Doohi Collective is designed for ongoing collaborations. That means your funding and community of support doesn’t disappear after a single campaign, or if the initial organizers move on."
            />
          </Description>
        </Box>
      </Flex>
      <Flex
        my={['16px', null, null, null, '32px']}
        flexDirection={['column', 'row']}
        alignItems="center"
        justifyContent={[null, 'space-between', null, 'center']}
        width={1}
      >
        <Box width={['288px', '392px', null, null, '558px']} height={[null, '323px']} mr={[null, null, 3, null, 5]}>
          <NextIllustration
            width={555}
            height={452}
            src={'/static/images/how-it-works/openIsBetter-illustration.png'}
            alt="Open is better"
          />
        </Box>
        <Box width={['288px', '264px', '358px', null, '472px']} textAlign={['center', 'left']} ml={[null, 4, 0, 5]}>
          <Title>
            <FormattedMessage id="howItWorks.openIsBetter" defaultMessage="Open is better" />
          </Title>
          <Description>
            <FormattedMessage
              id="howItWorks.openIsBetter.description"
              defaultMessage="Our code is fully transparent and open source, just like our budget. You own your data: we’ll never sell it or lock you in."
            />
          </Description>
        </Box>
      </Flex>
      <Flex
        my={['16px', null, null, null, '32px']}
        flexDirection={['column', 'row-reverse']}
        alignItems="center"
        justifyContent={[null, 'space-between', null, 'center']}
        width={1}
      >
        <Box width={['288px', '392px', null, null, '558px']} height={[null, '323px']} ml={[null, null, 3, null, 5]}>
          <NextIllustration
            width={555}
            height={452}
            src={'/static/images/how-it-works/moneyManagement-illustration.png'}
            alt="Hassle-free money management"
          />
        </Box>
        <Box width={['288px', '264px', '358px', null, '472px']} textAlign={['center', 'left']} mr={[null, 4, 0, 5]}>
          <Title>
            <FormattedMessage id="howItWorks.moneyManagement" defaultMessage="Hassle-free money management" />
          </Title>
          <Description>
            <FormattedMessage
              id="howItWorks.moneyManagement.description"
              defaultMessage="Doohi Collective uniquely combines a powerful tech platform with fiscal hosting, enabling Collectives to raise and spend money without legally incorporating, worrying about taxes, or opening a bank account."
            />
          </Description>
        </Box>
      </Flex>
    </Flex>
  );
};
export default HowOCIsDifferent;
