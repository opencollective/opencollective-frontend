import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import jwt from 'jsonwebtoken';
import * as Sentry from '@sentry/browser';
import { pick } from 'lodash';

import * as api from './api';
import storage from './storage';
import LoggedInUser from './LoggedInUser';
import { getLoggedInUserQuery } from './graphql/queries';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS, setLocalStorage } from './local-storage';

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
    const { token, error } = await api.refreshToken(currentToken);
    if (error) {
      return null;
    } else if (token) {
      setLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, token);
      return token;
    }
  }

  return currentToken;
};

export default WrappedComponent => {
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

    getLoggedInUserFromServer = () =>
      this.props.client.query({ query: getLoggedInUserQuery }).then(result => {
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

    /**
     * If `token` is passed in `options`, function it will throw if
     * that token is invalid and it won't try to load user from the local cache
     * but instead force refetch it from the server.
     */
    getLoggedInUser = async (options = {}) => {
      const { ignoreLocalStorage = false, token = null } = options;

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

        const newToken = await maybeRefreshAccessToken(token);
        if (!newToken) {
          throw Error('Invalid token');
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
