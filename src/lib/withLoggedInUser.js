import React from 'react'
import PropTypes from 'prop-types';
import moment from 'moment';
import jwt from 'jsonwebtoken';

import * as api from '../lib/api';
import storage from '../lib/storage';
import LoggedInUser from '../classes/LoggedInUser';
import { getLoggedInUserQuery } from '../graphql/queries';

const maybeRefreshAccessToken = async (currentToken) => {
  const { exp } = jwt.decode(currentToken);
  const shouldUpdate = moment(exp * 1000).subtract(1, 'month').isBefore(new Date);
  if (shouldUpdate) {
    const { token } = await api.refreshToken(currentToken);
    window.localStorage.setItem('accessToken', token);
  }
};

export default WrappedComponent => {

  return class withLoggedInUser extends React.Component {

    static propTypes = {
      client: PropTypes.object
    }

    static getInitialProps (props) {
      return WrappedComponent.getInitialProps(props);
    }

    getLoggedInUserFromServer = () =>
      this.props.client.query({ query: getLoggedInUserQuery }).then(result => {
        if (result.data && result.data.LoggedInUser) {
          storage.set("LoggedInUser", result.data.LoggedInUser, 1000 * 60 * 60);
          return result.data.LoggedInUser;
        } else {
          storage.set("LoggedInUser", null);
          return null;
        }
      })

    getLoggedInUser = async () => {
      // only Client Side for now
      if (!process.browser || !window) {
        return null;
      }

      // If no localStorage token, reset LoggedInUser
      const token = window.localStorage.getItem('accessToken');
      if (!token) {
        storage.set("LoggedInUser", null);
        return null;
      }

      // refresh Access Token in the background if needed
      maybeRefreshAccessToken(token);

      // From cache
      const cache = storage.get("LoggedInUser");
      if (cache) {
        // This is asynchronous and will take care of updating the cache
        this.getLoggedInUserFromServer();
        // Return from cache immediately
        return new LoggedInUser(cache);
      }

      // Synchronously
      const loggedInUser = await this.getLoggedInUserFromServer();
      if (loggedInUser) {
        return new LoggedInUser(loggedInUser);
      }
    }

    render() {
      return (
        <WrappedComponent
          getLoggedInUser={this.getLoggedInUser}
          {...this.props}
          />
      );
    }

  }

}
