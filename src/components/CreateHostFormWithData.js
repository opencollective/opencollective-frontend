import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { get } from 'lodash';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import LoadingGrid from './LoadingGrid';
import CreateHostForm from './CreateHostForm';
import { Flex } from 'grid-styled';

class CreateHostFormWithData extends React.Component {

  static propTypes = {
    LoggedInUser: PropTypes.object.isRequired,
    collective: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired
  };

  render() {
    const { data, collective } = this.props;

    const userCollective = data.Collective;
    if (!userCollective) {
      return (
        <Flex py={3} w={1} justifyContent="center">
          <LoadingGrid />
        </Flex>
      )
    }

    const organizations = [];
    userCollective.memberOf.map(membership => {
      organizations.push(membership.collective);
    });

    return (
      <CreateHostForm
        organizations={organizations}
        collective={collective}
        userCollective={userCollective}
        />
    );
  }

}

const getConnectedAccountsQuery = gql`
query Collective($slug: String!) {
  Collective(slug: $slug) {
    id
    isHost
    location {
      name
      address
    }
    slug
    memberOf(role: "ADMIN", type: "ORGANIZATION") {
      id
      collective {
        id
        slug
        name
        isHost
        location {
          name
          address
        }
        connectedAccounts {
          id
          service
          createdAt
          updatedAt
        }
      }
    }
    connectedAccounts {
      id
      service
      createdAt
      updatedAt
    }
  }
}
`;

export const addConnectedAccountsQuery = graphql(getConnectedAccountsQuery, {
  options(props) {
    return {
      variables: {
        slug: get(props, 'LoggedInUser.collective.slug')
      }
    }
  }
});
export default withIntl(addConnectedAccountsQuery(CreateHostFormWithData));
