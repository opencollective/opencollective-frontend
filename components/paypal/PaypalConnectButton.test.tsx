import '@testing-library/jest-dom';

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { PayPalSupportedCurrencies } from '@/lib/constants/currency';
import { withRequiredProviders } from '../../test/providers';

import { PAYPAL_CONNECT_POPUP_MESSAGE } from './constants';
import PaypalConnectButton from './PaypalConnectButton';

const DEFAULT_AUTHORIZE_URL =
  'https://www.paypal.com/connect?client_id=test-client-id&redirect_uri=https%3A%2F%2Fexample.com%2Fredirect&flowEntry=static&response_type=code&scope=openid';

const mockGetPaypalOAuthUrl = jest.fn();
const mockConnectPaypalPayoutMethod = jest.fn();

jest.mock('@apollo/client', () => {
  const actual = jest.requireActual('@apollo/client');
  return {
    ...actual,
    useMutation: jest.fn((document: { definitions?: Array<{ name?: { value?: string } }> }) => {
      const name = document?.definitions?.[0]?.name?.value;
      if (name === 'GetPaypalOAuthUrl') {
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
  let mockPopup: { closed: boolean; close: jest.Mock; focus: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPopup = { closed: false, close: jest.fn(), focus: jest.fn() };
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
    });
  });

  describe('Popup opening', () => {
    it('calls window.open with the authorize URL from GraphQL', async () => {
      const user = userEvent.setup();

      renderButton();
      await user.click(screen.getByRole('button', { name: /connect paypal/i }));

      await waitFor(() => expect(window.open).toHaveBeenCalled());

      const [calledUrl, target] = (window.open as jest.Mock).mock.calls[0];
      expect(target).toBe('paypalConnect');
      expect(calledUrl).toBe(DEFAULT_AUTHORIZE_URL);
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

      expect(onError).not.toHaveBeenCalled();
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
