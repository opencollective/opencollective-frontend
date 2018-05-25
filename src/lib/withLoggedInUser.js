import React from 'react'
import PropTypes from 'prop-types';
import moment from 'moment';

import * as api from '../lib/api';
import storage from '../lib/storage';
import LoggedInUser from '../classes/LoggedInUser';
import { getLoggedInUserQuery } from '../graphql/queries';

const maybeRefreshAccessToken = async (currentToken) => {
  const { exp } = JSON.parse(currentToken.split('.')[1]);
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
        return new LoggedInUser(cache);
      }

      // From GraphQL with Apollo
      const result = await this.props.client.query({
        query: getLoggedInUserQuery,
      });

      // No result
      if (!result.data || !result.data.LoggedInUser) {
        storage.set("LoggedInUser", null);
        return null;
      }

      // Store in cache
      storage.set("LoggedInUser", result.data.LoggedInUser, 1000 * 60 * 60);

      // Fresh data from Apollo
      return new LoggedInUser(result.data.LoggedInUser);
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
