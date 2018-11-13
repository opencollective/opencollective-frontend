import { getEnvVar, loadScriptAsync } from './utils';

const getRecaptchaSiteKey = () => getEnvVar('RECAPTCHA_SITE_KEY');

const getRecaptchaScriptUrl = () => {
  const apiKey = getRecaptchaSiteKey();
  if (!apiKey) {
    throw new Error("'RECAPTCHA_SITE_KEY' is undefined.");
  }
  return `https://www.google.com/recaptcha/api.js?render=${apiKey}`;
};

const loadRecaptcha = async () => {
  if (typeof window == 'undefined') {
    return;
  }
  if (typeof window.grecaptcha !== 'undefined') {
    return;
  }
  return loadScriptAsync(getRecaptchaScriptUrl());
};

const getRecaptcha = async () => {
  await loadRecaptcha();

  return window.grecaptcha;
};

export {
  getRecaptchaScriptUrl,
  loadRecaptcha,
  getRecaptcha,
  getRecaptchaSiteKey,
};
