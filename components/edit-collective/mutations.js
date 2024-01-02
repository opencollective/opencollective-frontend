import { gql } from '../../lib/graphql/helpers';

export const editAccountSettingsMutation = gql`
  mutation EditAccountSetting($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      settings
    }
  }
`;
