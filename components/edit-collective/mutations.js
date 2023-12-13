import { gql, gqlV1 } from '../../lib/graphql/helpers';

export const editCollectiveSettingsMutation = gqlV1/* GraphQL */ `
  mutation EditCollectiveSettings($id: Int!, $settings: JSON) {
    editCollective(collective: { id: $id, settings: $settings }) {
      id
      settings
    }
  }
`;

export const editAccountSettingsMutation = gql`
  mutation EditAccountSetting($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      settings
    }
  }
`;
