import React, { Fragment } from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

import { Router } from '../server/pages';
import withData from '../lib/withData';
import withLoggedInUser from '../lib/withLoggedInUser';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import ErrorPage from '../components/ErrorPage';
import OrderForm from '../components/OrderForm';
import SignInForm from '../components/SignInForm';
import { H1 } from '../components/Text';

class CompletePledgePage extends React.Component {
  static getInitialProps({ query = {} }) {
    return {
      id: query.id,
    };
  }

  state = {
    error: null,
    loadingUserLogin: true,
    LoggedInUser: null,
  };

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && (await getLoggedInUser());
    this.setState({
      LoggedInUser,
      loadingUserLogin: false,
    });
  }

  async submitForm(order) {
    const { completePledge, data } = this.props;
    try {
      const response = await completePledge(order);
      const completedPledge = response.data.updateOrder;

      Router.pushRoute('collective', {
        slug: completedPledge.fromCollective.slug,
        status: 'orderCreated',
        CollectiveId: order.collective.id,
        TierId: order.tier && order.tier.id,
        type: data.Order.collective.type,
        totalAmount: order.totalAmount,
      });
    } catch (error) {
      this.setState({ error });
    }
  }

  render() {
    const { data } = this.props;
    const { error, LoggedInUser, loadingUserLogin } = this.state;

    const { loading, Order } = data;

    if (loading || error) {
      if (error) {
        data.error = data.error || error;
      }

      return (
        <ErrorPage
          loading={loading || loadingUserLogin}
          data={data}
          message={error && error.message}
        />
      );
    }

    Order.tier = {
      name: 'Pledge',
      presets: !Order.totalAmount && [1000, 5000, 10000], // we only offer to customize the contribution if it hasn't been specified in the URL
      type: 'DONATION',
      currency: Order.collective.currency,
      interval: Order.interval,
      button: 'donate',
      description: 'Thank you for your kind donation',
    };

    return (
      <Fragment>
        <Header
          className={loadingUserLogin ? 'loading' : ''}
          LoggedInUser={LoggedInUser}
          title="Complete Pledge"
        />
        <Body>
          <H1>Complete Your Pledge</H1>
          {!loadingUserLogin && !LoggedInUser && <SignInForm />}
          {LoggedInUser && (
            <OrderForm
              collective={Order.collective}
              LoggedInUser={LoggedInUser}
              onSubmit={order => this.submitForm({ ...order, id: Order.id })}
              order={Order}
            />
          )}
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
      collective {
        slug
        currency
        host {
          id
          name
        }
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
export default withData(withLoggedInUser(addGraphQL(CompletePledgePage)));
