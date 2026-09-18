import React from 'react';
import { useMutation } from '@apollo/client';

import useLoggedInUser from '@/lib/hooks/useLoggedInUser';

import { DashboardContext } from '../../DashboardContext';

import { editAccountSettingMutation } from './queries';

export function useSetupGuide(): [boolean | undefined, (open: boolean) => Promise<void>] {
  const { account } = React.useContext(DashboardContext);
  const { LoggedInUser, refetchLoggedInUser } = useLoggedInUser();
  const [showSetupGuideOverride, setShowSetupGuideOverride] = React.useState<boolean | undefined>(undefined);
  const [editAccountSetting] = useMutation(editAccountSettingMutation);

  const defaultShowSetupGuide =
    LoggedInUser && account ? LoggedInUser.shouldDisplaySetupGuide(account) !== false : undefined;
  const showSetupGuide = showSetupGuideOverride ?? defaultShowSetupGuide;

  const handleSetupGuideToggle = React.useCallback(
    async (open: boolean) => {
      setShowSetupGuideOverride(open);
      await editAccountSetting({
        variables: {
          account: { legacyId: LoggedInUser.collective.id },
          key: `showSetupGuide.id${account.legacyId}`,
          value: open,
        },
      }).catch(() => {});
      await refetchLoggedInUser();
    },
    [account, LoggedInUser, editAccountSetting, refetchLoggedInUser],
  );

  return [showSetupGuide, handleSetupGuideToggle];
}
