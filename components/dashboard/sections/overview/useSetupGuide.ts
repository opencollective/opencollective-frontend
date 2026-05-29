import React from 'react';
import { useMutation } from '@apollo/client';

import useLoggedInUser from '@/lib/hooks/useLoggedInUser';

import { DashboardContext } from '../../DashboardContext';

import { editAccountSettingMutation } from './queries';

export function useSetupGuide(): [boolean | undefined, (open: boolean) => Promise<void>] {
  const { account } = React.useContext(DashboardContext);
  const { LoggedInUser, refetchLoggedInUser } = useLoggedInUser();
  const [showSetupGuide, setShowSetupGuide] = React.useState<boolean | undefined>(undefined);
  const [editAccountSetting] = useMutation(editAccountSettingMutation);

  React.useEffect(() => {
    if (showSetupGuide === undefined && LoggedInUser && account) {
      const showGuide = LoggedInUser.shouldDisplaySetupGuide(account);
      setShowSetupGuide(showGuide !== false);
    }
  }, [showSetupGuide, LoggedInUser, account]);

  const handleSetupGuideToggle = React.useCallback(
    async (open: boolean) => {
      setShowSetupGuide(open);
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
