import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import ConfirmationModal from '../ConfirmationModal';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import { P } from '../Text';

const MarkExpenseAsUnpaidButton = ({ onConfirm, ...props }) => {
  const [hasModal, setHasModal] = React.useState(false);
  const [refundPaymentProcessorFee, setRefundPaymentProcessorFee] = React.useState(true);

  const button = (
    <StyledButton {...props} buttonStyle="dangerSecondary" onClick={() => setHasModal(true)}>
      <FormattedMessage id="expense.markAsUnpaid.btn" defaultMessage="Mark as unpaid" />
    </StyledButton>
  );

  if (!hasModal) {
    return button;
  }

  return (
    <React.Fragment>
      {button}
      <ConfirmationModal
        show
        header={<FormattedMessage id="Expense.markAsUnpaid" defaultMessage="Mark expense as unpaid" />}
        width="100%"
        minWidth={280}
        maxWidth={450}
        isDanger
        onClose={() => setHasModal(false)}
        data-cy="mark-expense-as-unpaid-modal"
        continueHandler={async () => {
          try {
            await onConfirm(refundPaymentProcessorFee);
          } catch (e) {
            setHasModal(false);
            throw e;
          }
        }}
      >
        <P mb={4}>
          <FormattedMessage
            id="Expense.markAsUnpaid.details"
            defaultMessage="The amount will be credited back to the Collective balance."
          />
        </P>
        <StyledCheckbox
          name="processorFeeRefunded"
          checked={refundPaymentProcessorFee}
          onChange={({ checked }) => setRefundPaymentProcessorFee(checked)}
          label={
            <FormattedMessage
              id="processorFeeRefunded.checkbox.label"
              defaultMessage="Also refund payment processor fees?"
            />
          }
        />
      </ConfirmationModal>
    </React.Fragment>
  );
};

MarkExpenseAsUnpaidButton.propTypes = {
  onConfirm: PropTypes.func.isRequired,
};

export default MarkExpenseAsUnpaidButton;
