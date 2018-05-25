import React from 'react';
import renderer from 'react-test-renderer';
import { shallow } from 'enzyme'
import 'jest-styled-components';

import Router from 'next/router';

import { MockSearchPage } from '../search';

describe('Search Page', () => {
  const props = {
    data: {},
    getLoggedInUser: () => Promise.resolve({}),
  };

  it('renders loading grid SVG', () => {
    const loadingProps = {
      ...props,
      data: {
        loading: true,
      },
    };

    const tree = renderer.create(<MockSearchPage {...loadingProps} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders empty results message', () => {
    const emptyResultsProps = {
      ...props,
      data: {
        search: {
          collectives: [],
        },
      },
      term: 'test',
    };

    const tree = renderer.create(<MockSearchPage {...emptyResultsProps} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders error message', () => {
    const errorProps = {
      ...props,
      data: {
        error: {
          message: 'Test error',
        },
      },
    };

    const tree = renderer.create(<MockSearchPage {...errorProps} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders search results with pagination', () => {
    const resultsProps = {
      ...props,
      data: {
        search: {
          collectives: [{
            slug: 'test-collective',
          }],
          limit: 20,
          offset: 0,
          total: 100,
        },
      },
      term: 'Test',
    };

    const tree = renderer.create(<MockSearchPage {...resultsProps} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('calls Router.push on form submission', () => {
    Router.push = jest.fn();

    const submitProps = {
      ...props,
      url: {
        pathname: '/search',
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
