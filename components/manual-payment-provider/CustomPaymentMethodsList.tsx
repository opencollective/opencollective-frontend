import React, { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Edit, X } from 'lucide-react';
import FlipMove from 'react-flip-move';
import { FormattedMessage, useIntl } from 'react-intl';

import type { Account, ManualPaymentProvider } from '@/lib/graphql/types/v2/schema';

import Spinner from '../Spinner';
import { Button } from '../ui/Button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/Collapsible';

import { CustomPaymentMethodInstructions } from './CustomPaymentMethodInstructions';
import { getManualPaymentProviderIconComponent } from './ManualPaymentProviderIcon';

type CustomPaymentMethodsListProps = {
  account: Pick<Account, 'slug' | 'currency'>;
  customPaymentProviders: ManualPaymentProvider[];
  onClickEdit: (providerId: string) => void;
  onClickRemove: (providerId: string) => void;
  onReorder: (newList: ManualPaymentProvider[]) => void;
  canEdit?: boolean;
};

export const CustomPaymentMethodsList = ({
  account,
  customPaymentProviders,
  onClickEdit,
  onClickRemove,
  onReorder,
  canEdit = false,
}: CustomPaymentMethodsListProps) => {
  const intl = useIntl();
  const [openInstructions, setOpenInstructions] = useState<Set<string>>(new Set());
  const [isMoving, setIsMoving] = useState(false);

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

      await onReorder(updatedProviders);
    } finally {
      setIsMoving(false);
    }
  };

  if (customPaymentProviders.length === 0) {
    return null;
  }

  return (
    <div className="relative mb-4">
      {isMoving && (
        <div
          data-testid="moving-overlay"
          className="absolute inset-0 z-[9999] flex flex-col items-center justify-center rounded-lg bg-white/75 backdrop-blur-sm"
        >
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
              <Card className="flex-1 gap-2 pt-3 pb-2 shadow-xs">
                <CardHeader className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    {(() => {
                      const IconComponent = getManualPaymentProviderIconComponent(provider);
                      return <IconComponent className="h-5 w-5" />;
                    })()}
                    {provider.name}
                  </CardTitle>
                  {canEdit && (
                    <CardAction>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => onClickEdit(provider.id)}>
                          <Edit size={12} className="mr-1" />
                          <FormattedMessage defaultMessage="Edit" id="Edit" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onClickRemove(provider.id)}>
                          <X size={12} className="mr-1" />
                          <FormattedMessage defaultMessage="Remove" id="Remove" />
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
                          <CustomPaymentMethodInstructions
                            instructions={provider.instructions}
                            values={{
                              amount: { valueInCents: 3000, currency: account.currency },
                              collectiveSlug: account.slug,
                              OrderId: 1234,
                              accountDetails: provider.accountDetails,
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
                    data-testid="move-up-button"
                    title={isFirst ? undefined : intl.formatMessage({ defaultMessage: 'Move up', id: 'wmFdws' })}
                  >
                    <ArrowUp size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMove(provider.id, 'down')}
                    disabled={isLast || isMoving}
                    data-testid="move-down-button"
                    title={isLast ? undefined : intl.formatMessage({ defaultMessage: 'Move down', id: 'H/r5m6' })}
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
  );
};
