import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { graphql } from 'react-apollo'
import { FormattedMessage } from 'react-intl';
import gql from 'graphql-tag'
import { Button } from 'react-bootstrap';

class PayExpenseBtn extends React.Component {

  static propTypes = {
    expense: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
    this.state = {};
    this.onClick = this.onClick.bind(this);
  }

  async onClick() {
    const { expense } = this.props;
    try {
      await this.props.payExpense(expense.id);
    } catch (e) {
      console.log(">>> payExpense error: ", e);
      const error = e.message && e.message.replace(/GraphQL error:/, "");
      this.setState({ error });
    }
  }

  render() {
    const { expense } = this.props;

    return (
      <div className="PayExpenseBtn">
        <style jsx>{`
          .PayExpenseBtn {
            display: flex;
          }
          .error {
            color: red;
            font-size: 1.3rem;
            padding-left: 1rem;
          }
        `}</style>
        <Button bsStyle="primary" onClick={this.onClick}>
          { expense.payoutMethod === 'other' && <FormattedMessage id="expense.pay.manual.btn" defaultMessage="record as paid" />}
          { expense.payoutMethod !== 'other' && <FormattedMessage id="expense.pay.btn" defaultMessage="pay with {paymentMethod}" values={{ paymentMethod: expense.payoutMethod }} />}
        </Button>
        <div className="error">{this.state.error}</div>
      </div>
    );
  }

}

const payExpenseQuery = gql`
mutation payExpense($id: Int!) {
  payExpense(id: $id) {
    id
    status
  }
}
`;

const addMutation = graphql(payExpenseQuery, {
  props: ( { mutate }) => ({
    payExpense: async (id) => {
      return await mutate({ variables: { id } })
    }
  })
});

export default addMutation(withIntl(PayExpenseBtn));