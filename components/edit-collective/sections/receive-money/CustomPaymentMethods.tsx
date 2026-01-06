import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Add } from '@styled-icons/material/Add';
import { FormattedMessage, useIntl } from 'react-intl';
import { v7 as uuidv7 } from 'uuid';

import { getAccountReferenceInput } from '@/lib/collective';
import { i18nGraphqlException } from '@/lib/errors';
import type { Account } from '@/lib/graphql/types/v2/schema';

import { getI18nLink } from '@/components/I18nFormatters';

import ConfirmationModal from '../../../ConfirmationModal';
import { Button } from '../../../ui/Button';
import { useToast } from '../../../ui/useToast';

import { CustomPaymentMethodsList } from './CustomPaymentMethodsList';
import { type CustomPaymentProvider, EditCustomPaymentMethodDialog } from './EditCustomPaymentMethodDialog';
import { editCustomPaymentMethodsMutation, getCacheUpdaterAfterEditCustomPaymentMethods } from './gql';
import { updateCustomPaymentMethods } from './lib';

type CustomPaymentMethodsProps = {
  customPaymentProviders: CustomPaymentProvider[];
  canEdit: boolean;
  account: Pick<Account, 'slug' | 'currency' | 'settings'>;
};

const CustomPaymentMethods = ({ account, customPaymentProviders, canEdit }: CustomPaymentMethodsProps) => {
  const { toast } = useToast();
  const intl = useIntl();
  const [editCustomPaymentMethods] = useMutation(editCustomPaymentMethodsMutation);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<string | null>(null);

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
      const updatedProviders = [...customPaymentProviders];

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
    [customPaymentProviders, submitCustomPaymentMethods],
  );

  const handleDelete = React.useCallback(
    async (providerId: string) => {
      const updatedProviders = customPaymentProviders.filter(p => p.id !== providerId);
      await submitCustomPaymentMethods(updatedProviders, { onSuccess: () => setShowDeleteConfirmation(null) });
    },
    [customPaymentProviders, submitCustomPaymentMethods],
  );

  const handleReorder = React.useCallback(
    async (updatedProviders: CustomPaymentProvider[]) => {
      await submitCustomPaymentMethods(updatedProviders);
    },
    [submitCustomPaymentMethods],
  );

  const editingProvider = editingId ? customPaymentProviders.find(p => p.id === editingId) : null;
  return (
    <div className="flex flex-col">
      <div className="mb-3">
        <p className="text-sm text-gray-700">
          {canEdit ? (
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
      </div>

      <CustomPaymentMethodsList
        customPaymentProviders={customPaymentProviders}
        onClickEdit={setEditingId}
        onClickRemove={setShowDeleteConfirmation}
        onReorder={handleReorder}
        canEdit={canEdit}
        account={account}
      />

      {canEdit && (
        <div>
          <Button size="sm" variant="outline" onClick={() => setEditingId('new')}>
            <Add size="1em" className="mr-1" />
            <FormattedMessage id="customPaymentMethods.add" defaultMessage="Add Custom Payment Method" />
          </Button>
        </div>
      )}

      {editingId && (
        <EditCustomPaymentMethodDialog
          provider={editingProvider}
          onSave={handleSave}
          onClose={() => setEditingId(null)}
          defaultCurrency={account.currency}
        />
      )}

      {showDeleteConfirmation && (
        <ConfirmationModal
          width="100%"
          maxWidth="570px"
          onClose={() => setShowDeleteConfirmation(null)}
          header={
            <FormattedMessage defaultMessage="Delete Custom Payment Method" id="CustomPaymentMethod.DeleteTitle" />
          }
          continueHandler={() => handleDelete(showDeleteConfirmation)}
        >
          <p className="mt-2 text-sm leading-[18px]">
            <FormattedMessage
              defaultMessage="Are you sure you want to delete this custom payment method? This action cannot be undone."
              id="CustomPaymentMethod.DeleteConfirm"
            />
          </p>
        </ConfirmationModal>
      )}
    </div>
  );
};

export default CustomPaymentMethods;
