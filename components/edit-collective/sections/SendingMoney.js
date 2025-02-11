import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { FormattedMessage, injectIntl } from 'react-intl';

import hasFeature, { FEATURES } from '../../../lib/allowed-features';
import { editCollectiveSettingsMutation } from '../../../lib/graphql/v1/mutations';

import MessageBox from '../../MessageBox';
import { P } from '../../Text';
import { Button } from '../../ui/Button';

import ConnectedAccounts from './ConnectedAccounts';
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
    const services = ['transferwise'];
    if (hasFeature(this.props.collective, FEATURES.PAYPAL_PAYOUTS)) {
      services.push('paypal');
    }

    let paypalConnectButton;
    if (this.props.collective.settings?.disablePaypalPayouts) {
      paypalConnectButton = (
        <FormattedMessage id="collective.paypalPayoutsEnable.button" defaultMessage="Enable PayPal Payouts" />
      );
    } else {
      paypalConnectButton = (
        <FormattedMessage id="collective.paypalPayoutsDisable.button" defaultMessage="Disable PayPal Payouts" />
      );
    }

    return (
      <Fragment>
        <ConnectedAccounts
          collective={this.props.collective}
          connectedAccounts={this.props.collective.connectedAccounts}
          services={services}
        />
        {services.includes('paypal') && this.props.collective.connectedAccounts?.find(c => c.service === 'paypal') && (
          <Fragment>
            <SettingsSectionTitle>
              <FormattedMessage id="PayoutMethod.Type.Paypal" defaultMessage="PayPal" />
            </SettingsSectionTitle>
            {!this.props.collective.settings?.disablePaypalPayouts && (
              <P mb={3}>
                <FormattedMessage
                  id="collective.sendMoney.paypalEnabled.description"
                  defaultMessage="PayPal Payouts are active. Contributors can request Expenses to be paid with PayPal."
                />
              </P>
            )}
            {this.props.collective.settings?.disablePaypalPayouts && (
              <P mb={3}>
                <FormattedMessage
                  id="collective.sendMoney.paypalDisabled.description"
                  defaultMessage="PayPal Payouts are disabled. Contributors are not able to request Expenses to be paid with PayPal."
                />
              </P>
            )}
            <Button
              loading={this.state.isSubmitting}
              onClick={this.togglePaypal}
              type="submit"
              size="sm"
              variant="outline"
              className="w-fit grow-0"
            >
              {paypalConnectButton}
            </Button>
            {this.state.error && (
              <MessageBox type="error" withIcon my={3}>
                {this.state.error}
              </MessageBox>
            )}
          </Fragment>
        )}
      </Fragment>
    );
  }
}

const addEditCollectiveSettingsMutation = graphql(editCollectiveSettingsMutation, {
  name: 'editCollectiveSettings',
});

export default injectIntl(addEditCollectiveSettingsMutation(SendingMoney));
