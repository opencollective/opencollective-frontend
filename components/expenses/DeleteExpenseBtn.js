import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { FormattedMessage } from 'react-intl';

import SmallButton from '../SmallButton';

class DeleteExpenseBtn extends React.Component {
  static propTypes = {
    id: PropTypes.number.isRequired,
    deleteExpense: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  async onClick() {
    const { id } = this.props;
    const res = window.confirm('Do you want to delete this rejected expense?');
    if (res == true) {
      await this.props.deleteExpense(id);
    }
  }

  render() {
    return (
      <div className="DeleteExpenseBtn">
        <SmallButton className="delete" bsStyle="danger" onClick={this.onClick}>
          <FormattedMessage id="expense.delete.btn" defaultMessage="delete" />
        </SmallButton>
      </div>
    );
  }
}

const deleteExpenseQuery = gql`
  mutation deleteExpense($id: Int!) {
    deleteExpense(id: $id) {
      id
      status
    }
  }
`;

const addMutation = graphql(deleteExpenseQuery, {
  props: ({ mutate }) => ({
    deleteExpense: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});

export default addMutation(DeleteExpenseBtn);
