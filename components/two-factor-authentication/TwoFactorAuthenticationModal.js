import React from 'react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { createError, ERROR } from '../../lib/errors';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { useTwoFactorAuthenticationPrompt } from '../../lib/two-factor-authentication/TwoFactorAuthenticationContext';
import { getSettingsRoute } from '../../lib/url-helpers';

import { Box, Flex } from '../Grid';
import { getI18nLink, I18nSupportLink } from '../I18nFormatters';
import Link from '../Link';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledModal, { ModalFooter, ModalHeader } from '../StyledModal';
import { Label, P } from '../Text';

export default function TwoFactorAuthenticationModal() {
  const { LoggedInUser } = useLoggedInUser();
  const [twoFactorCode, setTwoFactorCode] = React.useState('');
  const [confirming, setConfirming] = React.useState(false);
  const [isUsingRecoveryCode, setIsUsingRecoveryCode] = React.useState(false);

  const prompt = useTwoFactorAuthenticationPrompt();
  const isOpen = prompt?.isOpen ?? false;
  const supportedMethods = prompt?.supportedMethods ?? [];
  const hasYubikeyOTP = supportedMethods.includes('yubikey_otp');
  const hasRecoveryCodeOption = supportedMethods.includes('recovery_code');
  const has2FAConfigured = supportedMethods.length > 0;
  const cancellable = !supportedMethods.includes('recovery_code');

  React.useEffect(() => {
    setIsUsingRecoveryCode(false);
  }, [supportedMethods]);

  const cancel = React.useCallback(() => {
    if (!cancellable) {
      return;
    }
    setTwoFactorCode('');
    setConfirming(false);
    prompt.rejectAuth(createError(ERROR.TWO_FACTOR_AUTH_CANCELED));
  }, [cancellable]);

  const confirm = React.useCallback(() => {
    const code = twoFactorCode;
    setConfirming(true);
    setTwoFactorCode('');

    let type = 'totp';
    if (hasYubikeyOTP && code.length === 44) {
      type = 'yubikey_otp';
    }

    if (isUsingRecoveryCode) {
      type = 'recovery_code';
    }

    prompt.resolveAuth({
      type,
      code,
    });
    setConfirming(false);
  }, [twoFactorCode, hasYubikeyOTP, isUsingRecoveryCode]);

  const router = useRouter();

  React.useEffect(() => {
    const handleRouteChange = () => {
      cancel();
    };

    router.events.on('routeChangeStart', handleRouteChange);

    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, [cancel]);

  React.useEffect(() => {
    if (hasYubikeyOTP && twoFactorCode.length === 44) {
      confirm();
    }
  }, [confirm, twoFactorCode, hasYubikeyOTP]);

  const header = has2FAConfigured ? (
    isUsingRecoveryCode ? (
      <FormattedMessage defaultMessage="Reset 2FA using a recovery code" />
    ) : (
      <FormattedMessage defaultMessage="Verify using the 2FA code" />
    )
  ) : (
    <FormattedMessage defaultMessage="You must configure 2FA to access this feature" />
  );

  const label = isUsingRecoveryCode ? (
    <FormattedMessage
      id="TwoFactorAuth.RecoveryCodes.Form.InputLabel"
      defaultMessage="Please enter one of your alphanumeric recovery codes."
    />
  ) : hasYubikeyOTP ? (
    <FormattedMessage
      id="TwoFactorAuth.Setup.Form.InputLabel.YubiKey"
      defaultMessage="Please enter your 6-digit code without any dashes or select the input below, plug your YubiKey and press it to generate a code."
    />
  ) : (
    <FormattedMessage
      id="TwoFactorAuth.Setup.Form.InputLabel"
      defaultMessage="Please enter your 6-digit code without any dashes."
    />
  );

  const placeholder = isUsingRecoveryCode ? '' : hasYubikeyOTP ? '123456 or YubiKey: cccc...' : '123456';
  const pattern = !isUsingRecoveryCode && !hasYubikeyOTP && '[0-9]{6}';
  const verifyBtnEnabled =
    has2FAConfigured &&
    ((isUsingRecoveryCode && twoFactorCode?.length > 0) ||
      (hasYubikeyOTP && twoFactorCode?.length === 44) ||
      twoFactorCode?.length === 6);

  const buttonLabel = isUsingRecoveryCode ? (
    <FormattedMessage id="login.twoFactorAuth.reset" defaultMessage="Reset 2FA" />
  ) : (
    <FormattedMessage id="actions.verify" defaultMessage="Verify" />
  );

  if (isOpen) {
    return (
      <StyledModal onClose={cancel} trapFocus maxWidth={495}>
        <ModalHeader hideCloseIcon>{header}</ModalHeader>
        {has2FAConfigured ? (
          <Flex mt={2} flexDirection="column">
            <Label htmlFor="2fa-code-input" fontWeight="normal" as="label" mb={2}>
              {label}
            </Label>
            <StyledInput
              id="2fa-code-input"
              name="2fa-code-input"
              type="text"
              minHeight={50}
              fontSize="20px"
              placeholder={placeholder}
              pattern={pattern}
              inputMode="numeric"
              value={twoFactorCode}
              onChange={e => setTwoFactorCode(e.target.value)}
              disabled={confirming}
              onKeyDown={event => {
                if (event.key === 'Enter' && twoFactorCode?.length === 6) {
                  event.preventDefault();
                  confirm();
                }
              }}
              autoFocus
            />
            {hasRecoveryCodeOption && !isUsingRecoveryCode && (
              <Box mt={4}>
                <P fontWeight="bold" fontSize={14} mb={1} textAlign="left" display="block">
                  <FormattedMessage id="login.twoFactorAuth.havingTrouble" defaultMessage="Having trouble?" />
                </P>
                <StyledButton
                  type="button"
                  buttonSize="tiny"
                  isBorderless
                  buttonStyle="secondary"
                  mb={3}
                  onClick={() => setIsUsingRecoveryCode(true)}
                >
                  <P>
                    <FormattedMessage
                      id="login.twoFactorAuth.useRecoveryCodes"
                      defaultMessage="Use 2FA recovery codes."
                    />
                  </P>
                </StyledButton>
              </Box>
            )}
            {isUsingRecoveryCode && (
              <Box mt={4} mb={3}>
                <P>
                  <FormattedMessage
                    id="login.twoFactorAuth.support"
                    defaultMessage="If you can't login with 2FA or recovery codes, please contact <SupportLink>support</SupportLink>."
                    values={{
                      SupportLink: I18nSupportLink,
                    }}
                  />
                </P>
              </Box>
            )}
          </Flex>
        ) : (
          <Flex mt={2} flexDirection="column">
            <P fontWeight="normal" as="label" mb={4}>
              <FormattedMessage
                defaultMessage="To enable Two-Factor Authentication (2FA), follow the steps <link>here</link>"
                values={{
                  link: getI18nLink({
                    href: getSettingsRoute(LoggedInUser.collective, 'user-security'),
                    as: Link,
                  }),
                }}
              />
            </P>
          </Flex>
        )}
        <ModalFooter isFullWidth dividerMargin="1rem 0">
          <Flex justifyContent="right" flexWrap="wrap">
            {cancellable && (
              <StyledButton disabled={confirming} mr={2} minWidth={120} onClick={cancel}>
                <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
              </StyledButton>
            )}
            <StyledButton
              ml={2}
              minWidth={120}
              buttonStyle="primary"
              loading={confirming}
              disabled={!verifyBtnEnabled}
              onClick={confirm}
            >
              {buttonLabel}
            </StyledButton>
          </Flex>
        </ModalFooter>
      </StyledModal>
    );
  }

  return null;
}
