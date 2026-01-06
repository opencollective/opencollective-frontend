import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Edit, HandCoins, Landmark, X } from 'lucide-react';
import FlipMove from 'react-flip-move';
import { FormattedMessage } from 'react-intl';

import { formatCurrency } from '@/lib/currency-utils';
import type { Account } from '@/lib/graphql/types/v2/schema';

import Spinner from '../../../Spinner';
import { Button } from '../../../ui/Button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '../../../ui/Card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../ui/Collapsible';

import { CUSTOM_PAYMEMENT_ICON_MAP } from './constants';
import { CustomPayoutMethodInstructions } from './CustomPayoutMethodInstructions';
import { type CustomPaymentProvider } from './EditCustomPaymentMethodDialog';

type CustomPaymentMethodsListProps = {
  account: Pick<Account, 'slug' | 'currency'>;
  customPaymentProviders: CustomPaymentProvider[];
  onClickEdit: (providerId: string) => void;
  onClickRemove: (providerId: string) => void;
  onReorder: (newList: CustomPaymentProvider[]) => void;
  canEdit?: boolean;
};

const getIconComponent = (provider: CustomPaymentProvider): LucideIcon | null => {
  if (provider.icon && CUSTOM_PAYMEMENT_ICON_MAP[provider.icon]) {
    return CUSTOM_PAYMEMENT_ICON_MAP[provider.icon];
  } else if (provider.type === 'BANK_TRANSFER') {
    return Landmark;
  } else {
    return HandCoins;
  }
};

export const CustomPaymentMethodsList = ({
  account,
  customPaymentProviders,
  onClickEdit,
  onClickRemove,
  onReorder,
  canEdit = false,
}: CustomPaymentMethodsListProps) => {
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
              <Card className="flex-1 gap-2 pt-3 pb-2 shadow-xs">
                <CardHeader className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    {(() => {
                      const IconComponent = getIconComponent(provider);
                      return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
                    })()}
                    {provider.name}
                  </CardTitle>
                  {canEdit && (
                    <CardAction>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => onClickEdit(provider.id)}>
                          <Edit size={12} className="mr-1" />
                          <FormattedMessage defaultMessage="Edit" id="actions.edit" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onClickRemove(provider.id)}>
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
                              amount: formatCurrency(3000, account.currency),
                              collective: account.slug,
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
  );
};
