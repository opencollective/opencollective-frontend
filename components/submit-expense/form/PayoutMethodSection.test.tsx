import '@testing-library/jest-dom';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormikContext } from 'formik';

import { withRequiredProviders } from '../../../test/providers';

import { PayoutMethodFormContent } from './PayoutMethodSection';

jest.mock('@/lib/hooks/useLoggedInUser', () => ({
  __esModule: true,
  default: () => ({ LoggedInUser: { isAdminOfCollective: () => true } }),
}));

// The payee as the form query returns it for a vendor without a saved payout method
const vendor = { id: 'v1', slug: 'vendor', name: 'Vendor', type: 'VENDOR', hasPayoutMethod: false, payoutMethods: [] };

function renderForVendor({ isHostAdmin }: { isHostAdmin: boolean }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form: any = {
    initialLoading: false,
    isSubmitting: false,
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    actions: {},
    values: { payeeSlug: 'vendor', payoutMethodId: null, expenseTypeOption: 'INVOICE', newPayoutMethod: { data: {} } },
    startOptions: {},
    options: {
      payee: vendor,
      payoutMethods: [],
      newPayoutMethodTypes: ['BANK_ACCOUNT', 'OTHER'],
      recentlySubmittedExpenses: { nodes: [] },
      isHostAdmin,
      isAdminOfPayee: false,
      account: { id: 'acc', slug: 'acc' },
      host: { id: 'host', slug: 'host', name: 'The Host' },
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
        <PayoutMethodFormContent {...PayoutMethodFormContent.getFormProps(form)} />
      </FormikContext.Provider>,
    ),
  );
}

describe('PayoutMethodFormContent for a vendor without a saved payout method', () => {
  it('asks host admins to save the payout method before submitting', () => {
    renderForVendor({ isHostAdmin: true });
    expect(screen.getByText(/doesn't have a saved payout method/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /New payout method/ })).toBeInTheDocument();
  });

  it('tells other submitters to contact the host', () => {
    renderForVendor({ isHostAdmin: false });
    expect(screen.getByText(/please contact The Host/)).toBeInTheDocument();
    expect(screen.queryByText(/doesn't have a saved payout method/)).not.toBeInTheDocument();
  });
});
