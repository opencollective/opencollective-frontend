import React from 'react';
import PropTypes from 'prop-types';

import { Row, Col, Checkbox, Button, Form } from 'react-bootstrap';
import { defineMessages, FormattedMessage } from 'react-intl';
import withIntl from '../lib/withIntl';
import EditConnectedAccount from '../components/EditConnectedAccount';
import { groupBy } from 'lodash';

class EditConnectedAccounts extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired,
    connectedAccounts: PropTypes.arrayOf(PropTypes.object)
  };

  constructor(props) {
    super(props);
    const { intl } = props;

    this.state = { editMode: props.editMode || false };

    this.messages = defineMessages({
      'collective.connectedAccounts.stripe.button': { id: 'collective.connectedAccounts.stripe.button', defaultMessage: 'Connect Stripe' },
      'collective.connectedAccounts.stripe.description': { id: 'collective.connectedAccounts.stripe.description', defaultMessage: 'Connect a Stripe account to start accepting donations' }
    });
    this.connectedAccounts = groupBy(props.connectedAccounts, 'service');

    // We can't handle Twitter and Github since they are using node-passport which returns a 302 redirect
    // We should move node-passport to the frontend
    this.services = ['stripe'];
    console.log(">>> connectedAccounts", this.connectedAccounts,props.connectedAccounts)
  }

  render() {
    const { intl, collective } = this.props;

    return (
      <div className="EditConnectedAccounts">
        <style global jsx>{`
        `}</style>

      { this.services.map(service => <EditConnectedAccount collective={collective} service={service} connectedAccount={this.connectedAccounts[service]} />) }

      </div>
    );
  }

}

export default withIntl(EditConnectedAccounts);