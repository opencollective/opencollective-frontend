import React from 'react';
import { FormattedMessage } from 'react-intl';

import NextIllustration from '../collectives/HomeNextIllustration';
import { Box, Flex } from '../Grid';
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
          color="primary.900"
          mb={['24px', 3]}
        >
          <FormattedMessage
            id="becomeASponsor.supportCommunities"
            defaultMessage="Support communities and help them grow."
          />
        </H2>
        <NextIllustration
          display={[null, 'none']}
          src="/static/images/become-a-sponsor/supportCommunities-illustration.png"
          width={576}
          height={405}
        />
      </Box>
      <Box width={['304px', '306px', '437px', null, '536px']}>
        <P
          fontSize={['14px', '16px', null, null, '18px']}
          lineHeight={['23px', '24px', null, null, '28px']}
          letterSpacing={['-0.12px', 'normal', null, null, '-0.16px']}
          color="black.800"
          fontWeight="500"
        >
          <FormattedMessage
            id="becomeASponsor.supportCommunities.description"
            defaultMessage="The Doohi Collective platform enables fiscal sponsor entities to host unincorporated groups, giving them a legal structure you can engage with."
          />
        </P>
      </Box>
    </Flex>
    <Box
      display={['none', 'block']}
      width={['324px', null, '478px', null, '576px']}
      height={['220px', null, '355px', null, '405px']}
    >
      <NextIllustration
        display={[null, 'block']}
        src="/static/images/become-a-sponsor/supportCommunities-illustration.png"
        width={576}
        height={405}
      />
    </Box>
  </Flex>
);

export default SupportCommunities;
