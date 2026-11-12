import React from 'react';
import { render, screen } from '@testing-library/react';

import { withRequiredProviders } from '../../../test/providers';

import { Pagination } from './Pagination';

const queryFilter = {
  values: { offset: 0, limit: 20 },
  defaultSchemaValues: { limit: 20 },
  setFilter: jest.fn(),
};

describe('Pagination', () => {
  it('offers the last page when the total is exact', () => {
    render(withRequiredProviders(<Pagination queryFilter={queryFilter} total={10000} />));

    expect(screen.getByRole('button', { name: '500' })).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 500')).toBeInTheDocument();
  });

  it('does not offer a last page when the total is a lower bound', () => {
    render(withRequiredProviders(<Pagination queryFilter={queryFilter} total={10000} isTotalCapped />));

    expect(screen.queryByRole('button', { name: '500' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 500+')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();
  });
});
