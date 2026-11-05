import React from 'react';
import { FormattedMessage } from 'react-intl';

import NextIllustration from '../collectives/HomeNextIllustration';
import { Box, Flex } from '../Grid';
import { P } from '../Text';

type NeedHelpProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
};

const NeedHelp = ({ title, description, actions }: NeedHelpProps) => {
  return (
    <Flex
      flexDirection="column"
      pt="16px"
      pb="56px"
      backgroundColor="#F9FAFB"
      justifyContent="center"
      alignItems="center"
      {...({ position: 'relative' } as Record<string, unknown>)}
      px="16px"
    >
      <Box {...({ position: [null, 'absolute'], top: '-19px' } as Record<string, unknown>)}>
        <NextIllustration
          width={70}
          height={75}
          src="/static/images/help-and-support/needHelp-illustration.png"
          alt={`Need help illustration`}
        />
      </Box>
      <Box {...({ width: ['288px', '100%'] } as Record<string, unknown>)} my={3}>
        <P fontSize="24px" lineHeight="32px" letterSpacing="-0.008em" color="black.900" textAlign="center">
          {title ? title : <FormattedMessage id="helpAndSupport.needHelp" defaultMessage="Need help?" />}
        </P>
      </Box>
      {description && (
        <Box {...({ width: ['288px', '100%'] } as Record<string, unknown>)}>
          <P fontSize="15px" lineHeight="22px" color="black.700" textAlign="center">
            {description}
          </P>
        </Box>
      )}
      <Box my="16px">{actions}</Box>
    </Flex>
  );
};

export default NeedHelp;
