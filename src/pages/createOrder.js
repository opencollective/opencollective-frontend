import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages } from 'react-intl';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { get, pick } from 'lodash';

import { Router } from '../server/pages';

import ErrorPage from '../components/ErrorPage';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import OrderForm from '../components/OrderForm';
import CollectiveCover from '../components/CollectiveCover';

import { addCreateOrderMutation } from '../graphql/mutations';

import storage from '../lib/storage';
import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';
import { isValidUrl } from '../lib/utils';

class CreateOrderPage extends React.Component {
  static getInitialProps({
    query: {
      collectiveSlug,
      eventSlug,
      TierId,
      amount,
      quantity,
      totalAmount,
      interval,
      description,
      verb,
      redeem,
      redirect,
    },
  }) {
    return {
      slug: eventSlug || collectiveSlug,
      TierId,
      quantity,
      totalAmount: totalAmount || amount * 100,
      interval,
      description,
      verb,
      redeem,
      redirect,
    };
  }

  static propTypes = {
    slug: PropTypes.string, // for addData
    TierId: PropTypes.string,
    quantity: PropTypes.number,
    totalAmount: PropTypes.number,
    interval: PropTypes.string,
    description: PropTypes.string,
    verb: PropTypes.string,
    redirect: PropTypes.string,
    redeem: PropTypes.bool,
    createOrder: PropTypes.func.isRequired, // from addCreateOrderMutation
    data: PropTypes.object.isRequired, // from withData
    intl: PropTypes.object.isRequired, // from withIntl
    getLoggedInUser: PropTypes.func.isRequired, // from withLoggedInUser
  };

  constructor(props) {
    super(props);
    this.state = { result: {}, loading: false };
    const interval = (props.interval || '').toLowerCase().replace(/ly$/, '');
    this.order = {
      quantity: parseInt(props.quantity, 10) || 1,
      interval: ['month', 'year'].indexOf(interval) !== -1 ? interval : null,
      totalAmount: parseInt(props.totalAmount, 10) || null,
    };

    switch (props.verb) {
      case 'pay':
        this.defaultType = 'PAYMENT';
        break;
      case 'donate':
        this.defaultType = 'DONATION';
        break;
      case 'contribute':
      default:
        this.defaultType = 'CONTRIBUTION';
        break;
    }

    this.messages = defineMessages({
      'ticket.title': { id: 'tier.order.ticket.title', defaultMessage: 'RSVP' },
      'tier.title': {
        id: 'tier.order.backer.title',
        defaultMessage: 'Become a {name}',
      },
      'donation.title': {
        id: 'tier.order.donation.title',
        defaultMessage: 'Contribute',
      },
      'membership.title': {
        id: 'tier.order.membership.title',
        defaultMessage: 'Become a member',
      },
      'service.title': {
        id: 'tier.order.service.title',
        defaultMessage: 'Order',
      },
      'product.title': {
        id: 'tier.order.product.title',
        defaultMessage: 'Order',
      },
      'contribution.title': {
        id: 'tier.name.contribution',
        defaultMessage: 'contribution',
      },
      'payment.title': { id: 'tier.name.payment', defaultMessage: 'payment' },
      'order.success': {
        id: 'tier.order.success',
        defaultMessage: 'order processed successfully',
      },
      'order.error': {
        id: 'tier.order.error',
        defaultMessage:
          "😱 Oh crap! An error occured. Try again, or shoot a quick email to support@opencollective.com and we'll figure things out.",
      },
      'tier.donation.button': {
        id: 'tier.donation.button',
        defaultMessage: 'donate',
      },
      'tier.donation.description': {
        id: 'tier.donation.description',
        defaultMessage: 'Thank you for your kind donation 🙏',
      },
    });
  }

  async componentDidMount() {
    const { getLoggedInUser, data } = this.props;
    const newState = {};
    newState.LoggedInUser = await getLoggedInUser();
    if (!data.Tier && data.fetchData) {
      data.fetchData();
    }
    this.referral = storage.get('referral');
    const matchingFund = storage.get('matchingFund');
    if (matchingFund) {
      newState.matchingFund = matchingFund;
    }
    this.setState(newState);
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    if (this.state.matchingFund) return;
    const matchingFund = get(newProps, 'data.Collective.settings.matchingFund');
    if (matchingFund) {
      this.setState({ matchingFund });
    }
  }

