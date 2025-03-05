import React from 'react';
import { useMutation } from '@apollo/client';
import { useFormik } from 'formik';
import { Plus } from 'lucide-react';
import QRCode from 'qrcode.react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import speakeasy from 'speakeasy';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import type { Individual, UserTwoFactorMethod } from '../../lib/graphql/types/v2/schema';
import { TwoFactorMethod } from '../../lib/graphql/types/v2/schema';

import { Box, Flex } from '../Grid';
import StyledCard from '../StyledCard';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import { H3 } from '../Text';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';

import { UserTwoFactorMethodItem } from './UserTwoFactorMethodItem';

function generateNewAuthenticatorAppSecret(email: string) {
  let issuer;
  if (window.location.hostname === 'localhost') {
    issuer = '&issuer=Open%20Collective%20Local';
  } else if (window.location.hostname === 'staging.opencollective.com') {
    issuer = '&issuer=Open%20Collective%20Staging';
  } else {
    issuer = '&issuer=Open%20Collective';
  }
  const options = {
    name: email,
    length: 64,
  };
  const secret = speakeasy.generateSecret(options);
  const otpAuthUrl = secret.otpauth_url + issuer;
  return {
    otpAuthUrl,
    base32: secret.base32,
  };
}

const I18nMessages = defineMessages({
  INVALID_TOTP_CODE: {
    defaultMessage: 'Invalid code',
    id: 'x2R8CB',
  },
  REQUIRED: {
    defaultMessage: 'Required',
    id: 'Seanpx',
  },
});

const AddAuthenticatorAppToIndividualMutation = gql`
  mutation AddAuthenticatorAppToIndividual($account: AccountReferenceInput!, $token: String!) {
    addTwoFactorAuthTokenToIndividual(account: $account, token: $token, type: TOTP) {
      account {
        id
        hasTwoFactorAuth
        twoFactorMethods {
          id
          method
          createdAt
          description
          icon
        }
      }
      recoveryCodes
    }
  }
`;

type AuthenticatorSettingsProps = {
  userTwoFactorAuthenticationMethods: UserTwoFactorMethod[];
  individual: Pick<Individual, 'id' | 'email'>;
  onRecoveryCodes: (recoveryCodes: string[]) => void;
};

export function AuthenticatorSettings(props: AuthenticatorSettingsProps) {
  const [isAddingAuthenticator, setIsAddingAuthenticator] = React.useState(false);
  const userTwoFactorMethods = props.userTwoFactorAuthenticationMethods.filter(m => m.method === TwoFactorMethod.TOTP);

  return (
    <StyledCard px={3} py={2}>
      <H3 fontSize="14px" fontWeight="700" my={2}>
        <FormattedMessage defaultMessage="Authenticator App" id="eoPp92" />
      </H3>
      <div className="mb-3 text-sm">
        <FormattedMessage
          defaultMessage="An application that supports TOTP (time-based one-time password). For example, Google Authenticator and 1Password."
          id="gL/uHv"
        />
      </div>
      <div>
        {userTwoFactorMethods.map(device => {
          return (
            <Box className="border-b last:border-b-0" key={device.id} data-cy="authenticator-2fa-method">
              <UserTwoFactorMethodItem individual={props.individual} userTwoFactorMethod={device} />
            </Box>
          );
        })}
      </div>
      {userTwoFactorMethods.length === 0 && (
        <Button className="mt-3 mb-2 w-full" variant="outline" onClick={() => setIsAddingAuthenticator(true)}>
          <Plus size="14px" /> <FormattedMessage defaultMessage="Add authenticator" id="cMa+0l" />
        </Button>
      )}
      {isAddingAuthenticator && (
        <AddAuthenticatorModal
          onClose={() => setIsAddingAuthenticator(false)}
          individual={props.individual}
          onRecoveryCodes={props.onRecoveryCodes}
        />
      )}
    </StyledCard>
  );
}

type AddAuthenticatorModalProps = {
  individual: Pick<Individual, 'id' | 'email'>;
  onRecoveryCodes: (codes: string[]) => void;
  onClose: () => void;
};

