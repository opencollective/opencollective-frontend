import React from 'react';
import Link from 'next/link';
import { IgnorableError } from '../../lib/errors';
import Page from '../../components/Page';
import { Flex } from '@rebass/grid';

class TestErrorsPage extends React.Component {
  static getInitialProps({ query }) {
    if (query.raiseError) {
      throw new Error('Error in getInitialProps');
    }
  }

  state = {
    raiseError: false,
  };

  componentDidUpdate() {
    if (this.state.raiseErrorInUpdate) {
      throw new Error('Error in componentDidUpdate');
    }
  }

  raiseErrorInUpdate = () => this.setState({ raiseErrorInUpdate: '1' });
  raiseErrorInRender = () => this.setState({ raiseErrorInRender: '1' });

  render() {
    if (this.state.raiseErrorInRender) {
      throw new Error('Error in render');
    }

    return (
      <Page noRobots>
        <Flex py={5} justifyContent="center">
          <ul>
            <li>
              <a
                href="#"
                onClick={() => {
                  throw new Error('Click Error');
                }}
              >
                Raise error
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={() => {
                  throw new IgnorableError('Click Error');
                }}
              >
                Raise ignorable error
              </a>
            </li>
            <li>
              <a href="#" onClick={this.raiseErrorInRender}>
                Raise the error in render
              </a>
            </li>
            <li>
              <a href="#" onClick={this.raiseErrorInUpdate}>
                Raise the error in componentDidUpdate
              </a>
            </li>
            <li>
              <Link href={{ query: { raiseError: '1' } }}>
                <a>Raise error in getInitialProps of client-loaded page</a>
              </Link>
            </li>
            <li>
              <a href="?raiseError=1">Raise error in getInitialProps of server-loaded page</a>
            </li>
          </ul>
        </Flex>
      </Page>
    );
  }
}

export default TestErrorsPage;
