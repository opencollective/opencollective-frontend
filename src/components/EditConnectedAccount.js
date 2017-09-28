import React from 'react';
import PropTypes from 'prop-types';

import { HelpBlock, Button } from 'react-bootstrap';
import { defineMessages, FormattedMessage } from 'react-intl';
import withIntl from '../lib/withIntl';
import { fetchConnectedAccount } from '../lib/api';

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
      'collective.connectedAccounts.stripe.button': { id: 'collective.connectedAccounts.stripe.button', defaultMessage: 'Connect Stripe' },
      'collective.connectedAccounts.stripe.description': { id: 'collective.connectedAccounts.stripe.description', defaultMessage: 'Connect a Stripe account to create collectives and start accepting donations on their behalf.' },
      'collective.connectedAccounts.stripe.connected': { id: 'collective.connectedAccounts.stripe.connected', defaultMessage: 'Stripe account connected on {createdAt, date, short}' },
      'collective.connectedAccounts.twitter.button': { id: 'collective.connectedAccounts.twitter.button', defaultMessage: 'Connect Twitter' },
      'collective.connectedAccounts.twitter.description': { id: 'collective.connectedAccounts.twitter.description', defaultMessage: 'Connect a Twitter account to automatically thank new backers' },
      'collective.connectedAccounts.twitter.connected': { id: 'collective.connectedAccounts.twitter.connected', defaultMessage: 'Twitter account connected on {createdAt, date, short}' }
    });
    this.services = ['stripe', 'paypal', 'twitter', 'github'];
  }

  connect(service) {
    fetchConnectedAccount(this.props.collective.id, service)
    .then(json => {
      console.log(`>>> /api/connected-accounts/${service} response`, json);
      return window.location.replace(json.redirectUrl);
    })
    .catch(err => {
      console.error(`>>> /api/connected-accounts/${service} error`, err);
    })
  }

  render() {
    const { intl, service, connectedAccount } = this.props;

    return (
      <div className="EditConnectedAccount">
        <style global jsx>{`
        `}</style>

      { !connectedAccount &&
        <div>
          <Button onClick={() => this.connect(service)}>{intl.formatMessage(this.messages[`collective.connectedAccounts.${service}.button`])}</Button>
          <HelpBlock>{intl.formatMessage(this.messages[`collective.connectedAccounts.${service}.description`])}</HelpBlock>
        </div>
      }
      { connectedAccount &&
        <div>{intl.formatMessage(this.messages[`collective.connectedAccounts.${service}.connected`], { createdAt: connectedAccount.createdAt })}</div>
      }
      </div>
    );
  }

}

export default withIntl(EditConnectedAccount);