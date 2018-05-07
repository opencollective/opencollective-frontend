import React from 'react';
import {
  Col,
  ControlLabel,
  FormControl,
  FormGroup,
  Grid,
  Row,
} from 'react-bootstrap';
import Router from 'next/router';
import classNames from 'classnames';

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
        <style jsx>{`
          div :global(.results-row) {
            flex-wrap: wrap;
            justify-content: flex-start;
            margin: 0;
          }

          @media(max-width: 500px) {
            div :global(.results-row) {
              justify-content: center;
            }
          }

          .search-row {
            align-items: flex-end;
            display: flex;
            margin: 2rem 0;
          }

          div :global(.col) {
            display: flex;
            flex-grow: 1;
            justify-content: flex-start;
            margin: 2rem 1rem;
            max-width: 200px;
          }

          div :global(.search-input) {
            border: none;
            border-bottom: 2px solid ${colors.blue};
            border-radius: 0;
            box-shadow: none;
            display: block;
            font-family: lato;
            height: 3.4rem;
            padding: 0;
          }

          .center {
            padding: 2rem 0;
            text-align: center;
            width: 100%;
          }

          .pagination {
            margin: 2rem auto;
          }
        `}</style>
        <Header
          title="Search"
          className={loadingUserLogin ? 'loading' : ''}
          LoggedInUser={LoggedInUser}
          showSearch={false}
          />
        <Body>
          <Grid>
            <Row>
              <Col xs={12}>
                <form method="GET" onSubmit={this.refetch}>
                  <FormGroup controlId="search" bsSize="large">
                    <ControlLabel className="h1">Search Open Collective</ControlLabel>
                    <div className="search-row">
                      <FormControl type="search" name="q" placeholder="open source" className="search-input" defaultValue={term} />
                      <Button type="submit" className="blue" style={{ padding: '0 2rem' }}><span className="fa fa-search" /></Button>
                    </div>
                  </FormGroup>
                </form>
              </Col>
            </Row>
            <Row className="results-row">
              {loading && (
                <div className="center">
                  <LoadingGrid />
                </div>
              )}

              {showCollectives && collectives.map(collective => (
                <Col className="col" key={collective.slug}>
                  <CollectiveCard collective={collective} />
                </Col>
              ))}

              { /* TODO: add suggested collectives when the result is empty */ }
              {showCollectives && collectives.length === 0 && (
                <p className="center"><em>No collectives found matching your query: &quot;{term}&quot;</em></p>
              )}
            </Row>
            {showCollectives && collectives.length !== 0 && <Row>
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
            </Row>}
          </Grid>
        </Body>
        <Footer />
      </div>
    )
  }
}

export { SearchPage as MockSearchPage };

export default withData(addGetLoggedInUserFunction(addSearchQueryData(withIntl(SearchPage))));
