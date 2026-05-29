import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { StructuredAddress } from '@/lib/address';
import { withRequiredProviders } from '../test/providers';

import I18nAddressFields, {
  NewSimpleLocationFieldRenderer,
  serializeAddress,
  SimpleLocationFieldRenderer,
} from './I18nAddressFields';

// Define types locally for the test
type Zone = { code: string; name: string };
type AddressFieldConfig = { name: string; label: string; required: boolean; zones?: Zone[] };

// Helper to get elements by data-cy attribute (used by the component instead of data-testid)
const getByDataCy = (cy: string) => {
  const element = document.querySelector(`[data-cy="${cy}"]`);
  if (!element) {
    throw new Error(`Unable to find an element with data-cy="${cy}"`);
  }
  return element as HTMLElement;
};

const mockGetAddressFormFields = jest.fn<
  { fields: AddressFieldConfig[]; optionalFields: string[] },
  [string, string?]
>();

// Mock the address lib - now returns synchronously (lib-address/lite has all data bundled)
jest.mock('../lib/address', () => ({
  getAddressFormFields: (...args: [string, string?]) => mockGetAddressFormFields(...args),
}));

describe('I18nAddressFields', () => {
  const defaultProps = {
    selectedCountry: 'US',
    onCountryChange: jest.fn(),
    // Use SimpleLocationFieldRenderer as default to avoid Formik context requirement
    Component: SimpleLocationFieldRenderer,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation for US - returns synchronously
    mockGetAddressFormFields.mockReturnValue({
      fields: [
        { name: 'address1', label: 'Address', required: true },
        { name: 'address2', label: 'Apartment, suite, etc.', required: false },
        { name: 'city', label: 'City', required: true },
        { name: 'zone', label: 'State', required: true, zones: [{ code: 'CA', name: 'California' }] },
        { name: 'postalCode', label: 'ZIP Code', required: true },
      ],
      optionalFields: ['address2'],
    });
  });

  describe('rendering', () => {
    it('renders address fields immediately (no loading state with lib-address/lite)', () => {
      render(withRequiredProviders(<I18nAddressFields {...defaultProps} />));

      // Check that fields are rendered (using data-cy attributes)
      expect(getByDataCy('address-address1')).toBeInTheDocument();
      expect(getByDataCy('address-city')).toBeInTheDocument();
      expect(getByDataCy('address-postalCode')).toBeInTheDocument();
    });

    it('renders nothing when no country is selected', () => {
      const { container } = render(withRequiredProviders(<I18nAddressFields {...defaultProps} selectedCountry="" />));

      expect(container).toBeEmptyDOMElement();
    });

    it('displays field values when provided', () => {
      const value: StructuredAddress = {
        address1: '123 Main St',
        city: 'San Francisco',
        postalCode: '94102',
      };

      render(withRequiredProviders(<I18nAddressFields {...defaultProps} value={value} />));

      expect(getByDataCy('address-address1')).toHaveValue('123 Main St');
      expect(getByDataCy('address-city')).toHaveValue('San Francisco');
      expect(getByDataCy('address-postalCode')).toHaveValue('94102');
    });
  });

  describe('country handling', () => {
    it('gets address fields for the selected country', () => {
      render(withRequiredProviders(<I18nAddressFields {...defaultProps} selectedCountry="FR" />));

      // intl can be anything, we don't care
      expect(mockGetAddressFormFields).toHaveBeenCalledWith('FR', expect.anything());
    });

    it('passes country code directly to getAddressFormFields', () => {
      // lib-address/lite handles all countries internally, including US territories
      render(withRequiredProviders(<I18nAddressFields {...defaultProps} selectedCountry="AS" />));

      expect(mockGetAddressFormFields).toHaveBeenCalledWith('AS', expect.anything());
    });

    it('re-computes fields when country changes', () => {
      const { rerender } = render(withRequiredProviders(<I18nAddressFields {...defaultProps} selectedCountry="US" />));

      expect(mockGetAddressFormFields).toHaveBeenCalledWith('US', expect.anything());

      rerender(withRequiredProviders(<I18nAddressFields {...defaultProps} selectedCountry="FR" />));

      expect(mockGetAddressFormFields).toHaveBeenCalledWith('FR', expect.anything());
    });
  });

  describe('callbacks', () => {
    it('calls onCountryChange when a field value changes', () => {
      const onCountryChange = jest.fn();
      render(withRequiredProviders(<I18nAddressFields {...defaultProps} onCountryChange={onCountryChange} />));

      const addressInput = getByDataCy('address-address1');
      fireEvent.change(addressInput, { target: { name: 'address1', value: '456 Oak Ave' } });

      expect(onCountryChange).toHaveBeenCalledWith(
        expect.objectContaining({
          address1: '456 Oak Ave',
        }),
      );
    });

    it('calls onLoadSuccess when fields are computed', async () => {
      const onLoadSuccess = jest.fn();
      render(withRequiredProviders(<I18nAddressFields {...defaultProps} onLoadSuccess={onLoadSuccess} />));

      // onLoadSuccess is called in useEffect after initial render
      await waitFor(() => {
        expect(onLoadSuccess).toHaveBeenCalledWith({
          countryInfo: expect.objectContaining({
            fields: expect.any(Array),
            optionalFields: expect.any(Array),
          }),
          addressFields: expect.any(Array),
        });
      });
    });

    it('calls onLoadError when getAddressFormFields throws', () => {
      mockGetAddressFormFields.mockImplementationOnce(() => {
        throw new Error('Failed to get fields');
      });
      const onLoadError = jest.fn();

      render(withRequiredProviders(<I18nAddressFields {...defaultProps} onLoadError={onLoadError} />));

      expect(onLoadError).toHaveBeenCalled();
    });
  });

  describe('required fields', () => {
    it('marks fields as required based on country data', () => {
      render(withRequiredProviders(<I18nAddressFields {...defaultProps} required={true} />));

      // address1 should be required, address2 should be optional (based on mock data)
      const address1Input = getByDataCy('address-address1');
      const address2Input = getByDataCy('address-address2');

      expect(address1Input).toHaveAttribute('required');
      expect(address2Input).not.toHaveAttribute('required');
    });

    it('can override all fields to be optional', () => {
      render(withRequiredProviders(<I18nAddressFields {...defaultProps} required={false} />));

      const address1Input = getByDataCy('address-address1');
      expect(address1Input).not.toHaveAttribute('required');
    });
  });

  describe('field errors', () => {
    it('displays field-specific errors', () => {
      const errors = {
        address1: 'Address is required',
        postalCode: 'Invalid ZIP code',
      };

      render(
        withRequiredProviders(
          <I18nAddressFields {...defaultProps} Component={NewSimpleLocationFieldRenderer} errors={errors} />,
        ),
      );

      expect(screen.getByText('Address is required')).toBeInTheDocument();
      expect(screen.getByText('Invalid ZIP code')).toBeInTheDocument();
    });
  });
});

