import config from 'config';
import debug from 'debug';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

const recaptchaVerifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
const recaptchaSecretKey = config.recaptcha.secretKey;
const recaptchaDebug = debug('recaptcha');

async function recaptchaVerify(recaptchaToken, remoteIp) {
  const method = 'POST';

  const body = new URLSearchParams();
  body.set('secret', recaptchaSecretKey);
  body.set('response', recaptchaToken);
  body.set('remoteip', remoteIp);

  try {
    const response = await fetch(recaptchaVerifyUrl, { method, body });
    const result = await response.json();
    recaptchaDebug(result);
    return result;
  } catch (err) {
    recaptchaDebug(err);
  }
}

export default {
  verify: recaptchaVerify,
};
