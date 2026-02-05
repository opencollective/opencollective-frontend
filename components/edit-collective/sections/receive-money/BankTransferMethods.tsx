import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Add } from '@styled-icons/material/Add';
import { partition, pick } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { getAccountReferenceInput } from '@/lib/collective';
import { i18nGraphqlException } from '@/lib/errors';
import type {
  EditCollectiveBankTransferHostQuery,
  EditCollectiveBankTransferHostQueryVariables,
} from '@/lib/graphql/types/v2/graphql';
import type { Account, ManualPaymentProvider } from '@/lib/graphql/types/v2/schema';

import { useToast } from '@/components/ui/useToast';

import Loading from '../../../Loading';
import { CustomPaymentMethodsList } from '../../../manual-payment-provider/CustomPaymentMethodsList';
import { EditCustomBankPaymentMethodDialog } from '../../../manual-payment-provider/EditCustomBankPaymentMethodDialog';
import { useModal } from '../../../ModalContext';
import { Button } from '../../../ui/Button';

import {
  deleteManualPaymentProviderMutation,
  editCollectiveBankTransferHostQuery,
  reorderManualPaymentProvidersMutation,
} from './gql';

type BankTransferProps = {
  account: Pick<Account, 'slug' | 'currency'>;
  manualPaymentProviders: ManualPaymentProvider[];
  canEdit: boolean;
};

const BankTransfer = ({ account, manualPaymentProviders, canEdit }: BankTransferProps) => {
  const intl = useIntl();
  const { toast } = useToast();
  const { showConfirmationModal } = useModal();
  const [editingId, setEditingId] = useState<string | null>(null);
  const { loading, data, refetch } = useQuery<
    EditCollectiveBankTransferHostQuery,
    EditCollectiveBankTransferHostQueryVariables
  >(editCollectiveBankTransferHostQuery, { variables: { slug: account.slug } });

  const [deleteProvider] = useMutation(deleteManualPaymentProviderMutation);
  const [reorderProviders] = useMutation(reorderManualPaymentProvidersMutation);

  if (loading) {
    return <Loading />;
  } else if (!data?.host) {
    return null;
  }

  const [bankTransferProviders, otherProviders] = partition(manualPaymentProviders, p => p.type === 'BANK_TRANSFER');

  return (
    <div className="flex flex-col">
      <CustomPaymentMethodsList
        customPaymentProviders={bankTransferProviders}
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
              await deleteProvider({
                variables: { manualPaymentProvider: { id } },
              });
              refetch();
            },
          })
        }
        onReorder={async updatedProviders => {
          try {
            await reorderProviders({
              variables: {
                host: getAccountReferenceInput(account),
                type: 'BANK_TRANSFER',
                // For now, keep bank accounts first
                providers: [...updatedProviders, ...otherProviders].map(p => pick(p, 'id')),
              },
            });
            refetch();
          } catch (e) {
            toast({
              variant: 'error',
              message: i18nGraphqlException(intl, e),
            });
          }
        }}
      />
      {canEdit && (
        <div>
          <Button size="sm" variant="outline" onClick={() => setEditingId('new')}>
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
          manualPaymentProvider={editingId !== 'new' ? bankTransferProviders.find(p => p.id === editingId) : undefined}
          onSuccess={() => {
            setEditingId(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default BankTransfer;
