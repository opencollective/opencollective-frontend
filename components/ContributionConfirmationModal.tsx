import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { ConfirmContributionForm } from './contributions/ConfirmContributionForm';
import Container from './Container';
import StyledButton from './StyledButton';
import StyledModal, { CollectiveModalHeader, ModalBody, ModalFooter } from './StyledModal';

const ContributionConfirmationModal = ({ order, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);

  return (
    <StyledModal width="578px" onClose={onClose}>
      <CollectiveModalHeader
        collective={order.toAccount}
        customText={
          <FormattedMessage
            defaultMessage="Confirm contribution to {payee}"
            id="nvYvGO"
            values={{ payee: order.toAccount.name }}
          />
        }
      />
      <ConfirmContributionForm
        order={order}
        onSubmit={() => setSubmitting(true)}
        onFailure={() => setSubmitting(false)}
        onSuccess={() => {
          onClose();
          onSuccess();
        }}
        FormBodyContainer={ModalBody}
        footer={
          <ModalFooter isFullWidth>
            <Container display="flex" justifyContent={['center', 'flex-end']} flexWrap="wrap">
              <StyledButton
                buttonStyle="secondary"
                onClick={onClose}
                mr={[0, '16px']}
                mb={['16px', 0]}
                minWidth={['268px', 0]}
                type="button"
                disabled={submitting}
              >
                <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
              </StyledButton>
              <StyledButton
                minWidth={240}
                buttonStyle="primary"
                loading={submitting}
                type="submit"
                data-cy="order-confirmation-modal-submit"
              >
                <FormattedMessage defaultMessage="Confirm contribution" id="k/uy+b" />
              </StyledButton>
            </Container>
          </ModalFooter>
        }
      />
    </StyledModal>
  );
};

ContributionConfirmationModal.propTypes = {
  /** the order that is being confirmed */
  order: PropTypes.object,
  /** handles how the modal is closed */
  onClose: PropTypes.func.isRequired,
  /** Called if the action request is successful */
  onSuccess: PropTypes.func,
};

export default ContributionConfirmationModal;
