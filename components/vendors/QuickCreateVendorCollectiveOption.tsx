import React from 'react';
import { PlusCircle } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type { VendorFieldsFragment } from '../../lib/graphql/types/v2/graphql';

import { I18nBold } from '@/components/I18nFormatters';

import { Flex } from '../Grid';
import { Span } from '../Text';

import type { QuickCreateVendorCallbacks } from './useQuickCreateVendor';

type QuickCreateVendorCollectiveOptionProps = {
  searchText: string;
  isBeneficiary?: boolean;
};

type QuickCreateVendorSelectArgs = {
  searchText: string;
  onCreatedCollective: (collective: VendorFieldsFragment) => void;
};

function QuickCreateVendorCollectiveOption({ searchText, isBeneficiary }: QuickCreateVendorCollectiveOptionProps) {
  const trimmed = searchText.trim();

  if (trimmed.length > 0) {
    return (
      <Flex alignItems="center">
        <Flex
          alignItems="center"
          justifyContent="center"
          color="#999"
          width="16px"
          minWidth="16px"
          height="16px"
          flexShrink={0}
        >
          <PlusCircle size={14} strokeWidth={2} />
        </Flex>
        <Flex flexDirection="column" ml="8px" textAlign="left">
          <Span fontSize="12px" fontWeight="500" lineHeight="18px" color="black.700">
            {isBeneficiary ? (
              <FormattedMessage
                defaultMessage="Create beneficiary: <b>{vendorName}</b>" id="QFO4ll"
                values={{ vendorName: trimmed, b: I18nBold }}
              />
            ) : (
              <FormattedMessage
                defaultMessage="Create vendor: <b>{vendorName}</b>"
                id="buY7Uz"
                values={{ vendorName: trimmed, b: I18nBold }}
              />
            )}
          </Span>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex alignItems="center">
      <Span fontSize="12px" lineHeight="18px" color="black.500">
        {isBeneficiary ? (
          <FormattedMessage
            defaultMessage="Begin typing to create a beneficiary" id="skcLyR"
          />
        ) : (
          <FormattedMessage defaultMessage="Begin typing to create a vendor" id="Jx28lM" />
        )}
      </Span>
    </Flex>
  );
}

/** `renderNewCollectiveOption` callback for `CollectivePicker` / `CollectivePickerAsync`. */
function quickCreateVendorRenderOption({ isBeneficiary }: { isBeneficiary?: boolean } = {}) {
  return function renderQuickCreateVendorOption({ searchText }: { searchText: string }) {
    return <QuickCreateVendorCollectiveOption searchText={searchText} isBeneficiary={isBeneficiary} />;
  };
}

/** `onSelectNewCollectiveOption` callback for `CollectivePicker` / `CollectivePickerAsync`. */
function quickCreateVendorOnSelect(
  createVendorFromSearch: (searchText: string, callbacks: QuickCreateVendorCallbacks) => void | Promise<void>,
) {
  return function onSelectQuickCreateVendorOption({ searchText, onCreatedCollective }: QuickCreateVendorSelectArgs) {
    const trimmed = searchText.trim();
    if (trimmed) {
      createVendorFromSearch(trimmed, { onSuccess: onCreatedCollective });
    }
  };
}

export function quickCreateVendorCollectivePickerOptions(
  createVendorFromSearch: (searchText: string, callbacks: QuickCreateVendorCallbacks) => void | Promise<void>,
  { isBeneficiary }: { isBeneficiary?: boolean } = {},
) {
  return {
    renderNewCollectiveOption: quickCreateVendorRenderOption({ isBeneficiary }),
    onSelectNewCollectiveOption: quickCreateVendorOnSelect(createVendorFromSearch),
  };
}
