import React from 'react';
import { render, screen } from '@testing-library/react';

import { withRequiredProviders } from '../../test/providers';

import OrderPaymentMethod from './OrderPaymentMethod';

const renderPaymentMethod = (order: React.ComponentProps<typeof OrderPaymentMethod>['order']) =>
  render(withRequiredProviders(<OrderPaymentMethod order={order} />));

describe('OrderPaymentMethod', () => {
  it('shows the payment method type when available', () => {
    renderPaymentMethod({ paymentMethod: { type: 'CREDITCARD' } });
    expect(screen.getByText('Credit Card')).toBeInTheDocument();
    expect(screen.queryByText('Unknown')).not.toBeInTheDocument();
  });

  it('shows the manual payment provider name for manual contributions', () => {
    renderPaymentMethod({ paymentMethod: null, manualPaymentProvider: { name: 'Wire to our bank account' } });
    expect(screen.getByText('Wire to our bank account')).toBeInTheDocument();
  });

  it('shows the payment method from the pending contribution data', () => {
    renderPaymentMethod({ paymentMethod: null, pendingContributionData: { paymentMethod: 'BANK_TRANSFER' } });
    expect(screen.getByText('Manual (Bank Transfer)')).toBeInTheDocument();
  });

  it('shows "Unknown" when the payment method is not available (e.g. removed by its owner)', () => {
    renderPaymentMethod({ paymentMethod: null, manualPaymentProvider: null, pendingContributionData: null });
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.queryByText(/Bank Transfer/i)).not.toBeInTheDocument();
  });
});
