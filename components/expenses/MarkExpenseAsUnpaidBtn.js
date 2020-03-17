import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import { getErrorFromGraphqlException } from '../../lib/errors';

import StyledButton from '../StyledButton';
import StyledCheckBox from '../StyledCheckbox';

const messages = defineMessages({
  'processorFeeRefunded.checkbox.label': {
    id: 'processorFeeRefunded.checkbox.label',
    defaultMessage: 'Also refund payment processor fees',
  },
});

const MarkExpenseAsUnpaidBtn = ({ id, markExpenseAsUnpaid, refetch, onError }) => {
  const [state, setState] = useState({
    showProcessorFeeConfirmation: false,
    processorFeeRefunded: false,
    disableBtn: false,
  });

  const intl = useIntl();

  async function handleOnClickContinue() {
    try {
      setState({ ...state, disableBtn: true });
      await markExpenseAsUnpaid(id, state.processorFeeRefunded);
      await refetch();
    } catch (err) {
      const error = getErrorFromGraphqlException(err).message;
      onError(error);
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
            label={intl.formatMessage(messages['processorFeeRefunded.checkbox.label'])}
          />
          <StyledButton
            mt={2}
            disabled={state.disableBtn}
            buttonStyle="primary"
            onClick={() => handleOnClickContinue()}
          >
            <FormattedMessage id="actions.continue" defaultMessage="Continue" />
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
  refetch: PropTypes.func,
  onError: PropTypes.func.isRequired,
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
