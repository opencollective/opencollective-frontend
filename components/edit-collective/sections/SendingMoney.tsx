import React from 'react';

import hasFeature, { FEATURES, requiresUpgrade } from '../../../lib/allowed-features';
import type { Account } from '@/lib/graphql/types/v2/graphql';

import { DashboardContext } from '@/components/dashboard/DashboardContext';
import { UpgradePlanCTA } from '@/components/platform-subscriptions/UpgradePlanCTA';

import EditPayPalAccount from '../EditPayPalAccount';
import EditTransferWiseAccount from '../EditTransferWiseAccount';

import SettingsSectionTitle from './SettingsSectionTitle';

type SendingMoneyProps = {
  collective: {
    id: number;
    slug: string;
    name: string;
    settings?: Record<string, unknown>;
    connectedAccounts?: Array<{ service?: string }>;
  };
};

const SendingMoney = ({ collective }: SendingMoneyProps) => {
  const { account } = React.useContext(DashboardContext);

  if (requiresUpgrade(account, FEATURES.TRANSFERWISE)) {
    return <UpgradePlanCTA featureKey={FEATURES.TRANSFERWISE} />;
  }
  const paypalAccount = collective.connectedAccounts?.find(c => c.service === 'paypal');

  return (
    <div className="flex flex-col gap-8">
      {hasFeature(account, FEATURES.PAYPAL_PAYOUTS) && (
        <div>
          <SettingsSectionTitle>PayPal</SettingsSectionTitle>
          <EditPayPalAccount collective={collective} connectedAccount={paypalAccount} variation="SENDING" />
        </div>
      )}

      <div>
        <SettingsSectionTitle>Wise</SettingsSectionTitle>
        <EditTransferWiseAccount collective={collective as unknown as Account} />
      </div>
    </div>
  );
};

export default SendingMoney;
