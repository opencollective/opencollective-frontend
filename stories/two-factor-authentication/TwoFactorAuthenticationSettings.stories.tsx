import React from 'react';

import { TwoFactorMethod } from '../../lib/graphql/types/v2/graphql';

import { TwoFactorAuthenticationSettings } from '../../components/two-factor-authentication/TwoFactorAuthenticationSettings';

const meta = {
  component: TwoFactorAuthenticationSettings,
};

export default meta;

export const NoSetup = {
  render: () => (
    <TwoFactorAuthenticationSettings
      individual={{
        id: '1234',
        email: 'test@opencollective.com',
      }}
      userTwoFactorAuthenticationMethods={[]}
    />
  ),
};

export const AuthenticatorAndDevices = {
  render: () => (
    <TwoFactorAuthenticationSettings
      individual={{
        id: '1234',
        email: 'test@opencollective.com',
      }}
      userTwoFactorAuthenticationMethods={[
        {
          id: '1234',
          name: 'authenticator app',
          method: TwoFactorMethod.TOTP,
          description: 'something',
          icon: '',
          createdAt: new Date(2023, 5, 15),
        },
        {
          id: '1234',
          name: 'u2f device',
          method: TwoFactorMethod.WEBAUTHN,
          description: 'something',
          icon: '',
          createdAt: new Date(2023, 5, 15),
        },
        {
          id: '5432',
          name: 'another u2f device',
          method: TwoFactorMethod.WEBAUTHN,
          description: 'something',
          icon: '',
          createdAt: new Date(2023, 5, 15),
        },
      ]}
    />
  ),
};
