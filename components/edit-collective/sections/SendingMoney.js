import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { FormattedMessage, injectIntl } from 'react-intl';

import hasFeature, { FEATURES } from '../../../lib/allowed-features';

import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import { P } from '../../Text';
import SettingsTitle from '../SettingsTitle';

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
    if (hasFeature(this.props.collective, FEATURES.PRIVACY_VCC)) {
      services.push('privacy');
    }

    let paypalConnectButton;
    if (this.props.collective.settings?.disablePaypalPayouts) {
      paypalConnectButton = <FormattedMessage id="collective.paypalEnable.button" defaultMessage="Enable PayPal" />;
    } else {
      paypalConnectButton = <FormattedMessage id="collective.paypalDisable.button" defaultMessage="Disable PayPal" />;
    }

    return (
      <Fragment>
        <SettingsTitle mb={4}>
          <FormattedMessage id="editCollective.sendingMoney" defaultMessage={'Sending Money'} />
        </SettingsTitle>
        <ConnectedAccounts
          collective={this.props.collective}
          connectedAccounts={this.props.collective.connectedAccounts}
          services={services}
        />
        {!services.includes('paypal') && (
          <Fragment>
            <SettingsSectionTitle>
              <FormattedMessage id="PayoutMethod.Type.Paypal" defaultMessage={'PayPal'} />
            </SettingsSectionTitle>
            {!this.props.collective.settings?.disablePaypalPayouts && (
              <P mb={3}>
                <FormattedMessage
                  id="collective.sendMoney.paypalEnable.description"
                  defaultMessage={"PayPal is active by default. You don't have to configure anything."}
                />
              </P>
            )}
            {this.props.collective.settings?.disablePaypalPayouts && (
              <P mb={3}>
                <FormattedMessage
                  id="collective.sendMoney.paypalDisable.description"
                  defaultMessage={'PayPal is disabled. Click below to enable it.'}
                />
              </P>
            )}
            <StyledButton
              loading={this.state.isSubmitting}
              onClick={this.togglePaypal}
              mt={2}
              type="submit"
              maxWidth={200}
            >
              {paypalConnectButton}
            </StyledButton>
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

const editCollectiveSettingsMutation = gql`
  mutation EditCollectiveSettings($id: Int!, $settings: JSON) {
    editCollective(collective: { id: $id, settings: $settings }) {
      id
      settings
    }
  }
`;

const addEditCollectiveSettingsMutation = graphql(editCollectiveSettingsMutation, {
  name: 'editCollectiveSettings',
});

export default injectIntl(addEditCollectiveSettingsMutation(SendingMoney));
