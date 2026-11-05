import { isExtensionOrInjectedScriptError, isThirdPartyScriptUrl } from '../../sentry-filters';

describe('sentry-filters', () => {
  describe('isThirdPartyScriptUrl', () => {
    it('matches browser extension URLs', () => {
      expect(isThirdPartyScriptUrl('chrome-extension://abc123/content.js')).toBe(true);
      expect(isThirdPartyScriptUrl('moz-extension://abc123/content.js')).toBe(true);
      expect(isThirdPartyScriptUrl('safari-web-extension://abc123/content.js')).toBe(true);
    });

    it('does not match application URLs', () => {
      expect(isThirdPartyScriptUrl('https://opencollective.com/_next/static/chunks/main.js')).toBe(false);
      expect(isThirdPartyScriptUrl('https://js.stripe.com/v3/')).toBe(false);
    });
  });

  describe('isExtensionOrInjectedScriptError', () => {
    it('returns false when the stack contains application frames', () => {
      const event = {
        exception: {
          values: [
            {
              stacktrace: {
                frames: [
                  { filename: 'chrome-extension://abc/content.js' },
                  { filename: 'https://opencollective.com/_next/static/chunks/pages/_app.js' },
                ],
              },
            },
          ],
        },
      };

      expect(isExtensionOrInjectedScriptError(event)).toBe(false);
    });

    it('returns true when all frames are from extensions or injected scripts', () => {
      const event = {
        exception: {
          values: [
            {
              stacktrace: {
                frames: [
                  { filename: 'chrome-extension://abc/content.js' },
                  { filename: 'moz-extension://xyz/userscript.js' },
                ],
              },
            },
          ],
        },
      };

      expect(isExtensionOrInjectedScriptError(event)).toBe(true);
    });

    it('returns false when there is no stack trace', () => {
      expect(isExtensionOrInjectedScriptError({ exception: { values: [{}] } })).toBe(false);
    });
  });
});
