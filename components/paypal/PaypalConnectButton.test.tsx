import '@testing-library/jest-dom';

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as api from '../../lib/api';
import type { PayPalSupportedCurrencies } from '@/lib/constants/currency';
import { withRequiredProviders } from '../../test/providers';

import { PAYPAL_CONNECT_POPUP_MESSAGE } from './constants';
import PaypalConnectButton from './PaypalConnectButton';

jest.mock('../../lib/api', () => ({
  getPaypalConnectConfig: jest.fn(),
  addAuthTokenToHeader: jest.fn(() => ({ Authorization: 'Bearer test-token' })),
}));

const mockToast = jest.fn();
jest.mock('../ui/useToast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const DEFAULT_CONFIG = {
  clientId: 'test-client-id',
  redirectUri: 'https://example.com/redirect',
  authorizeUrl: 'https://www.paypal.com/connect',
};

const DEFAULT_PROPS = {
  accountId: 'account-123',
  currency: 'USD' as (typeof PayPalSupportedCurrencies)[number],
  onSuccess: jest.fn(),
  onError: jest.fn(),
};

const renderButton = (props: Partial<React.ComponentProps<typeof PaypalConnectButton>> = {}) =>
  render(withRequiredProviders(<PaypalConnectButton {...DEFAULT_PROPS} {...props} />));

/** Simulates the popup posting back a message to the opener window */
const simulatePopupMessage = (data: Record<string, unknown>) => {
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: window.location.origin,
        data,
      }),
    );
  });
};

