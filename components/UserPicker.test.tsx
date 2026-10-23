import '@testing-library/jest-dom';

import React from 'react';
import { useQuery } from '@apollo/client';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { withRequiredProviders } from '../test/providers';

import { UserPicker } from './UserPicker';

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useQuery: jest.fn(),
}));

const user = { id: 'user_pub_1', name: 'Ada Lovelace', slug: 'ada', type: 'INDIVIDUAL', imageUrl: null };

const renderPicker = (props = {}) => {
  const onSelect = jest.fn();
  render(withRequiredProviders(<UserPicker onSelect={onSelect} {...props} />));
  return { onSelect };
};

const openPicker = () => {
  fireEvent.click(screen.getByRole('combobox', { name: /search or invite a user/i }));
};

const typeSearch = value => {
  fireEvent.change(screen.getByPlaceholderText(/search by name, slug or email/i), { target: { value } });
};

describe('UserPicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useQuery as jest.Mock).mockImplementation((query, options) =>
      options?.skip ? { data: undefined, loading: false } : { data: { accounts: { nodes: [user] } }, loading: false },
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns an existing user selection', async () => {
    jest.useFakeTimers();
    const { onSelect } = renderPicker();
    openPicker();
    typeSearch('ada');
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    fireEvent.click(screen.getByRole('option', { name: /ada lovelace/i }));

    expect(onSelect).toHaveBeenCalledWith({ memberAccount: user });
  });

  it('returns an email invite when pressing Enter and no user is found', async () => {
    jest.useFakeTimers();
    (useQuery as jest.Mock).mockImplementation((query, options) =>
      options?.skip ? { data: undefined, loading: false } : { data: { accounts: { nodes: [] } }, loading: false },
    );

    const { onSelect } = renderPicker();
    openPicker();
    const searchInput = screen.getByPlaceholderText(/search by name, slug or email/i);
    fireEvent.change(searchInput, { target: { value: 'new.person@example.com' } });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(screen.getByText(/invite by email: new.person@example.com/i)).toBeInTheDocument();
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith({ memberInfo: { email: 'new.person@example.com' } });
  });
});
