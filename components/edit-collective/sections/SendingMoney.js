import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { FormattedMessage, injectIntl } from 'react-intl';

import { FEATURES, isFeatureEnabled, isFeatureSupported } from '../../../lib/allowed-features';
import { editCollectiveSettingsMutation } from '../../../lib/graphql/v1/mutations';

import { UpgradeSubscriptionBlocker } from '@/components/platform-subscriptions/UpgradeSubscriptionBlocker';

import MessageBox from '../../MessageBox';
import EditPayPalAccount from '../EditPayPalAccount';
import EditTransferWiseAccount from '../EditTransferWiseAccount';

import SettingsSectionTitle from './SettingsSectionTitle';

class SendingMoney extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    editCollectiveSettings: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isSubmitting: false,
    };
  }

  togglePaypal = async () => {
    try {
      this.setState({ isSubmitting: true });
      await this.props.editCollectiveSettings({
        variables: {
          id: this.props.collective.id,
          settings: {
            ...this.props.collective.settings,
            disablePaypalPayouts: !this.props.collective.settings.disablePaypalPayouts,
          },
        },
      });
      this.setState({ isSubmitting: false });
    } catch (e) {
      this.setState({ error: e.toString() });
    }
  };

  render() {
    const paypalAccount = this.props.collective.connectedAccounts?.find(c => c.service === 'paypal');

    return (
      <Fragment>
        <div className="flex flex-col gap-8">
          {isFeatureSupported(this.props.collective, FEATURES.PAYPAL_PAYOUTS) && (
            <div>
              <SettingsSectionTitle>
                <FormattedMessage id="PayoutMethod.Type.Paypal" defaultMessage="PayPal" />
              </SettingsSectionTitle>
              {isFeatureEnabled(this.props.collective, FEATURES.PAYPAL_PAYOUTS) ? (
                <React.Fragment>
                  <EditPayPalAccount
                    collective={this.props.collective}
                    connectedAccount={paypalAccount}
                    variation="SENDING"
                  />
                  {this.state.error && (
                    <MessageBox type="error" withIcon my={3}>
                      {this.state.error}
                    </MessageBox>
                  )}
                </React.Fragment>
              ) : (
                <UpgradeSubscriptionBlocker
                  featureKey={FEATURES.PAYPAL_PAYOUTS}
                  description={this.props.intl.formatMessage({
                    defaultMessage:
                      'This feature is not available on your current plan. Upgrade your subscription to be able to pay expenses with PayPal.',
                    id: 'UpgradeSubscriptionBlocker.PayPalPayouts.description',
                  })}
                />
              )}
            </div>
          )}
          {isFeatureSupported(this.props.collective, FEATURES.TRANSFERWISE) && (
            <div>
              <SettingsSectionTitle>Wise</SettingsSectionTitle>
              {isFeatureEnabled(this.props.collective, FEATURES.TRANSFERWISE) ? (
                <EditTransferWiseAccount collective={this.props.collective} />
              ) : (
                <UpgradeSubscriptionBlocker
                  featureKey={FEATURES.PAYPAL_PAYOUTS}
                  description={this.props.intl.formatMessage({
                    defaultMessage:
                      'This feature is not available on your current plan. Upgrade your subscription to be able to pay expenses with Wise.',
                    id: 'UpgradeSubscriptionBlocker.Transferwise.description',
                  })}
                />
              )}
            </div>
          )}
        </div>
      </Fragment>
    );
  }
}

const addEditCollectiveSettingsMutation = graphql(editCollectiveSettingsMutation, {
  name: 'editCollectiveSettings',
});

export default injectIntl(addEditCollectiveSettingsMutation(SendingMoney));
