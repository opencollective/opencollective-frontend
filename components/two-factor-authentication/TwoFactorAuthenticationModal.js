import React from 'react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { createError, ERROR } from '../../lib/errors';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { useTwoFactorAuthenticationPrompt } from '../../lib/two-factor-authentication/TwoFactorAuthenticationContext';
import { getSettingsRoute } from '../../lib/url-helpers';

import { Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledModal, { ModalFooter, ModalHeader } from '../StyledModal';
import { Label, P } from '../Text';

export default function TwoFactorAuthenticationModal() {
  const { LoggedInUser } = useLoggedInUser();
  const [twoFactorCode, setTwoFactorCode] = React.useState('');
  const [confirming, setConfirming] = React.useState(false);
  const prompt = useTwoFactorAuthenticationPrompt();

  const cancel = React.useCallback(() => {
    setTwoFactorCode('');
    setConfirming(false);
    prompt.rejectAuth(createError(ERROR.TWO_FACTOR_AUTH_CANCELED));
  }, []);

  const confirm = React.useCallback(() => {
    const code = twoFactorCode;
    setConfirming(true);
    setTwoFactorCode('');
    prompt.resolveAuth({
      type: 'totp',
      code,
    });
    setConfirming(false);
  }, [twoFactorCode]);

  const router = useRouter();

  React.useEffect(() => {
    const handleRouteChange = () => {
      cancel();
    };

    router.events.on('routeChangeStart', handleRouteChange);

    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, [cancel]);

  if (prompt?.isOpen) {
    const has2FAConfigured = prompt.supportedMethods.length > 0;

    return (
      <StyledModal onClose={cancel} trapFocus maxWidth={495}>
        <ModalHeader hideCloseIcon>
          {has2FAConfigured ? (
            <FormattedMessage defaultMessage="Verify using the 2FA code" />
          ) : (
            <FormattedMessage defaultMessage="You must configure 2FA to access this feature" />
          )}
        </ModalHeader>
        {has2FAConfigured ? (
          <Flex mt={2} flexDirection="column">
            <Label htmlFor="2fa-code-input" fontWeight="normal" as="label" mb={2}>
              <FormattedMessage
                id="TwoFactorAuth.Setup.Form.InputLabel"
                defaultMessage="Please enter your 6-digit code without any dashes."
              />
            </Label>
            <StyledInput
              id="2fa-code-input"
              name="2fa-code-input"
              type="text"
              minHeight={50}
              fontSize="20px"
              placeholder="123456"
              pattern="[0-9]{6}"
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
            <StyledButton disabled={confirming} mr={2} minWidth={120} onClick={cancel}>
              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
            </StyledButton>
            <StyledButton
              ml={2}
              minWidth={120}
              buttonStyle="primary"
              loading={confirming}
              disabled={!has2FAConfigured || twoFactorCode?.length !== 6}
              onClick={confirm}
            >
              <FormattedMessage id="actions.verify" defaultMessage="Verify" />
            </StyledButton>
          </Flex>
        </ModalFooter>
      </StyledModal>
    );
  }

  return null;
}
