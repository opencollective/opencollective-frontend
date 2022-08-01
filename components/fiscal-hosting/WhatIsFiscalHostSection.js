import React from 'react';
import { FormattedMessage } from 'react-intl';

import Illustration from '../collectives/HomeIllustration';
import { Box, Flex } from '../Grid';
import { H2, P } from '../Text';

const WhatIsFiscalHost = () => (
  <Flex flexDirection={['column', 'row']} alignItems="center" px={3} mt="68px" justifyContent="center">
    <Flex flexDirection={['column', 'row']} alignItems="center" textAlign={['center', 'left']}>
      <Box width={['330px', '306px', '268px', null, '458px']} mr={[null, '40px']}>
        <Illustration src="/static/images/fiscal-hosting/what-is-a-fiscalhost-illustration.png" />
      </Box>
      <Box width={['266px', '326px', '472px', null, '518px']}>
        <H2
          fontSize={['24px', null, null, null, '30px']}
          lineHeight={['32px', null, null, null, '48px']}
          letterSpacing={['-1.2px', '-1.6px']}
          color="primary.900"
          mb={['16px', 3]}
          mt="52px"
        >
          <FormattedMessage id="fiscalHosting.whatIsFiscalHost" defaultMessage="What is a fiscal host?" />
        </H2>
        <P fontSize={['15px', '16px', '18px']} lineHeight={['22px', '24px', '26px']} color="black.800" fontWeight="500">
          <FormattedMessage
            id="fiscalHosting.whatIsFiscalHost.description"
            defaultMessage="A fiscal host is an organization that welcomes others to operate through their structure, so projects can use the host’s legal entity and bank account instead of setting up their own. The host provides administrative services, oversight, and support. {lineBreak}{lineBreak} *Fiscal hosting is also called fiscal sponsorship, fund-holding, or auspicing in different places around the world."
            values={{
              lineBreak: <br />,
            }}
          />
        </P>
      </Box>
    </Flex>
  </Flex>
);

export default WhatIsFiscalHost;
