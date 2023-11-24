import React from 'react';
import * as simplewebauthn from '@simplewebauthn/browser';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import { createGlobalStyle } from 'styled-components';

import { createError, ERROR } from '../../lib/errors';
import { onPressEnter } from '../../lib/form-utils';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import {
  getFromLocalStorage,
  LOCAL_STORAGE_KEYS,
  removeFromLocalStorage,
  setLocalStorage,
} from '../../lib/local-storage';
import { useTwoFactorAuthenticationPrompt } from '../../lib/two-factor-authentication/TwoFactorAuthenticationContext';
import { getSettingsRoute } from '../../lib/url-helpers';

import { Box, Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledLinkButton from '../StyledLinkButton';
import StyledModal, { Modal, ModalFooter, ModalHeader } from '../StyledModal';
import { P } from '../Text';
import { useToast } from '../ui/useToast';

const HideOtherModalsGlobalStyle = createGlobalStyle`
  ${Modal} {
    &:not(.twofactor-modal) {
      opacity: 0;
    }
  }
`;

function initialMethod(supportedMethods: string[]) {
  if (!supportedMethods) {
    return null;
  }
  if (supportedMethods.length === 1) {
    return supportedMethods[0];
  }

  const preferredMethod = getFromLocalStorage(LOCAL_STORAGE_KEYS.PREFERRED_TWO_FACTOR_METHOD);
  return (
    supportedMethods.find(method => method === preferredMethod) ||
    supportedMethods.find(method => method !== 'recovery_code')
  );
}

export default function TwoFactorAuthenticationModal() {
  const { toast } = useToast();
  const { LoggedInUser } = useLoggedInUser();

  const prompt = useTwoFactorAuthenticationPrompt();
  const isOpen = prompt?.isOpen ?? false;
  const supportedMethods = React.useMemo(() => {
    return (prompt?.supportedMethods ?? []).filter(method => {
      return method !== 'recovery_code' || prompt?.allowRecovery;
    });
  }, [prompt?.supportedMethods, prompt.allowRecovery]);

  const cancellable = !prompt.isRequired;

  const [selectedMethod, setSelectedMethod] = React.useState(initialMethod(supportedMethods));
  const [twoFactorCode, setTwoFactorCode] = React.useState('');
  const [confirming, setConfirming] = React.useState(false);

  React.useEffect(() => {
    if (supportedMethods.length > 0) {
      setSelectedMethod(initialMethod(supportedMethods));
    }
  }, [supportedMethods]);

  const useWebAuthn = React.useCallback(async () => {
    setLocalStorage(LOCAL_STORAGE_KEYS.PREFERRED_TWO_FACTOR_METHOD, 'webauthn');
    setConfirming(true);
    setTwoFactorCode('');
    try {
      const authenticationResponse = await simplewebauthn.startAuthentication(prompt.authenticationOptions.webauthn);
      const base64AuthenticationResponse = Buffer.from(JSON.stringify(authenticationResponse), 'utf8').toString(
        'base64',
      );

      prompt.resolveAuth({
        type: 'webauthn',
        code: base64AuthenticationResponse,
      });
    } catch (e) {
      toast({ variant: 'error', message: e.message });
      return;
    } finally {
      setConfirming(false);
    }
  }, [prompt]);

  const closeModal = () => {
    removeFromLocalStorage(LOCAL_STORAGE_KEYS.TWO_FACTOR_AUTH_TOKEN);
    window.location.reload();
  };

  const cancel = React.useCallback(() => {
    setTwoFactorCode('');
    setConfirming(false);
    setSelectedMethod(null);
    prompt.rejectAuth(createError(ERROR.TWO_FACTOR_AUTH_CANCELED));
  }, []);

  const confirm = React.useCallback(() => {
    const code = twoFactorCode;
    setConfirming(true);
    setTwoFactorCode('');
    setSelectedMethod(null);

    if (selectedMethod !== 'recovery_code') {
      setLocalStorage(LOCAL_STORAGE_KEYS.PREFERRED_TWO_FACTOR_METHOD, selectedMethod);
    }

    prompt.resolveAuth({
      type: selectedMethod,
      code,
    });

    setConfirming(false);
  }, [twoFactorCode, supportedMethods, selectedMethod]);

  const router = useRouter();

  React.useEffect(() => {
    const handleRouteChange = () => {
      cancel();
    };
    router.events.on('routeChangeStart', handleRouteChange);
    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, [cancel]);

  const verifyBtnEnabled =
    supportedMethods.length > 0 &&
    ((selectedMethod === 'recovery_code' && twoFactorCode?.length > 0) ||
      (selectedMethod === 'totp' && twoFactorCode?.length === 6) ||
      selectedMethod === 'webauthn');

  const alternativeMethods = supportedMethods.filter(method => method !== selectedMethod);

  if (!isOpen) {
    return null;
  }

  return (
    <StyledModal
      trapFocus
      preventClose={!cancellable}
      onClose={cancel}
      width={495}
      className="twofactor-modal"
      zindex="90000"
    >
      <HideOtherModalsGlobalStyle />
      <ModalHeader hideCloseIcon>
        {supportedMethods.length === 0 ? (
          <FormattedMessage defaultMessage="You must configure 2FA to access this feature" />
        ) : (
          <FormattedMessage defaultMessage="Two Factor Authentication" />
        )}
      </ModalHeader>
      <Box mt={3}>
        {supportedMethods.length === 0 && (
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

        {selectedMethod === 'recovery_code' && (
          <RecoveryCodeOptions value={twoFactorCode} onChange={setTwoFactorCode} disabled={confirming} />
        )}

        {selectedMethod === 'totp' && (
          <AuthenticatorOption
            value={twoFactorCode}
            onChange={setTwoFactorCode}
            supportedMethods={supportedMethods}
            disabled={confirming}
            onSubmit={confirm}
          />
        )}

        {selectedMethod === 'webauthn' && <WebauthnOption />}
      </Box>

      {supportedMethods.length > 1 && (
        <Box mt={4}>
          <FormattedMessage defaultMessage="You can also use alternative methods:" />
          <ul className="list-inside list-disc">
            {alternativeMethods.includes('totp') && (
              <li>
                <StyledLinkButton onClick={() => setSelectedMethod('totp')}>
                  <FormattedMessage defaultMessage="Authenticator Code" />
                </StyledLinkButton>
              </li>
            )}
            {alternativeMethods.includes('webauthn') && (
              <li>
                <StyledLinkButton onClick={() => setSelectedMethod('webauthn')}>
                  <FormattedMessage defaultMessage="U2F (Hardware Key, Passkey, Phone, etc)" />
                </StyledLinkButton>
              </li>
            )}
            {alternativeMethods.includes('recovery_code') && (
              <li>
                <StyledLinkButton onClick={() => setSelectedMethod('recovery_code')}>
                  <FormattedMessage defaultMessage="Recovery code" />
                </StyledLinkButton>
              </li>
            )}
          </ul>
        </Box>
      )}

      <ModalFooter isFullWidth dividerMargin="0.65rem 0">
        <Flex justifyContent="right" flexWrap="wrap">
          <StyledButton disabled={confirming} mr={2} minWidth={120} onClick={closeModal}>
            <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
          </StyledButton>
          <StyledButton
            ml={2}
            minWidth={120}
            buttonStyle="primary"
            loading={confirming}
            disabled={!verifyBtnEnabled}
            onClick={selectedMethod === 'webauthn' ? useWebAuthn : confirm}
          >
            {selectedMethod === 'recovery_code' ? (
              <FormattedMessage id="login.twoFactorAuth.reset" defaultMessage="Reset 2FA" />
            ) : (
              <FormattedMessage id="actions.verify" defaultMessage="Verify" />
            )}
          </StyledButton>
        </Flex>
      </ModalFooter>
    </StyledModal>
  );
}

function AuthenticatorOption(props: {
  value: string;
  onChange: (string) => void;
  onSubmit?: () => void;
  supportedMethods: string[];
  disabled: boolean;
}) {
  return (
    <Box>
      <FormattedMessage
        id="TwoFactorAuth.Setup.Form.InputLabel"
        defaultMessage="Please enter your 6-digit code without any dashes."
      />

      <StyledInput
        id="2fa-code-input"
        name="2fa-code-input"
        type="text"
        mt={3}
        minHeight={50}
        fontSize="20px"
        placeholder={'123456'}
        pattern={'[0-9]{6}'}
        inputMode="numeric"
        value={props.value}
        onKeyUp={onPressEnter(props.onSubmit)}
        onChange={e => props.onChange(e.target.value)}
        disabled={props.disabled}
        autoFocus
      />
    </Box>
  );
}

function RecoveryCodeOptions(props: { value: string; onChange: (string) => void; disabled: boolean }) {
  return (
    <Box>
      <FormattedMessage
        id="TwoFactorAuth.RecoveryCodes.Form.InputLabel"
        defaultMessage="Please enter one of your alphanumeric recovery codes."
      />
      <StyledInput
        id="2fa-code-input"
        name="2fa-code-input"
        type="text"
        mt={3}
        placeholder="ABCDEFGHIJKLM123"
        minHeight={50}
        fontSize="20px"
        value={props.value}
        onChange={e => props.onChange(e.target.value)}
        disabled={props.disabled}
        autoFocus
      />
    </Box>
  );
}

function WebauthnOption() {
  return (
    <Box>
      <FormattedMessage defaultMessage="Use your device for two factor authentication" />
    </Box>
  );
}
