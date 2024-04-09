import React from 'react';
import { useIntl } from 'react-intl';

import { formatErrorMessage } from '../../lib/errors';
import { useTwoFactorAuthenticationPrompt } from '../../lib/two-factor-authentication/TwoFactorAuthenticationContext';

import StyledButton from '../../components/StyledButton';
import TwoFactorAuthPrompt from '../../components/two-factor-authentication/TwoFactorAuthenticationModal';

export default function TwoFactorAuthenticationPromptButton() {
  const intl = useIntl();
  const prompt = useTwoFactorAuthenticationPrompt();
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState();

  const openPrompt = React.useCallback(async () => {
    try {
      const code = await prompt.open({ supportedMethods: ['totp'] });
      setCode(JSON.stringify(code));
      setError(null);
    } catch (e) {
      setError(e);
      setCode('');
    }
  }, [prompt]);

  return (
    <React.Fragment>
      <StyledButton onClick={openPrompt}>Prompt For 2FA</StyledButton>
      <TwoFactorAuthPrompt />
      <div>{code}</div>
      {error && <div>{formatErrorMessage(intl, error)}</div>}
    </React.Fragment>
  );
}
