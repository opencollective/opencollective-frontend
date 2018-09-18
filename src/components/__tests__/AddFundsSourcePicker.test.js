import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';
import 'jest-styled-components';

import {
  MockAddFundsSourcePicker,
  MockAddFundsSourcePickerForUser,
} from '../AddFundsSourcePicker';

describe('AddFundsSourcePicker component', () => {
  const defaultProps = {
    collective: {},
    data: {},
    host: {},
    onChange: () => {},
    paymentMethod: {},
  };

  it('renders default options', () => {
    const tree = renderer
      .create(<MockAddFundsSourcePicker {...defaultProps} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders loading state', () => {
    const props = {
      ...defaultProps,
      data: {
        loading: true,
      },
    };
    const tree = renderer
      .create(<MockAddFundsSourcePicker {...props} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders host name as first option', () => {
    const props = {
      ...defaultProps,
      host: {
        id: 'example-id',
        name: 'Example Host',
      },
    };

    const tree = renderer
      .create(<MockAddFundsSourcePicker {...props} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
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

    const tree = renderer
      .create(<MockAddFundsSourcePicker {...props} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('calls onChange prop function when selection changes', () => {
    const onChange = jest.fn();
    const props = {
      ...defaultProps,
      onChange,
    };

    const component = mount(<MockAddFundsSourcePicker {...props} />);

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
    const tree = renderer
      .create(<MockAddFundsSourcePickerForUser {...defaultProps} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
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

    const tree = renderer
      .create(<MockAddFundsSourcePickerForUser {...props} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
