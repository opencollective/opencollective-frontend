import { graphql } from '@apollo/react-hoc';
import gql from 'graphql-tag';
import { isArray, pick } from 'lodash';

import { editCollectivePageFields, loggedInUserQuery } from './queries';

const createCollectiveMutation = gql`
  mutation CreateCollective($collective: CollectiveInputType!) {
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

const createCollectiveFromGithubMutation = gql`
  mutation CreateCollectiveFromGithub($collective: CollectiveInputType!) {
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
const editCollectiveMutation = gql`
  mutation EditCollective($collective: CollectiveInputType!) {
    editCollective(collective: $collective) {
      ${editCollectivePageFields}
    }
  }
`;
/* eslint-enable graphql/template-strings, graphql/no-deprecated-fields, graphql/capitalized-type-name, graphql/named-operations */

const archiveCollectiveMutation = gql`
  mutation ArchiveCollective($id: Int!) {
    archiveCollective(id: $id) {
      id
      isArchived
    }
  }
`;

const unarchiveCollectiveMutation = gql`
  mutation UnarchiveCollective($id: Int!) {
    unarchiveCollective(id: $id) {
      id
      isArchived
    }
  }
`;

export const addCreateCollectiveMutation = graphql(createCollectiveMutation, {
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
        pick(tier, ['type', 'name', 'description', 'amount', 'maxQuantity']),
      );
      CollectiveInputType.location = pick(collective.location, ['name', 'address', 'lat', 'long', 'country']);
      return await mutate({
        variables: { collective: CollectiveInputType },
        update: (store, { data: { createCollective } }) => {
          const data = store.readQuery({ query: loggedInUserQuery });
          data.LoggedInUser.memberOf.push({
            __typename: 'Member',
            collective: createCollective,
            role: 'ADMIN',
          });
          store.writeQuery({ query: loggedInUserQuery, data });
        },
      });
    },
  }),
});

export const addCreateCollectiveFromGithubMutation = graphql(createCollectiveFromGithubMutation, {
  props: ({ mutate }) => ({
    createCollectiveFromGithub: async collective => {
      const CollectiveInputType = pick(collective, ['slug', 'type', 'name', 'description', 'githubHandle']);
      return await mutate({
        variables: { collective: CollectiveInputType },
        update: (store, { data: { createCollectiveFromGithub } }) => {
          const data = store.readQuery({ query: loggedInUserQuery });
          data.LoggedInUser.memberOf.push({
            __typename: 'Member',
            collective: createCollectiveFromGithub,
            role: 'ADMIN',
          });
          store.writeQuery({ query: loggedInUserQuery, data });
        },
      });
    },
  }),
});

export const addEditCollectiveMutation = graphql(editCollectiveMutation, {
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
        'isActive',
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

export const addArchiveCollectiveMutation = graphql(archiveCollectiveMutation, {
  props: ({ mutate }) => ({
    archiveCollective: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});

export const addUnarchiveCollectiveMutation = graphql(unarchiveCollectiveMutation, {
  props: ({ mutate }) => ({
    unarchiveCollective: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});
