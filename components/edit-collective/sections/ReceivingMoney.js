import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import { H3 } from '../../Text';

import ConnectedAccounts from './ConnectedAccounts';
import BankTransfer from './BankTransfer';

class ReceivingMoney extends React.Component {
  static propTypes = {
    collectiveSlug: PropTypes.string.isRequired,
    collective: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
  }

  state = {
    hideTopsection: false,
  };

  hideTopsection = value => {
    this.setState({ hideTopsection: value });
  };

  render() {
    const services = ['stripe'];
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
        <BankTransfer collectiveSlug={this.props.collectiveSlug} hideTopsection={this.hideTopsection}></BankTransfer>
      </Fragment>
    );
  }
}

export default injectIntl(ReceivingMoney);
