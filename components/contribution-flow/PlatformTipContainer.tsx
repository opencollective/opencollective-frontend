import React from 'react';
import { FormattedMessage } from 'react-intl';

import theme from '../../lib/theme';

import { Box, Flex } from '../Grid';
import Image from '../Image';
import StyledLinkButton from '../StyledLinkButton';
import { P } from '../Text';

import { WhyPlatformTipModal } from './WhyPlatformTipModal';

export function PlatformTipContainer() {
  const [isWhyPlatformTipModalOpen, setIsWhyPlatformTipModalOpen] = React.useState(false);
  return (
    <React.Fragment>
      <Box
        mt={3}
        p={[16, 32]}
        mx={[16, 'none']}
        style={{ borderRadius: '15px' }}
        backgroundColor={theme.colors.black[50]}
      >
        <Flex alignItems="center" gap={10}>
          <Image alt="Platform Tip" src="/static/images/platform-tip-jar.png" height={64} width={64} />
          <P fontWeight="500" fontSize="20px">
            <FormattedMessage defaultMessage="Keep Open Collective Sustainable" />
          </P>
        </Flex>
        <P mt="12px" fontWeight="400" fontSize="16px">
          <FormattedMessage defaultMessage="Adding a platform tip helps us to maintain the platform and introduce new features." />
        </P>
        <Flex mt="12px">
          <Box flexGrow={1} fontWeight="700" fontSize="16px">
            <FormattedMessage defaultMessage="Do you want to add a tip?" />
          </Box>
          <P fontStyle="italic">
            <StyledLinkButton onClick={() => setIsWhyPlatformTipModalOpen(true)}>
              <FormattedMessage defaultMessage="Why?" />
            </StyledLinkButton>
          </P>
        </Flex>
        <Box mt="12px">input</Box>
        <P mt="12px" fontWeight="400" fontSize="16px">
          <FormattedMessage defaultMessage="Thanks for your help." />
        </P>
      </Box>
      {isWhyPlatformTipModalOpen && <WhyPlatformTipModal onClose={() => setIsWhyPlatformTipModalOpen(false)} />}
    </React.Fragment>
  );
}
