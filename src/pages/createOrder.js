import React from 'react';
import { addGetLoggedInUserFunction } from '../graphql/queries';
import { addCreateOrderMutation } from '../graphql/mutations';
import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import OrderForm from '../components/OrderForm';
import CollectiveCover from '../components/CollectiveCover';
import { defineMessages } from 'react-intl';
import { Router } from '../server/pages';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import Loading from '../components/Loading';
import NotFound from '../components/NotFound';

class CreateOrderPage extends React.Component {

  static getInitialProps ({ query: { collectiveSlug, eventSlug, TierId, amount, quantity, totalAmount, interval, description } }) {
    return { slug: eventSlug || collectiveSlug, TierId, quantity, totalAmount: totalAmount || amount * 100, interval, description }
  }

  constructor(props) {
    super(props);
    this.createOrder = this.createOrder.bind(this);
    this.state = { result: {}, loading: false };
    const interval = (props.interval || "").toLowerCase().replace(/ly$/,'');
    this.order = {
      quantity: parseInt(props.quantity, 10) || 1,
      interval: (['month','year'].indexOf(interval) !== -1) ? interval : null,
      totalAmount: parseInt(props.totalAmount, 10) || null
    };

    this.messages = defineMessages({
      'ticket.title': { id: 'tier.order.ticket.title', defaultMessage: 'RSVP' },
      'tier.title': { id: 'tier.order.backer.title', defaultMessage: 'Become a {name}' },
      'donation.title': { id: 'tier.order.donation.title', defaultMessage: 'Contribute' },
      'order.success': { id: 'tier.order.success', defaultMessage: 'order processed with success' },
      'order.error': { id: 'tier.order.error', defaultMessage: '😱 Oh crap! An error occured. Try again, or shoot a quick email to support@opencollective.com and we\'ll figure things out.' },
      'tier.name.donation': { id: 'tier.name.donation', defaultMessage: 'donation' },
      'tier.button.donation': { id: 'tier.button.donation', defaultMessage: 'donate' },
      'tier.description.donation': { id: 'tier.description.donation', defaultMessage: 'Thank you for your kind donation 🙏' }
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
      const orderCreated = res.data.createOrder;
      this.setState({ loading: false, order, result: { success: intl.formatMessage(this.messages['order.success']) } });
      Router.pushRoute(`/${orderCreated.fromCollective.slug}?status=orderCreated&CollectiveId=${order.collective.id}`);
    } catch (e) {
      console.error(">>> createOrder error: ", e);
      this.setState({ loading: false, result: { error: `${intl.formatMessage(this.messages['order.error'])}: ${e}` } });
    }
  }

  render() {
    const { intl, data } = this.props;
    const collective = data.Collective;
    if (data.loading) return (<Loading />);
    if (!data.Collective) return (<NotFound />);

    const TierId = parseInt(this.props.TierId);
    let tier;
    if (TierId) {
      tier = collective.tiers.find(t => t.id === TierId);
    }

    tier = tier || {
      name: intl.formatMessage(this.messages['tier.name.donation']),
      presets: [1000, 5000, 10000],
      type: 'DONATION',
      currency: collective.currency,
      button: intl.formatMessage(this.messages['tier.button.donation']),
      description: intl.formatMessage(this.messages['tier.description.donation'])
    };

    this.order.tier = tier;

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
            title={intl.formatMessage(this.messages[`${tier.type.toLowerCase()}.title`], { name: tier.name })}
            className="small"
            />

          <div className="content">
            <OrderForm
              collective={collective}
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

const addData = graphql(gql`
query Collective($slug: String!) {
  Collective(slug: $slug) {
    id
    slug
    name
    type
    description
    twitterHandle
    image
    host {
      id
      name
      slug
      image
    }
    parentCollective {
      id
      slug
      name
      image
      backgroundImage
    }
    backgroundImage
    settings
    currency
    tiers {
      id
      type
      name
      slug
      amount
      currency
      interval
      presets
    }
  }
}
`);

export default withData(withIntl(addGetLoggedInUserFunction(addData(addCreateOrderMutation(CreateOrderPage)))));