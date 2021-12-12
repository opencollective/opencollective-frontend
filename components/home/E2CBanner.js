import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Box, Flex } from '../Grid';
import { getI18nLink, I18nBold } from '../I18nFormatters';
import { P } from '../Text';

const E2CBanner = () => (
  <Flex justifyContent="center" alignItems="center" py="14px" px="16px" backgroundColor="primary.200">
    <Box>
      <P fontSize="14px" lineHeight="20px" color="primary.900">
        <FormattedMessage
          defaultMessage="Join us as we find a way to decentralize the ownership of the platform. <link><strong>Know more about Exit to Community #E2C</strong></link>"
          values={{
            strong: I18nBold,
            link: getI18nLink({
              href: '/e2c',
              textDecoration: 'underline',
              color: 'primary.900',
            }),
          }}
        />
      </P>
    </Box>
  </Flex>
);

export default E2CBanner;