function AddAuthenticatorModal(props: AddAuthenticatorModalProps) {
  const { toast } = useToast();
  const intl = useIntl();

  const { otpAuthUrl, base32 } = React.useMemo(() => {
    return generateNewAuthenticatorAppSecret(props.individual.email);
  }, [props.individual.email]);

  const [addAuthenticatorAppMutation] = useMutation<{
    addTwoFactorAuthTokenToIndividual: {
      account: Pick<Individual, 'twoFactorMethods'>;
      recoveryCodes: string[];
    };
  }>(AddAuthenticatorAppToIndividualMutation, {
    context: API_V2_CONTEXT,
    variables: {
      account: {
        id: props.individual.id,
      },
      token: base32,
    },
  });

  const formik = useFormik({
    initialValues: {
      twoFactorAuthenticatorCode: '',
    },
    async onSubmit() {
      try {
        const result = await addAuthenticatorAppMutation();
        toast({
          variant: 'success',
          message: <FormattedMessage defaultMessage="Authenticator added" id="sL33nT" />,
        });

        if (result.data.addTwoFactorAuthTokenToIndividual.recoveryCodes) {
          props.onRecoveryCodes(result.data.addTwoFactorAuthTokenToIndividual.recoveryCodes);
        }
      } catch (e) {
        toast({
          variant: 'error',
          message: i18nGraphqlException(intl, e),
        });
      } finally {
        props.onClose();
      }
    },
    validate(values) {
      const errors: Record<string, unknown> = {};
      if (!values.twoFactorAuthenticatorCode) {
        errors.twoFactorAuthenticatorCode = intl.formatMessage(I18nMessages.REQUIRED);
      } else {
        const verified = speakeasy.totp.verify({
          secret: base32,
          encoding: 'base32',
          token: values.twoFactorAuthenticatorCode,
          window: 2,
        });

        if (!verified) {
          errors.twoFactorAuthenticatorCode = intl.formatMessage(I18nMessages.INVALID_TOTP_CODE);
        }
      }

      return errors;
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      formik.handleSubmit();
    }
  };

  return (
    <StyledModal onClose={props.onClose}>
      <ModalHeader>
        <FormattedMessage defaultMessage="Add authenticator" id="cMa+0l" />
      </ModalHeader>
      <form onSubmit={formik.handleSubmit}>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div className="self-center">
              <QRCode value={otpAuthUrl} renderAs="svg" size={256} level="L" includeMargin data-cy="qr-code" />
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-bold">
                <FormattedMessage
                  id="TwoFactorAuth.Setup.ManualEntry"
                  defaultMessage="Manual entry: {token}"
                  values={{ token: '' }}
                />
              </p>
              <code
                className="mx-8 rounded-md bg-gray-100 p-4 font-mono text-sm break-all"
                data-cy="manual-entry-2fa-token"
              >
                {base32}
              </code>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-bold">
                <FormattedMessage defaultMessage="Enter your code without any dashes" id="M+Txk3" />
              </p>
              <StyledInputField
                required
                htmlFor="twoFactorAuthenticatorCode"
                error={formik.touched.twoFactorAuthenticatorCode && formik.errors.twoFactorAuthenticatorCode}
                className="self-center"
                {...formik.getFieldProps('twoFactorAuthenticatorCode')}
              >
                {inputProps => (
                  <StyledInput
                    disabled={formik.isSubmitting}
                    as={StyledInput}
                    {...inputProps}
                    width={240}
                    minHeight={60}
                    fontSize="20px"
                    lineHeight="28px"
                    placeholder="123456"
                    pattern="[0-9]{6}"
                    inputMode="numeric"
                    minLength={6}
                    maxLength={6}
                    data-cy="add-two-factor-auth-totp-code-field"
                    onKeyDown={handleKeyDown}
                  />
                )}
              </StyledInputField>
            </div>
          </div>
        </ModalBody>
        <ModalFooter showDivider={false}>
          <Flex justifyContent="space-between">
            <Button disabled={formik.isSubmitting} variant="outline" onClick={props.onClose}>
              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
            </Button>
            <Button type="submit" loading={formik.isSubmitting} data-cy="add-two-factor-auth-totp-code-button">
              <FormattedMessage id="actions.verify" defaultMessage="Verify" />
            </Button>
          </Flex>
        </ModalFooter>
      </form>
    </StyledModal>
  );
}
