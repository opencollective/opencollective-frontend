import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { cloneDeep, get } from 'lodash';

import { getErrorFromGraphqlException } from '../../lib/errors';
import { compose } from '../../lib/utils';

import { Flex } from '../Grid';
import LoadingGrid from '../LoadingGrid';

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
    try {
      const res = await this.props.createCollective(CollectiveInputType);
      const collective = res.data.createCollective;
      return collective;
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
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

const editCollectiveConnectedAccountsQuery = gql`
  query EditCollectiveConnectedAccounts($slug: String!) {
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

export const addEditCollectiveConnectedAccountsData = graphql(editCollectiveConnectedAccountsQuery, {
  options: props => ({
    variables: {
      slug: get(props, 'LoggedInUser.collective.slug'),
    },
  }),
});

const editCollectiveCreateHostMutation = gql`
  mutation EditCollectiveCreateHost($collective: CollectiveInputType!) {
    createCollective(collective: $collective) {
      id
      slug
      name
      imageUrl
      createdAt
    }
  }
`;

const addEditCollectiveCreateHostMutation = graphql(editCollectiveCreateHostMutation, {
  props: ({ ownProps, mutate }) => ({
    createCollective: async CollectiveInputType =>
      await mutate({
        variables: { collective: CollectiveInputType },
        update: (proxy, { data: { createCollective } }) => {
          const variables = {
            slug: get(ownProps, 'LoggedInUser.collective.slug'),
          };

          // Retrieve the query from the cache
          const data = cloneDeep(
            proxy.readQuery({
              query: editCollectiveConnectedAccountsQuery,
              variables,
            }),
          );

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
            query: editCollectiveConnectedAccountsQuery,
            variables,
            data,
          });
        },
      }),
  }),
});

const addGraphql = compose(addEditCollectiveConnectedAccountsData, addEditCollectiveCreateHostMutation);

export default addGraphql(CreateHostFormWithData);
