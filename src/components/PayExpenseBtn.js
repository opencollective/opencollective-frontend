import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { graphql } from 'react-apollo'
import { defineMessages, FormattedMessage } from 'react-intl';
import gql from 'graphql-tag'
import SmallButton from './SmallButton';
import { get } from 'lodash';
import { isValidEmail } from '../lib/utils';

class PayExpenseBtn extends React.Component {

  static propTypes = {
    expense: PropTypes.object.isRequired,
    collective: PropTypes.object.isRequired,
    disabled: PropTypes.bool,
    lock: PropTypes.func,
    unlock: PropTypes.func
  }

  constructor(props) {
    super(props);
    this.state = { loading: false };
    this.onClick = this.onClick.bind(this);
    this.messages = defineMessages({
      'paypal.missing': { id: 'expense.payoutMethod.paypal.missing', defaultMessage: "Please provide a valid paypal email address"}
    });
  }

  async onClick() {
    const { expense, lock, unlock } = this.props;
    if (this.props.disabled) {
      return;
    }
    lock();
    this.setState({ loading: true });
    try {
      await this.props.payExpense(expense.id);
      this.setState({ loading: false });
      unlock();
    } catch (e) {
      console.log(">>> payExpense error: ", e);
      const error = e.message && e.message.replace(/GraphQL error:/, "");
      this.setState({ error, loading: false });
      unlock();
    }
  }

  render() {
    const { collective, expense, intl } = this.props;
    let disabled = this.state.loading, title = '', error = this.state.error;
    if (expense.payoutMethod === 'paypal' && !isValidEmail(get(expense, 'user.paypalEmail')) && !isValidEmail(get(expense, 'user.email'))) {
      disabled = true;
      title = intl.formatMessage(this.messages['paypal.missing']);
    }
    if (get(collective, 'stats.balance') < expense.amount ) {
      disabled = true;
      error = <FormattedMessage id="expense.pay.errror.insufficientBalance" defaultMessage="Insufficient balance" />
    }
    return (
      <div className="PayExpenseBtn">
        <style jsx>{`
          .PayExpenseBtn {
            display: flex;
          }
          .error {
            display: flex;
            align-items: center;
            color: red;
            font-size: 1.3rem;
            padding-left: 1rem;
          }
        `}</style>
        <SmallButton className="pay" onClick={this.onClick} disabled={this.props.disabled || disabled} title={title}>
          { expense.payoutMethod === 'other' && <FormattedMessage id="expense.pay.manual.btn" defaultMessage="record as paid" />}
          { expense.payoutMethod !== 'other' && <FormattedMessage id="expense.pay.btn" defaultMessage="pay with {paymentMethod}" values={{ paymentMethod: expense.payoutMethod }} />}
        </SmallButton>
        <div className="error">{error}</div>
      </div>
    );
  }

}

const payExpenseQuery = gql`
mutation payExpense($id: Int!) {
  payExpense(id: $id) {
    id
    status
    collective {
      id
      stats {
        id
        balance
      }
    }
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