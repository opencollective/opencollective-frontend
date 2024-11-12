import { ArrowLeftRight } from 'lucide-react';
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
      ].filter(a => a.if ?? true),
    };
  };

  return getActions;
}
