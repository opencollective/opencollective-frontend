import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { FormattedMessage } from 'react-intl';

import StyledButton from '../StyledButton';

const UnapproveExpenseBtn = ({ id, unapproveExpense }) => {
  const handleOnClick = async () => {
    try {
      await unapproveExpense(id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <StyledButton mr={2} buttonStyle="secondary" onClick={() => handleOnClick()}>
      <FormattedMessage id="expense.unapprove.btn" defaultMessage="Unapprove" />
    </StyledButton>
  );
};

UnapproveExpenseBtn.propTypes = {
  id: PropTypes.number.isRequired,
  unapproveExpense: PropTypes.func.isRequired,
};

const unapproveExpenseQuery = gql`
  mutation unapproveExpense($id: Int!) {
    unapproveExpense(id: $id) {
      id
      status
    }
  }
`;

const addMutation = graphql(unapproveExpenseQuery, {
  props: ({ mutate }) => ({
    unapproveExpense: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});

export default addMutation(UnapproveExpenseBtn);
