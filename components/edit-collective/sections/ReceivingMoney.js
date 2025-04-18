import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { has } from 'lodash';
import { injectIntl, FormattedMessage } from 'react-intl';

import hasFeature, { FEATURES } from '../../../lib/allowed-features';
import { CollectiveType } from '../../../lib/constants/collectives';

import BankTransfer from './BankTransfer';
import ConnectedAccounts from './ConnectedAccounts';
import SettingsSectionTitle from './SettingsSectionTitle';
import EditPayPalAccount from '../EditPayPalAccount';

const { USER } = CollectiveType;

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

    return (
      <Fragment>
        {!this.state.hideTopsection && (
          <>
            <ConnectedAccounts
              collective={this.props.collective}
              connectedAccounts={this.props.collective.connectedAccounts}
              services={services}
              variation="RECEIVING"
            />
            {hasFeature(this.props.collective, FEATURES.PAYPAL_DONATIONS) && (
              <div className="mb-8">
                <SettingsSectionTitle>
                  <FormattedMessage id="PayoutMethod.Type.Paypal" defaultMessage="PayPal" />
                </SettingsSectionTitle>
                <EditPayPalAccount
                  collective={this.props.collective}
                  connectedAccount={this.props.collective.connectedAccounts?.find(c => c.service === 'paypal')}
                  variation="RECEIVING"
                />
              </div>
            )}
          </>
        )}
        {(this.props.collective.type !== USER || has(this.props.collective, 'data.settings.paymentMethods.manual')) && (
          <BankTransfer collectiveSlug={this.props.collective.slug} hideTopsection={this.hideTopsection} />
        )}
      </Fragment>
    );
  }
}

export default injectIntl(ReceivingMoney);
