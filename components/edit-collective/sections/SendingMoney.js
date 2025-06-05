import React, { Fragment } from 'react';
import { graphql } from '@apollo/client/react/hoc';
import { FormattedMessage, injectIntl } from 'react-intl';

import hasFeature, { FEATURES } from '../../../lib/allowed-features';
import { editCollectiveSettingsMutation } from '../../../lib/graphql/v1/mutations';

import MessageBox from '../../MessageBox';
import EditPayPalAccount from '../EditPayPalAccount';
import EditTransferWiseAccount from '../EditTransferWiseAccount';

import SettingsSectionTitle from './SettingsSectionTitle';

class SendingMoney extends React.Component {
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
          {hasFeature(this.props.collective, FEATURES.PAYPAL_PAYOUTS) && (
            <div>
              <SettingsSectionTitle>
                <FormattedMessage id="PayoutMethod.Type.Paypal" defaultMessage="PayPal" />
              </SettingsSectionTitle>
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
            </div>
          )}
          <div>
            <SettingsSectionTitle>Wise</SettingsSectionTitle>
            <EditTransferWiseAccount collective={this.props.collective} />
          </div>
        </div>
      </Fragment>
    );
  }
}

const addEditCollectiveSettingsMutation = graphql(editCollectiveSettingsMutation, {
  name: 'editCollectiveSettings',
});

export default injectIntl(addEditCollectiveSettingsMutation(SendingMoney));
