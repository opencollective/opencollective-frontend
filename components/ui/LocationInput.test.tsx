import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { withRequiredProviders } from '../../test/providers';

import { UserLocationInput } from './LocationInput';

type AddressFieldConfig = { name: string; label: string; required: boolean };

const mockGetAddressFormFields = jest.fn<
  { fields: AddressFieldConfig[]; optionalFields: string[] },
  [string, string?]
>();

jest.mock('../../lib/address', () => ({
  getAddressFormFields: (...args: [string, string?]) => mockGetAddressFormFields(...args),
}));

jest.mock('../InputCountry', () => {
  return function MockInputCountry({ value, onChange }) {
    return (
      <select data-cy="country-select" value={value || ''} onChange={e => onChange(e.target.value)}>
        <option value="">Select country</option>
        <option value="US">United States</option>
        <option value="FR">France</option>
      </select>
    );
  };
});

const getByDataCy = (cy: string) => {
  const element = document.querySelector(`[data-cy="${cy}"]`);
  if (!element) {
    throw new Error(`Unable to find an element with data-cy="${cy}"`);
  }
  return element as HTMLElement;
};

describe('UserLocationInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAddressFormFields.mockReturnValue({
      fields: [
        { name: 'address1', label: 'Address', required: true },
        { name: 'address2', label: 'Apartment, suite, etc.', required: false },
        { name: 'city', label: 'City', required: true },
        { name: 'postalCode', label: 'Postal Code', required: true },
      ],
      optionalFields: ['address2'],
    });
  });

  it('preserves structured address when country changes', () => {
    const onChange = jest.fn();
    const structured = {
      address1: 'test',
      city: 'test',
      postalCode: '13600',
    };

    render(
      withRequiredProviders(
        <UserLocationInput location={{ country: 'US', structured }} onChange={onChange} required={true} />,
      ),
    );

    onChange.mockClear();
    fireEvent.change(getByDataCy('country-select'), { target: { value: 'FR' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        country: 'FR',
        structured,
      }),
    );
  });

  it('does not show required errors for filled fields after country change', () => {
    const structured = {
      address1: 'test',
      city: 'test',
      postalCode: '13600',
    };

    const { rerender } = render(
      withRequiredProviders(
        <UserLocationInput location={{ country: 'US', structured }} onChange={jest.fn()} required={true} />,
      ),
    );

    fireEvent.change(getByDataCy('country-select'), { target: { value: 'FR' } });

    rerender(
      withRequiredProviders(
        <UserLocationInput location={{ country: 'FR', structured }} onChange={jest.fn()} required={true} />,
      ),
    );

    expect(screen.queryByText('Address is required')).not.toBeInTheDocument();
    expect(screen.queryByText('City is required')).not.toBeInTheDocument();
    expect(screen.queryByText('Postal Code is required')).not.toBeInTheDocument();
    expect(document.getElementById('address1')).toHaveValue('test');
    expect(document.getElementById('city')).toHaveValue('test');
    expect(document.getElementById('postalCode')).toHaveValue('13600');
  });
});
