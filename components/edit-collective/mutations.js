import gql from 'graphql-tag';

import { gqlV2 } from '../../lib/graphql/helpers';

export const editCollectiveSettingsMutation = gql`
  mutation EditCollectiveSettings($id: Int!, $settings: JSON) {
    editCollective(collective: { id: $id, settings: $settings }) {
      id
      settings
    }
  }
`;

export const editAccountSettingsMutation = gqlV2/* GraphQL */ `
  mutation EditAccountSetting($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      settings
    }
  }
`;
