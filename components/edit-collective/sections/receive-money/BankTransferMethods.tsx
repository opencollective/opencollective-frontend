import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Add } from '@styled-icons/material/Add';
import { findLast } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { PayoutMethodType } from '../../../../lib/constants/payout-method';
import { getAccountReferenceInput } from '@/lib/collective';
import { i18nGraphqlException } from '@/lib/errors';
import type {
  EditCollectiveBankTransferHostQuery,
  EditCollectiveBankTransferHostQueryVariables,
  EditCollectiveCustomPaymentMethodsMutation,
} from '@/lib/graphql/types/v2/graphql';
import type { Account } from '@/lib/graphql/types/v2/schema';

import { useToast } from '@/components/ui/useToast';

import Loading from '../../../Loading';
import { useModal } from '../../../ModalContext';
import { Button } from '../../../ui/Button';

import { CustomPaymentMethodsList } from './CustomPaymentMethodsList';
import { EditCustomBankPaymentMethodDialog } from './EditCustomBankPaymentMethodDialog';
import type { CustomPaymentProvider } from './EditCustomPaymentMethodDialog';
import {
  editCollectiveBankTransferHostQuery,
  editCustomPaymentMethodsMutation,
  getCacheUpdaterAfterEditCustomPaymentMethods,
  removePayoutMethodMutation,
} from './gql';
import { updateCustomPaymentMethods } from './lib';

type BankTransferProps = {
  account: Pick<Account, 'slug' | 'currency' | 'legacyId' | 'settings'>;
  manualBankTransferMethods: CustomPaymentProvider[];
  canEdit: boolean;
};

const BankTransfer = ({ account, manualBankTransferMethods, canEdit }: BankTransferProps) => {
  const intl = useIntl();
  const { toast } = useToast();
  const { loading, data } = useQuery<EditCollectiveBankTransferHostQuery, EditCollectiveBankTransferHostQueryVariables>(
    editCollectiveBankTransferHostQuery,
    {
      variables: { slug: account.slug },
    },
  );
  const [removePayoutMethod] = useMutation(removePayoutMethodMutation);
  const [editCustomPaymentMethods] = useMutation<EditCollectiveCustomPaymentMethodsMutation>(
    editCustomPaymentMethodsMutation,
  );
  const { showConfirmationModal } = useModal();
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (loading) {
    return <Loading />;
  } else if (!data?.host) {
    return null;
  }

  const existingPayoutMethod = data.host.payoutMethods.find(pm => pm.data.isManualBankTransfer);
  // const existingManualPaymentMethod = !!get(data.host, 'settings.paymentMethods.manual') && existingPayoutMethod;
  // const instructions = data.host.settings?.paymentMethods?.manual?.instructions || BANK_TRANSFER_DEFAULT_INSTRUCTIONS;

  const latestBankAccount = findLast(
    data.host?.payoutMethods,
    payoutMethod => payoutMethod.type === PayoutMethodType.BANK_ACCOUNT,
  );

  return (
    <div className="flex flex-col">
      <div>
        <p className="text-sm text-gray-700">
          {data.host.plan.manualPayments ? (
            <FormattedMessage
              id="paymentMethods.manual.add.info"
              defaultMessage="Define instructions for contributions via bank transfer. When funds arrive, you can mark them as confirmed to credit the budget balance."
            />
          ) : (
            <FormattedMessage
              id="paymentMethods.manual.upgradePlan"
              defaultMessage="Subscribe to our special plans for hosts"
            />
          )}
        </p>
      </div>
      <div className="mt-4 w-full">
        <CustomPaymentMethodsList
          customPaymentProviders={manualBankTransferMethods}
          canEdit={canEdit}
          account={account}
          onClickEdit={id => {
            setEditingId(id);
            setShowDialog(true);
          }}
          onClickRemove={() =>
            showConfirmationModal({
              title: <FormattedMessage defaultMessage="Delete bank details" id="7aqY1c" />,
              description: (
                <FormattedMessage
                  defaultMessage="Are you sure you want to delete this bank details? This action cannot be undone."
                  id="7aqY1c"
                />
              ),
              onConfirm: () => {
                // TODO
              },
            })
          }
          onReorder={async updatedProviders => {
            try {
              const allCustomMethods = updateCustomPaymentMethods(
                account.settings.customPaymentProviders,
                'BANK_TRANSFER',
                updatedProviders,
              );
              console.log('allCustomMethods', allCustomMethods);
              await editCustomPaymentMethods({
                variables: { account: getAccountReferenceInput(account), value: allCustomMethods },
                update: getCacheUpdaterAfterEditCustomPaymentMethods(account),
              });
            } catch (e) {
              toast({
                variant: 'error',
                message: i18nGraphqlException(intl, e),
              });
            }
          }}
        />
      </div>
      <div>
        <Button size="sm" variant="outline" onClick={() => setShowDialog(true)}>
          <Add size="1em" className="mr-1" />
          <FormattedMessage defaultMessage="Add bank details" id="7aqY1c" />
        </Button>
      </div>
      <EditCustomBankPaymentMethodDialog
        open={showDialog}
        onClose={() => {
          setShowDialog(false);
          setEditingId(null);
        }}
        account={account}
        host={data.host}
        customPaymentProvider={editingId ? manualBankTransferMethods.find(p => p.id === editingId) : null}
      />
    </div>
  );
};

export default BankTransfer;
