import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import jwt from 'jsonwebtoken';

import * as api from '../lib/api';
import storage from '../lib/storage';
import LoggedInUser from '../classes/LoggedInUser';
import { getLoggedInUserQuery } from '../graphql/queries';

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
      window.localStorage.setItem('accessToken', token);
      return token;
    }
  }

  return currentToken;
};

export default WrappedComponent => {
  return class withLoggedInUser extends React.Component {
    static displayName = `withLoggedInUser(${WrappedComponent.displayName})`;

    static async getInitialProps(context) {
      return typeof WrappedComponent.getInitialProps === 'function'
        ? await WrappedComponent.getInitialProps(context)
        : {};
    }

    static propTypes = {
      client: PropTypes.object,
    };

    getLoggedInUserFromServer = () =>
      this.props.client.query({ query: getLoggedInUserQuery }).then(result => {
        if (result.data && result.data.LoggedInUser) {
          storage.set('LoggedInUser', result.data.LoggedInUser, 1000 * 60 * 60);
          return new LoggedInUser(result.data.LoggedInUser);
        } else {
          storage.set('LoggedInUser', null);
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
        } else if (window.localStorage.getItem('accessToken') !== newToken) {
          window.localStorage.setItem('accessToken', newToken);
        }
      } else {
        // If no localStorage token, reset LoggedInUser
        const localStorageToken = window.localStorage.getItem('accessToken');
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
