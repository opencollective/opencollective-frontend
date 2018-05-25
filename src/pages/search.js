import React from 'react';
import {
  ControlLabel,
  FormControl,
  FormGroup,
} from 'react-bootstrap';
import { Box, Flex } from 'grid-styled';
import Router from 'next/router';
import classNames from 'classnames';
import styled from 'styled-components';

import withData from '../lib/withData'
import withIntl from '../lib/withIntl';
import { addGetLoggedInUserFunction, addSearchQueryData } from '../graphql/queries';

import Body from '../components/Body';
import Button from '../components/Button';
import CollectiveCard from '../components/CollectiveCard';
import ErrorPage from '../components/ErrorPage';
import Footer from '../components/Footer';
import Header from '../components/Header';
import LoadingGrid from '../components/LoadingGrid';
import { Link } from '../server/pages';

import colors from '../constants/colors';

const SearchInput = styled(FormControl)`
  &&& {
    border: none;
    border-bottom: 2px solid ${colors.blue};
    border-radius: 0;
    box-shadow: none;
    display: block;
    font-family: lato;
    height: 3.4rem;
    padding: 0;
  }
`;

const SearchButton = styled(Button).attrs({
  className: 'blue',
})`
  && {
    padding: 0 2rem;
  }
`;

const Container = Box.extend`
  max-width: 1200px;
`;

class SearchPage extends React.Component {
  static getInitialProps({ query = {} }) {
    return {
      limit: query.limit || 20,
      offset: query.offset || 0,
      term: query.q || '',
    };
  }

  state = {
    loadingUserLogin: true,
    LoggedInUser: {},
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    try {
      const LoggedInUser = getLoggedInUser && await getLoggedInUser();
      this.setState({
        loadingUserLogin: false,
        LoggedInUser,
      });
    } catch (error) {
      this.setState({ loadingUserLogin: false });
    }
  }

  refetch = (event) => {
    event.preventDefault();

    const { target: form } = event;
    const { url } = this.props;
    const { q } = form;

    Router.push({ pathname: url.pathname, query: { q: q.value } });
  }

  render() {
    const { data: { error, loading, search }, term = '' } = this.props;
    const { loadingUserLogin, LoggedInUser } = this.state;

    const {
      collectives,
      limit = 20,
      offset,
      total = 0,
    } = search || {};

    if (error) {
      return <ErrorPage {...error} />;
    }

    const showCollectives = !loading && term.trim() !== "" && !!collectives;

    return (
      <div>
        <Header
          title="Search"
          className={loadingUserLogin ? 'loading' : ''}
          LoggedInUser={LoggedInUser}
          showSearch={false}
        />
        <Body>
          <Container mx="auto" px={3} w={[1, 0.85]}>
            <Box w={1}>
              <form method="GET" onSubmit={this.refetch}>
                <FormGroup controlId="search" bsSize="large">
                  <ControlLabel className="h1">Search Open Collective</ControlLabel>
                  <Flex alignItems="flex-end" my={3}>
                    <SearchInput type="search" name="q" placeholder="open source" defaultValue={term} />
                    <SearchButton type="submit"><span className="fa fa-search" /></SearchButton>
                  </Flex>
                </FormGroup>
              </form>
            </Box>
            <Flex justifyContent={['center', 'center', 'flex-start']} flexWrap="wrap">
              {loading && (
                <Flex py={3} w={1} justifyContent="center">
                  <LoadingGrid />
                </Flex>
              )}

              {showCollectives && collectives.map(collective => (
                <Flex key={collective.slug} my={3} mx={2}>
                  <CollectiveCard collective={collective} />
                </Flex>
              ))}

              { /* TODO: add suggested collectives when the result is empty */ }
              {showCollectives && collectives.length === 0 && (
                <Flex py={3} w={1} justifyContent="center">
                  <p><em>No collectives found matching your query: &quot;{term}&quot;</em></p>
                </Flex>
              )}
            </Flex>
            {showCollectives && collectives.length !== 0 && total > limit && <Flex justifyContent="center">
              <ul className="pagination">
                { Array(Math.ceil(total / limit)).fill(1).map((n, i) => (
                  <li key={i * limit} className={classNames({ active: (i * limit) === offset })}>
                    <Link
                      href={{
                        query: {
                          limit,
                          offset: i * limit,
                          q: term,
                        }
                      }}
                      >
                      <a>{`${n + i}`}</a>
                    </Link>
                  </li>
                )) }
              </ul>
            </Flex>}
          </Container>
        </Body>
        <Footer />
      </div>
    )
  }
}

export { SearchPage as MockSearchPage };

export default withData(addGetLoggedInUserFunction(addSearchQueryData(withIntl(SearchPage))));
