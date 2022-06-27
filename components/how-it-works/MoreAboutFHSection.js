import React from 'react';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import { SectionTitle } from '../marketing/Text';
import { H3 } from '../Text';

const Wrapper = styled(Container)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  padding: 25px 36px;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid #dcdde0;

  &:hover {
    border: 1px solid #297eff;
    color: #1041a3;

    h3 {
      color: #1041a3;
    }
  }
`;

const MoreAboutFiscalHosting = () => {
  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" px="16px" my={[4, '100px']}>
      <Box mb={['24px', '56px']} width={['288px', 1]}>
        <SectionTitle textAlign="center">
          <FormattedMessage id="howItWorks.moreAboutFiscalHosting" defaultMessage="More about fiscal hosting" />
        </SectionTitle>
      </Box>
      <Flex flexDirection={['column', null, 'row']}>
        <Link href="/fiscal-hosting">
          <Wrapper color="black.900" mb={[3, null, 0]} width={['288px', '400px']}>
            <Box width={[null, '266px']}>
              <H3
                fontSize={['24px', '32px']}
                textAlign={['center', 'left']}
                lineHeight={['32px', '40px']}
                letterSpacing="-0.008em"
                mb={2}
                fontWeight="bold"
                color="black.800"
              >
                <FormattedMessage id="howItWorks.fiscalHost" defaultMessage="About how fiscal hosting works" />
              </H3>
            </Box>
            <Box display={['none', 'inline-block']} className="arrowWrapper" fontWeight="bold">
              <ArrowRight2 size={'24'} />
            </Box>
          </Wrapper>
        </Link>
        <Link href="/become-a-host">
          <Wrapper color="black.900" ml={[null, null, 3]} width={['288px', '400px']}>
            <Box width={[null, '266px']}>
              <H3
                fontSize={['24px', '32px']}
                textAlign={['center', 'left']}
                lineHeight={['32px', '40px']}
                letterSpacing="-0.008em"
                mb={2}
                fontWeight="bold"
                color="black.800"
              >
                <FormattedMessage id="howItWorks.becomeHost" defaultMessage="About becoming a fiscal host" />
              </H3>
            </Box>
            <Box display={['none', 'inline-block']} className="arrowWrapper" fontWeight="bold">
              <ArrowRight2 size={'24'} />
            </Box>
          </Wrapper>
        </Link>
      </Flex>
    </Flex>
  );
};

export default MoreAboutFiscalHosting;
