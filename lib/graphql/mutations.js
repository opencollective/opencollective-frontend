import { graphql } from '@apollo/client/react/hoc';
import { pick } from 'lodash';

import { gqlV1 } from './helpers';
import { editCollectivePageFieldsFragment } from './queries';

const createCollectiveMutation = gqlV1/* GraphQL */ `
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

export const editCollectiveMutation = gqlV1/* GraphQL */ `
  mutation EditCollective($collective: CollectiveInputType!) {
    editCollective(collective: $collective) {
      id
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
        'privateInstructions',
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
        'settings',
      ]);
      CollectiveInputType.tiers = (collective.tiers || []).map(tier =>
        pick(tier, ['type', 'name', 'description', 'amount', 'maxQuantity']),
      );
      CollectiveInputType.location = pick(collective.location, [
        'name',
        'address',
        'address1',
        'address2',
        'city',
        'postalCode',
        'zone',
        'lat',
        'long',
        'country',
      ]);
      return await mutate({ variables: { collective: CollectiveInputType } });
    },
  }),
});
