import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Box } from '../Grid';
import MessageBox from '../MessageBox';
import { P, Span } from '../Text';

const StepProfileInfoMessage = () => {
  return (
    <MessageBox type="info" fontSize="12px" color="black.800" my={3} py={2}>
      <P fontSize="12px" lineHeight="18px">
        <Span fontWeight="bold">
          <FormattedMessage defaultMessage="About privacy" />
        </Span>
        <Box as="ul" pl="24px">
          <li>
            <FormattedMessage defaultMessage="Every contribution must be linked to an email account for legal reasons. Please provide a valid email. We wont send any spam or advertising, pinky promise." />
          </li>
          <li>
            <FormattedMessage defaultMessage="You can leave the name field empty if you want to keep your contribution anonymous, only the host admins and the platform will have access to your email." />
          </li>
        </Box>
      </P>
    </MessageBox>
  );
};

export default StepProfileInfoMessage;
