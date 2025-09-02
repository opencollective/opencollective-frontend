import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { FEATURES, requiresUpgrade } from '../../../lib/allowed-features';

import { DashboardContext } from '@/components/dashboard/DashboardContext';
import { UpgradePlanCTA } from '@/components/platform-subscriptions/UpgradePlanCTA';

import EditPayPalAccount from '../EditPayPalAccount';
import EditTransferWiseAccount from '../EditTransferWiseAccount';

import SettingsSectionTitle from './SettingsSectionTitle';

const SendingMoney = ({ collective }) => {
  const { account } = React.useContext(DashboardContext);

  if (requiresUpgrade(account, FEATURES.TRANSFERWISE) && requiresUpgrade(account, FEATURES.PAYPAL_PAYOUTS)) {
    // The TRANSFERWISE feature is used here, since they share the same Upgrade plan CTA messaging.
    return <UpgradePlanCTA featureKey={FEATURES.TRANSFERWISE} />;
  }
  const paypalAccount = collective.connectedAccounts?.find(c => c.service === 'paypal');

  return (
    <div className="flex flex-col gap-8">
      <div>
        <SettingsSectionTitle>
          <FormattedMessage id="PayoutMethod.Type.Paypal" defaultMessage="PayPal" />
        </SettingsSectionTitle>
        <EditPayPalAccount collective={collective} connectedAccount={paypalAccount} variation="SENDING" />
      </div>
      <div>
        <SettingsSectionTitle>Wise</SettingsSectionTitle>
        <EditTransferWiseAccount collective={collective} />
      </div>
    </div>
  );
};

SendingMoney.propTypes = {
  collective: PropTypes.object.isRequired,
};

export default SendingMoney;
