import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { graphql } from 'react-apollo'
import { FormattedMessage } from 'react-intl';
import gql from 'graphql-tag'
import { Button } from 'react-bootstrap';

class RejectExpenseBtn extends React.Component {

  static propTypes = {
    id: PropTypes.number.isRequired
  }

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  async onClick() {
    const { id } = this.props;
    await this.props.rejectExpense(id);
  }

  render() {
    return (
      <div className="RejectExpenseBtn">
        <Button bsStyle="danger" onClick={this.onClick}><FormattedMessage id="expense.reject.btn" defaultMessage="reject" /></Button>
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
  props: ( { mutate }) => ({
    rejectExpense: async (id) => {
      return await mutate({ variables: { id } })
    }
  })
});

export default addMutation(withIntl(RejectExpenseBtn));