// ignore unused exports default
// keeping the file in case we want to use it in the future

import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Box, Flex } from '../Grid';
import { getI18nLink, I18nBold } from '../I18nFormatters';
import { P } from '../Text';

const Banner = () => (
  <Flex justifyContent="center" alignItems="center" py="14px" px="16px" backgroundColor="primary.200">
    <Box>
      <P fontSize="14px" lineHeight="20px" color="primary.900">
        <FormattedMessage
          defaultMessage="We're hiring Senior Software Engineers! <link><strong>Learn more about open positions</strong></link>"
          values={{
            strong: I18nBold,
            link: getI18nLink({
              href: '/hiring',
              textDecoration: 'underline',
              color: 'primary.900',
            }),
          }}
        />
      </P>
    </Box>
  </Flex>
);

export default Banner;
