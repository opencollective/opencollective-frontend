import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { get, pick } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { formatCurrency } from '../lib/currency-utils';
import { compose } from '../lib/utils';

import Container from './Container';
import { Flex } from './Grid';
import StyledButton from './StyledButton';

class SendMoneyToCollectiveBtn extends React.Component {
  static propTypes = {
    amount: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    description: PropTypes.string,
    fromCollective: PropTypes.object.isRequired,
    toCollective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object.isRequired,
    data: PropTypes.object,
    sendMoneyToCollective: PropTypes.func,
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
    const { currency, amount, fromCollective, toCollective, description, data, LoggedInUser } = this.props;
    if (!LoggedInUser || !LoggedInUser.canEditCollective(fromCollective) || !get(data, 'Collective')) {
      return;
    }
    const paymentMethods = get(data, 'Collective.paymentMethods');
    if (!paymentMethods || paymentMethods.length === 0) {
      const error = "We couldn't find a payment method to make this transaction";
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
      await this.props.sendMoneyToCollective({ variables: { order } });
      this.setState({ loading: false });
    } catch (e) {
      const error = e.message;
      this.setState({ error, loading: false });
    }
  }

  render() {
    const { amount, currency, toCollective } = this.props;
    return (
      <div className="SendMoneyToCollectiveBtn">
        <Flex justifyContent="center" mb={1}>
          <StyledButton onClick={this.props.confirmTransfer || this.onClick}>
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
          </StyledButton>
        </Flex>
        {this.state.error && <Container fontSize="1.1rem">{this.state.error}</Container>}
      </div>
    );
  }
}

const paymentMethodsQuery = gql`
  query SendMoneyToCollectivePaymentMethods($slug: String) {
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

const addPaymentMethodsData = graphql(paymentMethodsQuery, {
  options: props => ({
    variables: {
      slug: get(props, 'fromCollective.slug'),
    },
  }),
  skip: props => {
    return !props.LoggedInUser;
  },
});

const sendMoneyToCollectiveMutation = gql`
  mutation SendMoneyToCollective($order: OrderInputType!) {
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

const addSendMoneyToCollectiveMutation = graphql(sendMoneyToCollectiveMutation, {
  name: 'sendMoneyToCollective',
});

const addGraphql = compose(addPaymentMethodsData, addSendMoneyToCollectiveMutation);

export default addGraphql(SendMoneyToCollectiveBtn);
