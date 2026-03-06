import React from 'react';
import PropTypes from 'prop-types';
import * as Sentry from '@sentry/browser';
import dayjs from 'dayjs';
import { decodeJwt } from 'jose';

import { exchangeLoginToken, refreshToken, refreshTokenWithTwoFactorCode } from '../api';
import { loggedInUserQuery } from '../graphql/queries';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS, setLocalStorage } from '../local-storage';
import LoggedInUser from '../LoggedInUser';

const maybeRefreshSessionTokenAndStore = async (currentToken, isTwoFactorToken) => {
  const decodeResult = decodeJwt(currentToken);
  if (!decodeResult) {
    return null;
  }

  // Update token if it expires in less than a month
  const shouldUpdate = dayjs(decodeResult.exp * 1000)
    .subtract(15, 'day')
    .isBefore(new Date());

  if (shouldUpdate) {
    // call to API again to exchange for long term token or 2FA token
    const res = await refreshToken(currentToken);
    const { token, error } = res;
    if (error) {
      return null;
    } else if (token) {
      setLocalStorage(
        isTwoFactorToken ? LOCAL_STORAGE_KEYS.TWO_FACTOR_AUTH_TOKEN : LOCAL_STORAGE_KEYS.ACCESS_TOKEN,
        token,
      );
      return token;
    }
  }

  return currentToken;
};

const withLoggedInUser = WrappedComponent => {
  return class withLoggedInUser extends React.Component {
    static async getInitialProps(context) {
      return typeof WrappedComponent.getInitialProps === 'function'
        ? await WrappedComponent.getInitialProps(context)
        : {};
    }

    static displayName = `withLoggedInUser(${WrappedComponent.displayName})`;

    static propTypes = {
      client: PropTypes.object,
    };

    getLoggedInUserFromServer = () => {
      return this.props.client.query({ query: loggedInUserQuery, fetchPolicy: 'network-only' }).then(result => {
        if (result.data?.loggedInAccount) {
          const account = result.data.loggedInAccount;
          Sentry.configureScope(scope => {
            scope.setUser({
              id: account.legacyId,
              email: account.email,
              slug: account.slug,
              CollectiveId: account.legacyId,
            });
          });
          return new LoggedInUser(account);
        } else {
          Sentry.configureScope(scope => {
            scope.setUser(null);
          });
          return null;
        }
      });
    };

    /**
     * If `token` is passed in `options`, function it will throw if
     * that token is invalid and it won't try to load user from the local cache
     * but instead force refetch it from the server.
     */
    getLoggedInUser = async (options = {}) => {
      const { token = null, twoFactorAuthenticatorCode, twoFactorAuthenticationType } = options;

      // only Client Side for now
      if (!process.browser || !window) {
        return null;
      }

      if (token) {
        // Ensure token is valid
        const decodeResult = decodeJwt(token);
        if (!decodeResult || !decodeResult.exp) {
          throw new Error('Invalid token');
        }

        if (decodeResult.scope === 'session') {
          setLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, token);
        }

        // We received directly a 'twofactorauth' prompt after login in with password
        else if (decodeResult.scope === 'twofactorauth') {
          if (twoFactorAuthenticatorCode && twoFactorAuthenticationType) {
            const newToken = await refreshTokenWithTwoFactorCode(token, {
              twoFactorAuthenticatorCode,
              twoFactorAuthenticationType,
            });
            setLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, newToken);
          } else {
            setLocalStorage(LOCAL_STORAGE_KEYS.TWO_FACTOR_AUTH_TOKEN, token);
            throw new Error('Two-factor authentication is enabled on this account. Please enter the code');
          }
        } else if (decodeResult.scope === 'login') {
          const { token: newToken, error } = await exchangeLoginToken(token);
          if (error || !newToken) {
            throw new Error(error || 'Invalid login token');
          }

          const decodedNewToken = decodeJwt(newToken);
          if (decodedNewToken.scope === 'twofactorauth') {
            setLocalStorage(LOCAL_STORAGE_KEYS.TWO_FACTOR_AUTH_TOKEN, newToken);
            throw new Error('Two-factor authentication is enabled on this account. Please enter the code');
          }
          setLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, newToken);
        } else {
          throw new Error(`Unsupported scope: ${decodeResult.scope}`);
        }
      } else {
        const localStorageToken =
          getFromLocalStorage(LOCAL_STORAGE_KEYS.TWO_FACTOR_AUTH_TOKEN) ||
          getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
        const isTwoFactorToken = !!getFromLocalStorage(LOCAL_STORAGE_KEYS.TWO_FACTOR_AUTH_TOKEN);

        if (!localStorageToken) {
          return null;
        }

        const decodedLocalStorageToken = decodeJwt(localStorageToken);

        // A null token means the token is malformed, clear it from local storage
        if (!decodedLocalStorageToken) {
          setLocalStorage(LOCAL_STORAGE_KEYS[isTwoFactorToken ? 'TWO_FACTOR_AUTH_TOKEN' : 'ACCESS_TOKEN'], null);
          return null;
        }

        if (isTwoFactorToken) {
          throw new Error('Two-factor authentication is enabled on this account. Please enter the code');
        }

        // refresh Access Token in the background if needed
        await maybeRefreshSessionTokenAndStore(localStorageToken, isTwoFactorToken);
      }

      // Synchronously
      return this.getLoggedInUserFromServer();
    };

    getLoggedInUserFromCache = () => {
      const result = this.props.client.readQuery({ query: loggedInUserQuery });
      return !result.loggedInAccount ? null : new LoggedInUser(result.loggedInAccount);
    };

    render() {
      return (
        <WrappedComponent
          getLoggedInUser={this.getLoggedInUser}
          getLoggedInUserFromCache={this.getLoggedInUserFromCache}
          {...this.props}
        />
      );
    }
  };
};

export default withLoggedInUser;