describe('serializeAddress', () => {
  it('serializes an address object to a sorted newline-separated string', () => {
    const address = {
      city: 'San Francisco',
      address1: '123 Main St',
      postalCode: '94102',
    };

    const result = serializeAddress(address);

    // Keys are sorted alphabetically
    expect(result).toBe('123 Main St\nSan Francisco\n94102');
  });

  it('handles empty address object', () => {
    const result = serializeAddress({});
    expect(result).toBe('');
  });

  it('handles undefined values', () => {
    const address = {
      address1: '123 Main St',
      address2: undefined,
      city: 'San Francisco',
    };

    const result = serializeAddress(address);
    expect(result).toContain('123 Main St');
    expect(result).toContain('San Francisco');
  });
});

describe('SimpleLocationFieldRenderer', () => {
  const defaultProps = {
    name: 'address1',
    label: 'Address',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders an input field', () => {
    render(withRequiredProviders(<SimpleLocationFieldRenderer {...defaultProps} />));
    expect(getByDataCy('address-address1')).toBeInTheDocument();
  });

  it('displays the provided value', () => {
    render(withRequiredProviders(<SimpleLocationFieldRenderer {...defaultProps} value="123 Main St" />));
    expect(getByDataCy('address-address1')).toHaveValue('123 Main St');
  });

  it('calls onChange when input value changes', () => {
    const onChange = jest.fn();
    render(withRequiredProviders(<SimpleLocationFieldRenderer {...defaultProps} onChange={onChange} />));

    fireEvent.change(getByDataCy('address-address1'), {
      target: { name: 'address1', value: 'New Address' },
    });

    expect(onChange).toHaveBeenCalled();
  });

  it('displays error when error prop is provided', () => {
    render(withRequiredProviders(<SimpleLocationFieldRenderer {...defaultProps} error="Custom error message" />));

    // The error is passed to StyledInputField and should be rendered
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });
});

describe('NewSimpleLocationFieldRenderer', () => {
  const defaultProps = {
    name: 'city',
    label: 'City',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a label and input', () => {
    render(withRequiredProviders(<NewSimpleLocationFieldRenderer {...defaultProps} />));
    expect(screen.getByText('City')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows optional indicator for non-required fields', () => {
    render(withRequiredProviders(<NewSimpleLocationFieldRenderer {...defaultProps} required={false} />));
    expect(screen.getByText(/optional/i)).toBeInTheDocument();
  });

  it('does not show optional indicator for required fields', () => {
    render(withRequiredProviders(<NewSimpleLocationFieldRenderer {...defaultProps} required={true} />));
    expect(screen.queryByText(/optional/i)).not.toBeInTheDocument();
  });
});
