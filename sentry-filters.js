/** @typedef {import('@sentry/core').Event} SentryEvent */

/** URL patterns for browser extensions, user scripts, and other injected code. */
export const THIRD_PARTY_SCRIPT_URL_PATTERNS = [
  /extensions\//i,
  /^chrome:\/\//i,
  /^chrome-extension:\/\//i,
  /^moz-extension:\/\//i,
  /^safari-extension:\/\//i,
  /^safari-web-extension:\/\//i,
  /^ms-browser-extension:\/\//i,
  /^edge-extension:\/\//i,
  /^resource:\/\//i,
  /^about:/i,
  /userscript:/i,
  /greasemonkey/i,
  /tampermonkey/i,
];

/**
 * Returns true when a stack frame filename matches a known extension or injected-script URL.
 *
 * @param {string | undefined} url
 */
export function isThirdPartyScriptUrl(url) {
  if (!url) {
    return false;
  }

  return THIRD_PARTY_SCRIPT_URL_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * @param {SentryEvent} event
 */
function getStackFrames(event) {
  const exception = event?.exception?.values?.[0];
  return exception?.stacktrace?.frames?.filter(frame => frame.filename) ?? [];
}

/**
 * Returns true when a stack frame belongs to our application bundles.
 *
 * @param {import('@sentry/core').StackFrame} frame
 */
function isApplicationFrame(frame) {
  if (!frame.filename) {
    return false;
  }

  if (frame.filename.includes('/_next/') || frame.filename.includes('app://')) {
    return true;
  }

  if (frame.module_metadata) {
    return Object.keys(frame.module_metadata).some(key => key.startsWith('_sentryBundlerPluginAppKey:'));
  }

  return false;
}

/**
 * Fallback filter for browser extensions and injected scripts when build-time
 * module metadata is unavailable (e.g. local development).
 *
 * @param {SentryEvent} event
 */
export function isExtensionOrInjectedScriptError(event) {
  const frames = getStackFrames(event);
  if (frames.length === 0) {
    return false;
  }

  if (frames.some(isApplicationFrame)) {
    return false;
  }

  return frames.every(frame => isThirdPartyScriptUrl(frame.filename));
}
