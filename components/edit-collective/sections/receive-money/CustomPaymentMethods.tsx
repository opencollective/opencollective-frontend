import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Add } from '@styled-icons/material/Add';
import { get } from 'lodash';
import type { LucideIcon } from 'lucide-react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Edit, X } from 'lucide-react';
import FlipMove from 'react-flip-move';
import { FormattedMessage } from 'react-intl';
import { v7 as uuidv7 } from 'uuid';

import { gql } from '../../../../lib/graphql/helpers';
import { formatCurrency } from '@/lib/currency-utils';

import { getI18nLink } from '@/components/I18nFormatters';

import ConfirmationModal from '../../../ConfirmationModal';
import Loading from '../../../Loading';
import Spinner from '../../../Spinner';
import { Button } from '../../../ui/Button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '../../../ui/Card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../ui/Collapsible';
import { useToast } from '../../../ui/useToast';
import SettingsSectionTitle from '../SettingsSectionTitle';

import { CUSTOM_PAYMEMENT_ICON_MAP } from './constants';
import { CustomPayoutMethodInstructions } from './CustomPayoutMethodInstructions';
import { type CustomPaymentProvider, EditCustomPaymentMethodDialog } from './EditCustomPaymentMethodDialog';

const hostQuery = gql`
  query EditCollectiveCustomPaymentMethodsHost($slug: String) {
    host(slug: $slug) {
      id
      slug
      currency
      settings
      plan {
        id
        hostedCollectives
        manualPayments
        name
      }
    }
  }
`;

const editCustomPaymentMethodsMutation = gql`
  mutation EditCollectiveCustomPaymentMethods(
    $account: AccountReferenceInput!
    $key: AccountSettingsKey!
    $value: JSON!
  ) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      settings
    }
  }
`;

type CustomPaymentMethodsProps = {
  collectiveSlug: string;
  hideTitle?: boolean;
};

const getIconComponent = (iconName: string | undefined): LucideIcon | null => {
  return CUSTOM_PAYMEMENT_ICON_MAP[iconName] || null;
};

