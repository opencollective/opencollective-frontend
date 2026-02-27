import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { get } from 'lodash';

import { DISMISSABLE_HELP_MESSAGE_KEY } from '../lib/constants/dismissable-help-message';
import { gql } from '../lib/graphql/helpers';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { getFromLocalStorage, setLocalStorage } from '../lib/local-storage';

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

const getSettingsKeys = (messageId: string, accountId?: number | string) => {
  return {
    globalKey: `${DISMISSABLE_HELP_MESSAGE_KEY}.${messageId}`,
    scopedKey: !accountId ? undefined : `${DISMISSABLE_HELP_MESSAGE_KEY}.${messageId}.account_${accountId}`,
  };
};

const getIsDismissedLocally = ({ globalKey, scopedKey }: { globalKey: string; scopedKey?: string }) => {
  return getFromLocalStorage(globalKey) || (scopedKey && getFromLocalStorage(scopedKey));
};

const getIsDismissedInSettings = (settings: Record<string, unknown>, globalKey: string, scopedKey?: string) => {
  const globalSetting = get(settings, globalKey);

  if (!globalSetting) {
    return false;
  } else if (typeof globalSetting === 'boolean') {
    // Only look at boolean value; if the global setting is an object, it means it's a scoped setting
    return globalSetting;
  }

  return get(settings, scopedKey, false);
};

type DismissibleMessageProps = {
  children: (args: { dismiss: () => void }) => React.ReactNode;
  messageId: string;
  /** If set, the key for this message will be scoped to this specific account, meaning the message will only be dismissed for this account */
  accountId?: number | string;
  dismissedComponent?: React.ReactNode;
  displayForLoggedOutUser?: boolean;
};

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
  messageId,
  accountId,
}: DismissibleMessageProps) => {
  const { LoggedInUser, loadingLoggedInUser } = useLoggedInUser();
  const settingsKeys = getSettingsKeys(messageId, accountId);
  const [isDismissedLocally, setDismissedLocally] = React.useState<boolean>(() =>
    Boolean(getIsDismissedLocally(settingsKeys)),
  );
  const [dismissMessage] = useMutation(dismissMessageMutation);
  const { data, loading } = useQuery(accountSettingsQuery, {
    skip: !LoggedInUser,
    fetchPolicy: 'network-only',
  });

  const loggedInAccount = data?.loggedInAccount || LoggedInUser;
  // Hide it if SSR or still loading user
  if (typeof window === 'undefined' || loading || loadingLoggedInUser) {
    return null;
  } else if (
    isDismissedLocally ||
    (!loggedInAccount && !displayForLoggedOutUser) ||
    getIsDismissedInSettings(loggedInAccount?.settings, settingsKeys.globalKey, settingsKeys.scopedKey)
  ) {
    // Don't show message if user is not logged in or if dismissed
    return dismissedComponent ? dismissedComponent : null;
  }

  return children({
    dismiss: () => {
      setDismissedLocally(true);
      const primaryKey = settingsKeys.scopedKey || settingsKeys.globalKey;
      setLocalStorage(primaryKey, 'true');
      return (
        loggedInAccount &&
        dismissMessage({
          variables: { account: { id: loggedInAccount.id }, key: primaryKey },
        })
      );
    },
  });
};

export default DismissibleMessage;
