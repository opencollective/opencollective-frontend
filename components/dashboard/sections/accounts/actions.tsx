import { ArrowLeftRight, Coins, Globe2, LayoutDashboard, Receipt } from 'lucide-react';
import { useIntl } from 'react-intl';

import type { GetActions } from '../../../../lib/actions/types';
import type { DashboardAccountsQueryFieldsFragment } from '../../../../lib/graphql/types/v2/graphql';

import { useModal } from '../../../ModalContext';

import InternalTransferModal from './InternalTransferModal';

export function useAccountActions<T extends DashboardAccountsQueryFieldsFragment>({ accounts = null } = {}) {
  const intl = useIntl();

  const { showModal } = useModal();

  const getActions: GetActions<T> = (account: T, onCloseFocusRef?: React.MutableRefObject<HTMLElement>) => {
    if (!account) {
      return {};
    }

    // 1. Add “Go to Dashboard”
    // 2. Add “Go to Public Profile”
    // 3. Add “Submit Payment Request” (if there is a positive balance and spending is enabled on the account)
    // 4. Add “View Transactions” (disabled to indicate that there aren’t any?)
    // 5. Add “View Disbursements” (disabled to indicate that there aren’t any?)
    // 6. Add “View Contributions” (disabled to indicate that there aren’t any?)
    // 7. Add “View Activity Logs”

    return {
      primary: [
        {
          key: 'transfer',
          label: intl.formatMessage({ defaultMessage: 'New internal transfer', id: 'v4unZI' }),
          if: accounts?.length > 1,
          onClick: () => {
            showModal(
              InternalTransferModal,
              {
                accounts: accounts,
                defaultFromAccount: account,
                onCloseFocusRef,
              },
              `internal-transfer-${account.id}`,
            );
          },
          Icon: ArrowLeftRight,
        },
        {
          key: 'submit-expense',
          label: 'Submit Payment Request',
          Icon: Receipt,
          onClick: () => {
            console.log('click');
          },
        },
      ].filter(a => a.if ?? true),
      secondary: [
        {
          key: 'dashboard',
          label: 'Go to Dashboard',
          Icon: LayoutDashboard,
          onClick: () => {
            console.log('dashboard');
          },
        },
        {
          key: 'profile',
          label: 'Go to Public Profile',
          Icon: Globe2,
          onClick: () => {
            console.log('click');
          },
        },

        {
          key: 'transactions',
          label: 'View Transactions',
          Icon: ArrowLeftRight,
          onClick: () => {
            console.log('click');
          },
        },
        {
          key: 'view-expenses',
          label: 'View Expenses',
          Icon: Receipt,
          onClick: () => {
            console.log('click');
          },
        },
        {
          key: 'view-expenses',
          label: 'View Contributions',
          Icon: Coins,
          onClick: () => {
            console.log('click');
          },
        },
        {
          key: 'view-expenses',
          label: 'View Activity Logs',
          Icon: Coins,
          onClick: () => {
            console.log('click');
          },
        },
      ],
    };
  };

  return getActions;
}
