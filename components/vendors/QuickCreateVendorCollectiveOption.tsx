import React from 'react';
import { PlusCircle } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type { VendorFieldsFragment } from '../../lib/graphql/types/v2/graphql';

import { I18nBold } from '@/components/I18nFormatters';

import { Button } from '../ui/Button';

import type { QuickCreateVendorCallbacks } from './useQuickCreateVendor';

type QuickCreateVendorCollectiveOptionProps = {
  searchText: string;
  onCreatedCollective: (collective: VendorFieldsFragment) => void;
  loading?: boolean;
  createVendorFromSearch: (searchText: string, callbacks: QuickCreateVendorCallbacks) => void | Promise<void>;
};

function QuickCreateVendorCollectiveOption({
  searchText,
  onCreatedCollective,
  loading,
  createVendorFromSearch,
}: QuickCreateVendorCollectiveOptionProps) {
  const trimmed = searchText.trim();

  if (trimmed.length > 0) {
    return (
      <Button
        type="button"
        variant="ghost"
        loading={loading}
        className="flex w-full items-center justify-between gap-2 text-sm text-gray-500"
        onClick={() => createVendorFromSearch(trimmed, { onSuccess: onCreatedCollective })}
      >
        <span>
          <FormattedMessage
            defaultMessage="Create vendor: <b>{vendorName}</b>"
            id="buY7Uz"
            values={{ vendorName: trimmed, b: I18nBold }}
          />
        </span>
        <PlusCircle size={16} />
      </Button>
    );
  }

  return (
    <div>
      <FormattedMessage defaultMessage="Begin typing to create a vendor" id="Jx28lM" />
    </div>
  );
}

/** `renderNewCollectiveOption` callback for `CollectivePicker` / `CollectivePickerAsync`. */
export function quickCreateVendorRenderOption(
  createVendorFromSearch: QuickCreateVendorCollectiveOptionProps['createVendorFromSearch'],
  loading?: boolean,
) {
  return function renderQuickCreateVendorOption({
    searchText,
    onCreatedCollective,
  }: {
    searchText: string;
    onCreatedCollective: (collective: VendorFieldsFragment) => void;
  }) {
    return (
      <QuickCreateVendorCollectiveOption
        searchText={searchText}
        onCreatedCollective={onCreatedCollective}
        loading={loading}
        createVendorFromSearch={createVendorFromSearch}
      />
    );
  };
}
