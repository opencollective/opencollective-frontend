import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { isArray, pick } from 'lodash';

import { editCollectivePageFieldsFragment } from './queries';

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

const editCollectiveMutation = gql`
  mutation EditCollective($collective: CollectiveInputType!) {
    editCollective(collective: $collective) {
      ...EditCollectivePageFields
    }
  }

  ${editCollectivePageFieldsFragment}
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
        'currency',
        'quantity',
        'HostCollectiveId',
        'ParentCollectiveId',
        'isIncognito',
      ]);
      CollectiveInputType.tiers = (collective.tiers || []).map(tier =>
        pick(tier, ['type', 'name', 'description', 'amount', 'maxQuantity']),
      );
      CollectiveInputType.location = pick(collective.location, ['name', 'address', 'lat', 'long', 'country']);
      return await mutate({ variables: { collective: CollectiveInputType } });
    },
  }),
});

export const addCreateCollectiveFromGithubMutation = graphql(createCollectiveFromGithubMutation, {
  props: ({ mutate }) => ({
    createCollectiveFromGithub: async collective => {
      const CollectiveInputType = pick(collective, ['slug', 'type', 'name', 'description', 'githubHandle']);
      return await mutate({ variables: { collective: CollectiveInputType } });
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
