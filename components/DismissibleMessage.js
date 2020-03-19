import React from 'react';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import { withUser } from './UserProvider';
import { HELP_MESSAGE, DISMISSABLE_HELP_MESSAGE_KEY } from '../lib/constants/dismissable-help-message';

const accountSettingsQuery = gqlV2`
  query AccountSettings {
    loggedInAccount {
      id
      settings
    }
  }
`;

const editAccountSettingsMutation = gqlV2`
  mutation DismissMessage($account: AccountReferenceInput!, $key: AccountSettingsKey!) {
    editAccountSetting(account: $account, key: $key, value: true) {
      id
      settings
    }
  }
`;

/**
 * A message that can be dismissed by the user. Saves a flag into user settings to make
 * sure it won't be displayed again in the future.
 *
 * Messages will never be displayed if user is not logged in.
 */
const DismissibleMessage = ({ LoggedInUser, messageId, children }) => {
  const settingsKey = `${DISMISSABLE_HELP_MESSAGE_KEY}.${messageId}`;
  const [isDismissedLocally, setDismissedLocally] = React.useState(false);
  const [editAccountSettings] = useMutation(editAccountSettingsMutation, {
    context: API_V2_CONTEXT,
  });
  const { data } = useQuery(accountSettingsQuery, {
    context: API_V2_CONTEXT,
    skip: !LoggedInUser,
    fetchPolicy: 'network-only',
  });

  const loggedInAccount = data?.loggedInAccount;
  if (isDismissedLocally || !loggedInAccount || get(loggedInAccount, `settings.${settingsKey}`)) {
    // Don't show message if user is not logged in or if dismissed
    return null;
  }

  return children({
    dismiss: () => {
      setDismissedLocally(true);
      return editAccountSettings({
        variables: { account: { id: loggedInAccount.id }, key: settingsKey },
      });
    },
  });
};

DismissibleMessage.propTypes = {
  messageId: PropTypes.oneOf(Object.values(HELP_MESSAGE)).isRequired,
  /** A function to render the actual message */
  children: PropTypes.func.isRequired,
  /** @ignore from withUser */
  LoggedInUser: PropTypes.object,
};

export default withUser(DismissibleMessage);
