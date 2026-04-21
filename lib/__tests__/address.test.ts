import type { IntlShape } from 'react-intl';

// Mock lib-address/lite before importing address module
const mockGetCountryData = jest.fn();
const mockGetCountryFields = jest.fn();

jest.mock('lib-address/lite', () => ({
  getCountryData: (...args: unknown[]) => mockGetCountryData(...args),
  getCountryFields: (...args: unknown[]) => mockGetCountryFields(...args),
}));

import { getAddressFormFields } from '../address';

// Create a mock intl object
const createMockIntl = (): IntlShape =>
  ({
    formatMessage: ({ defaultMessage }: { defaultMessage: string }) => defaultMessage,
  }) as unknown as IntlShape;

// Mock country data for different countries
const mockCountryDataUS = {
  code: 'US',
  lfmt: '%N%n%O%n%A%n%C, %S %Z',
  zip: '\\d{5}(-\\d{4})?',
  require: 'ACSZ',
  sub_regions: [
    { key: 'AL', name: 'Alabama', zip: null },
    { key: 'AK', name: 'Alaska', zip: null },
    { key: 'CA', name: 'California', zip: null },
    { key: 'NY', name: 'New York', zip: null },
    { key: 'TX', name: 'Texas', zip: null },
  ],
};

const mockCountryDataCA = {
  code: 'CA',
  lfmt: '%N%n%O%n%A%n%C %S %Z',
  zip: '[A-Z]\\d[A-Z] ?\\d[A-Z]\\d',
  require: 'ACSZ',
  sub_regions: [
    { key: 'ON', name: 'Ontario', zip: null },
    { key: 'QC', name: 'Quebec', zip: null },
    { key: 'BC', name: 'British Columbia', zip: null },
  ],
};

const mockCountryDataGB = {
  code: 'GB',
  lfmt: '%N%n%O%n%A%n%C%n%Z',
  zip: null,
  require: 'ACZ',
  sub_regions: [],
};

const mockCountryDataFR = {
  code: 'FR',
  lfmt: '%N%n%O%n%A%n%Z %C',
  zip: '\\d{5}',
  require: 'ACZ',
  sub_regions: [],
};

const mockCountryDataDE = {
  code: 'DE',
  lfmt: '%N%n%O%n%A%n%Z %C',
  zip: '\\d{5}',
  require: 'ACZ',
  sub_regions: [],
};

const mockCountryDataJP = {
  code: 'JP',
  lfmt: '%Z%n%S%C%n%A%n%O%n%N', // Includes city (%C) in format
  zip: '\\d{3}-\\d{4}',
  require: 'ACSZ',
  sub_regions: [
    { key: '01', name: 'Hokkaido', zip: null },
    { key: '13', name: 'Tokyo', zip: null },
    { key: '27', name: 'Osaka', zip: null },
  ],
};

const mockCountryDataPR = {
  code: 'PR',
  lfmt: '%N%n%O%n%A%n%C %S %Z',
  zip: '\\d{5}(-\\d{4})?',
  require: 'ACZ',
  sub_regions: [],
};

const mockCountryDataAS = {
  code: 'AS',
  lfmt: '%N%n%O%n%A%n%C %S %Z',
  zip: '\\d{5}(-\\d{4})?',
  require: 'ACZ',
  sub_regions: [],
};

// Mock field requirements
const mockFieldRequirementsUS = {
  name: undefined,
  organization: undefined,
  dependentLocality: undefined,
  city: 'required',
  state: 'required',
  zip: 'required',
  sortingCode: undefined,
  addressLine1: 'required',
};

const mockFieldRequirementsCA = {
  name: undefined,
  organization: undefined,
  dependentLocality: undefined,
  city: 'required',
  state: 'required',
  zip: 'required',
  sortingCode: undefined,
  addressLine1: 'required',
};

