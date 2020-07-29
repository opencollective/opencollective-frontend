import gql from 'graphql-tag';

import { gqlV2 } from '../../../lib/graphql/helpers';

export const editCollectiveSettingsMutation = gql`
  mutation EditCollectiveSettings($id: Int!, $settings: JSON) {
    editCollective(collective: { id: $id, settings: $settings }) {
      id
      settings
    }
  }
`;

export const editAccountSettingMutation = gqlV2/* GraphQL */ `
  mutation EditAccountSetting($collectiveId: Int!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: { legacyId: $collectiveId }, key: $key, value: $value) {
      id
      settings
    }
  }
`;

/** A mutation used by child components to update the collective */
export const editCollectiveLongDescriptionMutation = gql`
  mutation EditCollectiveLongDescription($id: Int!, $longDescription: String) {
    editCollective(collective: { id: $id, longDescription: $longDescription }) {
      id
      longDescription
    }
  }
`;

export const editCollectiveAvatarMutation = gql`
  mutation EditCollectiveAvatar($id: Int!, $image: String) {
    editCollective(collective: { id: $id, image: $image }) {
      id
      image
      imageUrl(height: 256)
    }
  }
`;

export const editCollectiveBackgroundMutation = gql`
  mutation EditCollectiveBackground($id: Int!, $settings: JSON, $backgroundImage: String) {
    editCollective(collective: { id: $id, settings: $settings, backgroundImage: $backgroundImage }) {
      id
      settings
      backgroundImage
      backgroundImageUrl
    }
  }
`;
