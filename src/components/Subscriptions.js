import React from 'react';
import { withApollo } from 'react-apollo';

import PropTypes from 'prop-types';
import Error from '../components/Error';
import withIntl from '../lib/withIntl';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { Button } from 'react-bootstrap';
import { FormattedMessage, defineMessages } from 'react-intl';

import { getSubscriptionsQuery } from '../graphql/queries';
import SubscriptionCard from './SubscriptionCard';
import colors from '../constants/colors';

const SUBSCRIPTIONS_PER_PAGE = 25;

class SubscriptionsWithData extends React.Component {

  static propTypes = {
    LoggedInUser: PropTypes.object,
    collective: PropTypes.object,
    subscriptions: PropTypes.array,
    refetch: PropTypes.func,
    loading: PropTypes.bool
  }

  constructor(props) {
    super(props);

    this.messages = defineMessages({
      'subscription.canceled.label': { id: 'subscription.cancelled.label', defaultMessage: 'Cancelled Subscriptions'},
      'subscription.login.message': { id: 'subscription.login.message', defaultMessage: 'Are these your subscriptions? Login above to edit them'},
    })
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.LoggedInUser && nextProps.LoggedInUser) {
      return this.props.refetch();
    }
  } 


  render() {
    const { intl, subscriptions, LoggedInUser, collective, loading } = this.props;

    if (!subscriptions || loading) {
      return (<div />);
    }

    const activeSubs = subscriptions.filter(s => s.isSubscriptionActive).sort((s1, s2) => s1.id < s2.id);
    const canceledSubs = subscriptions.filter(s => !s.isSubscriptionActive).sort((s1, s2) => s1.id < s2.id)

    let userString = `${collective.name || collective.slug} isn't`;
    if (LoggedInUser && LoggedInUser.canEditCollective(collective)) {
      userString = 'you aren\'t';
    }
    return (
      <div className="Subscriptions">
        <style jsx>{`
          Subscriptions {
            min-height: 500px;
          }
          :global(.loadMoreBtn) {
            margin: 1rem;
            text-align: center;
          }
          .filter {
            width: 100%;
            max-width: 400px;
            margin: 0 auto;
          }
          :global(.filterBtnGroup) {
            width: 100%;
          }
          :global(.filterBtn) {
            width: 33%;
          }
          .active, .canceled {
            display: flex;
            flex-wrap: wrap;
            flex-direction: row;
            justify-content: left;
            overflow: hidden;
            margin: 1rem 0;
          }
          .subscriptions-cancelled-label {
            width: 100%;
            text-align: left;
            margin: 30px 0 30px;
            font-size: 20px;
            font-weight: 700;
            line-height: 1.08;
            letter-spacing: -0.5px;
            border-bottom: 1px solid ${colors.gray};
            line-height: 0.1rem;
            color: ${colors.black};
          }

          .subscriptions-cancelled-label span {
            background: ${colors.offwhite};
            padding: 0 10px;
          }
          .subscriptions-noactive {
            text-align: left;
            font-weight: 300;
            font-size: 18px;
            margin-top: 50px;
            text-align: center;
            margin-bottom: 70px;
          }
          .subscriptions-noactive-image {
            padding-left: 36px;
          }
          .subscriptions-noactive-text {
            padding-top: 2rem;
            width: 100%;
          }
          .subscriptions-noactive-link {
            padding-top: 1rem;
            padding-left: 104px;
          }
        `}</style>

        <div className='active'>
          { activeSubs.map((subscription) =>
            <SubscriptionCard
              subscription={subscription}
              key={subscription.id}
              LoggedInUser={LoggedInUser}
              paymentMethods={collective.paymentMethods}
              slug={collective.slug}
            />
          )}
        </div>
        {activeSubs.length === 0 && 
          <div className='subscriptions-noactive'>
            <img className='subscriptions-noactive-image' src='/static/images/no-subscription-placeholder.svg' />
            <div className='subscriptions-noactive-text'> Looks like {userString} contributing right now.</div>
            <div className='subscriptions-noactive-link'> 
              <a href='/discover'>Discover more collectives</a>
            </div>
          </div>}
        {activeSubs.length > 1 && !LoggedInUser &&
          <div className='subscriptions-login-message'>
            {intl.formatMessage(this.messages['subscription.login.message'])}
          </div>}
        { canceledSubs.length > 0 && <div className="subscriptions-cancelled-label"> <span>{intl.formatMessage(this.messages['subscription.canceled.label'])} </span></div>}
        <div className='canceled'>
          { canceledSubs.map((subscription) =>
            <SubscriptionCard
              subscription={subscription}
              key={subscription.id}
              LoggedInUser={LoggedInUser}
              paymentMethods={collective.paymentMethods}
              slug={collective.slug}
            />
          )}
        </div>
      </div>
    );
  }

}


export default withIntl(SubscriptionsWithData);