describe('PaypalConnectButton', () => {
  let mockPopup: { closed: boolean; close: jest.Mock; focus: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPopup = { closed: false, close: jest.fn(), focus: jest.fn() };
    jest.spyOn(window, 'open').mockReturnValue(mockPopup as unknown as Window);
    (api.getPaypalConnectConfig as jest.Mock).mockResolvedValue(DEFAULT_CONFIG);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ connectedAccountId: 'ca-123', payoutMethodId: 'pm-456' }),
    } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── Rendering ────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders a "Connect PayPal" button', () => {
      renderButton();
      expect(screen.getByRole('button', { name: /connect paypal/i })).toBeInTheDocument();
    });

    it('disables the button when the disabled prop is true', () => {
      renderButton({ disabled: true });
      expect(screen.getByRole('button', { name: /connect paypal/i })).toBeDisabled();
    });

    it('does not render the popup overlay on initial load', () => {
      renderButton();
      expect(screen.queryByText(/don't see the paypal login window/i)).not.toBeInTheDocument();
    });
  });

  // ─── Config fetch errors ───────────────────────────────────────────────────

  describe('Config fetch errors', () => {
    it('calls onError when getPaypalConnectConfig rejects', async () => {
      const user = userEvent.setup();
      const onError = jest.fn();
      (api.getPaypalConnectConfig as jest.Mock).mockRejectedValue(new Error('Network failure'));

      renderButton({ onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Network failure' }));
      });
    });

    it('calls onError with "not available" message when config is null', async () => {
      const user = userEvent.setup();
      const onError = jest.fn();
      (api.getPaypalConnectConfig as jest.Mock).mockResolvedValue(null);

      renderButton({ onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'PayPal Connect is not available at the moment.' }),
        );
      });
    });

    it('calls onError with "not available" message when clientId is missing', async () => {
      const user = userEvent.setup();
      const onError = jest.fn();
      (api.getPaypalConnectConfig as jest.Mock).mockResolvedValue({
        redirectUri: DEFAULT_CONFIG.redirectUri,
        authorizeUrl: DEFAULT_CONFIG.authorizeUrl,
      });

      renderButton({ onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'PayPal Connect is not available at the moment.' }),
        );
      });
    });

    it('calls onError with "not available" message when redirectUri is missing', async () => {
      const user = userEvent.setup();
      const onError = jest.fn();
      (api.getPaypalConnectConfig as jest.Mock).mockResolvedValue({
        clientId: DEFAULT_CONFIG.clientId,
        authorizeUrl: DEFAULT_CONFIG.authorizeUrl,
      });

      renderButton({ onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'PayPal Connect is not available at the moment.' }),
        );
      });
    });
  });

  // ─── Popup opening ────────────────────────────────────────────────────────

  describe('Popup opening', () => {
    it('calls window.open with the correct PayPal URL parameters', async () => {
      const user = userEvent.setup();

      renderButton();
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));

      await waitFor(() => expect(window.open).toHaveBeenCalled());

      const [calledUrl, target] = (window.open as jest.Mock).mock.calls[0];
      const url = new URL(calledUrl as string);
      expect(target).toBe('paypalConnect');
      expect(url.origin + url.pathname).toBe(DEFAULT_CONFIG.authorizeUrl);
      expect(url.searchParams.get('client_id')).toBe(DEFAULT_CONFIG.clientId);
      expect(url.searchParams.get('redirect_uri')).toBe(DEFAULT_CONFIG.redirectUri);
      expect(url.searchParams.get('flowEntry')).toBe('static');
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('scope')).toContain('openid');
    });

    it('shows the popup overlay dialog after opening the popup', async () => {
      const user = userEvent.setup();

      renderButton();
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));

      await waitFor(() => {
        expect(screen.getByText(/don't see the paypal login window/i)).toBeInTheDocument();
      });
    });

    it('shows an error toast when popup is blocked (window.open returns null)', async () => {
      const user = userEvent.setup();
      jest.spyOn(window, 'open').mockReturnValue(null);
      const onError = jest.fn();

      renderButton({ onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }));
      });

      // The overlay is still shown when popup is null. Cancel it to clean up the
      // message listener so it doesn't bleed into subsequent tests.
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'PayPal login was cancelled' }));
      });
    });
  });

  // ─── Message event handling ───────────────────────────────────────────────

  describe('Message event handling', () => {
    it('calls fetch and then onSuccess when the popup sends a valid auth code', async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();

      renderButton({ onSuccess });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      simulatePopupMessage({ type: PAYPAL_CONNECT_POPUP_MESSAGE, code: 'auth_code_123' });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/connected-accounts/paypal/connect',
          expect.objectContaining({ method: 'POST' }),
        );
        expect(onSuccess).toHaveBeenCalledWith({ connectedAccountId: 'ca-123', payoutMethodId: 'pm-456' });
      });
    });

    it('sends accountId, currency, payoutMethodId, and alias in the request body', async () => {
      const user = userEvent.setup();

      renderButton({ payoutMethodId: 'pm-existing', alias: 'My PayPal' });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      simulatePopupMessage({ type: PAYPAL_CONNECT_POPUP_MESSAGE, code: 'auth_code_123' });

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.code).toBe('auth_code_123');
      expect(body.accountId).toBe('account-123');
      expect(body.currency).toBe('USD');
      expect(body.payoutMethodId).toBe('pm-existing');
      expect(body.name).toBe('My PayPal');
    });

    it('calls onError when the popup sends an error message', async () => {
      const user = userEvent.setup();
      const onError = jest.fn();

      renderButton({ onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      simulatePopupMessage({ type: PAYPAL_CONNECT_POPUP_MESSAGE, error: 'access_denied' });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'access_denied' }));
      });
    });

    it('calls onError with "did not return an authorization code" when message has neither code nor error', async () => {
      const user = userEvent.setup();
      const onError = jest.fn();

      renderButton({ onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      simulatePopupMessage({ type: PAYPAL_CONNECT_POPUP_MESSAGE });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'PayPal did not return an authorization code' }),
        );
      });
    });

    it('ignores messages originating from a different origin', async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();
      const onError = jest.fn();

      renderButton({ onSuccess, onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: 'https://malicious.example.com',
            data: { type: PAYPAL_CONNECT_POPUP_MESSAGE, code: 'stolen_code' },
          }),
        );
      });

      // Neither callback should be triggered by a cross-origin message
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it('ignores messages with a different type than PAYPAL_CONNECT_POPUP_MESSAGE', async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();

      renderButton({ onSuccess });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      simulatePopupMessage({ type: 'UNRELATED_MESSAGE', code: 'auth_code' });

      await new Promise(resolve => setTimeout(resolve, 50));
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('closes the popup overlay after receiving a valid auth code', async () => {
      const user = userEvent.setup();

      renderButton();
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      simulatePopupMessage({ type: PAYPAL_CONNECT_POPUP_MESSAGE, code: 'auth_code_123' });

      await waitFor(() => {
        expect(screen.queryByText(/don't see the paypal login window/i)).not.toBeInTheDocument();
      });
    });
  });

  // ─── API fetch errors ─────────────────────────────────────────────────────

  describe('API fetch errors', () => {
    it('calls onError with the JSON error message when fetch returns a non-ok response', async () => {
      const user = userEvent.setup();
      const onError = jest.fn();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: { message: 'Invalid authorization code' } }),
      } as Response);

      renderButton({ onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      simulatePopupMessage({ type: PAYPAL_CONNECT_POPUP_MESSAGE, code: 'bad_code' });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid authorization code' }));
      });
    });

    it('falls back to statusText when the error response has no message', async () => {
      const user = userEvent.setup();
      const onError = jest.fn();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
      } as Response);

      renderButton({ onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      simulatePopupMessage({ type: PAYPAL_CONNECT_POPUP_MESSAGE, code: 'auth_code_123' });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Internal Server Error' }));
      });
    });

    it('calls onError when fetch rejects entirely (network error)', async () => {
      const user = userEvent.setup();
      const onError = jest.fn();
      global.fetch = jest.fn().mockRejectedValue(new Error('fetch failed'));

      renderButton({ onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      simulatePopupMessage({ type: PAYPAL_CONNECT_POPUP_MESSAGE, code: 'auth_code_123' });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'fetch failed' }));
      });
    });
  });

  // ─── Popup closed before auth ─────────────────────────────────────────────

  describe('Popup closed before completing auth', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('calls onError with "cancelled" message when the user closes the popup', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const onError = jest.fn();

      renderButton({ onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      // Simulate user closing the popup window
      mockPopup.closed = true;

      act(() => jest.advanceTimersByTime(600)); // Trigger the 500ms poll
      act(() => jest.runAllTimers()); // Flush the nested setTimeout(0)

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'PayPal login was cancelled' }));
      });
    });

    it('does NOT call onError if popup closes after a successful auth', async () => {
      jest.useRealTimers(); // Use real timers for this test since it involves a successful flow
      const user = userEvent.setup();
      const onSuccess = jest.fn();
      const onError = jest.fn();

      renderButton({ onSuccess, onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      // Successful auth via message (sets hadSuccess.current = true)
      simulatePopupMessage({ type: PAYPAL_CONNECT_POPUP_MESSAGE, code: 'auth_code_123' });
      await waitFor(() => expect(onSuccess).toHaveBeenCalled());

      // Popup closes after success — should not trigger an error
      expect(onError).not.toHaveBeenCalled();
    });
  });

  // ─── Popup overlay interactions ────────────────────────────────────────────

  describe('Popup overlay', () => {
    it('calls onError with "cancelled" and hides the overlay when the X button is clicked', async () => {
      const user = userEvent.setup();
      const onError = jest.fn();

      renderButton({ onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'PayPal login was cancelled' }));
        expect(screen.queryByText(/don't see the paypal login window/i)).not.toBeInTheDocument();
      });
    });

    it('focuses the popup window when "Click to Continue" is clicked', async () => {
      const user = userEvent.setup();

      renderButton();
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      await user.click(screen.getByText(/click to continue/i));

      expect(mockPopup.focus).toHaveBeenCalled();
    });

    it('cancels the flow when the Escape key is pressed while the overlay is open', async () => {
      const user = userEvent.setup();
      const onError = jest.fn();

      renderButton({ onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'PayPal login was cancelled' }));
      });
    });
  });
});
