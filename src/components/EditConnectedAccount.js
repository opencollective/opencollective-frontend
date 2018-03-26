import React from 'react';
import PropTypes from 'prop-types';

import { HelpBlock, Button } from 'react-bootstrap';
import { defineMessages, FormattedMessage } from 'react-intl';
import withIntl from '../lib/withIntl';
import { connectAccount } from '../lib/api';
import EditTwitterAccount from './EditTwitterAccount';

class EditConnectedAccount extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired,
    connectedAccounts: PropTypes.arrayOf(PropTypes.object)
  };

  constructor(props) {
    super(props);

    this.state = { editMode: props.editMode || false };
    this.connect = this.connect.bind(this);

    this.messages = defineMessages({
      'collective.connectedAccounts.reconnect.button': { id: 'collective.connectedAccounts.reconnect.button', defaultMessage: 'Reconnect' },
      'collective.connectedAccounts.stripe.button': { id: 'collective.connectedAccounts.stripe.button', defaultMessage: 'Connect Stripe' },
      'collective.connectedAccounts.stripe.description': { id: 'collective.connectedAccounts.stripe.description', defaultMessage: 'Connect a Stripe account to create collectives and start accepting donations on their behalf.' },
      'collective.connectedAccounts.stripe.connected': { id: 'collective.connectedAccounts.stripe.connected', defaultMessage: 'Stripe account connected on {createdAt, date, short}' },
      'collective.connectedAccounts.twitter.button': { id: 'collective.connectedAccounts.twitter.button', defaultMessage: 'Connect Twitter' },
      'collective.connectedAccounts.twitter.description': { id: 'collective.connectedAccounts.twitter.description', defaultMessage: 'Connect a Twitter account to automatically thank new backers' },
      'collective.connectedAccounts.twitter.connected': { id: 'collective.connectedAccounts.twitter.connected', defaultMessage: 'Twitter account @{username} connected on {createdAt, date, short}' },
      'collective.connectedAccounts.github.button': { id: 'collective.connectedAccounts.github.button', defaultMessage: 'Connect GitHub' },
      'collective.connectedAccounts.github.description': { id: 'collective.connectedAccounts.github.description', defaultMessage: 'Connect a GitHub account to verify your identity and add it to your profile' },
      'collective.connectedAccounts.github.connected': { id: 'collective.connectedAccounts.github.connected', defaultMessage: 'GitHub account {username} connected on {createdAt, date, short}' }
    });
    this.services = ['stripe', 'paypal', 'twitter', 'github'];
  }

  connect(service) {
    const { collective } = this.props;

    if (service === 'github' || service === 'twitter') {
      const redirect = `${window.location.protocol}//${window.location.host}/${collective.slug}/edit#connectedAccounts`;
      return window.location.replace(`/api/connected-accounts/${service}/oauthUrl?CollectiveId=${collective.id}&redirect=${encodeURIComponent(redirect)}&access_token=${localStorage.accessToken}`);
    }

    connectAccount(collective.id, service)
    .then(json => {
      console.log(`>>> /api/connected-accounts/${service} response`, json);
      return window.location.replace(json.redirectUrl);
    })
    .catch(err => {
      console.error(`>>> /api/connected-accounts/${service} error`, err);
    })
  }

  render() {
    const { intl, service, connectedAccount, collective } = this.props;
    let vars = {};
    if (connectedAccount) {
      vars = {
        username: connectedAccount.username,
        createdAt: new Date(connectedAccount.createdAt)
      };
    }
    return (
      <div className="EditConnectedAccount">

      { !connectedAccount &&
        <div>
          <HelpBlock>{intl.formatMessage(this.messages[`collective.connectedAccounts.${service}.description`])}</HelpBlock>
          <Button onClick={() => this.connect(service)}>{intl.formatMessage(this.messages[`collective.connectedAccounts.${service}.button`])}</Button>
        </div>
      }
      { connectedAccount &&
        <div>
          <div>{intl.formatMessage(this.messages[`collective.connectedAccounts.${service}.connected`], vars)}</div>
          <Button onClick={() => this.connect(service)}>{intl.formatMessage(this.messages[`collective.connectedAccounts.reconnect.button`])}</Button>
        </div>
      }
      { connectedAccount && connectedAccount.service === 'twitter' &&
        <EditTwitterAccount collective={collective} connectedAccount={connectedAccount} />
      }
      </div>
    );
  }

}

export default withIntl(EditConnectedAccount);