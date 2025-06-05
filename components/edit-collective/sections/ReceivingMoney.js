import React, { Fragment } from 'react';
import { has } from 'lodash';
import { FormattedMessage, injectIntl } from 'react-intl';

import hasFeature, { FEATURES } from '../../../lib/allowed-features';
import { CollectiveType } from '../../../lib/constants/collectives';

import EditPayPalAccount from '../EditPayPalAccount';

import BankTransfer from './BankTransfer';
import ConnectedAccounts from './ConnectedAccounts';
import SettingsSectionTitle from './SettingsSectionTitle';

const { USER } = CollectiveType;

class ReceivingMoney extends React.Component {
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
          </React.Fragment>
        )}
        {(this.props.collective.type !== USER || has(this.props.collective, 'data.settings.paymentMethods.manual')) && (
          <BankTransfer collectiveSlug={this.props.collective.slug} hideTopsection={this.hideTopsection} />
        )}
      </Fragment>
    );
  }
}

export default injectIntl(ReceivingMoney);
