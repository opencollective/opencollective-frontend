import withData from '../lib/withData'
import withIntl from '../lib/withIntl';
import React from 'react'
import { addGetLoggedInUserFunction } from '../graphql/queries';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

import NotFound from '../components/NotFound';
import Loading from '../components/Loading';
import Error from '../components/Error';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import OrderForm from '../components/OrderForm';
import CollectiveCover from '../components/CollectiveCover';
import { defineMessages } from 'react-intl';
import { get } from 'lodash';

class DonatePage extends React.Component {

  static getInitialProps ({ query: { collectiveSlug, amount, interval, description } }) {
    return { slug: collectiveSlug, totalAmount: amount * 100, interval, description }
  }

  constructor(props) {
    super(props);
    this.state = {};
    const interval = (props.interval || "").toLowerCase().replace(/ly$/,'');
    this.order = {
      quantity: props.quantity || 1,
      interval: (['month','year'].indexOf(interval) !== -1) ? interval : null,
      totalAmount: props.totalAmount || null,
      description: props.description
    };

    this.messages = defineMessages({
      'donate.title': { id: 'donate.title', defaultMessage: 'Become a donor' },
      'tier.name.donation': { id: 'tier.name.donation', defaultMessage: 'donation' },
      'tier.button.donation': { id: 'tier.button.donation', defaultMessage: 'donate' },
      'tier.description.donation': { id: 'tier.description.donation', defaultMessage: 'Thank you for your kind donation 🙏' }
    });
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser();
    this.setState({LoggedInUser});
  }

  render() {
    const { data, slug, intl } = this.props;
    const { LoggedInUser } = this.state;

    if (data.loading) return (<Loading />);
    if (!data.Collective) return (<NotFound />);

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<Error message="GraphQL error" />)
    }

    const collective = data.Collective;
    const tiers = collective.tiers;

    let tier = tiers.find(t => t.slug === 'donors');
    tier = { ...tier } || {
      name: intl.formatMessage(this.messages['tier.name.donation']),
      presets: [1000, 5000, 10000],
      currency: collective.currency,
      button: intl.formatMessage(this.messages['tier.button.donation']),
      description: intl.formatMessage(this.messages['tier.description.donation'])
    };
    tier.currency = tier.currency || collective.currency;
    this.order.tier = tier;
    console.log("tier", tier, "tiers", tiers);

    return (
      <div>
        <Header
          title={collective.name}
          description={collective.description}
          twitterHandle={collective.twitterHandle}
          image={collective.image || collective.backgroundImage}
          className={this.state.status}
          LoggedInUser={this.state.LoggedInUser}
          />

        <Body>
          <CollectiveCover
            href={`/${collective.slug}`}
            logo={collective.image}
            title={intl.formatMessage(this.messages[`donate.title`])}
            className="small"
            backgroundImage={collective.backgroundImage}
            style={get(collective, 'settings.style.hero.cover')}
            />

          <div className="content">
            <OrderForm
              order={this.order}
              LoggedInUser={this.state.LoggedInUser}
              onSubmit={this.createOrder}
              stripePublishableKey={collective.stripePublishableKey}
              />
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
      id,
      slug,
      name,
      description,
      twitterHandle,
      image,
      backgroundImage,
      settings,
      currency,
      tiers {
        id,
        name,
        slug,
        amount,
        currency,
        interval,
        presets
      }
    }
  }
`);

export default withData(addGetLoggedInUserFunction(addData(withIntl(DonatePage))));
