import { loadScriptAsync } from './utils';
import { getEnvVar } from './env-utils';

const getRecaptchaSiteKey = () => getEnvVar('RECAPTCHA_SITE_KEY');

const getRecaptchaScriptUrl = () => {
  const apiKey = getRecaptchaSiteKey();
  if (!apiKey) {
    throw new Error("'RECAPTCHA_SITE_KEY' is undefined.");
  }
  return `https://www.google.com/recaptcha/api.js?render=${apiKey}`;
};

const RECAPTCHA_SCRIPT_ID = 'recaptcha';

const loadRecaptcha = async () => {
  if (typeof window == 'undefined') {
    return;
  }
  if (typeof window.grecaptcha !== 'undefined') {
    return;
  }
  return loadScriptAsync(getRecaptchaScriptUrl(), { attrs: { id: RECAPTCHA_SCRIPT_ID } });
};

const getRecaptcha = async () => {
  await loadRecaptcha();

  return window.grecaptcha;
};

const unloadRecaptcha = () => {
  if (typeof window == 'undefined') {
    return;
  }

  // Remove widget
  const widget = document.querySelector('.grecaptcha-badge');
  if (widget) {
    widget.remove();
  }

  // Remove script
  const script = document.getElementById(RECAPTCHA_SCRIPT_ID);
  if (script) {
    script.remove();
  }

  // Remove global instance
  delete window.grecaptcha;
};

export { getRecaptchaScriptUrl, loadRecaptcha, getRecaptcha, getRecaptchaSiteKey, unloadRecaptcha };
