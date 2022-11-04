import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { LoggedInUser } from '../lib/custom_typings/LoggedInUser';
import { getSettingsRoute } from '../lib/url-helpers';

import { Box, Flex } from './Grid';
import Image from './Image';
import Link from './Link';
import StyledButton from './StyledButton';
import StyledCard from './StyledCard';
import StyledHr from './StyledHr';
import { P, Strong } from './Text';

type TwoFactorAuthRequiredMessageProps = {
  loggedInUser: LoggedInUser;
};

export const TwoFactorAuthRequiredMessage = ({ loggedInUser }: TwoFactorAuthRequiredMessageProps) => {
  return (
    <Flex justifyContent="center" alignItems="flex-start" mt={[null, null, '64px']}>
      <StyledCard width="100%" maxWidth={496} py="16px" textAlign="center">
        <Strong fontSize="28px" lineHeight="36px">
          <FormattedMessage defaultMessage="2FA Required" />
        </Strong>
        <StyledHr my="21px" borderColor="black.200" />
        <Flex my="41px" px="36px" alignItems="center">
          <Box flex="1 0 164px">
            <Image src="/static/images/lock-illustration.png" alt="" width={164} height={164} />
          </Box>
          <P textAlign="left" fontSize="20px" lineHeight="28px" fontWeight="500" color="black.700">
            <FormattedMessage defaultMessage="Your organization requires you to have two-factor authentication activated to continue" />
          </P>
        </Flex>
        <StyledHr my="16px" borderColor="black.400" />
        <Flex justifyContent="center">
          <Link href={getSettingsRoute(loggedInUser.collective, 'two-factor-auth')}>
            <StyledButton buttonStyle="primary">
              <FormattedMessage defaultMessage="Activate 2FA" />
            </StyledButton>
          </Link>
        </Flex>
      </StyledCard>
    </Flex>
  );
};
