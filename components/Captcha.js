import React from 'react';
import PropTypes from 'prop-types';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { FormattedMessage } from 'react-intl';

import { getEnvVar } from '../lib/env-utils';
import useRecaptcha from '../lib/hooks/useRecaptcha';
import { parseToBoolean } from '../lib/utils';

import { Box } from './Grid';
import StyledCheckbox from './StyledCheckbox';
import { TOAST_TYPE, useToasts } from './ToastProvider';

export const PROVIDERS = {
  HCAPTCHA: 'HCAPTCHA',
  RECAPTCHA: 'RECAPTCHA',
};

export const isCaptchaEnabled = () => {
  const HCAPTCHA_SITEKEY = getEnvVar('HCAPTCHA_SITEKEY');
  const RECAPTCHA_SITE_KEY = getEnvVar('RECAPTCHA_SITE_KEY');
  const RECAPTCHA_ENABLED = getEnvVar('RECAPTCHA_ENABLED');
  return HCAPTCHA_SITEKEY || (RECAPTCHA_SITE_KEY && parseToBoolean(RECAPTCHA_ENABLED));
};

const ReCaptcha = ({ onVerify, ...props }) => {
  const { verify } = useRecaptcha();
  const [loading, setLoading] = React.useState(false);
  const [verified, setVerified] = React.useState(false);
  const { addToast } = useToasts();
  const handleClick = async () => {
    setLoading(true);
    try {
      const token = await verify();
      if (token) {
        onVerify({ token });
        setVerified(true);
      }
    } catch (e) {
      addToast({ type: TOAST_TYPE.ERROR, message: e.message });
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
};

const Captcha = ({ onVerify, provider, ...props }) => {
  const HCAPTCHA_SITEKEY = getEnvVar('HCAPTCHA_SITEKEY');
  const RECAPTCHA_SITE_KEY = getEnvVar('RECAPTCHA_SITE_KEY');
  const RECAPTCHA_ENABLED = getEnvVar('RECAPTCHA_ENABLED');
  const handleVerify = obj => {
    onVerify({ ...obj, provider });
  };

  React.useEffect(() => {
    onVerify(null);
  }, []);

  let captcha = null;
  if (provider === PROVIDERS.HCAPTCHA && HCAPTCHA_SITEKEY) {
    captcha = <HCaptcha sitekey={HCAPTCHA_SITEKEY} onVerify={token => handleVerify({ token })} />;
  } else if (provider === PROVIDERS.RECAPTCHA && RECAPTCHA_SITE_KEY && RECAPTCHA_ENABLED) {
    captcha = <ReCaptcha onVerify={handleVerify} {...props} />;
  }
  return <Box data-cy="captcha">{captcha}</Box>;
};

Captcha.propTypes = {
  onVerify: PropTypes.func,
  provider: PropTypes.string,
};

Captcha.defaultProps = {
  provider: PROVIDERS.HCAPTCHA,
};

export default Captcha;
