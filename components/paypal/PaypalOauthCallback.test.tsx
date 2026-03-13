import '@testing-library/jest-dom';

import React from 'react';
import { render } from '@testing-library/react';

import { PAYPAL_CONNECT_POPUP_MESSAGE } from '@/components/paypal/constants';

import PaypalCallbackPage, {
  type PaypalCallbackLocation,
  processPaypalCallback,
} from '../../pages/services/paypal/oauth/callback';

const mockLocation = (search: string): PaypalCallbackLocation => {
  const url = new URL(`http://localhost:3000/services/paypal/oauth/callback${search}`);
  return {
    href: url.href,
    search: url.search,
    origin: url.origin,
    hostname: url.hostname,
    port: url.port,
    protocol: url.protocol,
  };
};

describe('PaypalCallbackPage', () => {
  it('renders without throwing', () => {
    expect(() => render(<PaypalCallbackPage />)).not.toThrow();
  });
});

describe('processPaypalCallback', () => {
  let mockPostMessage: jest.Mock;
  let mockOpener: { postMessage: jest.Mock };

  beforeEach(() => {
    mockPostMessage = jest.fn();
    mockOpener = { postMessage: mockPostMessage };
  });

  it('calls postMessage with code when URL has code param and opener exists', () => {
    processPaypalCallback(mockLocation('?code=auth_code_123'), mockOpener as unknown as Window);

    expect(mockPostMessage).toHaveBeenCalledWith(
      { type: PAYPAL_CONNECT_POPUP_MESSAGE, code: 'auth_code_123', error: null },
      'http://localhost:3000',
    );
  });

  it('calls postMessage with error when URL has error param and opener exists', () => {
    processPaypalCallback(mockLocation('?error=access_denied'), mockOpener as unknown as Window);

    expect(mockPostMessage).toHaveBeenCalledWith(
      { type: PAYPAL_CONNECT_POPUP_MESSAGE, code: null, error: 'access_denied' },
      'http://localhost:3000',
    );
  });

  it('calls postMessage with null code and error when URL has neither and opener exists', () => {
    processPaypalCallback(mockLocation('?state=xyz'), mockOpener as unknown as Window);

    expect(mockPostMessage).toHaveBeenCalledWith(
      { type: PAYPAL_CONNECT_POPUP_MESSAGE, code: null, error: null },
      'http://localhost:3000',
    );
  });

  it('does not throw when window.opener is null', () => {
    expect(() => processPaypalCallback(mockLocation('?code=abc'), null)).not.toThrow();
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it('does not call postMessage when window.opener is undefined', () => {
    processPaypalCallback(mockLocation('?code=abc'), undefined as unknown as Window);
    expect(mockPostMessage).not.toHaveBeenCalled();
  });
});
