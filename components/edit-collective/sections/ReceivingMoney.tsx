import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import hasFeature, { FEATURES } from '../../../lib/allowed-features';
import { hasAccountMoneyManagement } from '@/lib/collective';
import type { Account, ConnectedAccount } from '@/lib/graphql/types/v2/schema';

import PageFeatureNotSupported from '@/components/PageFeatureNotSupported';

import EditConnectedAccount from '../EditConnectedAccount';
import EditPayPalAccount from '../EditPayPalAccount';

import CustomPaymentMethods from './receive-money/CustomPaymentMethods';
import BankTransfer from './BankTransfer';
import SettingsSectionTitle from './SettingsSectionTitle';

const ReceivingMoney = ({ collective }: {
  collective: Pick<Account, 'type' | 'slug' | 'isHost'> & {
    connectedAccounts: Pick<ConnectedAccount, 'service'>[];
  }
}) => {
  const [hideTopsection, setHideTopsection] = useState(false);
  if (!hasAccountMoneyManagement(collective)) {
    return <PageFeatureNotSupported />;
  }

  return (
    <div className="space-y-8">
      {/* Automatic Payments Section */}
      {!hideTopsection && (
        <div className="mb-8">
          <SettingsSectionTitle>
            <FormattedMessage id="editCollective.receivingMoney.automaticPayments" defaultMessage="Automatic Payments" />
          </SettingsSectionTitle>
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h4 className="mb-4 text-sm font-semibold text-gray-900">
                <FormattedMessage id="PayoutMethod.Type.Stripe" defaultMessage="Stripe" />
              </h4>
              <EditConnectedAccount
                // @ts-expect-error EditConnectedAccount is not typed yet
                collective={collective}
                service="stripe"
                variation="RECEIVING"
                connectedAccount={collective.connectedAccounts?.find(c => c.service === 'stripe')}
              />
            </div>
            {hasFeature(collective, FEATURES.PAYPAL_DONATIONS) && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h4 className="mb-4 text-sm font-semibold text-gray-900">
                  <FormattedMessage id="PayoutMethod.Type.Paypal" defaultMessage="PayPal" />
                </h4>
                <EditPayPalAccount
                  collective={collective}
                  connectedAccount={collective.connectedAccounts?.find(c => c.service === 'paypal')}
                  variation="RECEIVING"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Payments Section */}
      <div>
        <SettingsSectionTitle>
          <FormattedMessage id="editCollective.receivingMoney.manualPayments" defaultMessage="Manual Payments" />
        </SettingsSectionTitle>
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h4 className="mb-4 text-sm font-semibold text-gray-900">
              <FormattedMessage id="editCollective.receivingMoney.bankTransfers" defaultMessage="Bank Transfers" />
            </h4>
            <BankTransfer collectiveSlug={collective.slug} hideTopsection={setHideTopsection} hideTitle />
          </div>
          {collective.isHost && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h4 className="mb-4 text-sm font-semibold text-gray-900">
                <FormattedMessage
                  id="editCollective.receivingMoney.customPaymentMethods"
                  defaultMessage="Custom Payment Methods"
                />
              </h4>
              <CustomPaymentMethods collectiveSlug={collective.slug} hideTitle />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceivingMoney;
