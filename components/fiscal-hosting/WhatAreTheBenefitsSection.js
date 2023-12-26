import React from 'react';
import { themeGet } from '@styled-system/theme-get';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { display } from 'styled-system';

import NextIllustration from '../collectives/HomeNextIllustration';
import { Box, Flex } from '../Grid';
import { SectionDescription, SectionTitle } from '../marketing/Text';
import { H3, P } from '../Text';

const Title = styled(H3)`
  font-size: 20px;
  line-height: 28px;
  letter-spacing: -0.6px;
  font-weight: bold;
  margin-bottom: 16px;
  margin-top: 16px;
  color: ${themeGet('colors.primary.900')};
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

const WhatAreTheBenefits = () => {
  return (
    <Flex mx={[3, 4]} my={4} mt={['56px', null, '120px']} flexDirection="column" alignItems="center" textAlign="center">
      <SectionTitle>
        <FormattedMessage id="fiscalHosting.whatAreTheBenefits.title" defaultMessage="What are the benefits?" />
      </SectionTitle>
      <Box width={['288px', '548px', '708px', null, '755px']} textAlign="center" mb={['40px', null, 0]} mt={[2, 3]}>
        <SectionDescription>
          <FormattedMessage
            id="fiscalHosting.whatAreTheBenefits.subTitle"
            defaultMessage="Organizing takes work. Fiscal hosts are here to help."
          />
        </SectionDescription>
      </Box>
      <Flex
        my="32px"
        flexDirection={['column', 'row']}
        alignItems="center"
        justifyContent={[null, 'space-between', null, 'center']}
        width={1}
      >
        <Box width={[null, '390px', '488px', null, '558px']} mr={[null, null, 3, null, 5]}>
          <NextIllustration
            width={558}
            height={418}
            src="/static/images/fiscal-hosting/tax-exempt.png"
            alt="Collect money"
          />
        </Box>
        <Box width={[null, '264px', '344px', null, '408px']} textAlign={['center', 'left']} ml={[null, 2, null, 5]}>
          <Title>
            <FormattedMessage
              id="fiscalHosting.whatAreTheBenefits.taxExempt"
              defaultMessage="Tax-exempt or charity status"
            />
          </Title>
          <Description>
            <FormattedMessage
              id="fiscalHosting.whatAreTheBenefits.taxExempt.description"
              defaultMessage="Some fiscal hosts are registered charities or nonprofits, who are able to provide tax benefits to donors and qualify for philanthropic grants. Signing up with a fiscal host who already has this status in your country gives you immediate access."
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
        <Box width={[null, '390px', '488px', null, '558px']} ml={[null, null, 3, null, 5]}>
          <NextIllustration
            width={558}
            height={429}
            src="/static/images/fiscal-hosting/mission-focus.png"
            alt="Focus on your mission illustration"
          />
        </Box>
        <Box width={[null, '264px', '344px', null, '408px']} textAlign={['center', 'left']} mr={[null, 2, null, 5]}>
          <Title>
            <FormattedMessage
              id="fiscalHosting.whatAreTheBenefits.missionFocus"
              defaultMessage="Focus on your mission"
            />
          </Title>
          <Description>
            <FormattedMessage
              id="fiscalHosting.whatAreTheBenefits.missionFocus.description"
              defaultMessage="Fiscal hosts take care of a lot of the tedious and painful administrative tasks involved in running an organization. The host becomes your legal entity, handling taxes, invoicing, and accounting—so you can spend your time engaging supporters, building your community, and achieving your main mission."
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
        <Box display={[null, 'none']}>
          <NextIllustration
            width={288}
            height={238}
            src={'/static/images/fiscal-hosting/money-management-xs.png'}
            alt="Money management"
          />
        </Box>
        <Box
          display={['none', 'block']}
          width={['288px', '390px', '488px', null, '558px']}
          height={[null, '323px']}
          mr={[null, null, 3, null, 5]}
        >
          <NextIllustration
            width={555}
            height={452}
            src={'/static/images/fiscal-hosting/money-management.png'}
            alt="Money management"
          />
        </Box>
        <Box width={[null, '264px', '344px', null, '408px']} textAlign={['center', 'left']} ml={[null, 4, 0, 5]}>
          <Title>
            <FormattedMessage id="fiscalHosting.whatAreTheBenefits.moneyManagement" defaultMessage="Money management" />
          </Title>
          <Description>
            <FormattedMessage
              id="fiscalHosting.whatAreTheBenefits.moneyManagement.description"
              defaultMessage="Using your personal bank account can complicate your taxes, and it locks out other team members. A fiscal host holds money on your behalf in its bank account, tracking everything transparently on Open Collective. Everyone can have access to see the budget and to tools for fundraising and requesting payouts."
            />
          </Description>
        </Box>
      </Flex>
    </Flex>
  );
};
export default WhatAreTheBenefits;
