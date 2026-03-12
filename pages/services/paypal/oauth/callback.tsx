import React from 'react';

import { PAYPAL_CONNECT_POPUP_MESSAGE } from '@/components/paypal/constants';

/** Location-like object with the properties used by the callback logic */
export interface PaypalCallbackLocation {
  href: string;
  search: string;
  origin: string;
  hostname: string;
  port: string;
  protocol: string;
}

/**
 * Processes the PayPal OAuth callback: reads code/error from the URL and
 * posts them to the opener via postMessage. Extracted for testability.
 */
export function processPaypalCallback(
  location: PaypalCallbackLocation,
  opener: Window | null,
): void {
  // Check current domain to redirect ngrok to localhost in development
  const url = new URL(location.href);
  const expectedHostname = process.env.HOSTNAME ?? 'localhost';
  if (process.env.NODE_ENV === 'development' && url.hostname !== expectedHostname) {
    url.hostname = expectedHostname;
    url.port = process.env.PORT?.toString() ?? '3000';
    url.protocol = 'http:';
    if (typeof window !== 'undefined') {
      window.location.href = url.toString();
    }
  } else {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (opener) {
      opener.postMessage(
        { type: PAYPAL_CONNECT_POPUP_MESSAGE, code: code ?? null, error: error ?? null },
        location.origin,
      );
    }
  }
}

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
    processPaypalCallback(
      {
        href: window.location.href,
        search: window.location.search,
        origin: window.location.origin,
        hostname: window.location.hostname,
        port: window.location.port,
        protocol: window.location.protocol,
      },
      window.opener,
    );
  }, []);

  return null;
};

// next.js export
// ts-unused-exports:disable-next-line
export default PaypalCallbackPage;
