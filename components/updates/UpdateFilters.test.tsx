import '@testing-library/jest-dom';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from 'styled-components';

import theme from '../../lib/theme';

import UpdateFilters from './UpdateFilters';

const renderFilters = (values = {}) =>
  render(
    <IntlProvider locale="en" messages={{}}>
      <ThemeProvider theme={theme}>
        <UpdateFilters values={values} onChange={() => undefined} />
      </ThemeProvider>
    </IntlProvider>,
  );

describe('UpdateFilters', () => {
  it('shows the current search term in the search filter', () => {
    renderFilters({ searchTerm: 'climate' });

    expect(screen.getByDisplayValue('climate')).toBeInTheDocument();
  });

  it('does not show a search term when none is set', () => {
    renderFilters({});

    expect(screen.queryByDisplayValue('climate')).not.toBeInTheDocument();
  });
});
