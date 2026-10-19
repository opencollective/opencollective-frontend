import React from 'react';
import { render, screen } from '@testing-library/react';
import { createIntl } from 'react-intl';

import { i18nSearchCount } from '@/lib/i18n/search';
import { withRequiredProviders } from '../test/providers';

import Tabs from './Tabs';

describe('i18nSearchCount', () => {
  const intl = createIntl({ locale: 'en' });

  it('shows capped totals as a lower bound', () => {
    expect(i18nSearchCount(intl, 10000, true)).toBe('10,000+');
  });

  it('shows the exact total otherwise', () => {
    expect(i18nSearchCount(intl, 10000, false)).toBe('10,000');
    expect(i18nSearchCount(intl, 1234)).toBe('1,234');
  });
});

describe('Tabs', () => {
  it('shows capped counts as "10,000+" and other counts as before', () => {
    render(
      withRequiredProviders(
        <Tabs
          tabs={[
            { id: 'orders', label: 'Contributions', count: 10000, isCountCapped: true },
            { id: 'expenses', label: 'Expenses', count: 10000, isCountCapped: false },
            { id: 'accounts', label: 'Accounts', count: 42 },
          ]}
        />,
      ),
    );

    expect(screen.getByRole('button', { name: /Contributions/ })).toHaveTextContent('Contributions 10,000+');
    expect(screen.getByRole('button', { name: /Expenses/ })).toHaveTextContent('Expenses 10.0K');
    expect(screen.getByRole('button', { name: /Accounts/ })).toHaveTextContent('Accounts 42');
  });
});
