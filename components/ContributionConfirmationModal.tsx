import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { ConfirmContributionForm } from './contributions/ConfirmContributionForm';
import { Button } from './ui/Button';
import Container from './Container';
import StyledModal, { CollectiveModalHeader, ModalBody, ModalFooter } from './StyledModal';

interface ContributionConfirmationModalProps {
  /** the order that is being confirmed */
  order?: {
    toAccount: React.ComponentProps<typeof CollectiveModalHeader>['collective'];
  } & React.ComponentProps<typeof ConfirmContributionForm>['order'];
  /** handles how the modal is closed */
  onClose(...args: unknown[]): unknown;
  /** Called if the action request is successful */
  onSuccess?(...args: unknown[]): unknown;
}

const ContributionConfirmationModal = ({ order, onClose, onSuccess }: ContributionConfirmationModalProps) => {
  const [submitting, setSubmitting] = useState(false);

  return (
    <StyledModal onClose={onClose}>
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
              <Button
                variant="secondary"
                onClick={onClose}
                type="button"
                disabled={submitting}
                className="mr-0 mb-4 min-w-[268px] md:mr-4 md:mb-0 md:min-w-0"
              >
                <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
              </Button>
              <Button
                variant="default"
                loading={submitting}
                type="submit"
                data-cy="order-confirmation-modal-submit"
                className="min-w-[240px]"
              >
                <FormattedMessage defaultMessage="Confirm contribution" id="k/uy+b" />
              </Button>
            </Container>
          </ModalFooter>
        }
      />
    </StyledModal>
  );
};

export default ContributionConfirmationModal;
