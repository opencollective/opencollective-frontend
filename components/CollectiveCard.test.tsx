import '@testing-library/jest-dom';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from 'styled-components';

import theme from '../lib/theme';

import CollectiveCard from './CollectiveCard';

const collective = {
  id: 1,
  type: 'COLLECTIVE',
  slug: 'test-collective',
  name: 'Test Collective',
  currency: 'USD',
  description: 'A collective',
  imageUrl: '',
  backgroundImage: '',
  stats: { backersCount: 0, yearlyBudget: 0 },
};

const renderCard = memberships =>
  render(
    <IntlProvider locale="en" messages={{}}>
      <ThemeProvider theme={theme}>
        <CollectiveCard collective={collective} memberships={memberships} />
      </ThemeProvider>
    </IntlProvider>,
  );

describe('CollectiveCard', () => {
  it('shows the oldest membership date regardless of the input order', () => {
    renderCard([
      { id: '1', role: 'ADMIN', createdAt: '2020-05-01T00:00:00.000Z' },
      { id: '2', role: 'ADMIN', createdAt: '2019-01-15T00:00:00.000Z' },
    ]);

    expect(screen.getByText(/January 2019/)).toBeInTheDocument();
  });
});
