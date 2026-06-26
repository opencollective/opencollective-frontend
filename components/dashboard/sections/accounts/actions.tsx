import { Archive, ArrowLeftRight, Banknote, Coins, Globe2, LayoutDashboard, Logs, Receipt } from 'lucide-react';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

import type { GetActions } from '../../../../lib/actions/types';
import type { DashboardAccountsQueryFieldsFragment } from '../../../../lib/graphql/types/v2/graphql';
import { FEATURES } from '@/lib/allowed-features';
import { getCollectivePageRoute, getDashboardRoute } from '@/lib/url-helpers';

import { useModal } from '../../../ModalContext';

import { AddFundsModalAccount, ExpenseFlowModal } from './common';
import InternalTransferModal from './InternalTransferModal';

export function useAccountActions<T extends DashboardAccountsQueryFieldsFragment>({ accounts = null } = {}) {
  const intl = useIntl();
  const router = useRouter();
  const { showModal } = useModal();

  const getActions: GetActions<T> = (account: T, onCloseFocusRef?: React.MutableRefObject<HTMLElement>) => {
    if (!account) {
      return {};
    }

    const isAllowedAddFunds =
      Boolean(account.permissions?.addFunds?.allowed) && 'parent' in account ? account.parent.isHost : account.isHost;

    const dashboardBaseAccount = 'parent' in account ? account.parent : account;

    // The per-host platform-tips account is an internal billing account: money-movement and
    // contribution actions don't apply to it, so hide them.
    const isPlatformAccount = (account.type as string) === 'PLATFORM';

    return {
      primary: [
        {
          key: 'transfer',
          label: intl.formatMessage({ defaultMessage: 'New internal transfer', id: 'v4unZI' }),
          if: accounts?.length > 1 && !isPlatformAccount,
          onClick: () => {
            showModal(
              InternalTransferModal,
              {
                parentAccount: 'parent' in account ? account.parent : account,
                defaultFromAccount: account,
                onCloseFocusRef,
              },
              `internal-transfer-${account.id}`,
            );
          },
          Icon: ArrowLeftRight,
        },
        {
          key: 'add-funds',
          label: 'Add funds',
          if: isAllowedAddFunds && !isPlatformAccount,
          Icon: Banknote,
          onClick: () => {
            showModal(
              AddFundsModalAccount,
              { collective: account, ...('host' in account && { host: account.host }) },
              'add-funds-modal',
            );
          },
        },
        {
          key: 'submit-expense',
          label: 'Submit Payment Request',
          Icon: Receipt,
          if: !isPlatformAccount,
          onClick: () => {
            showModal(ExpenseFlowModal, { collective: account }, 'submit-payment-request');
          },
        },
      ].filter(a => a.if ?? true),
      secondary: [
        {
          key: 'dashboard',
          label: intl.formatMessage({ defaultMessage: 'Go to Dashboard', id: 'LxSJOb' }),
          Icon: LayoutDashboard,
          onClick: () => router.push(getDashboardRoute(account)),
        },
        {
          key: 'profile',
          label: intl.formatMessage({ defaultMessage: 'Go to Public Profile', id: 'lfSm7/' }),
          Icon: Globe2,
          onClick: () => router.push(getCollectivePageRoute(account)),
          if: account.features?.[FEATURES.PUBLIC_PROFILE] !== 'UNSUPPORTED',
        },
        {
          key: 'transactions',
          label: intl.formatMessage({ defaultMessage: 'View Transactions', id: 'viewTransactions' }),
          Icon: ArrowLeftRight,
          onClick: () => router.push(getDashboardRoute(dashboardBaseAccount, `transactions?account=${account.slug}`)),
        },
        {
          key: 'view-expenses',
          label: intl.formatMessage({ defaultMessage: 'View Expenses', id: '2nSnri' }),
          Icon: Receipt,
          onClick: () => router.push(getDashboardRoute(dashboardBaseAccount, `expenses?account=${account.slug}`)),
        },
        {
          key: 'view-contributions',
          label: intl.formatMessage({ defaultMessage: 'View Contributions', id: 'Ars4YO' }),
          Icon: Coins,
          if: !isPlatformAccount,
          onClick: () =>
            router.push(getDashboardRoute(dashboardBaseAccount, `incoming-contributions?account=${account.slug}`)),
        },
        {
          key: 'view-activity',
          label: intl.formatMessage({ defaultMessage: 'View Activity Logs', id: 'xnLFq2' }),
          Icon: Logs,
          onClick: () => router.push(getDashboardRoute(dashboardBaseAccount, `activity-log?account=${account.slug}`)),
        },
        {
          key: 'archive',
          label: intl.formatMessage({ defaultMessage: 'Archive', id: 'collective.archive.confirm.btn' }),
          Icon: Archive,
          onClick: () => router.push(getDashboardRoute(account, `advanced`)),
        },
      ].filter(a => a.if ?? true),
    };
  };

  return getActions;
}
