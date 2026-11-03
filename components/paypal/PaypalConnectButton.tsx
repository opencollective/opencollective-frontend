import React from 'react';
import { gql, useMutation } from '@apollo/client';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { PayPalSupportedCurrencies } from '@/lib/constants/currency';
import { i18nGraphqlException } from '@/lib/errors';
import type {
  ConnectPaypalPayoutMethodMutation,
  ConnectPaypalPayoutMethodMutationVariables,
  Currency,
  PaypalOAuthUrlMutation,
  PaypalOAuthUrlMutationVariables,
} from '@/lib/graphql/types/v2/graphql';
import { cn } from '@/lib/utils';

import PayPalIcon from '../icons/PayPal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';

import { PAYPAL_CONNECT_POPUP_MESSAGE } from './constants';

const getPaypalOAuthUrlMutation = gql`
  mutation PaypalOAuthUrl($account: AccountReferenceInput!, $currency: Currency) {
    getPaypalOAuthUrl(account: $account, currency: $currency)
  }
`;

const connectPaypalPayoutMethodMutation = gql`
  mutation ConnectPaypalPayoutMethod(
    $code: NonEmptyString!
    $state: NonEmptyString!
    $account: AccountReferenceInput!
    $currency: Currency!
    $name: String
    $payoutMethod: PayoutMethodReferenceInput
  ) {
    connectPaypalPayoutMethod(
      code: $code
      state: $state
      account: $account
      currency: $currency
      name: $name
      payoutMethod: $payoutMethod
    ) {
      connectedAccount {
        id
      }
      payoutMethod {
        id
      }
    }
  }
`;

const openPaypalPopup = (authorizeUrl: string): Window | null => {
  const width = Math.min(500, window.outerWidth);
  const height = Math.min(700, window.outerHeight);
  const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
  const top = Math.round(window.screenY + (window.outerHeight - height) / 2);

  return window.open(authorizeUrl, 'paypalConnect', `popup=1,width=${width},height=${height},left=${left},top=${top}`);
};

/**
 * Browsers only allow popups shortly after a user interaction (transient activation). When we know it
 * has expired (e.g. the user spent time in the 2FA prompt), we skip `window.open` to avoid triggering
 * the browser's "popup blocked" notice. Safari doesn't use this signal for popups, so callers must
 * still handle `window.open` returning null.
 */
const mayOpenPopupWithoutClick = (): boolean => {
  return typeof navigator === 'undefined' || !navigator.userActivation || navigator.userActivation.isActive;
};

type OverlayState = 'popupOpen' | 'popupBlocked' | null;

/**
 * Renders a "Connect PayPal" button that opens the "Log in with PayPal" flow
 * in a mini-browser popup (no fullPage param). On approval, the popup posts
 * the auth code back to this window; we then exchange it via GraphQL.
 */
