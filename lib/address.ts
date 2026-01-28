/**
 * Address utilities using lib-address/lite for browser environments.
 * The lite version includes all 252+ countries in a single ~50kb bundle (19kb gzip)
 * without needing to register individual countries.
 */
import type { getCountryFields as _typeGetCountryFields } from 'lib-address';
import type { AddressInput, CountryData } from 'lib-address/dist/types';
// @ts-expect-error - lib-address/lite types require moduleResolution: "bundler" but the import works at runtime
import { getCountryData, getCountryFields } from 'lib-address/lite';
import { startCase } from 'lodash';
import { defineMessages, type IntlShape } from 'react-intl';

/**
 * Structured address type used in Open Collective
 */
export type StructuredAddress = {
  address1?: string;
  address2?: string;
  city?: string;
  postalCode?: string;
  zone?: string;
};

/**
 * Field mapping from Open Collective field names to lib-address field names
 */
const FIELD_NAME_MAP: Record<keyof StructuredAddress, keyof AddressInput> = {
  address1: 'addressLine1',
  address2: 'addressLine2',
  city: 'city',
  zone: 'state',
  postalCode: 'zip',
};

const i18nLabels = defineMessages({
  address1: {
    id: 'collective.address.label',
    defaultMessage: 'Address',
  },
  address2: {
    id: 'address.address2',
    defaultMessage: 'Apartment, suite, etc.',
  },
  city: {
    defaultMessage: 'City',
    id: 'TE4fIS',
  },
  zone: {
    id: 'address.zone',
    defaultMessage: 'State/Province',
  },
  postalCode: {
    id: 'address.postalCode',
    defaultMessage: 'Postal Code',
  },
});

/**
 * Fields that are used in Open Collective address forms
 */
const OC_ADDRESS_FIELDS = ['address1', 'address2', 'city', 'zone', 'postalCode'] as const;

export type Zone = {
  code: string;
  name: string;
};

export type AddressFieldConfig = {
  name: string;
  label: string;
  required: boolean;
  zones?: Zone[];
};

/**
 * Parse the format string from lib-address to determine field order
 * Format uses codes like %A (address), %C (city), %S (state), %Z (zip)
 */
function parseFormatString(formatString: string): (keyof StructuredAddress)[] {
  // Map of format codes to OC field names
  const formatCodeMap: Record<string, keyof StructuredAddress> = {
    A: 'address1', // Address line 1 (address2 follows address1)
    C: 'city',
    S: 'zone', // State/Province
    Z: 'postalCode', // Zip/Postal code
  };

  const orderedFields: (keyof StructuredAddress)[] = [];
  const regex = /%([ACSZ])/g;
  let match;

  while ((match = regex.exec(formatString)) !== null) {
    const code = match[1];
    const fieldName = formatCodeMap[code];
    if (fieldName && !orderedFields.includes(fieldName)) {
      orderedFields.push(fieldName);
      // address2 always follows address1
      if (fieldName === 'address1') {
        orderedFields.push('address2');
      }
    }
  }

  return orderedFields;
}

const i18nFieldLabel = (intl: IntlShape, name: string) => {
  return i18nLabels[name] ? intl.formatMessage(i18nLabels[name]) : startCase(name);
};

/**
 * Get address form fields configuration for a country
 * Returns fields in display order with labels and required status
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param _locale - Locale for labels (currently unused, lib-address/lite uses default labels)
 */
export function getAddressFormFields(
  countryCode: string,
  intl: IntlShape,
): {
  fields: AddressFieldConfig[];
  optionalFields: string[];
} {
  // Get field requirements from lib-address/lite
  const fieldRequirements = getCountryFields(countryCode) as ReturnType<typeof _typeGetCountryFields>;
  if (!fieldRequirements) {
    // Fallback to all fields with default requirements
    return {
      fields: OC_ADDRESS_FIELDS.map(name => ({
        name,
        label: i18nFieldLabel(intl, name),
        required: name === 'address1',
      })),
      optionalFields: OC_ADDRESS_FIELDS.filter(name => name !== 'address1'),
    };
  }

  // Get country data for format string and subdivisions
  const countryData = getCountryData(countryCode) as CountryData;

  // Determine field order from format string or use default order
  let orderedFields: readonly (keyof StructuredAddress)[] = OC_ADDRESS_FIELDS;
  if (countryData?.lfmt) {
    const parsedOrder = parseFormatString(countryData.lfmt);
    if (parsedOrder.length > 0) {
      orderedFields = parsedOrder;
    }
  }

  // Get zones (sub_regions) for countries with states/provinces
  const zones: Zone[] = (countryData?.sub_regions || []).map(region => ({
    code: region.key,
    name: region.name as unknown as string, // wrongly typed in lib-address
  }));

  // Build field configurations
  const optionalFields: string[] = [];
  const fields: AddressFieldConfig[] = [];

  for (const ocFieldName of orderedFields) {
    const libFieldName = FIELD_NAME_MAP[ocFieldName];
    const requirement = fieldRequirements[libFieldName as keyof typeof fieldRequirements];

    // Skip fields that are not used for this country
    if (requirement === undefined && ocFieldName !== 'address2') {
      continue;
    }

    const isRequired = requirement === 'required';
    if (!isRequired) {
      optionalFields.push(ocFieldName);
    }

    const fieldConfig: AddressFieldConfig = {
      name: ocFieldName,
      label: i18nFieldLabel(intl, ocFieldName),
      required: isRequired,
    };

    // Add zones for the zone field if applicable
    if (ocFieldName === 'zone' && zones.length > 0) {
      fieldConfig.zones = zones;
    }

    fields.push(fieldConfig);
  }

  return { fields, optionalFields };
}
