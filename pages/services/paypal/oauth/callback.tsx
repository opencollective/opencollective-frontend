import React from 'react';

import { PAYPAL_CONNECT_POPUP_MESSAGE } from '@/components/paypal/constants';

/**
 * Minimal callback page for the "Log in with PayPal" popup flow.
 * PayPal redirects here after the user authorizes. The page reads the
 * authorization code from the URL, forwards it to the opener via postMessage,
 * and closes itself.
 */
const PaypalCallbackPage = () => {
  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Check current domain to redirect ngrok to localhost in development
    const url = new URL(window.location.href);
    const expectedHostname = process.env.HOSTNAME ?? 'localhost';
    if (process.env.NODE_ENV === 'development' && url.hostname !== expectedHostname) {
      url.hostname = expectedHostname;
      url.port = process.env.PORT?.toString() ?? '3000';
      url.protocol = 'http:';
      window.location.href = url.toString();
    } else {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (window.opener) {
        window.opener.postMessage(
          { type: PAYPAL_CONNECT_POPUP_MESSAGE, code: code ?? null, error: error ?? null },
          window.location.origin,
        );
        // window.close();
      }
    }
  }, []);

  return null;
};

// next.js export
// ts-unused-exports:disable-next-line
export default PaypalCallbackPage;
