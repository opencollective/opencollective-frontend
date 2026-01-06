import { useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { useIntl } from 'react-intl';

import type { GetActions } from '@/lib/actions/types';
import { type KycVerificationActionsFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import { useModal } from '@/components/ModalContext';

import { RevokeKYCConfirmationDialog } from './RevokeKYCConfirmationDialog';

type UseKYCVerificationActionsOptions = {
  refetchQueries?: string[];
};

export function useKYCVerificationActions(opts: UseKYCVerificationActionsOptions = {}) {
  const intl = useIntl();
  const { showModal } = useModal();
  const onRevoke = useCallback(
    async (kycVerification: KycVerificationActionsFieldsFragment) => {
      showModal(RevokeKYCConfirmationDialog, {
        refetchQueries: opts.refetchQueries,
        kycVerification: kycVerification,
      });
    },
    [opts.refetchQueries, showModal],
  );

  const getActions = useCallback(
    (verification: KycVerificationActionsFieldsFragment) => {
      const actions: ReturnType<GetActions<KycVerificationActionsFieldsFragment>> = { primary: [], secondary: [] };
      if (verification.permissions.canRevokeKYCVerification) {
        actions.primary.push({
          key: 'revoke',
          label: intl.formatMessage({ defaultMessage: 'Revoke', id: 'tnRDuU' }),
          onClick: () => onRevoke(verification),
          Icon: Trash2,
        });
      }
      return actions;
    },
    [intl, onRevoke],
  );

  return getActions;
}
