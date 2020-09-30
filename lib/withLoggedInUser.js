import React from 'react';
import PropTypes from 'prop-types';
import * as Sentry from '@sentry/browser';
import jwt from 'jsonwebtoken';
import { pick } from 'lodash';
import moment from 'moment';

import { loggedInUserQuery } from './graphql/queries';
import { refreshToken, refreshTokenWithTwoFactorAuthentication } from './api';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS, setLocalStorage } from './local-storage';
import LoggedInUser from './LoggedInUser';
import storage from './storage';

const maybeRefreshAccessToken = async currentToken => {
  const decodeResult = jwt.decode(currentToken);
  if (!decodeResult) {
    return null;
  }

  // Update token if it expires in less than a month
  const shouldUpdate = moment(decodeResult.exp * 1000)
    .subtract(1, 'month')
    .isBefore(new Date());

  if (shouldUpdate) {
    // call to API again to exchange for long term token or 2FA token
    const res = await refreshToken(currentToken);
    const { token, error } = res;
    if (error) {
      return null;
    } else if (token) {
      setLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, token);
      return token;
    }
  }

  return currentToken;
};

const exchangeTwoFactorAuthenticationToken = async (currentToken, twoFactorAuthenticatorCode) => {
  if (twoFactorAuthenticatorCode) {
    const res = await refreshTokenWithTwoFactorAuthentication(currentToken, twoFactorAuthenticatorCode);
    const { token, error } = res;
    if (error) {
      return error;
    } else if (token) {
      setLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, token);
      return token;
    }
  }
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
        if (result.data && result.data.LoggedInUser) {
          const user = result.data.LoggedInUser;
          storage.set('LoggedInUser', user, 1000 * 60 * 60);
          Sentry.configureScope(scope => {
            scope.setUser(pick(user, ['id', 'email', 'username']));
          });
          return new LoggedInUser(user);
        } else {
          storage.set('LoggedInUser', null);
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
      const { ignoreLocalStorage = false, token = null, twoFactorAuthenticatorCode } = options;

      // only Client Side for now
      if (!process.browser || !window) {
        return null;
      }

      if (token) {
        // Ensure token is valid
        const decodeResult = jwt.decode(token);
        if (!decodeResult || !decodeResult.exp) {
          throw new Error('Invalid token');
        }

        /**
         * If we're logging in with a token, 2 things may happen:
         * 1 It has scope of 'login' and there is no two factor authentication code passed into
         * the function. We should call maybeRefreshAccessToken. If the user has no 2FA enabled,
         * we exchange for a long term token and log in. If they do have 2FA enabled, we prompt
         * them to enter the 6-digit code.
         * 2 This function is then called again and token has scope 'twofactorauth' and we also
         * get the code, so we call exchangeTwoFactorAuthenticationToken.
         */
        let newToken;
        if (twoFactorAuthenticatorCode) {
          newToken = await exchangeTwoFactorAuthenticationToken(token, twoFactorAuthenticatorCode);
          if (newToken.code === 401) {
            // if we receive a 401 error from the API this means the 2FA token has failed
            throw new Error(newToken.message);
          }
        } else {
          // Used for the first exchange of the login token
          newToken = await maybeRefreshAccessToken(token);
          const decodedNewToken = jwt.decode(newToken);
          if (decodedNewToken.scope === 'twofactorauth') {
            throw new Error('Two-factor authentication is enabled on this account. Please enter the code');
          }
        }

        if (!newToken) {
          throw new Error('Invalid token');
        } else if (getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN) !== newToken) {
          setLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, newToken);
        }
      } else {
        // If no localStorage token, reset LoggedInUser
        const localStorageToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
        if (!localStorageToken) {
          if (storage.get('LoggedInUser')) {
            storage.set('LoggedInUser', null);
          }
          return null;
        }

        const decodedLocalStorageToken = jwt.decode(localStorageToken);
        if (decodedLocalStorageToken.scope === 'twofactorauth') {
          return null;
        }

        // refresh Access Token in the background if needed
        maybeRefreshAccessToken(localStorageToken);

        // From cache
        const cache = storage.get('LoggedInUser');
        if (!ignoreLocalStorage && cache) {
          // This is asynchronous and will take care of updating the cache
          this.getLoggedInUserFromServer();
          // Return from cache immediately
          return new LoggedInUser(cache);
        }
      }

      // Synchronously
      return this.getLoggedInUserFromServer();
    };

    render() {
      return <WrappedComponent getLoggedInUser={this.getLoggedInUser} {...this.props} />;
    }
  };
};

export default withLoggedInUser;
