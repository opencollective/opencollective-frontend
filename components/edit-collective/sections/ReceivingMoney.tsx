import React from 'react';
import { useQuery } from '@apollo/client';
import { Paypal } from '@styled-icons/fa-brands/Paypal';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import hasFeature, { FEATURES } from '../../../lib/allowed-features';
import { hasAccountMoneyManagement } from '@/lib/collective';
import type { Account, ConnectedAccount } from '@/lib/graphql/types/v2/schema';

import { getI18nLink } from '@/components/I18nFormatters';
import Stripe from '@/components/icons/Stripe';
import PageFeatureNotSupported from '@/components/PageFeatureNotSupported';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

import Loading from '../../Loading';
import EditConnectedAccount from '../EditConnectedAccount';
import EditPayPalAccount from '../EditPayPalAccount';

import BankTransferMethods from './receive-money/BankTransferMethods';
import CustomPaymentMethods from './receive-money/CustomPaymentMethods';
import { editCollectiveBankTransferHostQuery } from './receive-money/gql';
import SettingsSectionTitle from './SettingsSectionTitle';

const ReceivingMoney = ({
  collective,
}: {
  collective: Pick<Account, 'type' | 'slug' | 'isHost' | 'currency'> & {
    connectedAccounts: Pick<ConnectedAccount, 'service'>[];
  };
}) => {
  const { data, loading, refetch } = useQuery(editCollectiveBankTransferHostQuery, {
    variables: { slug: collective.slug },
  });

  if (!hasAccountMoneyManagement(collective)) {
    return <PageFeatureNotSupported />;
  }

  const host = data?.host;
  const manualPaymentProviders = host?.manualPaymentProviders || [];
  const canEditCustomPaymentMethods = get(host, 'plan.manualPayments');

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-12">
      {/* Automatic Payments Section */}
      <div>
        <SettingsSectionTitle>
          <FormattedMessage id="editCollective.receivingMoney.automaticPayments" defaultMessage="Automatic Payments" />
        </SettingsSectionTitle>
        <div className="mt-4 space-y-6">
          <Card className="bg-sidebar">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stripe className="h-4 w-4" />
                Stripe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EditConnectedAccount
                // @ts-expect-error EditConnectedAccount is not typed yet
                collective={collective}
                service="stripe"
                variation="RECEIVING"
                connectedAccount={collective.connectedAccounts?.find(c => c.service === 'stripe')}
              />
            </CardContent>
          </Card>
          {hasFeature(collective, FEATURES.PAYPAL_DONATIONS) && (
            <Card className="bg-sidebar">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paypal className="h-4 w-4" />
                  PayPal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EditPayPalAccount
                  collective={collective}
                  connectedAccount={collective.connectedAccounts?.find(c => c.service === 'paypal')}
                  variation="RECEIVING"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Manual Payments Section */}
      <div>
        <SettingsSectionTitle>
          <FormattedMessage id="editCollective.receivingMoney.manualPayments" defaultMessage="Manual Payments" />
        </SettingsSectionTitle>
        <p className="text-sm text-gray-700">
          {canEditCustomPaymentMethods ? (
            <FormattedMessage
              id="customPaymentMethods.description"
              defaultMessage="Add custom payment methods that contributors can use to send money. These contributions will need to be manually confirmed. <Link>Learn more.</Link>"
              values={{
                Link: getI18nLink({
                  href: 'https://docs.opencollective.com/help/host-guide/receiving-money/custom-payment-methods',
                  openInNewTab: true,
                }),
              }}
            />
          ) : (
            <FormattedMessage
              id="customPaymentMethods.upgradePlan"
              defaultMessage="Subscribe to our special plans for hosts to enable custom payment methods"
            />
          )}
        </p>
        <div className="mt-4 space-y-6">
          <Card className="bg-sidebar">
            <CardHeader>
              <CardTitle>
                <FormattedMessage id="editCollective.receivingMoney.bankTransfers" defaultMessage="Bank Transfers" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BankTransferMethods
                account={collective}
                manualPaymentProviders={manualPaymentProviders}
                canEdit={canEditCustomPaymentMethods}
              />
            </CardContent>
          </Card>
          <Card className="bg-sidebar">
            <CardHeader>
              <CardTitle>
                <FormattedMessage
                  id="editCollective.receivingMoney.customPaymentMethods"
                  defaultMessage="Custom Payment Methods"
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CustomPaymentMethods
                manualPaymentProviders={manualPaymentProviders}
                canEdit={canEditCustomPaymentMethods}
                account={collective}
                onRefetch={refetch}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReceivingMoney;
