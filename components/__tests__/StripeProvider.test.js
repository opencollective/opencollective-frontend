import React from 'react';
import { act, render, screen } from '@testing-library/react';

import { getStripe } from '../../lib/stripe';

import StripeProvider, { useStripeLoader } from '../StripeProvider';

jest.mock('../../lib/stripe', () => ({ getStripe: jest.fn(() => Promise.resolve({ id: 'stripe-instance' })) }));
jest.mock('@stripe/react-stripe-js', () => ({ Elements: ({ children }) => children }));

let loader;
const LoaderConsumer = () => {
  loader = useStripeLoader();
  // StripeProvider leaves `isStripeLoaded` undefined until Stripe gets loaded
  return <div data-testid="is-stripe-loaded">{String(Boolean(loader.isStripeLoaded))}</div>;
};

describe('useStripeLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loader = null;
  });

  it('returns a no-op loader outside of StripeProvider', () => {
    render(<LoaderConsumer />);
    expect(loader.isStripeLoaded).toBe(false);
    expect(() => loader.loadStripe()).not.toThrow();
    expect(getStripe).not.toHaveBeenCalled();
  });

  it('returns the StripeProvider loader, and updates once Stripe is loaded', async () => {
    render(
      <StripeProvider token="pk_test">
        <LoaderConsumer />
      </StripeProvider>,
    );

    expect(screen.getByTestId('is-stripe-loaded')).toHaveTextContent('false');
    await act(async () => {
      await loader.loadStripe();
    });

    expect(getStripe).toHaveBeenCalledWith('pk_test');
    expect(screen.getByTestId('is-stripe-loaded')).toHaveTextContent('true');

    // Loading again is a no-op
    await act(async () => {
      await loader.loadStripe();
    });
    expect(getStripe).toHaveBeenCalledTimes(1);
  });
});
