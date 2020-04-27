import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import colors from '../lib/constants/colors';

import SubscriptionCard from './SubscriptionCard';

class Subscriptions extends React.Component {
  static propTypes = {
    LoggedInUser: PropTypes.object,
    collective: PropTypes.object,
    subscriptions: PropTypes.array,
    refetch: PropTypes.func,
    loading: PropTypes.bool,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.messages = defineMessages({
      'subscription.canceled.label': {
        id: 'subscription.cancelled.label',
        defaultMessage: 'Cancelled financial contributions',
      },
      'subscription.pending.label': {
        id: 'subscription.pending.label',
        defaultMessage: 'Pending financial contributions',
      },
      'subscription.login.message': {
        id: 'subscription.login.message',
        defaultMessage: 'Are these your financial contributions? Log in above to edit them',
      },
    });
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.LoggedInUser && this.props.LoggedInUser) {
      return this.props.refetch();
    }
  }

  sortBycreatedAt(a, b) {
    const aTimestamp = new Date(a.createdAt).getTime();
    const bTimestamp = new Date(b.createdAt).getTime();

    return bTimestamp - aTimestamp;
  }

  render() {
    const { intl, subscriptions, LoggedInUser, collective, loading } = this.props;

    if (!subscriptions || loading) {
      return <div />;
    }

    const activeSubs = subscriptions.filter(s => s.isSubscriptionActive).sort(this.sortBycreatedAt);
    const canceledSubs = subscriptions
      .filter(s => !s.isSubscriptionActive && s.status !== 'PENDING')
      .sort(this.sortBycreatedAt);
    const pendingSubs = subscriptions.filter(({ status }) => status === 'PENDING').sort(this.sortBycreatedAt);

    return (
      <div className="Subscriptions">
        <style jsx>
          {`
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
            .active,
            .canceled,
            .pending {
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
          `}
        </style>

        <div className="active">
          {activeSubs.map(subscription => (
            <SubscriptionCard
              subscription={subscription}
              key={`active-${subscription.id}`}
              LoggedInUser={LoggedInUser}
              paymentMethods={collective.paymentMethods}
              slug={collective.slug}
            />
          ))}
        </div>
        {activeSubs.length === 0 && (
          <div className="subscriptions-noactive">
            <img className="subscriptions-noactive-image" src="/static/images/no-subscription-placeholder.svg" />
            <div className="subscriptions-noactive-text">
              <FormattedMessage
                id="Subscriptions.Empty"
                defaultMessage="No active recurring financial contributions."
              />
            </div>
            <div className="subscriptions-noactive-link">
              <a href="/discover">
                <FormattedMessage id="home.discoverMore" defaultMessage="Discover more Collectives" />
              </a>
            </div>
          </div>
        )}
        {activeSubs.length > 1 && !LoggedInUser && (
          <div className="subscriptions-login-message">
            {intl.formatMessage(this.messages['subscription.login.message'])}
          </div>
        )}
        {canceledSubs.length > 0 && (
          <div className="subscriptions-cancelled-label">
            {' '}
            <span>{intl.formatMessage(this.messages['subscription.canceled.label'])} </span>
          </div>
        )}
        <div className="canceled">
          {canceledSubs.map(subscription => (
            <SubscriptionCard
              subscription={subscription}
              key={`canceled-${subscription.id}`}
              LoggedInUser={LoggedInUser}
              paymentMethods={collective.paymentMethods}
              slug={collective.slug}
            />
          ))}
        </div>
        {pendingSubs.length > 0 && (
          <div className="subscriptions-cancelled-label">
            {' '}
            <span>{intl.formatMessage(this.messages['subscription.pending.label'])} </span>
          </div>
        )}
        <div className="pending">
          {pendingSubs.map(subscription => (
            <SubscriptionCard
              subscription={subscription}
              key={`canceled-${subscription.id}`}
              LoggedInUser={LoggedInUser}
              paymentMethods={collective.paymentMethods}
              slug={collective.slug}
            />
          ))}
        </div>
      </div>
    );
  }
}

export default injectIntl(Subscriptions);
