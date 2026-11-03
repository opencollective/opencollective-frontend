import '@testing-library/jest-dom';

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { PayPalSupportedCurrencies } from '@/lib/constants/currency';
import { withRequiredProviders } from '../../test/providers';

import { PAYPAL_CONNECT_POPUP_MESSAGE } from './constants';
import PaypalConnectButton from './PaypalConnectButton';

// Mirrors the URL built by the API (`getRedirectUrl` in `opencollective-api/server/paymentProviders/paypal/index.ts`)
const DEFAULT_AUTHORIZE_URL = `https://www.paypal.com/connect?${new URLSearchParams([
  ['flowEntry', 'static'],
  ['client_id', 'test-client-id'],
  ['response_type', 'code'],
  ['scope', 'openid profile email https://uri.paypal.com/services/paypalattributes'],
  ['redirect_uri', 'https://example.com/redirect'],
  ['state', 'test-state'],
])}`;

const mockGetPaypalOAuthUrl = jest.fn();
const mockConnectPaypalPayoutMethod = jest.fn();

jest.mock('@apollo/client', () => {
  const actual = jest.requireActual('@apollo/client');
  return {
    ...actual,
    useMutation: jest.fn((document: { definitions?: Array<{ name?: { value?: string } }> }) => {
      const name = document?.definitions?.[0]?.name?.value;
      if (name === 'PaypalOAuthUrl') {
        return [mockGetPaypalOAuthUrl, { loading: false }];
      }
      return [mockConnectPaypalPayoutMethod, { loading: false }];
    }),
  };
});

