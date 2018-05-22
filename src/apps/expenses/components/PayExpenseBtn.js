import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage } from 'react-intl';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { get } from 'lodash';

import withIntl from '../../../lib/withIntl';
import { getCurrencySymbol, isValidEmail } from '../../../lib/utils';

import InputField from '../../../components/InputField';
import SmallButton from '../../../components/SmallButton';


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
    this.state = {
      loading: false,
      paymentProcessorFeeInHostCurrency: 0,
    };
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
      await this.props.payExpense(expense.id, this.state.paymentProcessorFeeInHostCurrency);
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
            align-items: flex-end;
            display: flex;
            flex-wrap: wrap;
          }
          .error {
            display: flex;
            align-items: center;
            color: red;
            font-size: 1.3rem;
            padding-left: 1rem;
          }

          .processorFee {
            margin-right: 1rem;
            max-width: 16rem;
          }

          .processorFee label {
            margin: 0;
          }
        `}</style>
        <style global jsx>{`
          .processorFee .inputField, .processorFee .form-group {
            margin: 0;
          }

          .processorFee .inputField {
            margin-top: 0.5rem;
          }
        `}</style>
        {expense.payoutMethod === 'other' && (
          <div className="processorFee">
            <label htmlFor="processorFee">
              <FormattedMessage id="expense.paymentProcessorFeeInHostCurrency" defaultMessage="payment processor fee" />
            </label>
            <InputField
              defaultValue={0}
              id="paymentProcessorFeeInHostCurrency"
              name="paymentProcessorFeeInHostCurrency"
              onChange={fee => this.setState({ paymentProcessorFeeInHostCurrency: fee })}
              pre={getCurrencySymbol(expense.currency)}
              type="currency"
              />
          </div>
        )}
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
mutation payExpense($id: Int!, $fee: Int!) {
  payExpense(id: $id, fee: $fee) {
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
    payExpense: async (id, fee) => {
      return await mutate({ variables: { id, fee } })
    }
  })
});

export default addMutation(withIntl(PayExpenseBtn));
