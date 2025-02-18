import React from 'react';
import { useMutation } from '@apollo/client';
import * as webauthn from '@simplewebauthn/browser';
import { Plus } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import { TwoFactorMethod } from '../../lib/graphql/types/v2/graphql';
import type { Individual, UserTwoFactorMethod } from '../../lib/graphql/types/v2/schema';

import StyledCard from '../StyledCard';
import { H3 } from '../Text';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';

import { UserTwoFactorMethodItem } from './UserTwoFactorMethodItem';

const I18nMessages = defineMessages({
  DEVICE_ADDED: {
    defaultMessage: 'Device added',
    id: '9GxuH5',
  },
});

const CreateWebAuthnRegistrationOptionsMutation = gql`
  mutation CreateWebAuthnRegistrationOptions($account: AccountReferenceInput!) {
    createWebAuthnRegistrationOptions(account: $account)
  }
`;

const AddTwoFactorAuthToIndividualMutation = gql`
  mutation AddTwoFactorAuthToIndividual($account: AccountReferenceInput!, $token: String!) {
    addTwoFactorAuthTokenToIndividual(account: $account, token: $token, type: WEBAUTHN) {
      account {
        id
        hasTwoFactorAuth
        twoFactorMethods {
          id
          method
          name
          createdAt
          description
          icon
        }
      }
      recoveryCodes
    }
  }
`;

type DevicesSettingsProps = {
  userTwoFactorAuthenticationMethods: UserTwoFactorMethod[];
  individual: Pick<Individual, 'id' | 'email'>;
  onRecoveryCodes: (recoveryCodes: string[]) => void;
};

export function DevicesSettings(props: DevicesSettingsProps) {
  const intl = useIntl();
  const twoFactorMethods = props.userTwoFactorAuthenticationMethods.filter(m => m.method === TwoFactorMethod.WEBAUTHN);
  const { toast } = useToast();

  const [createPublicKeyRequestOptions] = useMutation(CreateWebAuthnRegistrationOptionsMutation, {
    context: API_V2_CONTEXT,
  });

  const [addWebauthnDevice] = useMutation(AddTwoFactorAuthToIndividualMutation, {
    context: API_V2_CONTEXT,
  });

  const startWebauthnDeviceRegistration = React.useCallback(async () => {
    const response = await createPublicKeyRequestOptions({
      variables: {
        account: {
          id: props.individual.id,
        },
      },
    });

    try {
      const registration = await webauthn.startRegistration({
        optionsJSON: response.data.createWebAuthnRegistrationOptions,
      });
      const registrationBase64 = Buffer.from(JSON.stringify(registration)).toString('base64');

      const result = await addWebauthnDevice({
        variables: {
          account: {
            id: props.individual.id,
          },
          token: registrationBase64,
        },
      });

      if (result.data.addTwoFactorAuthTokenToIndividual.recoveryCodes) {
        props.onRecoveryCodes(result.data.addTwoFactorAuthTokenToIndividual.recoveryCodes);
      }

      toast({
        variant: 'success',
        message: intl.formatMessage(I18nMessages.DEVICE_ADDED),
      });
    } catch (e) {
      toast({ variant: 'error', message: e.message });
    }
  }, [props.individual.id, intl]);

  return (
    <StyledCard px={3} py={2}>
      <H3 fontSize="14px" fontWeight="700" my={2}>
        <FormattedMessage defaultMessage="U2F (Universal 2nd Factor)" id="7I69Bp" />
      </H3>
      <div className="mb-3 text-sm">
        <FormattedMessage
          defaultMessage="A device or platform authenticator that supports the U2F specification. This can be a hardware key (like a YubiKey) or other methods supported by your browser."
          id="tE0Vtz"
        />
      </div>
      <div>
        {twoFactorMethods.map(device => {
          return (
            <div className="border-b last:border-b-0" key={device.id}>
              <UserTwoFactorMethodItem individual={props.individual} userTwoFactorMethod={device} />
            </div>
          );
        })}
      </div>
      <Button onClick={startWebauthnDeviceRegistration} variant="outline" className="mt-3 mb-2 w-full">
        <Plus size="14px" />
        <FormattedMessage defaultMessage="Add device" id="kFWJpj" />
      </Button>
    </StyledCard>
  );
}
