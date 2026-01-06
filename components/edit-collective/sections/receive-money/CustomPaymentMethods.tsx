import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Add } from '@styled-icons/material/Add';
import { FormattedMessage, useIntl } from 'react-intl';
import { v7 as uuidv7 } from 'uuid';

import { getAccountReferenceInput } from '@/lib/collective';
import { i18nGraphqlException } from '@/lib/errors';
import type { Account, CustomPaymentProvider } from '@/lib/graphql/types/v2/schema';

import { useModal } from '@/components/ModalContext';

import { CustomPaymentMethodsList } from '../../../custom-payment-provider/CustomPaymentMethodsList';
import { EditCustomPaymentMethodDialog } from '../../../custom-payment-provider/EditCustomPaymentMethodDialog';
import { Button } from '../../../ui/Button';
import { useToast } from '../../../ui/useToast';

import { editCustomPaymentMethodsMutation, getCacheUpdaterAfterEditCustomPaymentMethods } from './gql';
import { updateCustomPaymentMethods } from './lib';

type CustomPaymentMethodsProps = {
  customPaymentMethods: CustomPaymentProvider[];
  canEdit: boolean;
  account: Pick<Account, 'slug' | 'currency' | 'settings'>;
};

const CustomPaymentMethods = ({ account, customPaymentMethods, canEdit }: CustomPaymentMethodsProps) => {
  const { toast } = useToast();
  const intl = useIntl();
  const [editCustomPaymentMethods] = useMutation(editCustomPaymentMethodsMutation);
  const { showConfirmationModal } = useModal();
  const [editingId, setEditingId] = useState<string | null>(null);

  const submitCustomPaymentMethods = React.useCallback(
    async (updatedProviders: CustomPaymentProvider[], { onSuccess }: { onSuccess?: () => void } = {}) => {
      try {
        const allCustomMethods = updateCustomPaymentMethods(
          account.settings.customPaymentProviders,
          'OTHER',
          updatedProviders,
        );
        await editCustomPaymentMethods({
          variables: {
            account: getAccountReferenceInput(account),
            value: allCustomMethods,
          },
          update: getCacheUpdaterAfterEditCustomPaymentMethods(account),
        });

        toast({
          variant: 'success',
          message: (
            <FormattedMessage
              defaultMessage="Custom payment methods updated successfully"
              id="CustomPaymentMethod.Updated"
            />
          ),
        });
        onSuccess?.();
      } catch (error: unknown) {
        toast({
          variant: 'error',
          message: i18nGraphqlException(intl, error),
        });
      }
    },
    [editCustomPaymentMethods, account, intl, toast],
  );

  const handleSave = React.useCallback(
    async (values: CustomPaymentProvider, editingProvider: CustomPaymentProvider | null) => {
      const updatedProviders = [...customPaymentMethods];

      if (editingProvider) {
        // Update existing
        const index = updatedProviders.findIndex(p => p.id === editingProvider.id);
        if (index !== -1) {
          updatedProviders[index] = { ...updatedProviders[index], ...values };
        }
      } else {
        // Add new
        updatedProviders.push({ id: uuidv7(), ...values });
      }

      await submitCustomPaymentMethods(updatedProviders, { onSuccess: () => setEditingId(null) });
    },
    [customPaymentMethods, submitCustomPaymentMethods],
  );

  const onClickRemove = React.useCallback(
    id => {
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
          const updatedProviders = account.settings.customPaymentProviders.filter(p => p.id !== id);
          await editCustomPaymentMethods({
            variables: { account: getAccountReferenceInput(account), value: updatedProviders },
            update: getCacheUpdaterAfterEditCustomPaymentMethods(account),
          });
        },
      });
    },
    [account, editCustomPaymentMethods, showConfirmationModal],
  );

  const handleReorder = React.useCallback(
    async (updatedProviders: CustomPaymentProvider[]) => {
      await submitCustomPaymentMethods(updatedProviders);
    },
    [submitCustomPaymentMethods],
  );

  return (
    <div className="flex flex-col">
      <CustomPaymentMethodsList
        customPaymentProviders={customPaymentMethods.filter(p => p.type === 'OTHER')}
        onClickEdit={setEditingId}
        onClickRemove={onClickRemove}
        onReorder={handleReorder}
        canEdit={canEdit}
        account={account}
      />

      {canEdit && (
        <div>
          <Button size="sm" variant="outline" onClick={() => setEditingId(uuidv7())}>
            <Add size="1em" className="mr-1" />
            <FormattedMessage defaultMessage="Add Custom Payment Method" id="//3qi9" />
          </Button>
        </div>
      )}

      {editingId && (
        <EditCustomPaymentMethodDialog
          provider={customPaymentMethods.find(p => p.id === editingId)}
          onSave={handleSave}
          onClose={() => setEditingId(null)}
          defaultCurrency={account.currency}
        />
      )}
    </div>
  );
};

export default CustomPaymentMethods;
