import React from 'react';
import PropTypes from 'prop-types';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import * as Sentry from '@sentry/browser';
import { toUpper } from 'lodash';
import { FormattedMessage } from 'react-intl';
import Turnstile from 'react-turnstile';

import { getEnvVar } from '../lib/env-utils';
import useRecaptcha from '../lib/hooks/useRecaptcha';
import { parseToBoolean } from '../lib/utils';

import { useToast } from './ui/useToast';
import { Box } from './Grid';
import StyledCheckbox from './StyledCheckbox';

const PROVIDERS = {
  HCAPTCHA: 'HCAPTCHA',
  RECAPTCHA: 'RECAPTCHA',
  TURNSTILE: 'TURNSTILE',
};

const CAPTCHA_PROVIDER = PROVIDERS[toUpper(getEnvVar('CAPTCHA_PROVIDER'))] || PROVIDERS.HCAPTCHA;

export const isCaptchaEnabled = () => {
  return parseToBoolean(getEnvVar('CAPTCHA_ENABLED'));
};

const ReCaptcha = ({ onVerify, onError, ...props }) => {
  const { verify } = useRecaptcha();
  const [loading, setLoading] = React.useState(false);
  const [verified, setVerified] = React.useState(false);
  const { toast } = useToast();
  const handleClick = async () => {
    setLoading(true);
    try {
      const token = await verify();
      if (token) {
        onVerify({ token });
        setVerified(true);
      }
    } catch (e) {
      toast({ variant: 'error', message: e.message });
      onError?.(e);
    }
    setLoading(false);
  };
  return (
    <StyledCheckbox
      checked={verified}
      onChange={handleClick}
      isLoading={loading}
      size={18}
      label={
        verified ? (
          <FormattedMessage id="Captcha.Button.Verified" defaultMessage="Verified Human." />
        ) : (
          <FormattedMessage id="Captcha.Button.Verify" defaultMessage="I'm not a Robot." />
        )
      }
      {...props}
      disabled={verified}
    />
  );
};

ReCaptcha.propTypes = {
  onVerify: PropTypes.func,
  onError: PropTypes.func,
};

const Captcha = React.forwardRef(({ onVerify, provider, ...props }, captchaRef) => {
  const HCAPTCHA_SITEKEY = getEnvVar('HCAPTCHA_SITEKEY');
  const RECAPTCHA_SITE_KEY = getEnvVar('RECAPTCHA_SITE_KEY');
  const TURNSTILE_SITE_KEY = getEnvVar('TURNSTILE_SITEKEY');
  const handleVerify = obj => {
    onVerify({ ...obj, provider });
  };
  const handleError = err => {
    Sentry.captureException(err);
  };

  React.useEffect(() => {
    onVerify(null);
  }, []);

  if (!isCaptchaEnabled()) {
    return null;
  }

  let captcha = null;
  if (provider === PROVIDERS.HCAPTCHA && HCAPTCHA_SITEKEY) {
    captcha = (
      <HCaptcha
        ref={captchaRef}
        sitekey={HCAPTCHA_SITEKEY}
        onVerify={token => handleVerify({ token })}
        onError={handleError}
      />
    );
  } else if (provider === PROVIDERS.RECAPTCHA && RECAPTCHA_SITE_KEY) {
    captcha = <ReCaptcha onVerify={handleVerify} onError={handleError} {...props} />;
  } else if (provider === PROVIDERS.TURNSTILE) {
    captcha = (
      <Turnstile
        sitekey={TURNSTILE_SITE_KEY}
        onVerify={token => handleVerify({ token })}
        onError={handleError}
        theme="light"
        {...props}
      />
    );
  }

  return <Box data-cy="captcha">{captcha}</Box>;
});

Captcha.displayName = 'Captcha';

Captcha.propTypes = {
  onVerify: PropTypes.func,
  provider: PropTypes.string,
};

Captcha.defaultProps = {
  provider: CAPTCHA_PROVIDER,
};

export default Captcha;
