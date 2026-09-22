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
  GetPaypalOAuthUrlMutation,
  GetPaypalOAuthUrlMutationVariables,
} from '@/lib/graphql/types/v2/graphql';
import { cn } from '@/lib/utils';

import PayPalIcon from '../icons/PayPal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';

import { PAYPAL_CONNECT_POPUP_MESSAGE } from './constants';

const getPaypalOAuthUrlMutation = gql`
  mutation GetPaypalOAuthUrl($account: AccountReferenceInput!, $redirect: String, $currency: Currency) {
    getPaypalOAuthUrl(account: $account, redirect: $redirect, currency: $currency)
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
  const [isPopupOpen, setIsPopupOpen] = React.useState(false);
  const hadSuccess = React.useRef(false);
  const popupRef = React.useRef<Window | null>(null);
  const cancelRef = React.useRef<(() => void) | null>(null);

  const [getPaypalOAuthUrl] = useMutation<GetPaypalOAuthUrlMutation, GetPaypalOAuthUrlMutationVariables>(
    getPaypalOAuthUrlMutation,
  );
  const [connectPaypalPayoutMethod] = useMutation<
    ConnectPaypalPayoutMethodMutation,
    ConnectPaypalPayoutMethodMutationVariables
  >(connectPaypalPayoutMethodMutation);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      hadSuccess.current = false;
      const redirect = window.location.href.replace(/\?.*/, '');
      const oauthResult = await getPaypalOAuthUrl({
        variables: {
          account: { id: accountId },
          redirect,
          currency: currency as Currency,
        },
      });
      const authorizeUrl = oauthResult.data?.getPaypalOAuthUrl;
      if (!authorizeUrl) {
        throw new Error('PayPal Connect is not available at the moment.');
      }

      const popup = openPaypalPopup(authorizeUrl);
      if (!popup) {
        toast({
          variant: 'error',
          message: intl.formatMessage(
            { defaultMessage: 'Failed to open {service}. Please allow popups for this site.', id: 'l5AoL3' },
            { service: 'PayPal' },
          ),
        });
        return;
      }

      popupRef.current = popup;
      setIsPopupOpen(true);

      const { code, state } = await new Promise<{ code: string; state: string }>((resolve, reject) => {
        const cleanup = () => {
          cancelRef.current = null;
          setIsPopupOpen(false);
          popupRef.current = null;
          window.removeEventListener('message', onMessage);
          clearInterval(closedPoll);
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

        const closedPoll = setInterval(() => {
          if (popup?.closed) {
            cleanup();
            setTimeout(() => {
              if (!hadSuccess.current) {
                reject(new Error('PayPal login was cancelled'));
              }
            });
          }
        }, 500);

        window.addEventListener('message', onMessage);
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
      setIsPopupOpen(false);
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
      <DialogPrimitive.Root open={isPopupOpen}>
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
                <FormattedMessage
                  defaultMessage="Don't see the PayPal login window?{br}We'll help you re-launch it."
                  id="mpBY7Q"
                  values={{ br: <br /> }}
                />
              </DialogPrimitive.Description>
              <button
                onClick={() => popupRef.current?.focus()}
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
