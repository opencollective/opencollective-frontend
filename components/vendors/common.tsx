import type { IntlShape } from 'react-intl';

import { elementFromClass } from '../../lib/react-utils';
import type { UseVendorPolicy } from '@/lib/graphql/types/v2/graphql';

export const VendorContactTag = elementFromClass(
  'div',
  'text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-full w-max flex gap-1 truncate',
);

export const getUseVendorPolicyLabel = (
  policy: UseVendorPolicy | null | undefined,
  orgName: string | undefined,
  intl: IntlShape,
): string => {
  switch (policy) {
    case 'HOST_ADMINS':
      return intl.formatMessage({ defaultMessage: 'Only {orgName} admins', id: 'Ab202N' }, { orgName });
    case 'ALL_SUBMITTERS':
      return intl.formatMessage({ defaultMessage: 'All expense submitters', id: 'Q4svuX' });
    case 'HOST_AND_COLLECTIVE_ADMINS':
    default:
      return intl.formatMessage(
        { defaultMessage: '{orgName} admins and collective admins', id: 'IaKZQb' },
        { orgName },
      );
  }
};

export const getEffectiveVendorPolicyLabel = (
  vendor: { useVendorPolicy?: UseVendorPolicy | null },
  host: { name?: string; policies?: { USE_VENDOR_POLICY?: UseVendorPolicy | null } } | null | undefined,
  intl: IntlShape,
): { label: string; isInherited: boolean } => {
  const isInherited = !vendor.useVendorPolicy;
  const effective = vendor.useVendorPolicy ?? host?.policies?.USE_VENDOR_POLICY;
  return { label: getUseVendorPolicyLabel(effective, host?.name, intl), isInherited };
};
