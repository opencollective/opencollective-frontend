import '@testing-library/jest-dom';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormikContext } from 'formik';

import { withRequiredProviders } from '../../../test/providers';

import { WhoIsGettingPaidForm } from './WhoIsGettingPaidSection';

jest.mock('@/lib/hooks/useLoggedInUser', () => ({
  __esModule: true,
  default: () => ({ LoggedInUser: { isAdminOfCollective: () => true } }),
}));
jest.mock('@/components/vendors/useQuickCreateVendor', () => ({
  useQuickCreateVendor: () => ({ createVendorFromSearch: jest.fn(), isCreatingVendor: false }),
}));
jest.mock('../../CollectivePickerAsync', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => <div data-testid="vendor-picker">{props.collective?.slug ?? 'none'}</div>,
}));
jest.mock('../../CollectivePicker', () => ({ __esModule: true, default: () => null }));

const me = { id: 'me', slug: 'me', name: 'Me', type: 'INDIVIDUAL', legalName: 'Me' };
const preloaded = [1, 2, 3, 4, 5].map(i => ({ id: `v${i}`, slug: `vendor-${i}`, name: `Vendor ${i}`, type: 'VENDOR' }));
const sixthVendor = { id: 'v6', slug: 'vendor-6', name: 'Vendor 6', type: 'VENDOR', legalName: 'Vendor 6' };

function renderWithPayee(payee, vendorsForAccount) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form: any = {
    initialLoading: false,
    isSubmitting: false,
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    actions: {},
    values: { payeeSlug: payee.slug, expenseTypeOption: 'INVOICE' },
    options: {
      payoutProfiles: [me],
      recentlySubmittedExpenses: { nodes: [] },
      payee,
      allowInvite: false,
      lockedFields: [],
      showVendorsOption: true,
      vendorsForAccount,
      account: { id: 'acc', legacyId: 1, slug: 'acc' },
      host: { id: 'host', legacyId: 2, slug: 'host' },
    },
    registerField: jest.fn(),
    unregisterField: jest.fn(),
    getFieldMeta: () => ({}),
    getFieldProps: () => ({}),
    getFieldHelpers: () => ({}),
    errors: {},
    touched: {},
  };
  render(
    withRequiredProviders(
      <FormikContext.Provider value={form}>
        <WhoIsGettingPaidForm {...WhoIsGettingPaidForm.getFormProps(form)} />
      </FormikContext.Provider>,
    ),
  );
}

describe('WhoIsGettingPaidForm vendor payee', () => {
  it('checks the vendor option for a preloaded vendor', () => {
    renderWithPayee(preloaded[0], preloaded);
    expect(screen.getByRole('radio', { name: /A vendor/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('vendor-picker')).toHaveTextContent('vendor-1');
  });

  it('checks the vendor option and shows the picker for a vendor payee outside the 5 preloaded vendors', () => {
    renderWithPayee(sixthVendor, preloaded);
    expect(screen.getByRole('radio', { name: /A vendor/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('vendor-picker')).toHaveTextContent('vendor-6');
  });
});
