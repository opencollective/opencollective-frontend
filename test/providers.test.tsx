import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormattedMessage } from 'react-intl';

import { withRequiredProviders } from './providers';

describe('withRequiredProviders', () => {
  it('provides the messages of the requested locale', () => {
    render(
      withRequiredProviders(<FormattedMessage id="Expenses" defaultMessage="Expenses" />, {
        IntlProvider: { locale: 'fr' },
      }),
    );

    expect(screen.getByText('Dépenses')).toBeInTheDocument();
  });
});
