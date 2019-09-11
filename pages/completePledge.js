import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { get } from 'lodash';

import { compose } from '../lib/utils';
import { Router } from '../server/pages';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import ErrorPage from '../components/ErrorPage';
import OrderForm from '../components/OrderForm';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import { H1, P } from '../components/Text';
import Container from '../components/Container';
import { withUser } from '../components/UserProvider';

class CompletePledgePage extends React.Component {
  static getInitialProps({ query = {} }) {
    return {
      id: Number(query.id),
    };
  }

  static propTypes = {
    LoggedInUser: PropTypes.object,
    completePledge: PropTypes.func,
    data: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
  };

  state = {
    error: null,
  };

  async submitForm(order) {
    const { completePledge, data } = this.props;
    try {
      const response = await completePledge(order);
      const completedPledge = response.data.updateOrder;

      Router.pushRoute('collective', {
        slug: completedPledge.fromCollective.slug,
        status: completedPledge.status,
        CollectiveId: order.collective.id,
        collectiveType: data.Order.collective.type,
        OrderId: completedPledge.id,
        TierId: order.tier && order.tier.id,
        totalAmount: order.totalAmount,
      });
    } catch (error) {
      this.setState({ error });
    }
  }

  render() {
    const { data, LoggedInUser, loadingLoggedInUser } = this.props;
    const { error } = this.state;

    const { loading, Order } = data;

    if (loading || error) {
      if (error) {
        data.error = data.error || error;
      }

      return <ErrorPage loading={loading || loadingLoggedInUser} data={data} message={error && error.message} />;
    }

    if (Order) {
      Order.tier = {
        name: 'Pledge',
        presets: !Order.totalAmount && [1000, 5000, 10000], // we only offer to customize the contribution if it hasn't been specified in the URL
        type: 'DONATION',
        currency: Order.collective.currency,
        interval: Order.interval,
        button: 'donate',
        description: 'Thank you for your kind donation',
      };
    }

    const pledgeComplete = Order && ['ACTIVE', 'PAID'].includes(Order.status);
    const collectiveActive = get(Order, 'collective.isActive');
    const showForm = LoggedInUser && !pledgeComplete && get(Order, 'collective.isActive');

    return (
      <Fragment>
        <Header className={loadingLoggedInUser ? 'loading' : ''} LoggedInUser={LoggedInUser} title="Complete Pledge" />
        <Body>
          <Container maxWidth={1200} px={4} py={5}>
            <H1>Complete Your Pledge</H1>

            {!loadingLoggedInUser && !LoggedInUser && (
              <Fragment>
                <SignInOrJoinFree />
              </Fragment>
            )}

            {pledgeComplete && (
              <P fontWeight="bold" textAlign="center" mt={4}>
                This pledge has already been completed. No action needed at this time.
              </P>
            )}

            {!collectiveActive && (
              <P fontWeight="bold" textAlign="center" mt={4}>
                The {get(Order, 'collective.name')} collective has not been claimed. You will be notified once that
                occurs.
              </P>
            )}

            {showForm && (
              <OrderForm
                collective={Order.collective}
                LoggedInUser={LoggedInUser}
                onSubmit={order => this.submitForm({ ...order, id: Order.id })}
                order={Order}
              />
            )}
          </Container>
        </Body>
        <Footer />
      </Fragment>
    );
  }
}

const addOrderData = graphql(gql`
  query getOrder($id: Int!) {
    Order(id: $id) {
      id
      interval
      publicMessage
      quantity
      totalAmount
      status
      collective {
        slug
        currency
        host {
          id
          name
        }
        isActive
        name
        paymentMethods {
          id
          name
          service
        }
        website
      }
      fromCollective {
        id
        name
        type
      }
    }
  }
`);

const addUpdateOrderMutation = graphql(
  gql`
    mutation completePledge($order: OrderInputType!) {
      updateOrder(order: $order) {
        status
        fromCollective {
          slug
        }
      }
    }
  `,
  {
    props: ({ mutate }) => ({
      completePledge: order => mutate({ variables: { order } }),
    }),
  },
);

const addGraphQL = compose(
  addOrderData,
  addUpdateOrderMutation,
);

export { CompletePledgePage as MockCompletePledgePage };
export default withUser(addGraphQL(CompletePledgePage));
