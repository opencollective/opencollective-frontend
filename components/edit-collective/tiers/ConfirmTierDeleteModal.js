import React from 'react';
import PropTypes from 'prop-types';
import { Trash } from '@styled-icons/boxicons-regular/Trash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Flex } from '../../Grid';
import StyledButton from '../../StyledButton';
import StyledHr from '../../StyledHr';
import StyledModal, { ModalFooter, ModalHeader } from '../../StyledModal';
import { P } from '../../Text';
import { Switch } from '../../ui/Switch';

const CancelDeleteModalButton = styled(StyledButton)`
  @media (max-width: 700px) {
    order: 1;
  }
`;

const ConfirmDeleteModalButton = styled(StyledButton)`
  @media (max-width: 700px) {
    order: 0;
  }
`;

const DeleteModalActionsContainer = styled(Flex)`
  justify-content: space-between;
  flex-wrap: wrap;
  @media (max-width: 700px) {
    gap: 1em;
  }
`;

export default function ConfirmTierDeleteModal({ isDeleting, onClose, onConfirmDelete, tier }) {
  const [keepRecurringContributions, setKeepRecurringContributions] = React.useState(true);
  const action = (
    <FormattedMessage
      defaultMessage="Delete {type, select, TICKET {Ticket} other {Tier}}"
      values={{ type: tier.type }}
    />
  );

  return (
    <StyledModal>
      <ModalHeader hideCloseIcon>{action}</ModalHeader>
      <P mt="1.2em">
        <FormattedMessage defaultMessage="The tier will be deleted forever and can't be retrieved." />
      </P>
      <StyledHr my="1.2em" />
      <Flex gap="2em" mb="1.2em" alignItems="center" justifyContent="space-between">
        <Flex flexDirection="column">
          <P fontWeight="bold">
            <FormattedMessage defaultMessage="Do you want to continue recurring contributions?" />
          </P>
          <P mt={1} color="black.500">
            <FormattedMessage defaultMessage="If yes, you will still receive existing recurring contributions for this deleted tier." />
          </P>
        </Flex>
        <Switch
          checked={keepRecurringContributions}
          onCheckedChange={checked => setKeepRecurringContributions(checked)}
        />
      </Flex>
      <ModalFooter isFullWidth dividerMargin="1.2em 0">
        <DeleteModalActionsContainer>
          <CancelDeleteModalButton
            flexGrow={1}
            type="button"
            data-cy="cancel-delete-btn"
            disabled={isDeleting}
            buttonStyle="secondary"
            mx={2}
            minWidth={100}
            onClick={onClose}
          >
            <FormattedMessage defaultMessage="Don't Delete" />
          </CancelDeleteModalButton>
          <ConfirmDeleteModalButton
            flexGrow={1}
            type="button"
            data-cy="confirm-delete-btn"
            disabled={isDeleting}
            mx={2}
            buttonStyle="danger"
            minWidth={100}
            onClick={() => onConfirmDelete(keepRecurringContributions)}
          >
            <Flex alignItems="center" justifyContent="center">
              <Flex alignItems="center" mr={1}>
                <Trash size="1em" />
              </Flex>
              {action}
            </Flex>
          </ConfirmDeleteModalButton>
        </DeleteModalActionsContainer>
      </ModalFooter>
    </StyledModal>
  );
}

ConfirmTierDeleteModal.propTypes = {
  isDeleting: PropTypes.bool,
  onClose: PropTypes.func,
  onConfirmDelete: PropTypes.func,
  tier: PropTypes.shape({
    type: PropTypes.string,
  }),
};
