import React from 'react';
import { CheckShield } from '@styled-icons/boxicons-regular/CheckShield';
import { themeGet } from '@styled-system/theme-get';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Box, Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import { P } from '../Text';

const ProtectTransactionInfoBox = styled.div`
  border-radius: 8px;
  background-color: ${themeGet('colors.blue.50')};
  border: 1px solid ${themeGet('colors.blue.600')};
  padding: 16px 12px;
  width: 100%;
`;

const BlueCheckShield = styled(CheckShield)`
  color: ${themeGet('colors.blue.500')};
`;

const SafeTransactionMessage = () => {
  return (
    <ProtectTransactionInfoBox>
      <Flex alignItems="center">
        <Box>
          <BlueCheckShield size={30} />
        </Box>
        <Flex flexDirection="column" ml={22}>
          <P fontWeight="bold" fontSize="12px" lineHeight="20px">
            <FormattedMessage
              id="NewContributionFlow.ProtectTransactionTitle"
              defaultMessage="We protect your transaction:"
            />
          </P>
          <P fontSize="12px" lineHeight="18px" fontWeight="500">
            <FormattedMessage
              id="NewContributionFlow.ProtectTransactionDetails"
              defaultMessage="Open Collective keeps your transaction safe. <link>Learn more</link>."
              values={{
                link: getI18nLink({
                  href: 'https://docs.opencollective.com/help/product/security#payments-security',
                  openInNewTab: true,
                }),
              }}
            />
          </P>
        </Flex>
      </Flex>
    </ProtectTransactionInfoBox>
  );
};

export default SafeTransactionMessage;
