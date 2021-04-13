import React from 'react';
import { FormattedMessage } from 'react-intl';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import Illustration from '../HomeIllustration';
import SectionSubtitle from '../SectionSubtitle';
import SectionTitle from '../SectionTitle';

const WeAreOpen = () => (
  <Flex display="flex" flexDirection={['column', 'row']} alignItems="center" justifyContent="center" mx={[3, 4]}>
    <Container
      display="flex"
      flexDirection={'column'}
      alignItems="center"
      width={[1, '392px', null, null, '657px']}
      mr={[null, 2, 5]}
    >
      <Box textAlign={['center', 'left']} width={['288px', 1]}>
        <SectionTitle fontSize="32px" lineHeight="40px" letterSpacing="-1.2px" color="black.800">
          <FormattedMessage id="home.weAreOpenSection.title" defaultMessage="We are open in every way" />
        </SectionTitle>
      </Box>
      <Box display={['block', 'none']} my={3} width="224px" height="144px">
        <Illustration src="/static/images/home/weareopen-illustration-sm.png" alt="We are open in every way" />
      </Box>
      <Box my={2} width={['288px', 1]} textAlign={['center', 'left']}>
        <SectionSubtitle
          color={['black.600', 'black.700']}
          fontSize={['16px', '20px']}
          lineHeight={['24px', '28px']}
          letterSpacing={['-0.16px', '-0.6px']}
        >
          <FormattedMessage
            id="home.weAreOpenSection.subtitle"
            defaultMessage="We are transparent, just like we help you to be transparent."
          />
        </SectionSubtitle>
      </Box>
    </Container>
    <Box
      display={['none', 'block']}
      width={['224px', null, null, null, '336px']}
      height={['144px', null, null, null, '216px']}
      my={5}
      ml={[null, null, 5]}
    >
      <Illustration src="/static/images/home/weareopen-illustration-md.png" alt="We are open in every way" />
    </Box>
  </Flex>
);

export default WeAreOpen;
