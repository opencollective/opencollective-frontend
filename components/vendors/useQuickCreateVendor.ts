import { useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { pick } from 'lodash-es';
import { useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import type { AccountReferenceInput, VendorFieldsFragment } from '../../lib/graphql/types/v2/graphql';

import { useToast } from '../ui/useToast';

import { createVendorMutation } from './queries';

type HostReference = Pick<AccountReferenceInput, 'id' | 'slug'>;

export type QuickCreateVendorCallbacks = {
  onSuccess: (vendor: VendorFieldsFragment) => void;
};

type UseQuickCreateVendorOptions = {
  host: HostReference;
  canBeUsedWithAccounts?: AccountReferenceInput[];
  isBeneficiary?: boolean;
};

export function useQuickCreateVendor({ host, canBeUsedWithAccounts, isBeneficiary }: UseQuickCreateVendorOptions) {
  const intl = useIntl();
  const { toast } = useToast();
  const [createVendor, { loading: isCreatingVendor }] = useMutation(createVendorMutation);

  const createVendorFromSearch = useCallback(
    async (searchText: string, { onSuccess }: QuickCreateVendorCallbacks) => {
      const name = searchText.trim();
      if (!name) {
        return;
      }

      try {
        const result = await createVendor({
          variables: {
            vendor: { name, canBeUsedWithAccounts },
            host: pick(host, ['id', 'slug']),
          },
        });

        const vendor = result.data?.createVendor;
        if (!vendor) {
          throw new Error('Missing createVendor response');
        }

        toast({
          variant: 'success',
          message: isBeneficiary
            ? intl.formatMessage({ defaultMessage: 'Beneficiary created', id: 'gGYap6' })
            : intl.formatMessage({ defaultMessage: 'Vendor created', id: 'Ra9inC' }),
        });
        onSuccess(vendor);
      } catch (error) {
        toast({
          variant: 'error',
          message: i18nGraphqlException(intl, error),
        });
      }
    },
    [createVendor, host, canBeUsedWithAccounts, isBeneficiary, intl, toast],
  );

  return { createVendorFromSearch, isCreatingVendor };
}
