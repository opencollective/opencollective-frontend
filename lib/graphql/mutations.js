import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { pick, isArray } from 'lodash';

import { getLoggedInUserQuery, getCollectiveToEditQueryFields } from './queries';

export const createUserQuery = gql`
  mutation createUser($user: UserInputType!, $organization: CollectiveInputType, $redirect: String) {
    createUser(user: $user, organization: $organization, redirect: $redirect) {
      user {
        id
        email
        name
      }
      organization {
        id
        slug
      }
    }
  }
`;

const createCollectiveQuery = gql`
  mutation createCollective($collective: CollectiveInputType!) {
    createCollective(collective: $collective) {
      id
      name
      slug
      type
      website
      twitterHandle
      isIncognito
    }
  }
`;

const createCollectiveFromGithubQuery = gql`
  mutation createCollectiveFromGithub($collective: CollectiveInputType!) {
    createCollectiveFromGithub(collective: $collective) {
      id
      name
      slug
      type
      githubHandle
    }
  }
`;

/* eslint-disable graphql/template-strings, graphql/no-deprecated-fields, graphql/capitalized-type-name, graphql/named-operations */
const editCollectiveQuery = gql`
  mutation editCollective($collective: CollectiveInputType!) {
    editCollective(collective: $collective) {
      ${getCollectiveToEditQueryFields}
    }
  }
`;
/* eslint-enable graphql/template-strings, graphql/no-deprecated-fields, graphql/capitalized-type-name, graphql/named-operations */

const deleteCollectiveQuery = gql`
  mutation deleteCollective($id: Int!) {
    deleteCollective(id: $id) {
      id
    }
  }
`;

const deleteUserCollectiveQuery = gql`
  mutation deleteUserCollective($id: Int!) {
    deleteUserCollective(id: $id) {
      id
    }
  }
`;

const archiveCollectiveQuery = gql`
  mutation archiveCollective($id: Int!) {
    archiveCollective(id: $id) {
      id
      isArchived
    }
  }
`;

const unarchiveCollectiveQuery = gql`
  mutation unarchiveCollective($id: Int!) {
    unarchiveCollective(id: $id) {
      id
      isArchived
    }
  }
`;

export const createApplicationMutation = gql`
  mutation createApplication($application: ApplicationInput!) {
    createApplication(application: $application) {
      id
      type
      apiKey
    }
  }
`;

export const deleteApplicationMutation = gql`
  mutation deleteApplication($id: Int!) {
    deleteApplication(id: $id) {
      id
    }
  }
`;

export const addCreateCollectiveMutation = graphql(createCollectiveQuery, {
  props: ({ mutate }) => ({
    createCollective: async collective => {
      const CollectiveInputType = pick(collective, [
        'slug',
        'type',
        'name',
        'image',
        'description',
        'longDescription',
        'location',
        'twitterHandle',
        'githubHandle',
        'website',
        'tags',
        'startsAt',
        'endsAt',
        'timezone',
        'maxAmount',
        'currency',
        'quantity',
        'HostCollectiveId',
        'ParentCollectiveId',
        'isIncognito',
        'data',
        CollectiveInputType,
      ]);
      CollectiveInputType.tiers = (collective.tiers || []).map(tier =>
        pick(tier, ['type', 'name', 'description', 'amount', 'maxQuantity', 'maxQuantityPerUser']),
      );
      CollectiveInputType.location = pick(collective.location, ['name', 'address', 'lat', 'long', 'country']);
      return await mutate({
        variables: { collective: CollectiveInputType },
        update: (store, { data: { createCollective } }) => {
          const data = store.readQuery({ query: getLoggedInUserQuery });
          data.LoggedInUser.memberOf.push({
            __typename: 'Member',
            collective: createCollective,
            role: 'ADMIN',
          });
          store.writeQuery({ query: getLoggedInUserQuery, data });
        },
      });
    },
  }),
});

export const addCreateCollectiveFromGithubMutation = graphql(createCollectiveFromGithubQuery, {
  props: ({ mutate }) => ({
    createCollectiveFromGithub: async collective => {
      const CollectiveInputType = pick(collective, ['slug', 'type', 'name', 'description', 'githubHandle']);
      return await mutate({
        variables: { collective: CollectiveInputType },
        update: (store, { data: { createCollectiveFromGithub } }) => {
          const data = store.readQuery({ query: getLoggedInUserQuery });
          data.LoggedInUser.memberOf.push({
            __typename: 'Member',
            collective: createCollectiveFromGithub,
            role: 'ADMIN',
          });
          store.writeQuery({ query: getLoggedInUserQuery, data });
        },
      });
    },
  }),
});

export const addEditCollectiveMutation = graphql(editCollectiveQuery, {
  props: ({ mutate }) => ({
    editCollective: async collective => {
      const CollectiveInputType = pick(collective, [
        'id',
        'type',
        'slug',
        'name',
        'company',
        'description',
        'longDescription',
        'tags',
        'expensePolicy',
        'website',
        'twitterHandle',
        'githubHandle',
        'location',
        'startsAt',
        'endsAt',
        'timezone',
        'maxAmount',
        'currency',
        'quantity',
        'ParentCollectiveId',
        'HostCollectiveId',
        'image',
        'backgroundImage',
        'settings',
        'hostFeePercent',
      ]);

      if (isArray(collective.tiers)) {
        CollectiveInputType.tiers = collective.tiers.map(tier =>
          pick(tier, [
            'id',
            'type',
            'name',
            'description',
            'longDescription',
            'amount',
            'amountType',
            'interval',
            'maxQuantity',
            'maxQuantityPerUser',
            'longDescription',
            'presets',
            'minimumAmount',
            'goal',
            'button',
          ]),
        );
      }

      CollectiveInputType.location = pick(collective.location, ['name', 'address', 'lat', 'long', 'country']);
      return await mutate({ variables: { collective: CollectiveInputType } });
    },
  }),
});

export const addDeleteCollectiveMutation = graphql(deleteCollectiveQuery, {
  props: ({ mutate }) => ({
    deleteCollective: async id => {
      return await mutate({
        variables: { id },
        awaitRefetchQueries: true,
        refetchQueries: [{ query: getLoggedInUserQuery }],
      });
    },
  }),
});

export const addDeleteUserCollectiveMutation = graphql(deleteUserCollectiveQuery, {
  props: ({ mutate }) => ({
    deleteUserCollective: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});

export const addArchiveCollectiveMutation = graphql(archiveCollectiveQuery, {
  props: ({ mutate }) => ({
    archiveCollective: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});

export const addUnarchiveCollectiveMutation = graphql(unarchiveCollectiveQuery, {
  props: ({ mutate }) => ({
    unarchiveCollective: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});

export const addUpdateUserEmailMutation = graphql(
  gql`
    mutation updateUserEmail($email: String!) {
      updateUserEmail(email: $email) {
        id
        email
        emailWaitingForValidation
      }
    }
  `,
  {
    props: ({ mutate }) => ({
      updateUserEmail: email => {
        return mutate({ variables: { email } });
      },
    }),
  },
);