  createOrder = async order => {
    const { intl, data, redirect } = this.props;

    if (this.referral && this.referral > 0) {
      order.referral = { id: this.referral };
    }
    order.paymentMethod = pick(order.paymentMethod, [
      'uuid',
      'service',
      'type',
      'token',
      'customerId',
      'data',
      'name',
      'currency',
      'save',
    ]);
    if (this.state.LoggedInUser) {
      delete order.user;
    }
    try {
      this.setState({ loading: true });
      console.log('>>> createOrder', order);
      const res = await this.props.createOrder(order);
      const orderCreated = res.data.createOrder;
      this.setState({
        loading: false,
        order,
        result: { success: intl.formatMessage(this.messages['order.success']) },
      });
      if (redirect && isValidUrl(redirect)) {
        const transaction = orderCreated.transactions[0];
        const redirectTo = `${redirect}?transactionid=${transaction.id}`;
        window.location.href = redirectTo;
      } else {
        Router.pushRoute('collective', {
          slug: orderCreated.fromCollective.slug,
          status: 'orderCreated',
          CollectiveId: order.collective.id,
          TierId: order.tier && order.tier.id,
          type: data.Collective.type,
          totalAmount: order.totalAmount,
        });
      }
    } catch (e) {
      console.error('>>> createOrder error: ', e);
      this.setState({
        loading: false,
        result: {
          error: `${intl.formatMessage(this.messages['order.error'])}: ${e}`,
        },
      });
    }
  };

  render() {
    const { intl, data } = this.props;
    const { loading, LoggedInUser } = this.state;

    if (!data.Collective) return <ErrorPage data={data} />;

    const description = decodeURIComponent(this.props.description || '');
    const collective = data.Collective;

    const TierId = parseInt(this.props.TierId);
    let tier;
    if (TierId) {
      tier = collective.tiers.find(t => t.id === TierId);
    }

    tier = tier || {
      name: intl.formatMessage(
        this.messages[`${this.defaultType.toLowerCase()}.title`],
      ),
      presets: !this.order.totalAmount && [1000, 5000, 10000], // we only offer to customize the contribution if it hasn't been specified in the URL
      type: this.defaultType,
      currency: collective.currency,
      interval: this.order.interval,
      button: intl.formatMessage(this.messages['tier.donation.button']),
      description:
        description ||
        intl.formatMessage(this.messages['tier.donation.description']),
    };

    this.order.tier = tier;
    this.order.description = description;

    const coverClassName = collective.type === 'EVENT' ? 'small' : '';

    return (
      <div>
        <style jsx>
          {`
            .success {
              color: green;
            }
            .result {
              text-align: center;
            }
            .error {
              color: red;
            }
          `}
        </style>
        <Header
          title={collective.name}
          description={collective.description}
          twitterHandle={collective.twitterHandle}
          image={collective.image || collective.backgroundImage}
          className={loading && 'loading'}
          LoggedInUser={LoggedInUser}
        />

        <Body>
          <CollectiveCover
            collective={collective}
            href={collective.path}
            LoggedInUser={LoggedInUser}
            className={coverClassName}
          />

          <div className="content" id="content">
            <OrderForm
              collective={collective}
              order={this.order}
              LoggedInUser={this.state.LoggedInUser}
              onSubmit={this.createOrder}
              redeemFlow={this.props.redeem}
              matchingFund={this.state.matchingFund}
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
  query Collective($slug: String) {
    Collective(slug: $slug) {
      id
      slug
      path
      name
      type
      tags
      description
      twitterHandle
      image
      isActive
      host {
        id
        name
        slug
        image
        settings
      }
      location {
        name
      }
      startsAt
      endsAt
      timezone
      parentCollective {
        id
        slug
        name
        image
        backgroundImage
      }
      stats {
        id
        yearlyBudget
        balance
        backers {
          all
        }
      }
      members {
        id
        role
        createdAt
        description
        member {
          id
          description
          name
          slug
          type
          image
        }
      }
      backgroundImage
      settings
      currency
      tiers {
        id
        type
        name
        slug
        description
        amount
        currency
        interval
        presets
      }
    }
  }
`);

export default withData(
  withIntl(withLoggedInUser(addData(addCreateOrderMutation(CreateOrderPage)))),
);
