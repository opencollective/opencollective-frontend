import 'jest-styled-components';

import React from 'react';
import { shallow } from 'enzyme';
import Router from 'next/router';

import { MockSearchPage } from '../pages/search';

describe('Search Page', () => {
  const props = {
    data: {},
    getLoggedInUser: () => Promise.resolve({}),
  };

  it('calls Router.push on form submission', () => {
    Router.push = jest.fn();

    const submitProps = {
      ...props,
      router: {
        pathname: '/search',
        push: Router.push,
      },
    };
    const event = {
      preventDefault: jest.fn(),
      target: {
        q: {
          value: 'test',
        },
      },
    };

    const wrapper = shallow(<MockSearchPage {...submitProps} />);
    wrapper.find('form').simulate('submit', event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(Router.push).toHaveBeenCalledWith({
      pathname: '/search',
      query: {
        q: 'test',
      },
    });
  });
});