const CustomPaymentMethods = ({ collectiveSlug, hideTitle }: CustomPaymentMethodsProps) => {
  const { toast } = useToast();
  const { loading, data } = useQuery(hostQuery, {
    variables: { slug: collectiveSlug },
  });
  const [editCustomPaymentMethods] = useMutation(editCustomPaymentMethodsMutation);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<string | null>(null);
  const [openInstructions, setOpenInstructions] = useState<Set<string>>(new Set());
  const [isMoving, setIsMoving] = useState(false);

  if (loading) {
    return <Loading />;
  }

  const customPaymentProviders: CustomPaymentProvider[] = get(data, 'host.settings.customPaymentProviders', []) || [];
  const canEdit = data.host.plan?.manualPayments;

  const handleSave = async (values: CustomPaymentProvider, editingProvider: CustomPaymentProvider | null) => {
    try {
      const updatedProviders = [...customPaymentProviders];

      if (editingProvider) {
        // Update existing
        const index = updatedProviders.findIndex(p => p.id === editingProvider.id);
        if (index !== -1) {
          updatedProviders[index] = {
            ...updatedProviders[index],
            ...values,
          };
        }
      } else {
        // Add new
        updatedProviders.push({
          id: uuidv7(),
          ...values,
        });
      }

      await editCustomPaymentMethods({
        variables: {
          account: { slug: collectiveSlug },
          key: 'customPaymentProviders',
          value: updatedProviders,
        },
        refetchQueries: [{ query: hostQuery, variables: { slug: collectiveSlug } }],
        awaitRefetchQueries: true,
      });

      setEditingId(null);
      toast({
        variant: 'success',
        message: (
          <FormattedMessage
            defaultMessage="Custom payment method {action} successfully"
            id="CustomPaymentMethod.Saved"
            values={{ action: editingProvider ? 'updated' : 'added' }}
          />
        ),
      });
    } catch (error: unknown) {
      toast({
        variant: 'error',
        message: (error instanceof Error ? error.message : null) || (
          <FormattedMessage defaultMessage="Failed to save custom payment method" id="CustomPaymentMethod.Error" />
        ),
      });
    }
  };

  const handleDelete = async (providerId: string) => {
    try {
      const updatedProviders = customPaymentProviders.filter(p => p.id !== providerId);

      await editCustomPaymentMethods({
        variables: {
          account: { slug: collectiveSlug },
          key: 'customPaymentProviders',
          value: updatedProviders,
        },
        refetchQueries: [{ query: hostQuery, variables: { slug: collectiveSlug } }],
        awaitRefetchQueries: true,
      });

      setShowDeleteConfirmation(null);
      toast({
        variant: 'success',
        message: (
          <FormattedMessage
            defaultMessage="Custom payment method deleted successfully"
            id="CustomPaymentMethod.Deleted"
          />
        ),
      });
    } catch (error: unknown) {
      toast({
        variant: 'error',
        message: (error instanceof Error ? error.message : null) || (
          <FormattedMessage
            defaultMessage="Failed to delete custom payment method"
            id="CustomPaymentMethod.DeleteError"
          />
        ),
      });
    }
  };

  const handleMove = async (providerId: string, direction: 'up' | 'down') => {
    try {
      setIsMoving(true);
      const currentIndex = customPaymentProviders.findIndex(p => p.id === providerId);
      if (currentIndex === -1) {
        return;
      }

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= customPaymentProviders.length) {
        return;
      }

      const updatedProviders = [...customPaymentProviders];
      [updatedProviders[currentIndex], updatedProviders[newIndex]] = [
        updatedProviders[newIndex],
        updatedProviders[currentIndex],
      ];

      await editCustomPaymentMethods({
        variables: {
          account: { slug: collectiveSlug },
          key: 'customPaymentProviders',
          value: updatedProviders,
        },
        refetchQueries: [{ query: hostQuery, variables: { slug: collectiveSlug } }],
        awaitRefetchQueries: true,
      });

      // No toast; seeing the flip move animation is a good enough feedback
    } catch (error: unknown) {
      toast({
        variant: 'error',
        message: (error instanceof Error ? error.message : null) || (
          <FormattedMessage defaultMessage="Failed to move custom payment method" id="CustomPaymentMethod.MoveError" />
        ),
      });
    } finally {
      setIsMoving(false);
    }
  };

  const editingProvider = editingId ? customPaymentProviders.find(p => p.id === editingId) : null;

  return (
    <div className="EditCustomPaymentMethods mt-4 flex flex-col">
      {!hideTitle && (
        <SettingsSectionTitle>
          <FormattedMessage
            id="editCollective.receivingMoney.customPaymentMethods"
            defaultMessage="Custom Payment Methods"
          />
        </SettingsSectionTitle>
      )}

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

      {customPaymentProviders.length > 0 && (
        <div className="relative mb-4">
          {isMoving && (
            <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-white/75 backdrop-blur-sm">
              <Spinner size={64} />
              <p className="mt-3 text-sm">
                <FormattedMessage id="Saving" defaultMessage="Saving..." />
              </p>
            </div>
          )}
          <FlipMove enterAnimation="fade" leaveAnimation="fade">
            {customPaymentProviders.map((provider, index) => {
              const isFirst = index === 0;
              const isLast = index === customPaymentProviders.length - 1;

              return (
                <div key={provider.id} className="mb-3 flex items-start gap-3 last:mb-0">
                  <Card className="flex-1 gap-2 pt-3 pb-2">
                    <CardHeader className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {(() => {
                          if (provider.iconUrl) {
                            return (
                              <img src={provider.iconUrl} alt={provider.name} className="h-5 w-5 object-contain" />
                            );
                          }
                          const IconComponent = getIconComponent(provider.icon);
                          return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
                        })()}
                        {provider.name}
                      </CardTitle>
                      {canEdit && (
                        <CardAction>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => setEditingId(provider.id)}>
                              <Edit size={12} className="mr-1" />
                              <FormattedMessage defaultMessage="Edit" id="actions.edit" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirmation(provider.id)}>
                              <X size={12} className="mr-1" />
                              <FormattedMessage defaultMessage="Remove" id="actions.remove" />
                            </Button>
                          </div>
                        </CardAction>
                      )}
                    </CardHeader>
                    {provider.instructions && (
                      <CardContent className="border-t pt-2">
                        <Collapsible
                          open={openInstructions.has(provider.id)}
                          onOpenChange={open => {
                            setOpenInstructions(prev => {
                              const next = new Set(prev);
                              if (open) {
                                next.add(provider.id);
                              } else {
                                next.delete(provider.id);
                              }
                              return next;
                            });
                          }}
                        >
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-full justify-between">
                              <FormattedMessage
                                defaultMessage="View Instructions"
                                id="CustomPaymentMethod.ViewInstructions"
                              />
                              {openInstructions.has(provider.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-3 mb-2 rounded border bg-gray-50 p-4 text-sm sm:p-5">
                              <CustomPayoutMethodInstructions
                                instructions={provider.instructions}
                                formattedValues={{
                                  account: provider.accountDetails || '',
                                  reference: '1234',
                                  OrderId: '1234',
                                  amount: formatCurrency(3000, data.host.currency),
                                  collective: collectiveSlug,
                                }}
                              />
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </CardContent>
                    )}
                  </Card>
                  {canEdit && (
                    <div className="flex flex-col gap-1 pt-6">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMove(provider.id, 'up')}
                        disabled={isFirst || isMoving}
                        title={isFirst ? undefined : 'Move up'}
                      >
                        <ArrowUp size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMove(provider.id, 'down')}
                        disabled={isLast || isMoving}
                        title={isLast ? undefined : 'Move down'}
                      >
                        <ArrowDown size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </FlipMove>
        </div>
      )}

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
          defaultCurrency={data.host.currency}
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
