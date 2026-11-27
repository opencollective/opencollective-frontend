import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import { PayoutMethodType } from '../../lib/graphql/types/v2/graphql';

import { PayoutMethodDetailsContainer } from './PayoutMethodDetails';

const renderPayoutMethod = (data: Record<string, unknown>) =>
  render(
    <IntlProvider locale="en">
      <PayoutMethodDetailsContainer payoutMethod={{ type: PayoutMethodType.BANK_ACCOUNT, data }} />
    </IntlProvider>,
  );

describe('PayoutMethodDetailsContainer', () => {
  it('renders bank details that contain an empty optional field', () => {
    renderPayoutMethod({ currency: 'EUR', type: 'iban', details: { IBAN: 'FR761234', bic: null } });
    expect(screen.getByText('FR761234')).toBeInTheDocument();
  });

  it('renders nested details that share a field name without duplicate keys', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    renderPayoutMethod({ currency: 'USD', type: 'aba', details: { city: 'Paris', address: { city: 'Lyon' } } });
    const duplicateKeyErrors = errorSpy.mock.calls.filter(args => String(args[0]).includes('same key'));
    errorSpy.mockRestore();
    expect(duplicateKeyErrors).toEqual([]);
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('Lyon')).toBeInTheDocument();
  });
});
