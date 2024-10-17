import React from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { get } from 'lodash';

import { BANNER, DISMISSABLE_HELP_MESSAGE_KEY, HELP_MESSAGE } from '../lib/constants/dismissable-help-message';
import { API_V2_CONTEXT, gql } from '../lib/graphql/helpers';
import { getFromLocalStorage, setLocalStorage } from '../lib/local-storage';

import { withUser } from './UserProvider';

const accountSettingsQuery = gql`
  query AccountSettings {
    loggedInAccount {
      id
      settings
    }
  }
`;

const dismissMessageMutation = gql`
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
const DismissibleMessage = ({
  children,
  dismissedComponent,
  displayForLoggedOutUser,
  loadingLoggedInUser,
  LoggedInUser,
  messageId,
}) => {
  const settingsKey = `${DISMISSABLE_HELP_MESSAGE_KEY}.${messageId}`;
  const [isDismissedLocally, setDismissedLocally] = React.useState(getFromLocalStorage(settingsKey));
  const [dismissMessage] = useMutation(dismissMessageMutation, {
    context: API_V2_CONTEXT,
  });
  const { data, loading } = useQuery(accountSettingsQuery, {
    context: API_V2_CONTEXT,
    skip: !LoggedInUser,
    fetchPolicy: 'network-only',
  });

  const loggedInAccount = data?.loggedInAccount || LoggedInUser?.collective;
  // Hide it if SSR or still loading user
  if (typeof window === 'undefined' || loading || loadingLoggedInUser) {
    return null;
  } else if (
    isDismissedLocally ||
    (!loggedInAccount && !displayForLoggedOutUser) ||
    get(loggedInAccount, `settings.${settingsKey}`)
  ) {
    // Don't show message if user is not logged in or if dismissed
    return dismissedComponent ? dismissedComponent : null;
  }

  return children({
    dismiss: () => {
      setDismissedLocally(true);
      setLocalStorage(settingsKey, 'true');
      return (
        loggedInAccount &&
        dismissMessage({
          variables: { account: { id: loggedInAccount.id }, key: settingsKey },
        })
      );
    },
  });
};

DismissibleMessage.propTypes = {
  messageId: PropTypes.oneOf([...Object.values(HELP_MESSAGE), ...Object.values(BANNER)]).isRequired,
  displayForLoggedOutUser: PropTypes.bool,
  loadingLoggedInUser: PropTypes.bool,
  /** A function to render the actual message */
  children: PropTypes.func.isRequired,
  /** A component we can display if the message was already dismissed once */
  dismissedComponent: PropTypes.object,
  /** @ignore from withUser */
  LoggedInUser: PropTypes.object,
};

export default withUser(DismissibleMessage);
