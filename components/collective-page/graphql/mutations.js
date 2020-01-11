import gql from 'graphql-tag';

export const EditCollectiveSettingsMutation = gql`
  mutation EditCollectiveSettings($id: Int!, $settings: JSON) {
    editCollective(collective: { id: $id, settings: $settings }) {
      id
      settings
    }
  }
`;

/** A mutation used by child components to update the collective */
export const EditCollectiveLongDescriptionMutation = gql`
  mutation EditCollective($id: Int!, $longDescription: String) {
    editCollective(collective: { id: $id, longDescription: $longDescription }) {
      id
      longDescription
    }
  }
`;

export const EditAvatarMutation = gql`
  mutation EditCollectiveImage($id: Int!, $image: String) {
    editCollective(collective: { id: $id, image: $image }) {
      id
      image
      imageUrl
    }
  }
`;

export const EditCollectiveBackgroundMutation = gql`
  mutation EditCollective($id: Int!, $settings: JSON, $backgroundImage: String) {
    editCollective(collective: { id: $id, settings: $settings, backgroundImage: $backgroundImage }) {
      id
      settings
      backgroundImage
      backgroundImageUrl
    }
  }
`;
