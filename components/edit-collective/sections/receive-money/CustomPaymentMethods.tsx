import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Add } from '@styled-icons/material/Add';
import { pick } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { getAccountReferenceInput } from '@/lib/collective';
import { i18nGraphqlException } from '@/lib/errors';
import { type Account, type ManualPaymentProvider, ManualPaymentProviderType } from '@/lib/graphql/types/v2/schema';

import { useModal } from '@/components/ModalContext';

import { CustomPaymentMethodsList } from '../../../custom-payment-provider/CustomPaymentMethodsList';
import { EditCustomPaymentMethodDialog } from '../../../custom-payment-provider/EditCustomPaymentMethodDialog';
import { Button } from '../../../ui/Button';
import { useToast } from '../../../ui/useToast';

import {
  createManualPaymentProviderMutation,
  deleteManualPaymentProviderMutation,
  reorderManualPaymentProvidersMutation,
  updateManualPaymentProviderMutation,
} from './gql';

type CustomPaymentMethodsProps = {
  manualPaymentProviders: ManualPaymentProvider[];
  canEdit: boolean;
  account: Pick<Account, 'slug' | 'currency'>;
  onRefetch: () => void;
};

const CustomPaymentMethods = ({ account, manualPaymentProviders, canEdit, onRefetch }: CustomPaymentMethodsProps) => {
  const { toast } = useToast();
  const intl = useIntl();
  const { showConfirmationModal } = useModal();
  const [editingId, setEditingId] = useState<string | null>(null);

  const [createProvider] = useMutation(createManualPaymentProviderMutation);
  const [updateProvider] = useMutation(updateManualPaymentProviderMutation);
  const [deleteProvider] = useMutation(deleteManualPaymentProviderMutation);
  const [reorderProviders] = useMutation(reorderManualPaymentProvidersMutation);

  const otherProviders = manualPaymentProviders.filter(p => p.type === 'OTHER' && !p.isArchived);

  const handleSave = React.useCallback(
    async (values: { name: string; instructions: string; icon?: string }, editingProvider?: ManualPaymentProvider) => {
      try {
        if (editingProvider) {
          // Update existing
          await updateProvider({
            variables: {
              manualPaymentProvider: { id: editingProvider.id },
              input: {
                type: ManualPaymentProviderType.OTHER,
                name: values.name,
                instructions: values.instructions,
                icon: values.icon,
              },
            },
          });
        } else {
          // Create new
          await createProvider({
            variables: {
              host: getAccountReferenceInput(account),
              manualPaymentProvider: {
                type: 'OTHER',
                name: values.name,
                instructions: values.instructions,
                icon: values.icon,
              },
            },
          });
        }

        toast({
          variant: 'success',
          message: (
            <FormattedMessage
              defaultMessage="Custom payment methods updated successfully"
              id="CustomPaymentMethod.Updated"
            />
          ),
        });
        setEditingId(null);
        onRefetch();
      } catch (error: unknown) {
        toast({
          variant: 'error',
          message: i18nGraphqlException(intl, error),
        });
      }
    },
    [createProvider, updateProvider, account, intl, toast, onRefetch],
  );

  const onClickRemove = React.useCallback(
    (id: string) => {
      showConfirmationModal({
        variant: 'destructive',
        title: <FormattedMessage defaultMessage="Delete custom payment method" id="CustomPaymentMethod.DeleteTitle" />,
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
          onRefetch();
        },
      });
    },
    [deleteProvider, showConfirmationModal, onRefetch],
  );

  const handleReorder = React.useCallback(
    async (updatedProviders: ManualPaymentProvider[]) => {
      try {
        await reorderProviders({
          variables: {
            host: getAccountReferenceInput(account),
            type: 'OTHER',
            providers: updatedProviders.map(p => pick(p, 'id')),
          },
        });
        onRefetch();
      } catch (error: unknown) {
        toast({
          variant: 'error',
          message: i18nGraphqlException(intl, error),
        });
      }
    },
    [reorderProviders, account, intl, toast, onRefetch],
  );

  return (
    <div className="flex flex-col">
      <CustomPaymentMethodsList
        customPaymentProviders={otherProviders}
        onClickEdit={setEditingId}
        onClickRemove={onClickRemove}
        onReorder={handleReorder}
        canEdit={canEdit}
        account={account}
      />

      {canEdit && (
        <div>
          <Button size="sm" variant="outline" onClick={() => setEditingId('new')}>
            <Add size="1em" className="mr-1" />
            <FormattedMessage defaultMessage="Add Custom Payment Method" id="//3qi9" />
          </Button>
        </div>
      )}

      {editingId && (
        <EditCustomPaymentMethodDialog
          provider={editingId !== 'new' ? otherProviders.find(p => p.id === editingId) : undefined}
          onSave={handleSave}
          onClose={() => setEditingId(null)}
          defaultCurrency={account.currency}
        />
      )}
    </div>
  );
};

export default CustomPaymentMethods;
