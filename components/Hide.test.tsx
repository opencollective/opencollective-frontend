import '@testing-library/jest-dom';

import React from 'react';
import { render, screen } from '@testing-library/react';

import Hide from './Hide';

describe('Hide', () => {
  it('applies the position prop', () => {
    render(
      <Hide position="relative" data-testid="hide">
        content
      </Hide>,
    );

    expect(screen.getByTestId('hide')).toHaveStyle({ position: 'relative' });
  });
});
