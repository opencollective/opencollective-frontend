import React from 'react';
import PropTypes from 'prop-types';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { FormattedMessage } from 'react-intl';

import { getEnvVar } from '../lib/env-utils';
import useRecaptcha from '../lib/hooks/useRecaptcha';

import { Box } from './Grid';
import StyledButton from './StyledButton';
import { TOAST_TYPE, useToasts } from './ToastProvider';

const isTrue = str => str === 'true' || str === 'TRUE' || str === '1';

export const PROVIDERS = {
  HCAPTCHA: 'HCAPTCHA',
  RECAPTCHA: 'RECAPTCHA',
};

export const isCaptchaEnabled = () => {
  const HCAPTCHA_SITEKEY = getEnvVar('HCAPTCHA_SITEKEY');
  const RECAPTCHA_SITE_KEY = getEnvVar('RECAPTCHA_SITE_KEY');
  const RECAPTCHA_ENABLED = getEnvVar('RECAPTCHA_ENABLED');
  return HCAPTCHA_SITEKEY || (RECAPTCHA_SITE_KEY && isTrue(RECAPTCHA_ENABLED));
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
    <StyledButton
      loading={loading}
      onClick={handleClick}
      {...props}
      disabled={verified}
      buttonStyle={verified ? 'success' : 'primary'}
    >
      {verified ? (
        <FormattedMessage id="Captcha.Button.Verified" defaultMessage="Verified Human." />
      ) : (
        <FormattedMessage id="Captcha.Button.Verify" defaultMessage="I'm not a Robot." />
      )}
    </StyledButton>
  );
};

ReCaptcha.propTypes = {
  onVerify: PropTypes.function,
};

const Captcha = ({ onVerify, provider, ...props }) => {
  const HCAPTCHA_SITEKEY = getEnvVar('HCAPTCHA_SITEKEY');
  const RECAPTCHA_SITE_KEY = getEnvVar('RECAPTCHA_SITE_KEY');
  const RECAPTCHA_ENABLED = getEnvVar('RECAPTCHA_ENABLED');
  const handleVerify = obj => {
    onVerify({ ...obj, provider });
  };

  let captcha = null;
  if (provider === PROVIDERS.HCAPTCHA && HCAPTCHA_SITEKEY) {
    captcha = <HCaptcha sitekey={HCAPTCHA_SITEKEY} onVerify={token => handleVerify({ token })} />;
  } else if (provider === PROVIDERS.RECAPTCHA && RECAPTCHA_SITE_KEY && RECAPTCHA_ENABLED) {
    captcha = <ReCaptcha onVerify={handleVerify} {...props} />;
  }
  return <Box data-cy="captcha">{captcha}</Box>;
};

Captcha.propTypes = {
  onVerify: PropTypes.function,
  provider: PropTypes.string,
};

Captcha.defaultProps = {
  provider: PROVIDERS.HCAPTCHA,
};

export default Captcha;