const PaypalConnectButton = ({
  accountId,
  payoutMethodId,
  currency,
  disabled,
  loading,
  alias,
  onSuccess,
  onError,
  className = undefined,
}: {
  accountId: string;
  /** When editing, pass its ID here */
  payoutMethodId?: string;
  currency: (typeof PayPalSupportedCurrencies)[number];
  disabled?: boolean;
  loading?: boolean;
  alias?: string;
  onSuccess: (result: { connectedAccountId: string; payoutMethodId: string }) => void;
  onError: (err: Error) => void;
  className?: Parameters<typeof cn>[0];
}) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [overlayState, setOverlayState] = React.useState<OverlayState>(null);
  const hadSuccess = React.useRef(false);
  const popupRef = React.useRef<Window | null>(null);
  const cancelRef = React.useRef<(() => void) | null>(null);
  const openPopupFromClickRef = React.useRef<(() => void) | null>(null);

  const [getPaypalOAuthUrl] = useMutation<PaypalOAuthUrlMutation, PaypalOAuthUrlMutationVariables>(
    getPaypalOAuthUrlMutation,
  );
  const [connectPaypalPayoutMethod] = useMutation<
    ConnectPaypalPayoutMethodMutation,
    ConnectPaypalPayoutMethodMutationVariables
  >(connectPaypalPayoutMethodMutation);

  const showPopupBlockedToast = () => {
    toast({
      variant: 'error',
      message: intl.formatMessage(
        { defaultMessage: 'Failed to open {service}. Please allow popups for this site.', id: 'l5AoL3' },
        { service: 'PayPal' },
      ),
    });
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      hadSuccess.current = false;
      // Fetch the URL before opening any window: this request may trigger a 2FA prompt, which must not be
      // hidden behind the PayPal popup. See https://github.com/opencollective/opencollective/issues/9050
      const oauthResult = await getPaypalOAuthUrl({
        variables: {
          account: { id: accountId },
          currency: currency as Currency,
        },
      });
      const authorizeUrl = oauthResult.data?.getPaypalOAuthUrl;
      if (!authorizeUrl) {
        throw new Error('PayPal Connect is not available at the moment.');
      }

      const { code, state } = await new Promise<{ code: string; state: string }>((resolve, reject) => {
        let closedPoll: ReturnType<typeof setInterval> | null = null;

        const cleanup = () => {
          cancelRef.current = null;
          openPopupFromClickRef.current = null;
          setOverlayState(null);
          window.removeEventListener('message', onMessage);
          if (closedPoll) {
            clearInterval(closedPoll);
          }
          const popup = popupRef.current;
          popupRef.current = null;
          if (popup && !popup.closed) {
            popup.close();
          }
        };

        cancelRef.current = () => {
          cleanup();
          reject(new Error('PayPal login was cancelled'));
        };

        const onMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin || event.data?.type !== PAYPAL_CONNECT_POPUP_MESSAGE) {
            return;
          }
          cleanup();
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else if (event.data.code && event.data.state) {
            resolve({ code: event.data.code, state: event.data.state });
          } else if (event.data.code) {
            reject(new Error('PayPal did not return a valid OAuth state. Please try again.'));
          } else {
            reject(new Error('PayPal did not return an authorization code'));
          }
        };

        const watchPopup = (popup: Window) => {
          popupRef.current = popup;
          setOverlayState('popupOpen');
          closedPoll = setInterval(() => {
            if (popup.closed) {
              cleanup();
              setTimeout(() => {
                if (!hadSuccess.current) {
                  reject(new Error('PayPal login was cancelled'));
                }
              });
            }
          }, 500);
        };

        // Must be called from a click handler, so that the browser lets the popup through
        openPopupFromClickRef.current = () => {
          const popup = openPaypalPopup(authorizeUrl);
          if (popup) {
            watchPopup(popup);
          } else {
            showPopupBlockedToast();
          }
        };

        window.addEventListener('message', onMessage);

        // Try to open the popup right away. If the browser blocks it (the click that started the flow is too old,
        // e.g. after a 2FA prompt), the overlay asks the user to click again to open it.
        const popup = mayOpenPopupWithoutClick() ? openPaypalPopup(authorizeUrl) : null;
        if (popup) {
          watchPopup(popup);
        } else {
          setOverlayState('popupBlocked');
        }
      });

      const connectResult = await connectPaypalPayoutMethod({
        variables: {
          code,
          state,
          account: { id: accountId },
          currency: currency as Currency,
          name: alias,
          payoutMethod: payoutMethodId ? { id: payoutMethodId } : undefined,
        },
      });

      hadSuccess.current = true;
      const payload = connectResult.data?.connectPaypalPayoutMethod;
      if (!payload?.connectedAccount?.id || !payload?.payoutMethod?.id) {
        throw new Error('PayPal connect failed');
      }

      onSuccess({
        connectedAccountId: payload.connectedAccount.id,
        payoutMethodId: payload.payoutMethod.id,
      });
    } catch (err) {
      const graphQLErrors = (err as { graphQLErrors?: unknown[] })?.graphQLErrors;
      if (err instanceof Error && !graphQLErrors?.length) {
        onError(err);
      } else {
        onError(new Error(i18nGraphqlException(intl, err)));
      }
    } finally {
      setIsLoading(false);
      setOverlayState(null);
    }
  };

  return (
    <React.Fragment>
      <Button
        onClick={handleConnect}
        loading={loading || isLoading}
        className={cn(className, 'gap-2')}
        disabled={disabled}
      >
        <PayPalIcon size={16} />
        <FormattedMessage defaultMessage="Connect {service}" id="C9HmCs" values={{ service: 'PayPal' }} />
      </Button>
      <DialogPrimitive.Root open={overlayState !== null}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0">
            <DialogPrimitive.Content
              className="relative mx-4 flex w-full max-w-xs flex-col items-center gap-5 rounded-2xl bg-white px-8 py-10 text-center shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
              onEscapeKeyDown={() => cancelRef.current?.()}
              onInteractOutside={e => e.preventDefault()}
            >
              <button
                onClick={() => cancelRef.current?.()}
                className="absolute top-4 right-4 rounded-sm opacity-60 transition-opacity hover:opacity-100 focus:outline-none"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
              <DialogPrimitive.Title className="flex items-center gap-2">
                <PayPalIcon size={28} />
                <span className="text-2xl font-bold tracking-tight text-[#003087]">PayPal</span>
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm leading-relaxed text-slate-700">
                {overlayState === 'popupBlocked' ? (
                  <FormattedMessage
                    defaultMessage="Continue to {service} to connect your account."
                    id="BvpUE5"
                    values={{ service: 'PayPal' }}
                  />
                ) : (
                  <FormattedMessage
                    defaultMessage="Don't see the PayPal login window?{br}We'll help you re-launch it."
                    id="mpBY7Q"
                    values={{ br: <br /> }}
                  />
                )}
              </DialogPrimitive.Description>
              <button
                onClick={() => {
                  if (popupRef.current && !popupRef.current.closed) {
                    popupRef.current.focus();
                  } else {
                    openPopupFromClickRef.current?.();
                  }
                }}
                className="text-sm font-semibold text-[#0070ba] underline underline-offset-2 hover:text-[#003087] focus:outline-none"
              >
                <FormattedMessage defaultMessage="Click to Continue" id="PaypalConnectButton.popupOverlay.cta" />
              </button>
            </DialogPrimitive.Content>
          </DialogPrimitive.Overlay>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </React.Fragment>
  );
};

export default PaypalConnectButton;
