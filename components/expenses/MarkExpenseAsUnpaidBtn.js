import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { FormattedMessage } from 'react-intl';

import StyledButton from '../StyledButton';
import StyledCheckBox from '../StyledCheckbox';

const MarkExpenseAsUnpaidBtn = ({ id, markExpenseAsUnpaid }) => {
  const [state, setState] = useState({
    showProcessorFeeConfirmation: false,
    processorFeeRefunded: false,
    disableBtn: false,
  });

  async function handleOnClickContinue() {
    try {
      setState({ ...state, disableBtn: true });
      await markExpenseAsUnpaid(id, state.processorFeeRefunded);
    } catch (err) {
      console.log('>>> payExpense error: ', err);
      setState({ ...state, disableBtn: false });
    }
  }

  return (
    <Fragment>
      {state.showProcessorFeeConfirmation ? (
        <Fragment>
          <StyledCheckBox
            name="processorFeeRefunded"
            checked={state.processorFeeRefunded}
            onChange={({ checked }) => setState({ ...state, processorFeeRefunded: checked })}
            label="Has the payout provider refunded the payment processor fees?"
          />
          <StyledButton
            mt={2}
            disabled={state.disableBtn}
            buttonStyle="primary"
            onClick={() => handleOnClickContinue()}
          >
            <FormattedMessage id="expense.markAsUnpaid.continue.btn" defaultMessage="Continue" />
          </StyledButton>
        </Fragment>
      ) : (
        <StyledButton onClick={() => setState({ ...state, showProcessorFeeConfirmation: true })} mt={2}>
          <FormattedMessage id="expense.markAsUnpaid.btn" defaultMessage="Mark as unpaid" />
        </StyledButton>
      )}
    </Fragment>
  );
};

MarkExpenseAsUnpaidBtn.propTypes = {
  id: PropTypes.number.isRequired,
  markExpenseAsUnpaid: PropTypes.func.isRequired,
};

const markExpenseAsUnpaidQuery = gql`
  mutation markExpenseAsUnpaid($id: Int!, $processorFeeRefunded: Boolean!) {
    markExpenseAsUnpaid(id: $id, processorFeeRefunded: $processorFeeRefunded) {
      id
      status
    }
  }
`;

const addMutation = graphql(markExpenseAsUnpaidQuery, {
  props: ({ mutate }) => ({
    markExpenseAsUnpaid: async (id, processorFeeRefunded) => {
      return await mutate({ variables: { id, processorFeeRefunded } });
    },
  }),
});

export default addMutation(MarkExpenseAsUnpaidBtn);
