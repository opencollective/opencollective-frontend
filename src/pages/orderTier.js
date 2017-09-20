import React from 'react';
import { addCollectiveTierData, addGetLoggedInUserFunction } from '../graphql/queries';
import { addCreateOrderMutation } from '../graphql/mutations';
import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import NotFound from '../components/NotFound';
import OrderForm from '../components/OrderForm';
import CollectiveCover from '../components/CollectiveCover';
import { defineMessages } from 'react-intl';
import { Router } from '../server/pages';

class OrderTierPage extends React.Component {

  static getInitialProps ({ query: { collectiveSlug, TierId, amount, interval, description } }) {
    return { slug: collectiveSlug, TierId, totalAmount: amount * 100, interval, description }
  }

  constructor(props) {
    super(props);
    this.createOrder = this.createOrder.bind(this);
    this.state = { result: {}, loading: false };
    const interval = (props.interval || "").toLowerCase().replace(/ly$/,'');
    this.order = {
      quantity: props.quantity || 1,
      interval: (['month','year'].indexOf(interval) !== -1) ? interval : null,
      totalAmount: props.totalAmount || null
    };
    console.log("orderTier", "constructor", this.order);

    this.messages = defineMessages({
      'ticket.title': { id: 'tier.order.ticket.title', defaultMessage: 'RSVP' },
      'tier.title': { id: 'tier.order.backer.title', defaultMessage: 'Become a {name}' },
      'order.success': { id: 'tier.order.success', defaultMessage: 'order processed with success' },
      'order.error': { id: 'tier.order.error', defaultMessage: '😱 Oh crap! An error occured. Try again, or shoot a quick email to support@opencollective.com and we\'ll figure things out.' }
    });
  }

  async componentDidMount() {
    const { getLoggedInUser, data } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser();
    if (!data.Tier && data.fetchData) {
      data.fetchData();
    }
    this.setState({LoggedInUser});
  }

  async createOrder(order) {
    const { intl, data } = this.props;
    order.collective = { id: data.Collective.id };
    if (this.state.LoggedInUser) {
      delete order.user;
    }
    console.log(">>> createOrder", order);
    try {
      this.setState({ loading: true});
      const res = await this.props.createOrder(order);
      console.log(">>> createOrder response", res);
      const response = res.data.createOrder;
      this.setState({ loading: false, order, result: { success: intl.formatMessage(this.messages['order.success']) } });
      Router.pushRoute(`/${response.fromCollective.slug}`);
    } catch (e) {
      console.error(">>> createOrder error: ", e);
      this.setState({ loading: false, result: { error: `${intl.formatMessage(this.messages['order.error'])}: ${e}` } });
    }
  }

  render() {
    const { intl, data } = this.props;
    const { loading, Tier } = data;
    const collective = data.Collective;
    if (loading) return (<div />);

    if (!Tier) return (<NotFound />);

    this.order.tier = data.Tier;

    return (
      <div>
        <style jsx>{`
          .success {
            color: green;
          }
          .error {
            color: red;
          }
        `}</style>
        <Header
          title={collective.name}
          description={collective.description}
          twitterHandle={collective.twitterHandle}
          image={collective.image || collective.backgroundImage}
          className={this.state.loading && 'loading'}
          LoggedInUser={this.state.LoggedInUser}
          />

        <Body>
          <CollectiveCover
            collective={collective}
            href={`/${collective.slug}`}
            title={intl.formatMessage(this.messages[`${Tier.type.toLowerCase()}.title`], { name: Tier.name })}
            className="small"
            />

          <div className="content">
            <OrderForm
              order={this.order}
              LoggedInUser={this.state.LoggedInUser}
              onSubmit={this.createOrder}
              />
            <div className="result">
              <div className="success">{this.state.result.success}</div>
              <div className="error">{this.state.result.error}</div>
            </div>
          </div>
        </Body>
        <Footer />
      </div>
    );
  }

}

export default withData(withIntl(addGetLoggedInUserFunction(addCollectiveTierData(addCreateOrderMutation(OrderTierPage)))));