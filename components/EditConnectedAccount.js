import React from 'react';
import PropTypes from 'prop-types';
import { HelpBlock, Button } from 'react-bootstrap';
import { defineMessages, injectIntl } from 'react-intl';

import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../lib/local-storage';
import { connectAccount, disconnectAccount } from '../lib/api';
import EditTwitterAccount from './edit-collective/EditTwitterAccount';

class EditConnectedAccount extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    connectedAccounts: PropTypes.arrayOf(PropTypes.object),
    options: PropTypes.object,
    editMode: PropTypes.bool,
    intl: PropTypes.object.isRequired,
    service: PropTypes.string,
    connectedAccount: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.state = {
      editMode: props.editMode || false,
      connectedAccount: props.connectedAccount,
    };
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);

    this.messages = defineMessages({
      'collective.connectedAccounts.reconnect.button': {
        id: 'collective.connectedAccounts.reconnect.button',
        defaultMessage: 'Reconnect',
      },
      'collective.connectedAccounts.disconnect.button': {
        id: 'collective.connectedAccounts.disconnect.button',
        defaultMessage: 'Disconnect',
      },
      'collective.connectedAccounts.stripe.button': {
        id: 'collective.connectedAccounts.stripe.button',
        defaultMessage: 'Connect Stripe',
      },
      'collective.connectedAccounts.stripe.description': {
        id: 'collective.create.connectedAccounts.stripe.description',
        defaultMessage: 'Connect a Stripe account to start accepting financial contributions.',
      },
      'collective.connectedAccounts.stripe.connected': {
        id: 'collective.connectedAccounts.stripe.connected',
        defaultMessage: 'Stripe account connected on {updatedAt, date, short}',
      },
      'collective.connectedAccounts.twitter.button': {
        id: 'collective.connectedAccounts.twitter.button',
        defaultMessage: 'Connect Twitter',
      },
      'collective.connectedAccounts.twitter.description': {
        id: 'collective.connectedAccounts.twitter.description',
        defaultMessage: 'Connect a Twitter account to automatically thank new financial contributors',
      },
      'collective.connectedAccounts.twitter.connected': {
        id: 'collective.connectedAccounts.twitter.connected',
        defaultMessage: 'Twitter account @{username} connected on {updatedAt, date, short}',
      },
      'collective.connectedAccounts.github.button': {
        id: 'collective.connectedAccounts.github.button',
        defaultMessage: 'Connect GitHub',
      },
      'collective.connectedAccounts.github.description': {
        id: 'collective.connectedAccounts.github.description',
        defaultMessage: 'Connect a GitHub account to verify your identity and add it to your profile',
      },
      'collective.connectedAccounts.github.connected': {
        id: 'collective.connectedAccounts.github.connected',
        defaultMessage: 'GitHub account {username} connected on {updatedAt, date, short}',
      },
    });
    this.services = ['stripe', 'paypal', 'twitter', 'github'];
  }

  connect(service) {
    const { collective, options } = this.props;

    if (service === 'github' || service === 'twitter') {
      const redirect = `${window.location.protocol}//${window.location.host}/${collective.slug}/edit/connected-accounts`;
      return window.location.replace(
        `/api/connected-accounts/${service}/oauthUrl?CollectiveId=${collective.id}&redirect=${encodeURIComponent(
          redirect,
        )}&access_token=${getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN)}`,
      );
    }

    connectAccount(collective.id, service, options)
      .then(json => {
        return (window.location.href = json.redirectUrl);
      })
      .catch(err => {
        console.error(`>>> /api/connected-accounts/${service} error`, err);
      });
  }

  disconnect(service) {
    const { collective } = this.props;

    disconnectAccount(collective.id, service)
      .then(json => {
        if (json.deleted === true) {
          this.setState({
            connectedAccount: null,
          });
        }
      })
      .catch(err => {
        console.error(`>>> /api/connected-accounts/${service}/disconnect error`, err);
      });
  }

  render() {
    const { intl, service, collective } = this.props;
    const { connectedAccount } = this.state;

    let vars = {};
    if (connectedAccount) {
      vars = {
        username: connectedAccount.username,
        updatedAt: new Date(connectedAccount.updatedAt),
      };
    }
    return (
      <div className="EditConnectedAccount">
        {!connectedAccount && (
          <div>
            <HelpBlock>
              {intl.formatMessage(this.messages[`collective.connectedAccounts.${service}.description`])}
            </HelpBlock>
            <Button onClick={() => this.connect(service)}>
              {intl.formatMessage(this.messages[`collective.connectedAccounts.${service}.button`])}
            </Button>
          </div>
        )}
        {connectedAccount && (
          <div>
            <div>{intl.formatMessage(this.messages[`collective.connectedAccounts.${service}.connected`], vars)}</div>
            <Button onClick={() => this.connect(service)}>
              {intl.formatMessage(this.messages['collective.connectedAccounts.reconnect.button'])}
            </Button>{' '}
            <Button onClick={() => this.disconnect(service)}>
              {intl.formatMessage(this.messages['collective.connectedAccounts.disconnect.button'])}
            </Button>
          </div>
        )}
        {connectedAccount && connectedAccount.service === 'twitter' && collective.type === 'ORGANIZATION' && (
          <EditTwitterAccount collective={collective} connectedAccount={connectedAccount} />
        )}
      </div>
    );
  }
}

export default injectIntl(EditConnectedAccount);
