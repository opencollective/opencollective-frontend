import React from 'react';
// import PropTypes from 'prop-types';

import Page from '../components/Page';
// import Loading from '../components/Loading';
import { withUser } from '../components/UserProvider';
import { Flex } from '@rebass/grid';

class OpenSourceApplyPage extends React.Component {
  static async getInitalProps({ query }) {
    return {
      token: query && query.token,
    };
  }

  componentDidMount() {
    console.log(this.props.token);
  }

  render() {
    return (
      <Page>
        <Flex alignItems="center" flexDirection="column" mx="auto" width={300} pt={4} mb={4} />
      </Page>
    );
  }
}

export default withUser(OpenSourceApplyPage);
