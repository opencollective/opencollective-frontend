import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { FormattedMessage } from 'react-intl';

import StyledButton from '../StyledButton';

class RejectExpenseBtn extends React.Component {
  static propTypes = {
    id: PropTypes.number.isRequired,
    rejectExpense: PropTypes.func.isRequired,
    refetch: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  async onClick() {
    const { id } = this.props;
    await this.props.rejectExpense(id);
    await this.props.refetch();
  }

  render() {
    return (
      <div className="RejectExpenseBtn" data-cy="reject-expense-btn">
        <StyledButton mr={2} my={1} width="100%" className="reject" buttonStyle="danger" onClick={this.onClick}>
          <FormattedMessage id="expense.reject.btn" defaultMessage="Reject" />
        </StyledButton>
      </div>
    );
  }
}

const rejectExpenseQuery = gql`
  mutation rejectExpense($id: Int!) {
    rejectExpense(id: $id) {
      id
      status
    }
  }
`;

const addMutation = graphql(rejectExpenseQuery, {
  props: ({ mutate }) => ({
    rejectExpense: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});

export default addMutation(RejectExpenseBtn);