const mockFieldRequirementsGB = {
  name: undefined,
  organization: undefined,
  dependentLocality: undefined,
  city: 'required',
  state: undefined,
  zip: 'required',
  sortingCode: undefined,
  addressLine1: 'required',
};

const mockFieldRequirementsFR = {
  name: undefined,
  organization: undefined,
  dependentLocality: undefined,
  city: 'required',
  state: undefined,
  zip: 'required',
  sortingCode: undefined,
  addressLine1: 'required',
};

const mockFieldRequirementsDE = {
  name: undefined,
  organization: undefined,
  dependentLocality: undefined,
  city: 'required',
  state: undefined,
  zip: 'required',
  sortingCode: undefined,
  addressLine1: 'required',
};

const mockFieldRequirementsJP = {
  name: undefined,
  organization: undefined,
  dependentLocality: undefined,
  city: 'required',
  state: 'required',
  zip: 'required',
  sortingCode: undefined,
  addressLine1: 'required',
};

const mockFieldRequirementsPR = {
  name: undefined,
  organization: undefined,
  dependentLocality: undefined,
  city: 'required',
  state: undefined,
  zip: 'required',
  sortingCode: undefined,
  addressLine1: 'required',
};

const mockFieldRequirementsAS = {
  name: undefined,
  organization: undefined,
  dependentLocality: undefined,
  city: 'required',
  state: undefined,
  zip: 'required',
  sortingCode: undefined,
  addressLine1: 'required',
};

// Helper to set up mocks for a specific country
const setupMocksForCountry = (
  countryCode: string,
  countryData: typeof mockCountryDataUS | null,
  fieldRequirements: typeof mockFieldRequirementsUS | null,
) => {
  mockGetCountryData.mockImplementation((code: string) => {
    if (code === countryCode) {
      return countryData;
    }
    return null;
  });
  mockGetCountryFields.mockImplementation((code: string) => {
    if (code === countryCode) {
      return fieldRequirements;
    }
    return null;
  });
};

