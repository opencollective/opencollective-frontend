import 'jest-styled-components';

import React from 'react';
import { ThemeProvider } from 'styled-components';

import theme from '../../lib/theme';
import { snapshot } from '../../test/snapshot-helpers';

import { MockAddFundsSourcePicker, MockAddFundsSourcePickerForUser } from '../AddFundsSourcePicker';

describe('AddFundsSourcePicker component', () => {
  const defaultProps = {
    collective: {},
    data: {},
    host: {},
    onChange: () => {},
    paymentMethod: {},
  };

  it('renders default options', () => {
    snapshot(
      <ThemeProvider theme={theme}>
        <MockAddFundsSourcePicker {...defaultProps} />
      </ThemeProvider>,
    );
  });

  it('renders loading state', () => {
    const props = {
      ...defaultProps,
      data: {
        loading: true,
      },
    };
    snapshot(
      <ThemeProvider theme={theme}>
        <MockAddFundsSourcePicker {...props} />
      </ThemeProvider>,
    );
  });

  it('renders host name as first option', () => {
    const props = {
      ...defaultProps,
      host: {
        id: 'example-id',
        name: 'Example Host',
      },
    };

    snapshot(
      <ThemeProvider theme={theme}>
        <MockAddFundsSourcePicker {...props} />
      </ThemeProvider>,
    );
  });

  it('renders fromCollectives by type in optgroup', () => {
    const props = {
      ...defaultProps,
      data: {
        PaymentMethod: {
          fromCollectives: {
            collectives: [
              {
                id: 13337,
                name: 'Example Collective',
                type: 'COLLECTIVE',
              },
              {
                id: 13338,
                name: 'Example Organzation',
                type: 'ORGANIZATION',
              },
              {
                id: 13339,
                name: 'Example Person',
                type: 'USER',
              },
            ],
          },
        },
      },
    };

    snapshot(
      <ThemeProvider theme={theme}>
        <MockAddFundsSourcePicker {...props} />
      </ThemeProvider>,
    );
  });
});

describe('AddFundsSourcePickerForUser component', () => {
  const defaultProps = {
    LoggedInUser: {
      hostsUserIsAdminOf: () => [],
    },
    onChange: () => {},
  };

  it('renders default options', () => {
    snapshot(
      <ThemeProvider theme={theme}>
        <MockAddFundsSourcePickerForUser {...defaultProps} />
      </ThemeProvider>,
    );
  });

  it('render host options', () => {
    const props = {
      ...defaultProps,
      LoggedInUser: {
        hostsUserIsAdminOf: () => [
          {
            id: 'host-id',
            name: 'Example Host',
          },
        ],
      },
    };

    snapshot(
      <ThemeProvider theme={theme}>
        <MockAddFundsSourcePickerForUser {...props} />
      </ThemeProvider>,
    );
  });
});
