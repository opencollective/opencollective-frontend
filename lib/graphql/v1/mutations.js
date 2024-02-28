import { graphql } from '@apollo/client/react/hoc';
import { pick } from 'lodash';

import { gqlV1 } from '../helpers';

import { editCollectivePageFieldsFragment } from './queries';

export const editTagsMutation = gqlV1/* GraphQL */ `
  mutation EditTags($collective: CollectiveInputType!) {
    editCollective(collective: $collective) {
      id
      tags
    }
  }
`;

export const editCollectiveSettingsMutation = gqlV1/* GraphQL */ `
  mutation EditCollectiveSettings($id: Int!, $settings: JSON) {
    editCollective(collective: { id: $id, settings: $settings }) {
      id
      settings
    }
  }
`;

/** A mutation used by child components to update the collective */
export const editCollectiveLongDescriptionMutation = gqlV1/* GraphQL */ `
  mutation EditCollectiveLongDescription($id: Int!, $longDescription: String) {
    editCollective(collective: { id: $id, longDescription: $longDescription }) {
      id
      longDescription
    }
  }
`;

export const editCollectiveAvatarMutation = gqlV1/* GraphQL */ `
  mutation EditCollectiveAvatar($id: Int!, $image: String) {
    editCollective(collective: { id: $id, image: $image }) {
      id
      image
      imageUrl(height: 256)
    }
  }
`;

export const editCollectiveBackgroundMutation = gqlV1/* GraphQL */ `
  mutation EditCollectiveBackground($id: Int!, $settings: JSON, $backgroundImage: String) {
    editCollective(collective: { id: $id, settings: $settings, backgroundImage: $backgroundImage }) {
      id
      settings
      backgroundImage
      backgroundImageUrl
    }
  }
`;

export const editCollectivePolicyMutation = gqlV1/* GraphQL */ `
  mutation EditCollectivePolicy($collective: CollectiveInputType!) {
    editCollective(collective: $collective) {
      id
      type
      isActive
      settings
    }
  }
`;

// GraphQL for editing Collective admins info
export const editCollectiveMembersMutation = gqlV1/* GraphQL */ `
  mutation EditCollectiveMembers($collectiveId: Int!, $members: [MemberInputType!]!) {
    editCoreContributors(collectiveId: $collectiveId, members: $members) {
      id
      members(roles: ["ADMIN"]) {
        id
        role
        member {
          id
          name
        }
      }
    }
  }
`;

// GraphQL for editing Collective contact info
export const editCollectiveContactMutation = gqlV1/* GraphQL */ `
  mutation EditCollectiveContact($collective: CollectiveInputType!) {
    editCollective(collective: $collective) {
      id
      socialLinks {
        type
        url
      }
    }
  }
`;

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

export const editCollectivePageMutation = gqlV1/* GraphQL */ `
  mutation EditCollectivePage($collective: CollectiveInputType!) {
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
        'structured',
        'lat',
        'long',
        'country',
      ]);
      return await mutate({ variables: { collective: CollectiveInputType } });
    },
  }),
});
