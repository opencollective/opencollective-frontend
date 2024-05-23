import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { Individual, UserTwoFactorMethod } from '../../lib/graphql/types/v2/graphql';

import { Box } from '../Grid';
import { P } from '../Text';

import { AuthenticatorSettings } from './AuthenticatorSettings';
import { DevicesSettings } from './DevicesSettings';
import { RecoverySettings } from './RecoverySettings';
import { ResetTwoFactorButton } from './ResetTwoFactorButton';
import { SaveRecoveryCodesModal } from './SaveRecoveryCodesModal';

type TwoFactorAuthenticationSettingsProps = {
  userTwoFactorAuthenticationMethods: UserTwoFactorMethod[];
  individual: Pick<Individual, 'id' | 'email'>;
};

export function TwoFactorAuthenticationSettings(props: TwoFactorAuthenticationSettingsProps) {
  const [recoveryCodes, setRecoveryCodes] = React.useState(null);

  return (
    <React.Fragment>
      <Box>
        <P mb={3}>
          <FormattedMessage
            id="TwoFactorAuth.Setup.Info"
            defaultMessage="Two-factor authentication adds an extra layer of security for your account when logging in or performing admin actions."
          />
        </P>

        <Box>
          <AuthenticatorSettings
            onRecoveryCodes={codes => setRecoveryCodes(codes)}
            individual={props.individual}
            userTwoFactorAuthenticationMethods={props.userTwoFactorAuthenticationMethods}
          />
        </Box>

        <Box mt={3}>
          <DevicesSettings
            onRecoveryCodes={codes => setRecoveryCodes(codes)}
            individual={props.individual}
            userTwoFactorAuthenticationMethods={props.userTwoFactorAuthenticationMethods}
          />
        </Box>

        {props.userTwoFactorAuthenticationMethods.length > 0 && (
          <Box mt={3}>
            <RecoverySettings onRecoveryCodes={codes => setRecoveryCodes(codes)} />
          </Box>
        )}

        {props.userTwoFactorAuthenticationMethods.length > 0 && (
          <Box mt={3}>
            <ResetTwoFactorButton individual={props.individual} />
          </Box>
        )}
      </Box>
      {recoveryCodes && <SaveRecoveryCodesModal recoveryCodes={recoveryCodes} onClose={() => setRecoveryCodes(null)} />}
    </React.Fragment>
  );
}