const mockToast = jest.fn();
jest.mock('../ui/useToast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

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

/** Valid OAuth state JWT for tests (matches format from API) */
const TEST_STATE = 'eyJhbGciOiJIUzI1NiJ9.eyJDb2xsZWN0aXZlSWQiOjEsInVzZXJJZCI6MX0.test';

describe('PaypalConnectButton', () => {
  let mockPopup: { closed: boolean; close: jest.Mock; focus: jest.Mock; location: { href: string } };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPopup = { closed: false, close: jest.fn(), focus: jest.fn(), location: { href: 'about:blank' } };
    jest.spyOn(window, 'open').mockReturnValue(mockPopup as unknown as Window);
    mockGetPaypalOAuthUrl.mockResolvedValue({ data: { getPaypalOAuthUrl: DEFAULT_AUTHORIZE_URL } });
    mockConnectPaypalPayoutMethod.mockResolvedValue({
      data: {
        connectPaypalPayoutMethod: {
          connectedAccount: { id: 'ca-123' },
          payoutMethod: { id: 'pm-456' },
        },
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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

  describe('OAuth URL errors', () => {
    it('calls onError when getPaypalOAuthUrl rejects', async () => {
      const user = userEvent.setup();
      const onError = jest.fn();
      mockGetPaypalOAuthUrl.mockRejectedValue(new Error('Network failure'));

      renderButton({ onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
      expect(window.open).not.toHaveBeenCalled();
    });

    it('calls onError with "not available" message when OAuth URL is missing', async () => {
      const user = userEvent.setup();
      const onError = jest.fn();
      mockGetPaypalOAuthUrl.mockResolvedValue({ data: { getPaypalOAuthUrl: null } });

      renderButton({ onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'PayPal Connect is not available at the moment.' }),
        );
      });
      expect(window.open).not.toHaveBeenCalled();
    });
  });

  describe('Popup opening', () => {
    it('does not open any window until the OAuth URL is received, so the 2FA prompt is never hidden', async () => {
      const user = userEvent.setup();
      let resolveOAuthUrl: (value: unknown) => void;
      mockGetPaypalOAuthUrl.mockReturnValue(new Promise(resolve => (resolveOAuthUrl = resolve)));

      renderButton();
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));

      // The OAuth URL request can trigger a 2FA prompt: no window must be opened on top of it
      expect(mockGetPaypalOAuthUrl).toHaveBeenCalledTimes(1);
      expect(window.open).not.toHaveBeenCalled();

      await act(async () => resolveOAuthUrl({ data: { getPaypalOAuthUrl: DEFAULT_AUTHORIZE_URL } }));
      await waitFor(() => expect(window.open).toHaveBeenCalledTimes(1));
      const [calledUrl, target] = (window.open as jest.Mock).mock.calls[0];
      expect(calledUrl).toBe(DEFAULT_AUTHORIZE_URL);
      expect(target).toBe('paypalConnect');
    });

    it('shows the popup overlay dialog after opening the popup', async () => {
      const user = userEvent.setup();

      renderButton();
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));

      await waitFor(() => {
        expect(screen.getByText(/don't see the paypal login window/i)).toBeInTheDocument();
      });
    });

    describe('when the browser blocks the popup', () => {
      it('asks the user to continue, then opens the popup from that click', async () => {
        const user = userEvent.setup();
        const onError = jest.fn();
        const openSpy = jest.spyOn(window, 'open').mockReturnValueOnce(null);

        renderButton({ onError });
        await user.click(screen.getByRole('button', { name: /connect paypal/i }));

        await waitFor(() => {
          expect(screen.getByText(/continue to paypal to connect your account/i)).toBeInTheDocument();
        });
        expect(mockToast).not.toHaveBeenCalled();

        openSpy.mockReturnValue(mockPopup as unknown as Window);
        await user.click(screen.getByRole('button', { name: /click to continue/i }));

        expect(openSpy).toHaveBeenCalledTimes(2);
        expect(openSpy.mock.calls[1][0]).toBe(DEFAULT_AUTHORIZE_URL);
        await waitFor(() => {
          expect(screen.getByText(/don't see the paypal login window/i)).toBeInTheDocument();
        });

        simulatePopupMessage({ type: PAYPAL_CONNECT_POPUP_MESSAGE, code: 'auth-code', state: TEST_STATE });
        await waitFor(() => {
          expect(DEFAULT_PROPS.onSuccess).toHaveBeenCalledWith({
            connectedAccountId: 'ca-123',
            payoutMethodId: 'pm-456',
          });
        });
        expect(onError).not.toHaveBeenCalled();
      });

      it('does not try to open the popup when the user activation has expired', async () => {
        const user = userEvent.setup();
        Object.defineProperty(window.navigator, 'userActivation', {
          configurable: true,
          value: { isActive: false, hasBeenActive: true },
        });

        try {
          renderButton();
          await user.click(screen.getByRole('button', { name: /connect paypal/i }));

          await waitFor(() => {
            expect(screen.getByText(/continue to paypal to connect your account/i)).toBeInTheDocument();
          });
          expect(window.open).not.toHaveBeenCalled();
        } finally {
          delete (window.navigator as { userActivation?: unknown }).userActivation;
        }
      });

      it('shows an error toast and keeps the overlay open when the popup is still blocked after clicking', async () => {
        const user = userEvent.setup();
        const onError = jest.fn();
        jest.spyOn(window, 'open').mockReturnValue(null);

        renderButton({ onError });
        await user.click(screen.getByRole('button', { name: /connect paypal/i }));
        await user.click(await screen.findByRole('button', { name: /click to continue/i }));

        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }));
        });
        expect(screen.getByText(/continue to paypal to connect your account/i)).toBeInTheDocument();
        expect(onError).not.toHaveBeenCalled();
      });

      it('cancels the flow when the X button is clicked', async () => {
        const user = userEvent.setup();
        const onError = jest.fn();
        jest.spyOn(window, 'open').mockReturnValue(null);

        renderButton({ onError });
        await user.click(screen.getByRole('button', { name: /connect paypal/i }));
        await user.click(await screen.findByRole('button', { name: /cancel/i }));

        await waitFor(() => {
          expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'PayPal login was cancelled' }));
        });
        expect(screen.queryByText(/continue to paypal to connect your account/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Message event handling', () => {
    it('calls connectPaypalPayoutMethod and then onSuccess when the popup sends a valid auth code and state', async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();

      renderButton({ onSuccess });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      simulatePopupMessage({
        type: PAYPAL_CONNECT_POPUP_MESSAGE,
        code: 'auth_code_123',
        state: TEST_STATE,
      });

      await waitFor(() => {
        expect(mockConnectPaypalPayoutMethod).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalledWith({ connectedAccountId: 'ca-123', payoutMethodId: 'pm-456' });
      });
    });

    it('sends code, state, account, currency, payoutMethod, and name to GraphQL', async () => {
      const user = userEvent.setup();

      renderButton({ payoutMethodId: 'pm-existing', alias: 'My PayPal' });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      simulatePopupMessage({
        type: PAYPAL_CONNECT_POPUP_MESSAGE,
        code: 'auth_code_123',
        state: TEST_STATE,
      });

      await waitFor(() => expect(mockConnectPaypalPayoutMethod).toHaveBeenCalled());
      expect(mockGetPaypalOAuthUrl).toHaveBeenCalledWith({
        variables: { account: { id: 'account-123' }, currency: 'USD' },
      });
      expect(mockConnectPaypalPayoutMethod).toHaveBeenCalledWith({
        variables: {
          code: 'auth_code_123',
          state: TEST_STATE,
          account: { id: 'account-123' },
          currency: 'USD',
          name: 'My PayPal',
          payoutMethod: { id: 'pm-existing' },
        },
      });
    });

    it('calls onError when the popup sends code without state', async () => {
      const user = userEvent.setup();
      const onError = jest.fn();

      renderButton({ onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      simulatePopupMessage({ type: PAYPAL_CONNECT_POPUP_MESSAGE, code: 'auth_code_123' });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'PayPal did not return a valid OAuth state. Please try again.',
          }),
        );
      });
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

      await new Promise(resolve => setTimeout(resolve, 50));
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it('ignores same-origin messages with an unrelated type', async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();
      const onError = jest.fn();

      renderButton({ onSuccess, onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: window.location.origin,
            data: { type: 'UNRELATED_MESSAGE', code: 'auth_code_123', state: 'some_state' },
          }),
        );
      });

      await new Promise(resolve => setTimeout(resolve, 50));
      expect(mockConnectPaypalPayoutMethod).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it('closes the popup overlay after receiving a valid auth code and state', async () => {
      const user = userEvent.setup();

      renderButton();
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      simulatePopupMessage({
        type: PAYPAL_CONNECT_POPUP_MESSAGE,
        code: 'auth_code_123',
        state: TEST_STATE,
      });

      await waitFor(() => {
        expect(screen.queryByText(/don't see the paypal login window/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('GraphQL connect errors', () => {
    it('calls onError when connectPaypalPayoutMethod rejects', async () => {
      const user = userEvent.setup();
      const onError = jest.fn();
      mockConnectPaypalPayoutMethod.mockRejectedValue(new Error('Invalid authorization code'));

      renderButton({ onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      simulatePopupMessage({
        type: PAYPAL_CONNECT_POPUP_MESSAGE,
        code: 'bad_code',
        state: TEST_STATE,
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('Popup closed before completing auth', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('calls onError with "cancelled" message when the user closes the popup', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const onError = jest.fn();

      renderButton({ onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      mockPopup.closed = true;

      act(() => jest.advanceTimersByTime(600));
      act(() => jest.runAllTimers());

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'PayPal login was cancelled' }));
      });
    });

    it('does NOT call onError if popup closes after a successful auth', async () => {
      jest.useRealTimers();
      const user = userEvent.setup();
      const onSuccess = jest.fn();
      const onError = jest.fn();

      renderButton({ onSuccess, onError });
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));
      await waitFor(() => screen.getByText(/don't see the paypal login window/i));

      simulatePopupMessage({
        type: PAYPAL_CONNECT_POPUP_MESSAGE,
        code: 'auth_code_123',
        state: TEST_STATE,
      });
      await waitFor(() => expect(onSuccess).toHaveBeenCalled());

      expect(onError).not.toHaveBeenCalled();
    });
  });

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
