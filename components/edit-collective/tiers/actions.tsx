import React from 'react';
import { useMutation } from '@apollo/client';
import { ArrowDown, ArrowUp, Edit, Power, PowerOff, Trash2 } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { GetActions } from '../../../lib/actions/types';
import { getErrorFromGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../../lib/graphql/helpers';
import type { Account, Tier } from '../../../lib/graphql/types/v2/schema';

import type { BaseModalProps } from '../../ModalContext';
import { useModal } from '../../ModalContext';
import { editAccountSettingsMutation } from '../mutations';

import EditTierModal from './EditTierModal';

type TierRow = Tier | { id: 'custom'; type: 'CUSTOM'; name: string; description?: string };

// Wrapper component to adapt EditTierModal to BaseModalProps interface
const EditTierModalWrapper = ({
  tier,
  collective,
  onUpdate,
  forcedType = undefined,
  ...baseModalProps
}: {
  tier: Tier | null;
  collective: Account;
  onUpdate: () => void;
  forcedType?: string;
} & BaseModalProps) => {
  return (
    <EditTierModal
      tier={tier}
      collective={collective}
      onClose={() => baseModalProps.setOpen(false)}
      onUpdate={onUpdate}
      forcedType={forcedType}
    />
  );
};

const deleteTierMutation = gql`
  mutation DeleteTier($tier: TierReferenceInput!, $stopRecurringContributions: Boolean! = false) {
    deleteTier(tier: $tier, stopRecurringContributions: $stopRecurringContributions) {
      id
    }
  }
`;

interface UseTierActionsOptions {
  tiersOrderKey: string; // Required: TIERS_ORDER_KEY or TICKETS_ORDER_KEY
  data: TierRow[];
  collectiveId: number;
  isCustomContributionEnabled?: boolean;
  useIdAsKey?: boolean; // For tickets, use id instead of legacyId
  refetch: () => void;
  setError: (error: Error | null) => void;
  collective: Account; // Collective object needed for EditTierModal
  forcedType?: string; // Optional forced type (e.g., 'TICKET')
}

export function useTierActions({
  tiersOrderKey,
  data,
  isCustomContributionEnabled,
  useIdAsKey = false,
  refetch,
  setError,
  collective,
  forcedType,
}: UseTierActionsOptions): {
  getActions: GetActions<TierRow>;
  handleEdit: (tier: Tier | null) => void;
} {
  const intl = useIntl();
  const { showModal, showConfirmationModal } = useModal();
  const [deleteTier] = useMutation(deleteTierMutation, {
    context: API_V2_CONTEXT,
  });
  const [editAccountSettings] = useMutation(editAccountSettingsMutation, {
    context: API_V2_CONTEXT,
  });

  const handleEdit = (tier: Tier | null) => {
    const { closeModal } = showModal(EditTierModalWrapper, {
      tier,
      collective,
      onUpdate: () => {
        refetch();
        closeModal();
      },
      forcedType,
    });
  };

  const handleConfirmDelete = async (tier: Tier) => {
    try {
      await deleteTier({
        variables: {
          tier: { id: tier.id },
          stopRecurringContributions: false,
        },
      });
      refetch();
    } catch (e) {
      setError(getErrorFromGraphqlException(e));
      throw e;
    }
  };

  const handleDelete = (tier: Tier) => {
    const isTicket = forcedType === 'TICKET';
    if (isTicket) {
      showConfirmationModal({
        title: <FormattedMessage defaultMessage="Delete Ticket" id="DeleteTicket" />,
        description: (
          <FormattedMessage
            defaultMessage="Are you sure you want to delete this ticket? This action cannot be undone."
            id="DeleteTicketConfirmation"
          />
        ),
        variant: 'destructive',
        type: 'delete',
        onConfirm: async () => {
          await handleConfirmDelete(tier);
        },
      });
    } else {
      showConfirmationModal({
        title: <FormattedMessage defaultMessage="Delete Tier" id="DeleteTier" />,
        description: (
          <FormattedMessage
            defaultMessage="Are you sure you want to delete this tier? This action cannot be undone."
            id="DeleteTierConfirmation"
          />
        ),
        variant: 'destructive',
        type: 'delete',
        onConfirm: async () => {
          await handleConfirmDelete(tier);
        },
      });
    }
  };

  const handleReorder = async (newOrder: string[]) => {
    setError(null);
    try {
      await editAccountSettings({
        variables: {
          account: { legacyId: collective.id },
          key: tiersOrderKey,
          value: newOrder,
        },
      });
      // Refetch to get updated order
      refetch();
    } catch (e) {
      setError(getErrorFromGraphqlException(e));
    }
  };

  const getTierKey = (tier: TierRow): string => {
    if (tier.id === 'custom') {
      return 'custom';
    }
    const tierData = tier as Tier;
    // For tickets, always use id. For tiers, use legacyId if available, otherwise id
    if (useIdAsKey) {
      return String(tierData.id);
    }
    return String(tierData.legacyId || tierData.id);
  };

  const getActions: GetActions<TierRow> = (tier: TierRow, onCloseFocusRef) => {
    const actions: ReturnType<GetActions<TierRow>> = { primary: [], secondary: [] };
    const currentIndex = data.findIndex(t => getTierKey(t) === getTierKey(tier));
    const isCustom = tier.id === 'custom';

    // Handle custom contribution tier
    if (isCustom) {
      actions.primary.push({
        key: 'toggle-custom',
        label: isCustomContributionEnabled
          ? intl.formatMessage({ defaultMessage: 'Disable custom contribution', id: 'DisableCustomContribution' })
          : intl.formatMessage({ defaultMessage: 'Enable custom contribution', id: 'EnableCustomContribution' }),
        Icon: isCustomContributionEnabled ? PowerOff : Power,
        onClick: () => {
          editAccountSettings({
            variables: {
              account: { legacyId: collective.id },
              key: 'disableCustomContributions',
              value: isCustomContributionEnabled,
            },
            context: API_V2_CONTEXT,
          });
        },
        'data-cy': 'btn-toggle-custom-contribution',
      });

      return actions;
    }

    // Regular tier actions
    actions.primary.push({
      key: 'edit',
      label: intl.formatMessage({ defaultMessage: 'Edit', id: 'Edit' }),
      Icon: Edit,
      onClick: () => handleEdit(tier as Tier),
      'data-cy': 'btn-edit-tier',
    });

    actions.primary.push({
      key: 'delete',
      label: intl.formatMessage({ defaultMessage: 'Delete', id: 'actions.delete' }),
      Icon: Trash2,
      onClick: () => handleDelete(tier as Tier),
      'data-cy': 'btn-delete-tier',
    });

    // Reordering actions
    if (currentIndex > 0) {
      actions.secondary.push({
        key: 'move-up',
        label: intl.formatMessage({ defaultMessage: 'Move up', id: 'MoveUp' }),
        Icon: ArrowUp,
        onClick: () => {
          const newData = [...data];
          [newData[currentIndex - 1], newData[currentIndex]] = [newData[currentIndex], newData[currentIndex - 1]];
          const newOrder = newData.map(t => getTierKey(t));
          handleReorder(newOrder);
          onCloseFocusRef?.current?.focus();
        },
        'data-cy': 'btn-move-tier-up',
      });
    }

    if (currentIndex < data.length - 1) {
      actions.secondary.push({
        key: 'move-down',
        label: intl.formatMessage({ defaultMessage: 'Move down', id: 'MoveDown' }),
        Icon: ArrowDown,
        onClick: () => {
          const newData = [...data];
          [newData[currentIndex], newData[currentIndex + 1]] = [newData[currentIndex + 1], newData[currentIndex]];
          const newOrder = newData.map(t => getTierKey(t));
          handleReorder(newOrder);
          onCloseFocusRef?.current?.focus();
        },
        'data-cy': 'btn-move-tier-down',
      });
    }

    return actions;
  };

  return { getActions, handleEdit };
}
