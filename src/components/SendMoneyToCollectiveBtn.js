import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { graphql, compose } from 'react-apollo'
import { FormattedMessage } from 'react-intl';
import gql from 'graphql-tag'
import SmallButton from './SmallButton';
import { get, pick } from 'lodash';
import { formatCurrency } from '../lib/utils';

class SendMoneyToCollectiveBtn extends React.Component {

  static propTypes = {
    amount: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    fromCollective: PropTypes.object.isRequired,
    toCollective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  async onClick() {
    const { currency, amount, fromCollective, toCollective } = this.props;
    const order = {
      totalAmount: amount,
      currency,
      collective: pick(toCollective, ['id']),
      fromCollective: pick(fromCollective, ['id'])
    }
    console.log(">>> order: ", order);
    const res = await this.props.createOrder(order);
    console.log(">>> Res", res);
  }

  render() {
    console.log(">>> SendMoneyToCollectiveBtn paymentMethods", get(this.props.data, 'Collective.paymentMethods'));
    const { amount, currency, toCollective } = this.props;
    return (
      <div className="SendMoneyToCollectiveBtn">
        <SmallButton className="approve" bsStyle="success" onClick={this.onClick}><FormattedMessage id="SendMoneyToCollective.btn" defaultMessage="Send {amount} to {collective}" values={{ amount: formatCurrency(amount, currency), collective: toCollective.name}} /></SmallButton>
      </div>
    );
  }

}

const addPaymentMethodsQuery = gql`
query Collective($slug: String!) {
  Collective(slug: $slug) {
    id
    paymentMethods {
      id
      service
      name
      uuid
    }
  }
}
`;

const addPaymentMethods = graphql(addPaymentMethodsQuery, {
  options(props) {
    return {
      variables: {
        slug: get(props, 'fromCollective.slug')
      }
    }
  }
});

const createOrderQuery = gql`
mutation createOrder($order: OrderInputType!) {
  createOrder(order: $order) {
    id
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

const addMutation = graphql(createOrderQuery, {
props: ( { mutate }) => ({
  createOrder: async (order) => {
    return await mutate({ variables: { order } })
  }
})
});

const addData = compose(addMutation, addPaymentMethods);
export default addData(withIntl(SendMoneyToCollectiveBtn));