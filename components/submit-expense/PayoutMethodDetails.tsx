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
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

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
        title: startCase(key),
        children: value,
      },
    ];
  }, []);
}

type PayoutMethodDetailsProps = {
  payoutMethod: Omit<PayoutMethod, 'id'> & { id?: string };
};

function PayoutMethodDetails(props: PayoutMethodDetailsProps) {
  if (!props.payoutMethod) {
    return <LoadingPlaceholder height={24} mb={2} />;
  }

  switch (props.payoutMethod.type) {
    case PayoutMethodType.PAYPAL:
      return (
        <React.Fragment>
          {props.payoutMethod.data.currency && (
            <PayoutMethodDetailItem
              className="col-start-1 col-end-[-1]"
              title={
                <div className="flex gap-2">
                  <FormattedMessage defaultMessage="Currency" id="Currency" />
                </div>
              }
            >
              {upperCase(props.payoutMethod.data.currency)}
            </PayoutMethodDetailItem>
          )}
          <PayoutMethodDetailItem
            className="col-start-1 col-end-[-1]"
            title={
              <div className="flex gap-2">
                <FormattedMessage id="User.EmailAddress" defaultMessage="Email address" /> <PrivateInfoIcon />
              </div>
            }
          >
            {props.payoutMethod.data.email ?? '********'}
          </PayoutMethodDetailItem>
        </React.Fragment>
      );
    case PayoutMethodType.OTHER:
      return (
        <React.Fragment>
          {props.payoutMethod.data.currency && (
            <PayoutMethodDetailItem
              className="col-start-1 col-end-[-1]"
              title={
                <div className="flex gap-2">
                  <FormattedMessage defaultMessage="Currency" id="Currency" />
                </div>
              }
            >
              {upperCase(props.payoutMethod.data.currency)}
            </PayoutMethodDetailItem>
          )}
          <PayoutMethodDetailItem
            className="col-start-1 col-end-[-1]"
            title={
              <div className="flex gap-2">
                <FormattedMessage id="Details" defaultMessage="Details" /> <PrivateInfoIcon />
              </div>
            }
          >
            {props.payoutMethod.data.content ?? '********'}
          </PayoutMethodDetailItem>
        </React.Fragment>
      );
    case PayoutMethodType.BANK_ACCOUNT: {
      const items: (PayoutMethodDetailItemProps & { field: string })[] = [];

      if (!props.payoutMethod.data) {
        return <LoadingPlaceholder height={20} />;
      }

      if (props.payoutMethod.data.type) {
        items.push({
          field: 'type',
          title: <FormattedMessage defaultMessage="Type" id="+U6ozc" />,
          children: upperCase(props.payoutMethod.data.type),
        });
      }

      if (props.payoutMethod.data.currency) {
        items.push({
          field: 'currency',
          title: <FormattedMessage defaultMessage="Currency" id="Currency" />,
          children: upperCase(props.payoutMethod.data.currency),
        });
      }

      if (props.payoutMethod.data.accountHolderName) {
        items.push({
          field: 'accountHolderName',
          title: (
            <div className="flex gap-2">
              <FormattedMessage defaultMessage="Account Holder" id="GEFifJ" /> <PrivateInfoIcon />
            </div>
          ),
          children: props.payoutMethod.data.accountHolderName,
        });
      }

      if (props.payoutMethod.data.details) {
        items.push(...flattenDetailsObject(props.payoutMethod.data.details));
      }

      return items.map(i => <PayoutMethodDetailItem key={i.field} {...i} />);
    }
    default:
      return null;
  }
}

type PayoutMethodDetailItemProps = {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

function PayoutMethodDetailItem(props: PayoutMethodDetailItemProps) {
  return (
    <div className={clsx('mb-2 rounded-md bg-slate-100 last:mb-0', props.className)}>
      <div className="mb-1 text-sm font-bold">{props.title}</div>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="overflow-x-clip text-ellipsis text-sm">{props.children}</div>
        </TooltipTrigger>
        <TooltipContent>{props.children}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export function PayoutMethodDetailsContainer(props: { payoutMethod: ExpenseForm['options']['payoutMethod'] }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleContainer = React.useCallback(() => {
    setIsOpen(isOpen => !isOpen);
  }, []);

  return (
    <div
      className={clsx('relative', {
        'after:hidden': isOpen,
        'max-h-16 overflow-hidden after:absolute after:bottom-0 after:left-0 after:right-0 after:h-9 after:[background:linear-gradient(0deg,rgba(0,0,0,0.3)_0%,rgba(255,255,255,0.1)_100%)]':
          !isOpen,
      })}
    >
      <div className="grid grid-cols-3 gap-2 *:bg-transparent *:p-2 *:last:mb-0">
        <PayoutMethodDetails payoutMethod={props.payoutMethod} />
      </div>
      <div
        className={clsx('bottom-1 z-20 flex w-full items-center justify-center', {
          relative: isOpen,
          absolute: !isOpen,
        })}
      >
        <Button variant="ghost" size="xs" className="flex items-center justify-center gap-2" onClick={toggleContainer}>
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
        </Button>
      </div>
    </div>
  );
}
