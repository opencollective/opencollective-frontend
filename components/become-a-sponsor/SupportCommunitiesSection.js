import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Box, Flex } from '../Grid';
import Illustration from '../home/HomeIllustration';
import { H2, P } from '../Text';

const SupportCommunities = () => (
  <Flex flexDirection={['column', 'row']} alignItems="center" px={3} mt="82px" justifyContent="center">
    <Flex
      flexDirection="column"
      alignItems={['center', 'flex-start']}
      textAlign={['center', 'left']}
      mr={[null, '26px', '40px']}
    >
      <Box width={['304px', '306px']}>
        <H2
          fontSize={['24px', null, null, null, '30px']}
          lineHeight={['32px', null, null, null, '48px']}
          letterSpacing={['-1.2px', '-1.6px']}
          color="black.900"
          mb={['24px', 3]}
        >
          <FormattedMessage
            id="becomeASponsor.supportCommunities"
            defaultMessage="Support communities and help them grow."
          />
        </H2>
        <Illustration
          display={[null, 'none']}
          src="/static/images/become-a-sponsor/supportCommunities-illustration-xs.png"
        />
      </Box>
      <Box width={['304px', '306px', '437px', null, '536px']}>
        <P
          fontSize={['14px', '16px', null, null, '18px']}
          lineHeight={['23px', '24px', null, null, '28px']}
          letterSpacing={['-0.12px', 'normal', null, null, '-0.16px']}
          color="black.800"
          fontWeight={[null, '500']}
        >
          <FormattedMessage
            id="becomeASponsor.supportCommunities.description"
            defaultMessage="The Open Collective platform enables fiscal sponsor entities to host unincorporated groups, giving them a legal structure you can engage with."
          />
        </P>
      </Box>
    </Flex>
    <Box
      display={['none', 'block']}
      width={['324px', null, '478px', null, '576px']}
      height={['220px', null, '355px', null, '405px']}
    >
      <Illustration
        display={[null, null, 'none']}
        src="/static/images/become-a-sponsor/supportCommunities-illustration-sm.png"
      />
      <Illustration
        display={[null, 'none', 'block', null, 'none']}
        src="/static/images/become-a-sponsor/supportCommunities-illustration-md.png"
      />
      <Illustration
        display={[null, 'none', null, null, 'block']}
        src="/static/images/become-a-sponsor/supportCommunities-illustration-lg.png"
      />
    </Box>
  </Flex>
);

export default SupportCommunities;
