import React from 'react';
import renderer from 'react-test-renderer';
import { shallow } from 'enzyme';
import 'jest-styled-components';

import Router from 'next/router';
import { withMockRouterContext } from '../../../test/mocks/withMockRouter';

import { MockSearchPage } from '../search';

describe('Search Page', () => {
  const props = {
    data: {},
    getLoggedInUser: () => Promise.resolve({}),
  };

  const MockRouter = withMockRouterContext({});

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

  it('renders "Make pledge" button with empty results', () => {
    const emptyResultsProps = {
      ...props,
      data: {
        search: {
          collectives: [],
        },
      },
      term: 'test',
      usePledges: true,
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
          collectives: [
            {
              slug: 'test-collective',
            },
          ],
          limit: 20,
          offset: 0,
          total: 100,
        },
      },
      term: 'Test',
    };

    const tree = renderer
      .create(
        <MockRouter>
          <MockSearchPage {...resultsProps} />
        </MockRouter>,
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

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
