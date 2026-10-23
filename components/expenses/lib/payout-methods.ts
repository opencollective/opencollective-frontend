import { AccountTypesWithHost, CollectiveType } from '../../../lib/constants/collectives';
import type { AccountType, Currency, PayoutMethod } from '../../../lib/graphql/types/v2/graphql';
import { PayoutMethodType } from '../../../lib/graphql/types/v2/graphql';

import { NEW_ACCOUNT_BALANCE_PAYOUT_METHOD_ID } from './constants';

type PayoutHost = {
  id: string;
  currency: Currency;
  supportedPayoutMethods?: readonly PayoutMethodType[] | null;
};

type PayoutPayee<T = Pick<PayoutMethod, 'id' | 'type' | 'data'>> = {
  type: AccountType;
  host?: {
    id: string;
    payoutMethods?: readonly T[] | null;
  } | null;
};

export function getSupportedPayoutMethods(host?: PayoutHost | null, payee?: PayoutPayee | null): PayoutMethodType[] {
  if (payee?.host && host && payee.host.id === host.id) {
    return [PayoutMethodType.ACCOUNT_BALANCE];
  }

  const supportedPayoutMethods = host
    ? host.supportedPayoutMethods || []
    : [PayoutMethodType.OTHER, PayoutMethodType.BANK_ACCOUNT];
  const payeeHasHost = payee && (AccountTypesWithHost as readonly string[]).includes(payee.type);

  return supportedPayoutMethods.filter(
    type =>
      type !== PayoutMethodType.CREDIT_CARD &&
      type !== PayoutMethodType.ACCOUNT_BALANCE &&
      !(payeeHasHost && type === PayoutMethodType.OTHER),
  );
}

type AccountBalancePayoutMethod = {
  id: string;
  type: PayoutMethodType.ACCOUNT_BALANCE;
  data: { currency: Currency };
  isSaved: true;
} & Partial<Pick<PayoutMethod, 'name' | 'canBeEdited' | 'canBeDeleted' | 'createdAt' | 'updatedAt' | 'isVerified'>>;

export function getAvailablePayoutMethods<T extends Pick<PayoutMethod, 'id' | 'type' | 'data'>>({
  host,
  payee,
  payoutMethods,
  supportedPayoutMethods,
}: {
  host?: PayoutHost | null;
  payee?: PayoutPayee<T> | null;
  payoutMethods?: readonly T[] | null;
  supportedPayoutMethods: readonly PayoutMethodType[];
}): Array<T | AccountBalancePayoutMethod> | undefined {
  if (payee?.host && host && payee.host.id !== host.id) {
    // Cross-host expenses use the recipient host's payout methods.
    return payee.host.payoutMethods?.filter(method => supportedPayoutMethods.includes(method.type));
  }

  const availablePayoutMethods = payoutMethods
    ?.filter(method => supportedPayoutMethods.includes(method.type))
    .map(method =>
      method.type === PayoutMethodType.ACCOUNT_BALANCE && host
        ? { ...method, data: { currency: host.currency } }
        : method,
    );

  if (
    payee?.type !== CollectiveType.VENDOR &&
    host &&
    supportedPayoutMethods.includes(PayoutMethodType.ACCOUNT_BALANCE) &&
    !availablePayoutMethods?.some(method => method.type === PayoutMethodType.ACCOUNT_BALANCE)
  ) {
    return [
      ...(availablePayoutMethods || []),
      {
        id: NEW_ACCOUNT_BALANCE_PAYOUT_METHOD_ID,
        type: PayoutMethodType.ACCOUNT_BALANCE,
        data: { currency: host.currency },
        isSaved: true,
      },
    ];
  }

  return availablePayoutMethods;
}