describe('address utilities', () => {
  const mockIntl = createMockIntl();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAddressFormFields', () => {
    describe('US address', () => {
      beforeEach(() => {
        setupMocksForCountry('US', mockCountryDataUS, mockFieldRequirementsUS);
      });

      it('returns correct fields for US', () => {
        const result = getAddressFormFields('US', mockIntl);

        expect(result.fields).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'address1', required: true }),
            expect.objectContaining({ name: 'address2', required: false }),
            expect.objectContaining({ name: 'city', required: true }),
            expect.objectContaining({ name: 'zone', required: true }),
            expect.objectContaining({ name: 'postalCode', required: true }),
          ]),
        );
      });

      it('includes US states as zones', () => {
        const result = getAddressFormFields('US', mockIntl);
        const zoneField = result.fields.find(f => f.name === 'zone');

        expect(zoneField?.zones).toBeDefined();
        expect(zoneField?.zones?.length).toBeGreaterThan(0);
        // Check for some well-known US states
        expect(zoneField?.zones).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ code: 'CA' }),
            expect.objectContaining({ code: 'NY' }),
            expect.objectContaining({ code: 'TX' }),
          ]),
        );
      });

      it('marks address2 as optional', () => {
        const result = getAddressFormFields('US', mockIntl);

        expect(result.optionalFields).toContain('address2');
      });
    });

    describe('Canadian address', () => {
      beforeEach(() => {
        setupMocksForCountry('CA', mockCountryDataCA, mockFieldRequirementsCA);
      });

      it('returns correct fields for Canada', () => {
        const result = getAddressFormFields('CA', mockIntl);

        expect(result.fields).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'address1' }),
            expect.objectContaining({ name: 'city' }),
            expect.objectContaining({ name: 'zone' }),
            expect.objectContaining({ name: 'postalCode' }),
          ]),
        );
      });

      it('includes Canadian provinces as zones', () => {
        const result = getAddressFormFields('CA', mockIntl);
        const zoneField = result.fields.find(f => f.name === 'zone');

        expect(zoneField?.zones).toBeDefined();
        expect(zoneField?.zones?.length).toBeGreaterThan(0);
        // Check for some Canadian provinces
        expect(zoneField?.zones).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ code: 'ON' }), // Ontario
            expect.objectContaining({ code: 'QC' }), // Quebec
            expect.objectContaining({ code: 'BC' }), // British Columbia
          ]),
        );
      });
    });

    describe('UK address', () => {
      beforeEach(() => {
        setupMocksForCountry('GB', mockCountryDataGB, mockFieldRequirementsGB);
      });

      it('returns correct fields for UK', () => {
        const result = getAddressFormFields('GB', mockIntl);

        expect(result.fields).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'address1' }),
            expect.objectContaining({ name: 'city' }),
            expect.objectContaining({ name: 'postalCode' }),
          ]),
        );
      });

      it('does not include zone field for UK (no states/provinces)', () => {
        const result = getAddressFormFields('GB', mockIntl);
        const zoneField = result.fields.find(f => f.name === 'zone');

        // UK doesn't have states, so zone field should either not exist or have no zones
        expect(zoneField?.zones?.length || 0).toBe(0);
      });
    });

    describe('French address', () => {
      beforeEach(() => {
        setupMocksForCountry('FR', mockCountryDataFR, mockFieldRequirementsFR);
      });

      it('returns correct fields for France', () => {
        const result = getAddressFormFields('FR', mockIntl);

        expect(result.fields).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'address1' }),
            expect.objectContaining({ name: 'city' }),
            expect.objectContaining({ name: 'postalCode' }),
          ]),
        );
      });
    });

    describe('German address', () => {
      beforeEach(() => {
        setupMocksForCountry('DE', mockCountryDataDE, mockFieldRequirementsDE);
      });

      it('returns correct fields for Germany', () => {
        const result = getAddressFormFields('DE', mockIntl);

        expect(result.fields).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'address1' }),
            expect.objectContaining({ name: 'city' }),
            expect.objectContaining({ name: 'postalCode' }),
          ]),
        );
      });
    });

    describe('Japanese address', () => {
      beforeEach(() => {
        setupMocksForCountry('JP', mockCountryDataJP, mockFieldRequirementsJP);
      });

      it('returns correct fields for Japan', () => {
        const result = getAddressFormFields('JP', mockIntl);

        expect(result.fields).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'address1' }),
            expect.objectContaining({ name: 'city' }),
            expect.objectContaining({ name: 'postalCode' }),
          ]),
        );
      });

      it('includes Japanese prefectures as zones', () => {
        const result = getAddressFormFields('JP', mockIntl);
        const zoneField = result.fields.find(f => f.name === 'zone');

        expect(zoneField?.zones).toBeDefined();
        expect(zoneField?.zones?.length).toBeGreaterThan(0);
      });
    });

    describe('field labels', () => {
      beforeEach(() => {
        setupMocksForCountry('US', mockCountryDataUS, mockFieldRequirementsUS);
      });

      it('returns localized labels using intl', () => {
        const result = getAddressFormFields('US', mockIntl);

        // Should use default messages from i18n
        const address1Field = result.fields.find(f => f.name === 'address1');
        const cityField = result.fields.find(f => f.name === 'city');
        const postalCodeField = result.fields.find(f => f.name === 'postalCode');

        expect(address1Field?.label).toBe('Address');
        expect(cityField?.label).toBe('City');
        expect(postalCodeField?.label).toBe('Postal Code');
      });
    });

    describe('field ordering', () => {
      beforeEach(() => {
        setupMocksForCountry('US', mockCountryDataUS, mockFieldRequirementsUS);
      });

      it('address2 always follows address1', () => {
        const result = getAddressFormFields('US', mockIntl);

        const address1Index = result.fields.findIndex(f => f.name === 'address1');
        const address2Index = result.fields.findIndex(f => f.name === 'address2');

        expect(address1Index).toBeGreaterThanOrEqual(0);
        expect(address2Index).toBe(address1Index + 1);
      });
    });

    describe('unknown country code', () => {
      beforeEach(() => {
        // Return null for unknown country
        mockGetCountryData.mockReturnValue(null);
        mockGetCountryFields.mockReturnValue(null);
      });

      it('returns fallback fields for unknown country', () => {
        const result = getAddressFormFields('XX', mockIntl);

        // Should return default fields when country data is not available
        expect(result.fields.length).toBeGreaterThan(0);
        expect(result.fields).toEqual(
          expect.arrayContaining([expect.objectContaining({ name: 'address1', required: true })]),
        );
      });

      it('returns all standard address fields in fallback', () => {
        const result = getAddressFormFields('XX', mockIntl);

        const fieldNames = result.fields.map(f => f.name);
        expect(fieldNames).toContain('address1');
        expect(fieldNames).toContain('address2');
        expect(fieldNames).toContain('city');
        expect(fieldNames).toContain('zone');
        expect(fieldNames).toContain('postalCode');
      });

      it('only marks address1 as required in fallback', () => {
        const result = getAddressFormFields('XX', mockIntl);

        const address1Field = result.fields.find(f => f.name === 'address1');
        const otherFields = result.fields.filter(f => f.name !== 'address1');

        expect(address1Field?.required).toBe(true);
        for (const field of otherFields) {
          expect(field.required).toBe(false);
        }
      });
    });

    describe('US territories', () => {
      it('handles Puerto Rico (PR)', () => {
        setupMocksForCountry('PR', mockCountryDataPR, mockFieldRequirementsPR);
        const result = getAddressFormFields('PR', mockIntl);

        expect(result.fields.length).toBeGreaterThan(0);
        expect(result.fields).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'address1' })]));
      });

      it('handles American Samoa (AS)', () => {
        setupMocksForCountry('AS', mockCountryDataAS, mockFieldRequirementsAS);
        const result = getAddressFormFields('AS', mockIntl);

        expect(result.fields.length).toBeGreaterThan(0);
        expect(result.fields).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'address1' })]));
      });
    });

    describe('return structure', () => {
      beforeEach(() => {
        setupMocksForCountry('US', mockCountryDataUS, mockFieldRequirementsUS);
      });

      it('returns both fields and optionalFields', () => {
        const result = getAddressFormFields('US', mockIntl);

        expect(result).toHaveProperty('fields');
        expect(result).toHaveProperty('optionalFields');
        expect(Array.isArray(result.fields)).toBe(true);
        expect(Array.isArray(result.optionalFields)).toBe(true);
      });

      it('optionalFields contains field names that are not required', () => {
        const result = getAddressFormFields('US', mockIntl);

        for (const optionalFieldName of result.optionalFields) {
          const field = result.fields.find(f => f.name === optionalFieldName);
          expect(field?.required).toBe(false);
        }
      });

      it('each field has name, label, and required properties', () => {
        const result = getAddressFormFields('US', mockIntl);

        for (const field of result.fields) {
          expect(field).toHaveProperty('name');
          expect(field).toHaveProperty('label');
          expect(field).toHaveProperty('required');
          expect(typeof field.name).toBe('string');
          expect(typeof field.label).toBe('string');
          expect(typeof field.required).toBe('boolean');
        }
      });
    });

    describe('calls lib-address/lite correctly', () => {
      beforeEach(() => {
        setupMocksForCountry('US', mockCountryDataUS, mockFieldRequirementsUS);
      });

      it('calls getCountryFields with the country code', () => {
        getAddressFormFields('US', mockIntl);

        expect(mockGetCountryFields).toHaveBeenCalledWith('US');
      });

      it('calls getCountryData with the country code', () => {
        getAddressFormFields('US', mockIntl);

        expect(mockGetCountryData).toHaveBeenCalledWith('US');
      });
    });
  });
});
