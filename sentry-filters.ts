import type { Event, StackFrame } from '@sentry/browser';

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
 * Non-Error promise rejections thrown by an injected assistive-writing browser extension
 * (word prediction, dictation, math OCR...). They are plain strings without a stack trace,
 * so the frame-based filters cannot catch them. Example values:
 * - `Request timeout nn-NO_wordsDistributor.getValue`
 * - `Request timeout isDictateAvailable`
 */
export const EXTENSION_REQUEST_TIMEOUT_REJECTION_PATTERN =
  /^Non-Error promise rejection captured with value: Request timeout [\w-]+(\.getValue|Available)$/;

/**
 * Returns true when a stack frame filename matches a known extension or injected-script URL.
 */
export function isThirdPartyScriptUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  return THIRD_PARTY_SCRIPT_URL_PATTERNS.some(pattern => pattern.test(url));
}

function getStackFrames(event: Event): StackFrame[] {
  const exception = event?.exception?.values?.[0];
  return exception?.stacktrace?.frames?.filter(frame => frame.filename) ?? [];
}

/**
 * Returns true when a stack frame belongs to our application bundles.
 */
function isApplicationFrame(frame: StackFrame): boolean {
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
 */
export function isExtensionOrInjectedScriptError(event: Event): boolean {
  const frames = getStackFrames(event);
  if (frames.length === 0) {
    return false;
  }

  if (frames.some(isApplicationFrame)) {
    return false;
  }

  return frames.every(frame => isThirdPartyScriptUrl(frame.filename));
}
