import React from 'react';
import { FormattedMessage } from 'react-intl';

import { addAuthTokenToHeader, getPaypalConnectConfig } from '../../lib/api';
import type { PayPalSupportedCurrencies } from '@/lib/constants/currency';

import PayPalIcon from '../icons/PayPal';
import { Button } from '../ui/Button';

import { PAYPAL_CONNECT_POPUP_MESSAGE } from './constants';

type PaypalConnectButtonProps = {
  collectiveId: number;
  currency: typeof PayPalSupportedCurrencies;
  disabled?: boolean;
  loading?: boolean;
  alias?: string;
  onSuccess: (result: { connectedAccountId: number; payoutMethodId: number }) => void;
  onError: (err: Error) => void;
};

const PAYPAL_CONNECT_SCOPES = 'openid profile email address https://uri.paypal.com/services/paypalattributes';

const openPaypalPopup = (authorizeUrl: string, clientId: string, redirectUri: string): Window | null => {
  const url = new URL(authorizeUrl);
  url.searchParams.set('flowEntry', 'static');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', PAYPAL_CONNECT_SCOPES);
  url.searchParams.set('redirect_uri', redirectUri);

  const width = 500;
  const height = 700;
  const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
  const top = Math.round(window.screenY + (window.outerHeight - height) / 2);

  return window.open(url.toString(), 'paypalConnect', `width=${width},height=${height},left=${left},top=${top}`);
};

/**
 * Renders a "Connect PayPal" button that opens the "Log in with PayPal" flow
 * in a mini-browser popup (no fullPage param). On approval, the popup posts
 * the auth code back to this window; we then exchange it via the JSON endpoint.
 */
const PaypalConnectButton = ({
  collectiveId,
  currency,
  disabled,
  loading,
  alias,
  onSuccess,
  onError,
}: PaypalConnectButtonProps) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const hadSuccess = React.useRef(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const config = await getPaypalConnectConfig(collectiveId);
      if (!config?.clientId || !config?.redirectUri || !config?.authorizeUrl) {
        throw new Error('PayPal Connect is not configured');
      }

      const popup = openPaypalPopup(config.authorizeUrl, config.clientId, config.redirectUri);
      if (!popup) {
        throw new Error('Failed to open PayPal popup. Please allow popups for this site.');
      }

      const code = await new Promise<string>((resolve, reject) => {
        const cleanup = () => {
          window.removeEventListener('message', onMessage);
          clearInterval(closedPoll);
          if (!popup.closed) {
            popup.close();
          }
        };

        const onMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin || event.data?.type !== PAYPAL_CONNECT_POPUP_MESSAGE) {
            return;
          }
          cleanup();
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else if (event.data.code) {
            resolve(event.data.code);
          } else {
            reject(new Error('PayPal did not return an authorization code'));
          }
        };

        const closedPoll = setInterval(() => {
          if (popup.closed) {
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

      const result: { connectedAccountId: number; payoutMethodId: number } = await fetch(
        '/api/connected-accounts/paypal/connect',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...addAuthTokenToHeader(),
          },
          body: JSON.stringify({ code, CollectiveId: collectiveId, currency, name: alias }),
        },
      ).then(response => {
        if (!response.ok) {
          return response.json().then(json => {
            throw new Error(json?.error?.message || json?.error || response.statusText);
          });
        }
        hadSuccess.current = true;
        return response.json();
      });

      onSuccess(result);
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleConnect} loading={loading || isLoading} className="w-full gap-2" disabled={disabled}>
      <PayPalIcon size={16} />
      <FormattedMessage defaultMessage="Connect {service}" id="C9HmCs" values={{ service: 'PayPal' }} />
    </Button>
  );
};

export default PaypalConnectButton;
