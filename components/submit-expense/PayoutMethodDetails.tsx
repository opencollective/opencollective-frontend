import React from 'react';
import clsx from 'clsx';
import { startCase, upperCase } from 'lodash';
import { ChevronDown } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type { PayoutMethod } from '../../lib/graphql/types/v2/graphql';
import { PayoutMethodType } from '../../lib/graphql/types/v2/graphql';

import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { Button } from '../ui/Button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/Collapsible';
import type { DataListItemProps } from '../ui/DataList';
import { DataList, DataListItem } from '../ui/DataList';

import type { ExpenseForm } from './useExpenseForm';

function flattenDetailsObject(details: any) {
  return Object.entries(details).reduce((acc, [key, value]) => {
    if (typeof value === 'object') {
      return [...acc, ...flattenDetailsObject(value)];
    }
    return [
      ...acc,
      {
        id: key,
        label: startCase(key),
        value: value,
      },
    ];
  }, []);
}

type PayoutMethodDetailsProps = {
  payoutMethod: Omit<PayoutMethod, 'id'> & { id?: string };
};

function getPayoutMethodDetailItems(props: PayoutMethodDetailsProps) {
  const items: (DataListItemProps & { id: string })[] = [];

  switch (props.payoutMethod.type) {
    case PayoutMethodType.PAYPAL:
      if (props.payoutMethod.data.currency) {
        items.push({
          id: 'currency',
          label: <FormattedMessage defaultMessage="Currency" id="Currency" />,
          value: upperCase(props.payoutMethod.data.currency),
        });
      }

      items.push({
        id: 'email',
        label: (
          <div className="flex gap-2">
            <FormattedMessage id="User.EmailAddress" defaultMessage="Email address" /> <PrivateInfoIcon />
          </div>
        ),
        value: props.payoutMethod.data.email ?? '********',
      });
      break;
    case PayoutMethodType.OTHER:
      if (props.payoutMethod.data.currency) {
        items.push({
          id: 'currency',
          label: <FormattedMessage defaultMessage="Currency" id="Currency" />,
          value: upperCase(props.payoutMethod.data.currency),
        });
      }
      items.push({
        id: 'details',
        label: (
          <div className="flex gap-2">
            <FormattedMessage id="Details" defaultMessage="Details" /> <PrivateInfoIcon />
          </div>
        ),
        value: props.payoutMethod.data.content ?? '********',
      });
      break;
    case PayoutMethodType.BANK_ACCOUNT:
      {
        if (props.payoutMethod.data.type) {
          items.push({
            id: 'type',
            label: <FormattedMessage defaultMessage="Type" id="+U6ozc" />,
            value: upperCase(props.payoutMethod.data.type),
          });
        }

        if (props.payoutMethod.data.currency) {
          items.push({
            id: 'currency',
            label: <FormattedMessage defaultMessage="Currency" id="Currency" />,
            value: upperCase(props.payoutMethod.data.currency),
          });
        }

        if (props.payoutMethod.data.accountHolderName) {
          items.push({
            id: 'accountHolderName',
            label: (
              <div className="flex gap-2">
                <FormattedMessage defaultMessage="Account Holder" id="GEFifJ" /> <PrivateInfoIcon />
              </div>
            ),
            value: props.payoutMethod.data.accountHolderName,
          });
        }

        if (props.payoutMethod.data.details) {
          items.push(...flattenDetailsObject(props.payoutMethod.data.details));
        }
      }
      break;
    default:
      return null;
  }
  return items;
}

export function PayoutMethodDetailsContainer(props: {
  payoutMethod: ExpenseForm['options']['payoutMethod'];
  maxItems?: number;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const toggleContainer = React.useCallback(() => {
    setIsOpen(isOpen => !isOpen);
  }, []);

  const payoutMethodDetailItems = getPayoutMethodDetailItems(props);
  const isExpandable = props.maxItems && payoutMethodDetailItems?.length > props.maxItems;

  const shownItems = isExpandable ? payoutMethodDetailItems.slice(0, 3) : payoutMethodDetailItems;
  const hiddenItems = isExpandable ? payoutMethodDetailItems.slice(3) : [];

  if (!payoutMethodDetailItems || payoutMethodDetailItems.length === 0) {
    return <LoadingPlaceholder height={24} mb={2} />;
  }

  return (
    <Collapsible className="group" open={isOpen}>
      <div className={'relative overflow-hidden rounded-xl bg-muted'}>
        {isExpandable && (
          <React.Fragment>
            <div
              className={clsx(
                'absolute bottom-0 z-10 h-8 w-full bg-gradient-to-t from-muted to-transparent transition-opacity',
                isOpen ? 'opacity-0' : 'opacity-100',
              )}
            />
            <CollapsibleTrigger
              className={clsx(
                'group absolute z-20 focus:outline-none',
                isOpen ? 'bottom-0 right-0' : 'inset-0 flex w-full items-end justify-end',
              )}
              onClick={toggleContainer}
            >
              <Button
                variant="ghost"
                size="xs"
                asChild
                className={clsx(
                  'm-2 border border-transparent text-muted-foreground ring-ring hover:text-foreground group-focus-visible:border-border group-focus-visible:bg-white group-focus-visible:ring-2',
                  {
                    'group-hover:border-border group-hover:bg-white': !isOpen,
                    'hover:border-border hover:bg-white': isOpen,
                  },
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  <span
                    className={clsx('transition-all', {
                      'rotate-180': isOpen,
                    })}
                  >
                    <ChevronDown size={14} />
                  </span>
                  {isOpen ? (
                    <FormattedMessage defaultMessage="Close" id="Close" />
                  ) : (
                    <FormattedMessage defaultMessage="See more" id="yoLwRW" />
                  )}
                </div>
              </Button>
            </CollapsibleTrigger>
          </React.Fragment>
        )}
        <div className={'space-y-1 p-4'}>
          <DataList className="gap-2">
            {shownItems.map(({ id, ...item }) => (
              <DataListItem key={id} {...item} />
            ))}
          </DataList>
          {hiddenItems.length > 0 && (
            <CollapsibleContent>
              <DataList className="gap-2">
                {hiddenItems.map(({ id, ...item }) => (
                  <DataListItem key={id} {...item} />
                ))}
              </DataList>
            </CollapsibleContent>
          )}
        </div>
      </div>
    </Collapsible>
  );
}
