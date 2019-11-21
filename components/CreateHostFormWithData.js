import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import { Flex } from '@rebass/grid';

import { compose } from '../lib/utils';

import LoadingGrid from './LoadingGrid';
import CreateHostForm from './CreateHostForm';

class CreateHostFormWithData extends React.Component {
  static propTypes = {
    LoggedInUser: PropTypes.object.isRequired,
    collective: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    createCollective: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.createOrganization = this.createOrganization.bind(this);
  }

  async createOrganization(CollectiveInputType) {
    this.setState({ status: 'loading' });
    CollectiveInputType.type = 'ORGANIZATION';
    console.log('>>> createOrganization', CollectiveInputType);
    try {
      const res = await this.props.createCollective(CollectiveInputType);
      const collective = res.data.createCollective;
      return collective;
    } catch (err) {
      console.error('>>> createOrganization error: ', JSON.stringify(err));
      const errorMsg = err.graphQLErrors && err.graphQLErrors[0] ? err.graphQLErrors[0].message : err.message;
      this.setState({ result: { error: errorMsg } });
      throw new Error(errorMsg);
    }
  }

  render() {
    const { data, collective } = this.props;

    const userCollective = data.Collective;
    if (!userCollective) {
      return (
        <Flex py={3} width={1} justifyContent="center">
          <LoadingGrid />
        </Flex>
      );
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
        createOrganization={this.createOrganization}
        onSubmit={this.props.onSubmit}
      />
    );
  }
}

const getConnectedAccountsQuery = gql`
  query Collective($slug: String!) {
    Collective(slug: $slug) {
      id
      isHost
      slug
      memberOf(role: "ADMIN", type: "ORGANIZATION") {
        id
        collective {
          id
          slug
          name
          isHost
          createdAt
          imageUrl
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
        slug: get(props, 'LoggedInUser.collective.slug'),
      },
    };
  },
});

const createCollectiveQuery = gql`
  mutation createCollective($collective: CollectiveInputType!) {
    createCollective(collective: $collective) {
      id
      slug
      name
      imageUrl
      createdAt
    }
  }
`;

const addMutation = graphql(createCollectiveQuery, {
  props: ({ ownProps, mutate }) => ({
    createCollective: async CollectiveInputType =>
      await mutate({
        variables: { collective: CollectiveInputType },
        update: (proxy, { data: { createCollective } }) => {
          const variables = {
            slug: get(ownProps, 'LoggedInUser.collective.slug'),
          };

          // Retrieve the query from the cache
          const data = proxy.readQuery({
            query: getConnectedAccountsQuery,
            variables,
          });

          // Insert new Collective at the beginning
          const membership = {
            createdAt: createCollective.createdAt,
            id: Math.round(Math.random() * 10000000),
            __typename: 'MemberType',
            collective: {
              ...createCollective,
              isHost: false,
              connectedAccounts: [],
            },
          };
          data.Collective.memberOf.push(membership);

          // write data back for the query
          proxy.writeQuery({
            query: getConnectedAccountsQuery,
            variables,
            data,
          });
        },
      }),
  }),
});

const addGraphQL = compose(addConnectedAccountsQuery, addMutation);

export default addGraphQL(CreateHostFormWithData);
