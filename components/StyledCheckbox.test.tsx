import '@testing-library/jest-dom';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import theme from '../lib/theme';

import StyledCheckbox from './StyledCheckbox';

const renderCheckbox = props =>
  render(
    <ThemeProvider theme={theme}>
      <StyledCheckbox name="tos" label="I agree" {...props} />
    </ThemeProvider>,
  );

describe('StyledCheckbox', () => {
  it('forwards `required` to the native input', () => {
    renderCheckbox({ required: true });

    expect(screen.getByRole('checkbox')).toBeRequired();
  });

  it('does not require the input by default', () => {
    renderCheckbox({});

    expect(screen.getByRole('checkbox')).not.toBeRequired();
  });
});
