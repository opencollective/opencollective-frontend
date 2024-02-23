import React from 'react';
import { useMutation } from '@apollo/client';
import { useFormik } from 'formik';
import { CheckCircle2Icon, CircleIcon, PlusIcon } from 'lucide-react';
import QRCode from 'qrcode.react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import speakeasy from 'speakeasy';
import styled from 'styled-components';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import type { Individual, UserTwoFactorMethod } from '../../lib/graphql/types/v2/graphql';
import { TwoFactorMethod } from '../../lib/graphql/types/v2/graphql';

import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import { H3, P } from '../Text';
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
  },
  REQUIRED: {
    defaultMessage: 'Required',
  },
});

const TokenBox = styled(Box)`
  overflow-wrap: break-word;
  word-wrap: break-word;
`;

const Code = styled.code`
  background: ${props => props.theme.colors.black[100]};
  color: ${props => props.theme.colors.black[700]};
  word-break: break-all;
  display: block;
  margin-top: 8px;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #4d4f51;
  max-width: 350px;
`;

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
      <Flex alignItems="center">
        <Box mr={3}>{userTwoFactorMethods.length > 0 ? <CheckCircle2Icon color="#0EA755" /> : <CircleIcon />}</Box>
        <H3 fontSize="14px" fontWeight="700">
          <FormattedMessage defaultMessage="Authenticator App" />
        </H3>
      </Flex>
      <div className="mb-3 text-sm">
        <FormattedMessage defaultMessage="An application that supports TOTP (time-based one-time password). For example, Google Authenticator and 1Password." />
      </div>
      <Box>
        {userTwoFactorMethods.map(device => {
          return (
            <Box className="border-b last:border-b-0" mx={4} key={device.id} data-cy="authenticator-2fa-method">
              <UserTwoFactorMethodItem individual={props.individual} userTwoFactorMethod={device} />
            </Box>
          );
        })}
      </Box>
      {userTwoFactorMethods.length === 0 && (
        <Box mt={3}>
          <StyledButton
            onClick={() => setIsAddingAuthenticator(true)}
            buttonSize="tiny"
            buttonStyle="secondary"
            display="flex"
          >
            <FormattedMessage defaultMessage="Add authenticator" /> <PlusIcon size="14px" />
          </StyledButton>
        </Box>
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
          message: <FormattedMessage defaultMessage="Authenticator added" />,
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
        <FormattedMessage defaultMessage="Add authenticator" />
      </ModalHeader>
      <form onSubmit={formik.handleSubmit}>
        <ModalBody>
          <Box>
            <Flex gap="20px">
              <Flex justifyContent="center">
                <QRCode value={otpAuthUrl} renderAs="svg" size={128} level="L" includeMargin data-cy="qr-code" />
              </Flex>
              <Box>
                <TokenBox data-cy="manual-entry-2fa-token">
                  <P>
                    <FormattedMessage
                      id="TwoFactorAuth.Setup.ManualEntry"
                      defaultMessage="Manual entry: {token}"
                      values={{
                        token: <Code>{base32}</Code>,
                      }}
                    />
                  </P>
                </TokenBox>
                <Box mt={4}>
                  <StyledInputField
                    required
                    mt={2}
                    mb={3}
                    label={<FormattedMessage defaultMessage="Enter your code without any dashes" />}
                    htmlFor="twoFactorAuthenticatorCode"
                    error={formik.touched.twoFactorAuthenticatorCode && formik.errors.twoFactorAuthenticatorCode}
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
                </Box>
              </Box>
            </Flex>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Flex justifyContent="space-between">
            <StyledButton disabled={formik.isSubmitting} buttonStyle="danger" onClick={props.onClose}>
              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
            </StyledButton>
            <StyledButton
              type="submit"
              loading={formik.isSubmitting}
              buttonStyle="secondary"
              data-cy="add-two-factor-auth-totp-code-button"
            >
              <FormattedMessage id="actions.verify" defaultMessage="Verify" />
            </StyledButton>
          </Flex>
        </ModalFooter>
      </form>
    </StyledModal>
  );
}
