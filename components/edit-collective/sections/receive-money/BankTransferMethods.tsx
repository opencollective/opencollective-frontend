import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Add } from '@styled-icons/material/Add';
import { FormattedMessage, useIntl } from 'react-intl';
import { v7 as uuidv7 } from 'uuid';

import { getAccountReferenceInput } from '@/lib/collective';
import { i18nGraphqlException } from '@/lib/errors';
import type {
  EditCollectiveBankTransferHostQuery,
  EditCollectiveBankTransferHostQueryVariables,
  EditCollectiveCustomPaymentMethodsMutation,
} from '@/lib/graphql/types/v2/graphql';
import { type Account, type CustomPaymentProvider, CustomPaymentProviderType } from '@/lib/graphql/types/v2/schema';

import { useToast } from '@/components/ui/useToast';

import { CustomPaymentMethodsList } from '../../../custom-payment-provider/CustomPaymentMethodsList';
import { EditCustomBankPaymentMethodDialog } from '../../../custom-payment-provider/EditCustomBankPaymentMethodDialog';
import Loading from '../../../Loading';
import { useModal } from '../../../ModalContext';
import { Button } from '../../../ui/Button';

import {
  editCollectiveBankTransferHostQuery,
  editCustomPaymentMethodsMutation,
  getCacheUpdaterAfterEditCustomPaymentMethods,
} from './gql';
import { updateCustomPaymentMethods } from './lib';

type BankTransferProps = {
  account: Pick<Account, 'slug' | 'currency' | 'legacyId' | 'settings'>;
  customPaymentMethods: CustomPaymentProvider[];
  canEdit: boolean;
};

const BankTransfer = ({ account, customPaymentMethods, canEdit }: BankTransferProps) => {
  const intl = useIntl();
  const { toast } = useToast();
  const { showConfirmationModal } = useModal();
  const [editingId, setEditingId] = useState<string | null>(null);
  const { loading, data } = useQuery<EditCollectiveBankTransferHostQuery, EditCollectiveBankTransferHostQueryVariables>(
    editCollectiveBankTransferHostQuery,
    { variables: { slug: account.slug } },
  );
  const [editCustomPaymentMethods] = useMutation<EditCollectiveCustomPaymentMethodsMutation>(
    editCustomPaymentMethodsMutation,
  );

  if (loading) {
    return <Loading />;
  } else if (!data?.host) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <div className="mt-4 w-full">
        <CustomPaymentMethodsList
          customPaymentProviders={customPaymentMethods.filter(p => p.type === 'BANK_TRANSFER')}
          canEdit={canEdit}
          account={account}
          onClickEdit={id => {
            setEditingId(id);
          }}
          onClickRemove={id =>
            showConfirmationModal({
              variant: 'destructive',
              title: <FormattedMessage defaultMessage="Delete custom bank transfer method" id="Le5mN4" />,
              description: (
                <FormattedMessage
                  defaultMessage="Any incomplete contributions using these payment instructions will stay in pending status until you confirm or reject them."
                  id="CustomPaymentMethod.DeleteDescription"
                />
              ),
              onConfirm: async () => {
                const updatedProviders = account.settings.customPaymentProviders.filter(p => p.id !== id);
                await editCustomPaymentMethods({
                  variables: { account: getAccountReferenceInput(account), value: updatedProviders },
                  update: getCacheUpdaterAfterEditCustomPaymentMethods(account),
                });
              },
            })
          }
          onReorder={async updatedProviders => {
            try {
              const allCustomMethods = updateCustomPaymentMethods(
                account.settings.customPaymentProviders,
                CustomPaymentProviderType.BANK_TRANSFER,
                updatedProviders,
              );

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
      {canEdit && (
        <div>
          <Button size="sm" variant="outline" onClick={() => setEditingId(uuidv7())}>
            <Add size="1em" className="mr-1" />
            <FormattedMessage defaultMessage="Add bank details" id="7aqY1c" />
          </Button>
        </div>
      )}
      {editingId && (
        <EditCustomBankPaymentMethodDialog
          open={true}
          onClose={() => {
            setEditingId(null);
          }}
          account={account}
          host={data.host}
          customPaymentProvider={editingId && customPaymentMethods.find(p => p.id === editingId)}
        />
      )}
    </div>
  );
};

export default BankTransfer;
