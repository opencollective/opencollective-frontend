import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { FormattedMessage, injectIntl } from 'react-intl';

import hasFeature, { FEATURES } from '../../../lib/allowed-features';
import { editCollectiveSettingsMutation } from '../../../lib/graphql/v1/mutations';

import MessageBox from '../../MessageBox';
import { Button } from '../../ui/Button';

import SettingsSectionTitle from './SettingsSectionTitle';
import EditTransferWiseAccount from '../EditTransferWiseAccount';
import EditPayPalAccount from '../EditPayPalAccount';

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
            </div>
          )}
          <div>
            <SettingsSectionTitle>Wise</SettingsSectionTitle>
            <EditTransferWiseAccount
              collective={this.props.collective}
              connectedAccount={this.props.connectedAccount}
            />
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
