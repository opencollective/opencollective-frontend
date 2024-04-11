import React from 'react';
import { FormattedMessage } from 'react-intl';

import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { getDashboardRoute } from '../lib/url-helpers';

import { Box, Flex } from './Grid';
import Image from './Image';
import Link from './Link';
import StyledButton from './StyledButton';
import StyledCard from './StyledCard';
import StyledHr from './StyledHr';
import { P, Strong } from './Text';

type TwoFactorAuthRequiredMessageProps = {
  borderWidth?: string | number;
  noTitle?: boolean;
  className?: string;
};

export const TwoFactorAuthRequiredMessage = ({
  borderWidth = '1px',
  noTitle = false,
  ...flexProps
}: TwoFactorAuthRequiredMessageProps) => {
  const { LoggedInUser } = useLoggedInUser();
  return (
    <Flex justifyContent="center" alignItems="flex-start" {...flexProps}>
      <StyledCard width="100%" maxWidth={496} py="16px" textAlign="center" borderWidth={borderWidth}>
        {!noTitle && (
          <Strong fontSize="28px" lineHeight="36px">
            <FormattedMessage defaultMessage="2FA Required" id="ScX/93" />
          </Strong>
        )}
        <StyledHr my="21px" borderColor="black.200" />
        <Flex my="41px" px="36px" alignItems="center">
          <Box flex="1 0 164px">
            <Image src="/static/images/lock-illustration.png" alt="" width={164} height={164} />
          </Box>
          <P textAlign="left" fontSize="20px" lineHeight="28px" fontWeight="500" color="black.700">
            <FormattedMessage
              defaultMessage="Your organization requires you to have two-factor authentication activated to continue"
              id="UoQDcG"
            />
          </P>
        </Flex>
        <StyledHr my="16px" borderColor="black.400" />
        {LoggedInUser && (
          <Flex justifyContent="center">
            <Link href={getDashboardRoute(LoggedInUser.collective, 'user-security#two-factor-auth')}>
              <StyledButton buttonStyle="primary">
                <FormattedMessage defaultMessage="Activate 2FA" id="st/dW2" />
              </StyledButton>
            </Link>
          </Flex>
        )}
      </StyledCard>
    </Flex>
  );
};
