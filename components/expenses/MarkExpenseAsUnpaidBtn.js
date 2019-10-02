import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { FormattedMessage } from 'react-intl';

import StyledButton from '../StyledButton';

const MarkExpenseAsUnpaidBtn = ({ id, markExpenseAsUnpaid }) => {
  async function handleOnClick() {
    try {
      await markExpenseAsUnpaid(id);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <StyledButton onClick={() => handleOnClick()} mt={2} buttonStyle="secondary">
      <FormattedMessage id="expense.markAsUnpaid.btn" defaultMessage="mark as unpaid" />
    </StyledButton>
  );
};

MarkExpenseAsUnpaidBtn.propTypes = {
  id: PropTypes.number.isRequired,
  markExpenseAsUnpaid: PropTypes.func.isRequired,
};

const markExpenseAsUnpaidQuery = gql`
  mutation markExpenseAsUnpaid($id: Int!) {
    markExpenseAsUnpaid(id: $id) {
      id
      status
    }
  }
`;

const addMutation = graphql(markExpenseAsUnpaidQuery, {
  props: ({ mutate }) => ({
    markExpenseAsUnpaid: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});

export default addMutation(MarkExpenseAsUnpaidBtn);
