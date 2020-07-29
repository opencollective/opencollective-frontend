import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';
import gql from 'graphql-tag';
import { FormattedMessage } from 'react-intl';

import { getErrorFromGraphqlException } from '../../lib/errors';

import StyledButton from '../StyledButton';

class RejectExpenseBtn extends React.Component {
  static propTypes = {
    id: PropTypes.number.isRequired,
    rejectExpense: PropTypes.func.isRequired,
    refetch: PropTypes.func,
    onError: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  async onClick() {
    const { id } = this.props;
    try {
      await this.props.rejectExpense(id);
      await this.props.refetch();
    } catch (e) {
      const error = getErrorFromGraphqlException(e).message;
      this.props.onError(error);
    }
  }

  render() {
    return (
      <div className="RejectExpenseBtn" data-cy="reject-expense-btn">
        <StyledButton mr={2} my={1} width="100%" className="reject" buttonStyle="danger" onClick={this.onClick}>
          <FormattedMessage id="actions.reject" defaultMessage="Reject" />
        </StyledButton>
      </div>
    );
  }
}

const rejectExpensemutation = gql`
  mutation RejectExpense($id: Int!) {
    rejectExpense(id: $id) {
      id
      status
    }
  }
`;

const addRejectExpensemutation = graphql(rejectExpensemutation, {
  props: ({ mutate }) => ({
    rejectExpense: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});

export default addRejectExpensemutation(RejectExpenseBtn);
