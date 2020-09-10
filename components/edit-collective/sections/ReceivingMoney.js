import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import hasFeature, { FEATURES } from '../../../lib/allowed-features';

import { H3 } from '../../Text';

import BankTransfer from './BankTransfer';
import ConnectedAccounts from './ConnectedAccounts';

class ReceivingMoney extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
  };

  state = {
    hideTopsection: false,
  };

  hideTopsection = value => {
    this.setState({ hideTopsection: value });
  };

  render() {
    const services = ['stripe'];

    if (hasFeature(this.props.collective, FEATURES.PAYPAL_DONATIONS)) {
      services.push('paypal');
    }

    return (
      <Fragment>
        {!this.state.hideTopsection && (
          <React.Fragment>
            <H3>
              <FormattedMessage id="editCollective.receivingMoney" defaultMessage="Receiving Money" />
            </H3>
            <ConnectedAccounts
              collective={this.props.collective}
              connectedAccounts={this.props.collective.connectedAccounts}
              services={services}
            />
          </React.Fragment>
        )}
        <BankTransfer collectiveSlug={this.props.collective.slug} hideTopsection={this.hideTopsection} />
      </Fragment>
    );
  }
}

export default injectIntl(ReceivingMoney);
