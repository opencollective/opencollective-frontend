import { throttle } from 'lodash';

/**
 * We don't have much information about the robots invalidating our sign in tokens yet,
 * except that they use older versions of Chrome.
 */
export const isSuspiciousUserAgent = userAgent => {
  if (!userAgent) {
    return false;
  }

  const chromeVersionRegex = /Chrome\/(\d+)/;
  const regexResult = userAgent.match(chromeVersionRegex);
  if (!regexResult) {
    // Not Chrome
    return false;
  }

  const chromeVersion = parseInt(regexResult[1]);
  return chromeVersion <= 72;
};

/**
 * JS client-side robot detector
 */
export class RobotsDetector {
  static WATCHED_EVENTS = ['mousemove', 'keydown', 'touchstart'];

  constructor() {
    this.isListening = false;
    this.callback = null;
  }

  startListening(callback) {
    this.callback = callback;
    if (!this.isListening) {
      this.isListening = true;
      RobotsDetector.WATCHED_EVENTS.forEach(event => {
        document.addEventListener(event, this.watchEvent);
      });
    }
  }

  stopListening() {
    if (this.isListening) {
      this.isListening = false;
      RobotsDetector.WATCHED_EVENTS.forEach(event => {
        document.removeEventListener(event, this.watchEvent);
      });
    }
  }

  /**
   * Watch for human activity. As soon as something is detected, stop listening & call `callback`
   */
  watchEvent = throttle(
    () => {
      this.callback?.();
      this.stopListening();
    },
    1000,
    { trailing: false },
  );
}
