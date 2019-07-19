import React from 'react';
import 'jest-styled-components';

import { MockAddFundsSourcePicker, MockAddFundsSourcePickerForUser } from '../AddFundsSourcePicker';
import { snapshotI18n } from '../../test/snapshot-helpers';
import { mountWithIntl } from '../../test/intlHelper';

describe('AddFundsSourcePicker component', () => {
  const defaultProps = {
    collective: {},
    data: {},
    host: {},
    onChange: () => {},
    paymentMethod: {},
  };

  it('renders default options', () => {
    snapshotI18n(<MockAddFundsSourcePicker {...defaultProps} />);
  });

  it('renders loading state', () => {
    const props = {
      ...defaultProps,
      data: {
        loading: true,
      },
    };
    snapshotI18n(<MockAddFundsSourcePicker {...props} />);
  });

  it('renders host name as first option', () => {
    const props = {
      ...defaultProps,
      host: {
        id: 'example-id',
        name: 'Example Host',
      },
    };

    snapshotI18n(<MockAddFundsSourcePicker {...props} />);
  });

  it('renders fromCollectives by type in optgroup', () => {
    const props = {
      ...defaultProps,
      data: {
        PaymentMethod: {
          fromCollectives: {
            collectives: [
              {
                id: 'collective-id',
                name: 'Example Collective',
                type: 'COLLECTIVE',
              },
              {
                id: 'organization-id',
                name: 'Example Organzation',
                type: 'ORGANIZATION',
              },
              {
                id: 'user-id',
                name: 'Example Person',
                type: 'USER',
              },
            ],
          },
        },
      },
    };

    snapshotI18n(<MockAddFundsSourcePicker {...props} />);
  });

  it('calls onChange prop function when selection changes', () => {
    const onChange = jest.fn();
    const props = {
      ...defaultProps,
      onChange,
    };

    const component = mountWithIntl(<MockAddFundsSourcePicker {...props} />);

    component.find('select').simulate('change', { target: { value: 'test' } });

    expect(onChange).toHaveBeenCalledWith('test');
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
    snapshotI18n(<MockAddFundsSourcePickerForUser {...defaultProps} />);
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

    snapshotI18n(<MockAddFundsSourcePickerForUser {...props} />);
  });
});
