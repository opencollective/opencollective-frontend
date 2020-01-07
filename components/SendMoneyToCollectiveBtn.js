import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import { FormattedMessage } from 'react-intl';
import gql from 'graphql-tag';
import { get, pick } from 'lodash';

import { compose, formatCurrency } from '../lib/utils';

import SmallButton from './SmallButton';

class SendMoneyToCollectiveBtn extends React.Component {
  static propTypes = {
    amount: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    description: PropTypes.string,
    fromCollective: PropTypes.object.isRequired,
    toCollective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object.isRequired,
    data: PropTypes.object,
    createOrder: PropTypes.func,
    confirmTransfer: PropTypes.func,
    isTransferApproved: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.state = {};
  }

  componentDidUpdate(prevProps) {
    if (this.props.isTransferApproved !== prevProps.isTransferApproved) {
      this.onClick();
    }
  }

  async onClick() {
    const {
      currency,
      amount,
      fromCollective,
      toCollective,
      description,
      data: {
        Collective: { paymentMethods },
      },
    } = this.props;
    if (!paymentMethods || paymentMethods.length === 0) {
      const error = "We couldn't find a payment method to make this transaction";
      console.error(error);
      this.setState({ error });
      return;
    }
    this.setState({ loading: true });
    const order = {
      totalAmount: amount,
      currency,
      collective: pick(toCollective, ['id']),
      fromCollective: pick(fromCollective, ['id']),
      description,
      paymentMethod: { uuid: paymentMethods[0].uuid },
    };
    try {
      const res = await this.props.createOrder(order);
      console.log('>>> createOrder result:', res);
      this.setState({ loading: false });
    } catch (e) {
      const error = e.message && e.message.replace(/GraphQL error:/, '');
      this.setState({ error, loading: false });
    }
  }

  render() {
    const { amount, currency, toCollective } = this.props;
    return (
      <div className="SendMoneyToCollectiveBtn">
        <style jsx>
          {`
            .error {
              font-size: 1.1rem;
            }
          `}
        </style>
        <SmallButton className="approve" onClick={this.props.confirmTransfer || this.onClick}>
          {this.state.loading && <FormattedMessage id="form.processing" defaultMessage="processing" />}
          {!this.state.loading && (
            <FormattedMessage
              id="SendMoneyToCollective.btn"
              defaultMessage="Send {amount} to {collective}"
              values={{
                amount: formatCurrency(amount, currency),
                collective: toCollective.name,
              }}
            />
          )}
        </SmallButton>
        {this.state.error && <div className="error">{this.state.error}</div>}
      </div>
    );
  }
}

const addPaymentMethodsQuery = gql`
  query Collective($slug: String) {
    Collective(slug: $slug) {
      id
      paymentMethods(service: "opencollective") {
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
        slug: get(props, 'fromCollective.slug'),
      },
    };
  },
});

const createOrderQuery = gql`
  mutation createOrder($order: OrderInputType!) {
    createOrder(order: $order) {
      id
      fromCollective {
        id
        stats {
          id
          balance
        }
      }
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
  props: ({ mutate }) => ({
    createOrder: async order => {
      return await mutate({ variables: { order } });
    },
  }),
});

const addData = compose(addMutation, addPaymentMethods);

export default addData(SendMoneyToCollectiveBtn);
