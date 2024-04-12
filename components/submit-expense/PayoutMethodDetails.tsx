import React from 'react';
import clsx from 'clsx';
import { startCase, upperCase } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { PayoutMethod, PayoutMethodType } from '../../lib/graphql/types/v2/graphql';

import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import LoadingPlaceholder from '../LoadingPlaceholder';

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
  payoutMethod: PayoutMethod;
};

export function PayoutMethodDetails(props: PayoutMethodDetailsProps) {
  if (!props.payoutMethod) {
    return <LoadingPlaceholder height={24} mb={2} />;
  }

  switch (props.payoutMethod.type) {
    case PayoutMethodType.PAYPAL:
      return (
        <PayoutMethodDetailItem
          className="col-start-1 col-end-[-1]"
          title={
            <div className="flex gap-2">
              <FormattedMessage id="User.EmailAddress" defaultMessage="Email address" /> <PrivateInfoIcon />
            </div>
          }
        >
          {props.payoutMethod.data?.email ?? '********'};
        </PayoutMethodDetailItem>
      );
    case PayoutMethodType.OTHER:
      return (
        <PayoutMethodDetailItem
          className="col-start-1 col-end-[-1]"
          title={
            <div className="flex gap-2">
              <FormattedMessage id="Details" defaultMessage="Details" /> <PrivateInfoIcon />
            </div>
          }
        >
          {props.payoutMethod.data?.content ?? '********'}
        </PayoutMethodDetailItem>
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
    <div className={clsx('rounded-md bg-slate-100 p-2', props.className)}>
      <div className="mb-1 text-sm font-bold">{props.title}</div>
      <div className="text-sm">{props.children}</div>
    </div>
  );
}
