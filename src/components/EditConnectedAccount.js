import React from 'react';
import PropTypes from 'prop-types';

import { HelpBlock, Button } from 'react-bootstrap';
import { defineMessages, FormattedMessage } from 'react-intl';
import withIntl from '../lib/withIntl';
import fetch from 'isomorphic-fetch';

class EditConnectedAccount extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired,
    connectedAccounts: PropTypes.arrayOf(PropTypes.object)
  };

  constructor(props) {
    super(props);
    const { intl } = props;

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

  /**
   * The Promise returned from fetch() won't reject on HTTP error status. We
   * need to throw an error ourselves.
   */
  checkStatus(response) {
    console.log(">>> checkStatus", response);
    const { status } = response;
    if (status >= 200 && status < 300) {
      return response.json();
    } else {
      return response.json()
      .then((json) => {
        const error = new Error(json.error.message);
        error.json = json;
        error.response = response;
        throw error;
      });
    }
  }

  addAuthTokenToHeader(obj = {}) {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return obj;
    return {
      Authorization: `Bearer ${accessToken}`,
      ...obj,
    };
  }

  connect(service) {
    fetch(`/api/connected-accounts/${service}?CollectiveId=${this.props.collective.id}`, {
      method: 'get',
      headers: this.addAuthTokenToHeader()
    })
    .then(this.checkStatus)
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