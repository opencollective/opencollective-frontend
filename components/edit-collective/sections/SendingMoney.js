import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import hasFeature, { FEATURES } from '../../../lib/allowed-features';

import { P } from '../../Text';
import SettingsTitle from '../SettingsTitle';

import ConnectedAccounts from './ConnectedAccounts';
import SettingsSectionTitle from './SettingsSectionTitle';

class SendingMoney extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
  };

  render() {
    const services = ['transferwise'];
    if (hasFeature(this.props.collective, FEATURES.PAYPAL_PAYOUTS)) {
      services.push('paypal');
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
            <P>
              <FormattedMessage
                id="collective.sendMoney.description"
                defaultMessage={"PayPal is activated by default, you don't have to configure anything."}
              />
            </P>
          </Fragment>
        )}
      </Fragment>
    );
  }
}

export default injectIntl(SendingMoney);
