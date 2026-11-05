import '@testing-library/jest-dom';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from 'styled-components';

import theme from '../lib/theme';

import InputTypeCountry from './InputTypeCountry';

const renderInput = props =>
  render(
    <IntlProvider locale="en" messages={{}}>
      <ThemeProvider theme={theme}>
        <InputTypeCountry name="country" onChange={() => undefined} {...props} />
      </ThemeProvider>
    </IntlProvider>,
  );

describe('InputTypeCountry', () => {
  it('preselects the default value', () => {
    renderInput({ defaultValue: 'FR' });

    expect(screen.getByText('France')).toBeInTheDocument();
  });
});
