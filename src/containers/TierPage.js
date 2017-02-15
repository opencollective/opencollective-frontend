import React from 'react'
import { Link } from 'react-router'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { css } from 'glamor';
import EventHeader from '../components/EventHeader';
import Tier from '../components/Tier';
import SignInUp from '../components/SignInUp';
import { formatCurrency } from '../lib/utils';
import { injectIntl } from 'react-intl';
import api from '../lib/api';

const styles = {
  TierPage: css({
    '& a': {
      textDecoration: 'none'
    }
  }),
  content: css({
    maxWidth: 960,
    margin: '0 auto'
  }),
  description: css({
    margin: '1rem'
  }),
  map: css({
    border: '1px solid #eee',
    height: '300px'
  })
};

class TierPage extends React.Component {

  static propTypes = {
    data: React.PropTypes.object,
  }

  constructor(props) {
    super(props);
    this.state = { quantity: 0, amount : 0 };
    this.api = new api(this);
    this.actions = {
      rsvp: (user) => this.rsvp(user)
    }
  }

  rsvp(user) {
    this.api.rsvp({
      userid: user.id,
      collectiveid: this.tier.collective.id,
      eventid: this.tier.event.id,
      tierid: this.tier.id,
      quantity: this.state.quantity
    })
  }

  updateTier(tier) {
    this.setState(tier);
  }

  componentDidMount() {
    console.log("Tier", this.tier);
  }

  render () {
    
    this.tier = this.props.data.Tier;

    if (this.props.data.loading) {
      return (<div>Loading</div>)
    }

    return (
      <div className={styles.TierPage}>

        <EventHeader logo={this.tier.collective.logo} title={this.tier.event.name} backgroundImage={this.tier.event.backgroundImage || this.tier.collective.backgroundImage} />

        <div className={styles.content} >

        <Tier name={this.tier.name} description={this.tier.description} amount={this.tier.amount} currency={this.tier.currency} onChange={(tier) => this.updateTier(tier)} />

        <SignInUp
          requireCreditCard={this.state.amount > 0}
          stripePublishableKey="pk_test_5aBB887rPuzvWzbdRiSzV3QB"
          label={`RSVP for ${formatCurrency(this.state.amount, this.tier.currency)}`}
          onClick={(user) => this.actions.rsvp(user)} 
          />

        </div>

      </div>
    )
  }
}

const FeedQuery = gql`query tier {
  Tier(id:"ciwjn1ery2q4001702l75rjcn") {
    id,
    name,
    description,
    amount,
    currency,
    event {
      id,
      name,
      description
    },
    collective {
      id,
      slug,
      name,
      mission,
      backgroundImage,
      logo
    }
  }
}`

const TierPageWithData = graphql(FeedQuery)(TierPage)

export default injectIntl(TierPageWithData);
