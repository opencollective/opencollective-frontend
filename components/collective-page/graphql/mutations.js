import { gql } from '../../../lib/graphql/helpers';

export const editAccountSettingMutation = gql`
  mutation EditAccountSettingByLegacyId($collectiveId: Int!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: { legacyId: $collectiveId }, key: $key, value: $value) {
      id
      settings
    }
  }
`;
