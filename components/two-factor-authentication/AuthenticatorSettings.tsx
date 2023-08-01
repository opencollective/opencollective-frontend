import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { useFormik } from 'formik';
import { CheckCircle2Icon, CircleIcon } from 'lucide-react';
import QRCode from 'qrcode.react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import speakeasy from 'speakeasy';
import styled from 'styled-components';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { Individual, TwoFactorMethod, UserTwoFactorMethod } from '../../lib/graphql/types/v2/graphql';

import { Box, Flex } from '../Grid';
import Image from '../Image';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import { H3, P } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

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
  mutation addAuthenticatorAppToIndividual($account: AccountReferenceInput!, $token: String!) {
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

const RemoveTwoFactorAuthTokenFromIndividualMutation = gql`
  mutation removeTwoFactorAuthTokenFromIndividual($account: AccountReferenceInput!) {
    removeTwoFactorAuthTokenFromIndividual(account: $account, type: TOTP) {
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
  }
`;

type AuthenticatorSettingsProps = {
  userTwoFactorAuthenticationMethods: UserTwoFactorMethod[];
  individual: Pick<Individual, 'id' | 'email'>;
  onRecoveryCodes: (recoveryCodes: string[]) => void;
};

export function AuthenticatorSettings(props: AuthenticatorSettingsProps) {
  const { addToast } = useToasts();
  const intl = useIntl();
  const authenticatorMethod = props.userTwoFactorAuthenticationMethods.find(m => m.method === TwoFactorMethod.TOTP);

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

  const [removeAuthenticatorAppMutation, removeResult] = useMutation(RemoveTwoFactorAuthTokenFromIndividualMutation, {
    context: API_V2_CONTEXT,
    variables: {
      account: {
        id: props.individual.id,
      },
    },
  });

  const deleteAuthenticatorApp = React.useCallback(async () => {
    try {
      await removeAuthenticatorAppMutation();
      addToast({
        type: TOAST_TYPE.SUCCESS,
        message: <FormattedMessage defaultMessage="Authenticator removed" />,
      });
    } catch (e) {
      addToast({
        type: TOAST_TYPE.ERROR,
        message: i18nGraphqlException(intl, e),
      });
    }
  }, []);

  const formik = useFormik({
    initialValues: {
      twoFactorAuthenticatorCode: '',
    },
    async onSubmit() {
      try {
        const result = await addAuthenticatorAppMutation();
        addToast({
          type: TOAST_TYPE.SUCCESS,
          message: <FormattedMessage defaultMessage="Authenticator added" />,
        });

        if (result.data.addTwoFactorAuthTokenToIndividual.recoveryCodes) {
          props.onRecoveryCodes(result.data.addTwoFactorAuthTokenToIndividual.recoveryCodes);
        }
      } catch (e) {
        addToast({
          type: TOAST_TYPE.ERROR,
          message: i18nGraphqlException(intl, e),
        });
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

  return (
    <StyledCard px={3} py={2}>
      <Flex alignItems="center">
        <Box mr={3}>{authenticatorMethod ? <CheckCircle2Icon color="#0EA755" /> : <CircleIcon />}</Box>
        <H3 fontSize="14px" fontWeight="700">
          {authenticatorMethod ? (
            <FormattedMessage defaultMessage="Authenticator App" />
          ) : (
            <FormattedMessage defaultMessage="Authenticator App not setup yet" />
          )}
        </H3>
      </Flex>
      <Box>
        {authenticatorMethod ? (
          <React.Fragment>
            <Flex alignItems="center">
              <Box flex="0 0 183px">
                <Image src="/static/images/lock-green.png" width={183} height={183} alt="" />
              </Box>
              <Box flex="1 1 223px" pr="9px">
                <P fontSize="20px" fontWeight="500">
                  <FormattedMessage
                    id="TwoFactorAuth.Setup.AlreadyAdded"
                    defaultMessage="Two-factor authentication (2FA) is enabled on this account. Well done! 🎉"
                  />
                </P>
              </Box>
            </Flex>
            <StyledButton
              loading={removeResult.loading}
              buttonSize="small"
              buttonStyle="dangerSecondary"
              onClick={deleteAuthenticatorApp}
            >
              <FormattedMessage id="actions.delete" defaultMessage="Delete" />
            </StyledButton>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Box>
              <Flex gap="20px">
                <Flex justifyContent="center">
                  <QRCode value={otpAuthUrl} renderAs="svg" size={128} level="L" includeMargin data-cy="qr-code" />
                </Flex>
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
              </Flex>
              <form onSubmit={formik.handleSubmit}>
                <Flex gap="20px" alignItems="center">
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
                      />
                    )}
                  </StyledInputField>
                  <Box mt={3}>
                    <StyledButton
                      type="submit"
                      loading={formik.isSubmitting}
                      buttonSize="small"
                      buttonStyle="secondary"
                    >
                      <FormattedMessage id="actions.verify" defaultMessage="Verify" />
                    </StyledButton>
                  </Box>
                </Flex>
              </form>
            </Box>
          </React.Fragment>
        )}
      </Box>
    </StyledCard>
  );
}
