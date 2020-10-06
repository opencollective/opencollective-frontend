import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { getStripe } from '../lib/stripe';

import AuthenticatedPage from '../components/AuthenticatedPage';
import Container from '../components/Container';
import MessageBox from '../components/MessageBox';
import { withUser } from '../components/UserProvider';

class ConfirmOrderPage extends React.Component {
  static getInitialProps({ query }) {
    return { id: parseInt(query.id) };
  }

  static propTypes = {
    /** OrderId */
    id: PropTypes.number.isRequired,
    /** @ignore from graphql */
    confirmOrder: PropTypes.func.isRequired,
    /** @ignore from withUser */
    loadingLoggedInUser: PropTypes.bool.isRequired,
    /** @ignore from withUser */
    LoggedInUser: PropTypes.object,
  };

  state = {
    status: ConfirmOrderPage.SUBMITTING,
    isRequestSent: false,
    error: null,
  };

  componentDidMount() {
    if (!this.props.loadingLoggedInUser && this.props.LoggedInUser) {
      return this.triggerRequest();
    }
  }

  componentDidUpdate() {
    if (!this.state.isRequestSent && !this.props.loadingLoggedInUser && this.props.LoggedInUser) {
      return this.triggerRequest();
    }
  }

  static SUBMITTING = 1;
  static SUCCESS = 2;
  static ERROR = 3;

  async triggerRequest() {
    try {
      this.setState({ isRequestSent: true });
      const res = await this.props.confirmOrder({ variables: { order: { id: this.props.id } } });
      const orderConfirmed = res.data.confirmOrder;
      if (orderConfirmed.stripeError) {
        this.handleStripeError(orderConfirmed);
      } else {
        this.setState({ status: ConfirmOrderPage.SUCCESS });
      }
    } catch (e) {
      const error = get(e, 'graphQLErrors.0') || e;
      this.setState({ status: ConfirmOrderPage.ERROR, error: error.message });
    }
  }

  handleStripeError = async ({ id, stripeError: { message, account, response } }) => {
    if (!response) {
      this.setState({ status: ConfirmOrderPage.ERROR, error: message });
      return;
    }
    if (response.paymentIntent) {
      const stripe = await getStripe(null, account);
      const result = await stripe.handleCardAction(response.paymentIntent.client_secret);
      if (result.error) {
        this.setState({ status: ConfirmOrderPage.ERROR, error: result.error.message });
      }
      if (result.paymentIntent && result.paymentIntent.status === 'requires_confirmation') {
        this.triggerRequest({ id });
      }
    }
  };

  confirmOrder = async order => {
    this.setState({ status: ConfirmOrderPage.SUBMITTING, error: null });

    try {
      const res = await this.props.confirmOrder({ variables: { order: { id: order.id } } });
      const orderConfirmed = res.data.confirmOrder;
      if (orderConfirmed.stripeError) {
        this.handleStripeError(orderConfirmed);
      } else {
        this.handleSuccess(orderConfirmed);
      }
    } catch (e) {
      this.setState({ status: ConfirmOrderPage.ERROR, error: e.message });
    }
  };

  render() {
    const { status, error } = this.state;

    return (
      <AuthenticatedPage title="Order confirmation">
        <Container
          display="flex"
          py={[5, 6]}
          px={2}
          flexDirection="column"
          alignItems="center"
          background="linear-gradient(180deg, #EBF4FF, #FFFFFF)"
        >
          {status === ConfirmOrderPage.SUBMITTING && (
            <MessageBox type="info" isLoading>
              <FormattedMessage id="Order.Confirm.Processing" defaultMessage="Confirming your payment method…" />
            </MessageBox>
          )}
          {status === ConfirmOrderPage.SUCCESS && (
            <MessageBox mb={3} type="success" withIcon>
              <FormattedMessage
                id="Order.Confirm.Success"
                defaultMessage="Your payment method has now been confirmed and the payment successfully went through."
              />
            </MessageBox>
          )}
          {status === ConfirmOrderPage.ERROR && (
            <MessageBox type="error" withIcon>
              {error}
            </MessageBox>
          )}
        </Container>
      </AuthenticatedPage>
    );
  }
}

const confirmOrderMutation = gql`
  mutation ConfirmOrder($order: ConfirmOrderInputType!) {
    confirmOrder(order: $order) {
      id
      status
      stripeError {
        message
        account
        response
      }
      transactions {
        id
      }
    }
  }
`;

const addConfirmOrderMutation = graphql(confirmOrderMutation, {
  name: 'confirmOrder',
});

export default withUser(addConfirmOrderMutation(ConfirmOrderPage));
