import { gql, useMutation } from '@apollo/client';
import { API_V2_CONTEXT } from '../graphql/helpers';
import { ActionType, GetActions } from './types';
import { Host, VirtualCard } from '../graphql/types/v2/graphql';
import { useIntl } from 'react-intl';
import { useModal } from '../../components/ModalContext';

import EditVirtualCardModal from '../../components/edit-collective/EditVirtualCardModal';
import { toast } from '../../components/ui/useToast';
import React from 'react';
const pauseCardMutation = gql`
  mutation PauseVirtualCard($virtualCard: VirtualCardReferenceInput!) {
    pauseVirtualCard(virtualCard: $virtualCard) {
      id
      data
      status
    }
  }
`;

const resumeCardMutation = gql`
  mutation ResumeVirtualCard($virtualCard: VirtualCardReferenceInput!) {
    resumeVirtualCard(virtualCard: $virtualCard) {
      id
      data
      status
    }
  }
`;

export const useVirtualCardActions = ({ host }: { host: Host }) => {
  const intl = useIntl();
  const [pauseCard, { loading: pauseLoading }] = useMutation(pauseCardMutation, {
    context: API_V2_CONTEXT,
  });
  const [resumeCard, { loading: resumeLoading }] = useMutation(resumeCardMutation, {
    context: API_V2_CONTEXT,
  });

  const { showModal, showConfirmationModal } = useModal();
  const handleActionSuccess = React.useCallback(
    message => {
      toast({
        variant: 'success',
        message: message,
      });
    },
    [toast],
  );

  const getActions: GetActions<VirtualCard> = (
    virtualCard: VirtualCard,
    onCloseFocusRef?: React.RefObject<HTMLElement>,
    refetch?: () => void,
  ) => {
    const isActive = virtualCard.data.status === 'active' || virtualCard.data.state === 'OPEN';
    const isCanceled = virtualCard.data.status === 'canceled';

    const handlePauseUnpause = async () => {
      try {
        if (isActive) {
          await pauseCard({ variables: { virtualCard: { id: virtualCard.id } } });
          //   handleActionSuccess(<FormattedMessage defaultMessage="Card paused" id="6cdzhs" />);
        } else {
          await resumeCard({ variables: { virtualCard: { id: virtualCard.id } } });
          //   handleActionSuccess(<FormattedMessage defaultMessage="Card resumed" id="3hR6A8" />);
        }
      } catch (e) {
        // props.onError(e);
      }
    };

    const isLoading = pauseLoading || resumeLoading;
    const confirmOnPauseCard = true;
    return [
      {
        if: virtualCard.provider === 'STRIPE',
        type: ActionType.PRIMARY,
        label: isActive
          ? intl.formatMessage({ defaultMessage: 'Pause Card', id: 'VirtualCards.PauseCard' })
          : intl.formatMessage({ defaultMessage: 'Resume Card', id: 'VirtualCards.ResumeCard' }),
        onClick: e => {
          // e.preventDefault();

          confirmOnPauseCard && isActive
            ? showConfirmationModal({
                title: intl.formatMessage({ defaultMessage: 'Pause Virtual Card', id: 'VirtualCards.PauseCard' }),
                description: intl.formatMessage({
                  defaultMessage: 'This will pause the virtual card. To unpause, you will need to contact the host.',
                  id: '6VPa5L',
                }),
                continueLabel: intl.formatMessage({ defaultMessage: 'Pause Card', id: 'VirtualCards.PauseCard' }),
                continueHandler: async () => await handlePauseUnpause(),
                onCloseFocusRef,
              })
            : handlePauseUnpause();
          // handlePauseUnpause();
        },
        isLoading: isLoading,
        disabled: isLoading || isCanceled,
      },
      {
        type: ActionType.PRIMARY,
        // if: canEditVirtualCard,
        label: intl.formatMessage({ defaultMessage: 'Edit', id: 'Edit' }),
        onClick: () => {
          showModal(EditVirtualCardModal, {
            onCloseFocusRef,
            host: host,
            virtualCard,
            onSuccess: message =>
              toast({
                variant: 'success',
                message,
              }),
          });
        },
      },
      // {virtualCard.provider === 'STRIPE' && (
      //   <DropdownMenuItem
      //     onClick={e => {
      //       e.preventDefault();
      //       confirmOnPauseCard && isActive ? setShowConfirmationModal(true) : handlePauseUnpause();
      //     }}
      //     disabled={isLoading || isCanceled}
      //   >
      //     {isActive ? (
      //       <FormattedMessage id="VirtualCards.PauseCard" defaultMessage="Pause Card" />
      //     ) : (
      //       <FormattedMessage id="VirtualCards.ResumeCard" defaultMessage="Resume Card" />
      //     )}
      //     {isLoading && <StyledSpinner ml={2} size="0.9em" mb="2px" />}
      //   </DropdownMenuItem>
      // )}
    ].filter(a => a.if ?? true);
  };

  return { getActions };
};
