import React from 'react';
import { truncate } from 'lodash';
import { useIntl } from 'react-intl';

import type { PayoutMethod } from '../lib/graphql/types/v2/schema';
import { PayoutMethodType } from '../lib/graphql/types/v2/schema';
import i18nPayoutMethodType from '@/lib/i18n/payout-method-type';
import { cn } from '@/lib/utils';

import { PayoutMethodIcon } from './PayoutMethodIcon';

const MAX_PAYOUT_OPTION_DATA_LENGTH = 20;

type PayoutMethodLabelProps = {
  className?: string;
  showIcon?: boolean;
  iconSize?: number;
  payoutMethod?: Omit<PayoutMethod, 'id'>;
};

export function PayoutMethodLabel(props: PayoutMethodLabelProps) {
  const intl = useIntl();
  if (!props.payoutMethod) {
    return null;
  }

  const pm = props.payoutMethod;
  const customLabel = pm.name;
  let defaultLabel: React.ReactNode;

  switch (pm.type) {
    case PayoutMethodType.PAYPAL:
      defaultLabel = pm.data?.email;
      break;
    case PayoutMethodType.ACCOUNT_BALANCE:
      break;
    case PayoutMethodType.BANK_ACCOUNT: {
      if (pm.data?.details?.IBAN) {
        defaultLabel = `IBAN ${pm.data.details.IBAN}`;
      } else if (pm.data?.details?.accountNumber) {
        defaultLabel = `A/N ${pm.data.details.accountNumber}`;
      } else if (pm.data?.details?.clabe) {
        defaultLabel = `Clabe ${pm.data.details.clabe}`;
      } else if (pm.data?.details?.bankgiroNumber) {
        defaultLabel = `Bankgiro ${pm.data.details.bankgiroNumber}`;
      } else if (pm.data?.accountHolderName && pm.data?.currency) {
        defaultLabel = `${pm.data.accountHolderName} (${pm.data.currency})`;
      }
      break;
    }
    case PayoutMethodType.OTHER: {
      const content = truncate(pm.data?.content, { length: MAX_PAYOUT_OPTION_DATA_LENGTH }).replace(/\n|\t/g, ' ');
      if (content) {
        defaultLabel = <span>{i18nPayoutMethodType(intl, PayoutMethodType.OTHER)}</span>;
      }
      break;
    }
  }

  if (!defaultLabel) {
    defaultLabel = i18nPayoutMethodType(intl, pm.type);
  }

  return (
    <div className={cn('flex min-h-8 min-w-0 items-center gap-2', props.className)}>
      {props.showIcon && <PayoutMethodIcon size={props.iconSize} payoutMethod={pm} />}
      <span className="truncate whitespace-break-spaces sm:whitespace-nowrap">
        {defaultLabel}{' '}
        {customLabel ? <span className="whitespace-nowrap text-muted-foreground">{customLabel}</span> : null}
      </span>
    </div>
  );
}
