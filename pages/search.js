import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { Search } from '@styled-icons/octicons/Search';
import { withRouter } from 'next/router';
import { ControlLabel, FormControl, FormGroup } from 'react-bootstrap';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import colors from '../lib/constants/colors';
import { Link, Router } from '../server/pages';

import Button from '../components/Button';
import CollectiveCard from '../components/CollectiveCard';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import { Box, Flex } from '../components/Grid';
import LoadingGrid from '../components/LoadingGrid';
import Page from '../components/Page';
import Pagination from '../components/Pagination';
import StyledFilters from '../components/StyledFilters';
import StyledLink from '../components/StyledLink';
import { P } from '../components/Text';

const SearchInput = styled(FormControl)`
  &&& {
    border: none;
    border-bottom: 2px solid ${colors.blue};
    border-radius: 0;
    box-shadow: none;
    display: block;
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

const FILTERS = {
  ALL: 'ALL',
  COLLECTIVE: 'COLLECTIVE',
  EVENT: 'EVENT',
  ORGANIZATION: 'ORGANIZATION',
  HOST: 'HOST',
};

const I18nFilters = defineMessages({
  [FILTERS.ALL]: {
    id: 'searchFilter.all',
    defaultMessage: 'View all',
  },
  [FILTERS.COLLECTIVE]: {
    id: 'CollectiveType.Collective',
    defaultMessage: '{count, plural, one {Collective} other {Collectives}}',
  },
  [FILTERS.EVENT]: {
    id: 'CollectiveType.Event',
    defaultMessage: '{count, plural, one {Event} other {Events}}',
  },
  [FILTERS.ORGANIZATION]: {
    id: 'CollectiveType.Organization',
    defaultMessage: '{count, plural, one {Organization} other {Organizations}}',
  },
  [FILTERS.HOST]: {
    id: 'searchFilter.host',
    defaultMessage: 'Fiscal hosts',
  },
});

const DEFAULT_SEARCH_TYPES = ['COLLECTIVE', 'EVENT', 'ORGANIZATION', 'FUND', 'PROJECT'];

class SearchPage extends React.Component {
  static getInitialProps({ query }) {
    return {
      term: query.q || '',
      types: query.types,
      isHost: Boolean(query.isHost),
      limit: Number(query.limit) || 20,
      offset: Number(query.offset) || 0,
    };
  }

  static propTypes = {
    term: PropTypes.string, // for addSearchQueryData
    limit: PropTypes.number, // for addSearchQueryData
    offset: PropTypes.number, // for addSearchQueryData
    router: PropTypes.object, // from next.js
    data: PropTypes.object.isRequired, // from withData
    intl: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.state = { filter: 'ALL' };
  }

  refetch = event => {
    event.preventDefault();

    const { target: form } = event;
    const { router } = this.props;
    const { q } = form;

    router.push({ pathname: router.pathname, query: { q: q.value } });
  };

  onClick = filter => {
    const { term } = this.props;

    if (filter === 'HOST') {
      Router.pushRoute('search', { q: term, isHost: true });
    } else if (filter !== 'ALL') {
      Router.pushRoute('search', { q: term, types: filter });
    } else {
      Router.pushRoute('search', { q: term, types: DEFAULT_SEARCH_TYPES });
    }
  };

  changePage = offset => {
    const { router } = this.props;
    Router.pushRoute('search', { ...router.query, offset });
  };

  render() {
    const {
      data: { error, loading, search },
      term = '',
      intl,
    } = this.props;

    if (error) {
      return <ErrorPage data={this.props.data} />;
    }

    const filters = ['ALL', 'COLLECTIVE', 'EVENT', 'ORGANIZATION', 'HOST'];
    const { collectives, limit = 20, offset, total = 0 } = search || {};
    const showCollectives = term.trim() !== '' && !!collectives;

    return (
      <Page title="Search" showSearch={false}>
        <Container mx="auto" px={3} py={4} width={[1, 0.85]} maxWidth={1200}>
          <Box width={1}>
            <form method="GET" onSubmit={this.refetch}>
              <FormGroup controlId="search" bsSize="large">
                <ControlLabel className="h1">
                  <FormattedMessage id="search.OpenCollective" defaultMessage="Search Open Collective..." />
                </ControlLabel>
                <Flex alignItems="flex-end" my={3}>
                  <SearchInput type="search" name="q" placeholder="open source" defaultValue={term} />
                  <SearchButton type="submit">
                    <Search size="1em" />
                  </SearchButton>
                </Flex>
              </FormGroup>
            </form>
          </Box>
          <Box mt={4} mb={4} mx="auto">
            <StyledFilters
              filters={filters}
              getLabel={key => intl.formatMessage(I18nFilters[key], { count: 10 })}
              selected={this.state.filter}
              justifyContent="left"
              minButtonWidth={150}
              onChange={filter => {
                this.setState({ filter: filter });
                this.onClick(filter);
              }}
            />
          </Box>
          <Flex justifyContent={['center', 'center', 'flex-start']} flexWrap="wrap">
            {loading && !collectives && (
              <Flex py={3} width={1} justifyContent="center">
                <LoadingGrid />
              </Flex>
            )}
            {showCollectives &&
              collectives.map(collective => (
                <Flex key={collective.slug} my={3} mx={2}>
                  <CollectiveCard collective={collective} />
                </Flex>
              ))}

            {/* TODO: add suggested collectives when the result is empty */}
            {showCollectives && collectives.length === 0 && (
              <Flex py={3} width={1} justifyContent="center" flexDirection="column" alignItems="center">
                <P my={4}>
                  <em>
                    <FormattedMessage
                      id="search.noResult"
                      defaultMessage='No collectives found matching your query: "{query}"'
                      values={{ query: term }}
                    />
                  </em>
                </P>
                {
                  <Link route="createPledge" params={{ name: term }} passHref>
                    <StyledLink
                      display="block"
                      fontSize="14px"
                      fontWeight="bold"
                      maxWidth="220px"
                      py={2}
                      px={4}
                      textAlign="center"
                      buttonStyle="primary"
                    >
                      <FormattedMessage id="menu.createPledge" defaultMessage="Make a Pledge" />
                    </StyledLink>
                  </Link>
                }
              </Flex>
            )}
          </Flex>
          {showCollectives && collectives.length !== 0 && total > limit && (
            <Container display="flex" justifyContent="center" fontSize="14px" my={3}>
              <Pagination offset={offset} total={total} limit={limit} />
            </Container>
          )}

          {showCollectives && collectives.length !== 0 && (
            <Flex py={3} width={1} justifyContent="center" flexDirection="column" alignItems="center">
              <P pt={3} pb={3} borderTop="1px solid #E6E6E6">
                <em>
                  <FormattedMessage
                    id="search.ifYouDontSee"
                    defaultMessage="If you don't see the collective you're looking for:"
                  />
                </em>
              </P>
              {
                <Link route="createPledge" params={{ name: term }} passHref>
                  <StyledLink
                    display="block"
                    fontSize="14px"
                    fontWeight="bold"
                    maxWidth="220px"
                    py={2}
                    px={4}
                    textAlign="center"
                    buttonStyle="primary"
                  >
                    <FormattedMessage id="menu.createPledge" defaultMessage="Make a Pledge" />
                  </StyledLink>
                </Link>
              }
            </Flex>
          )}
        </Container>
      </Page>
    );
  }
}

export { SearchPage as MockSearchPage };

export const searchPageQuery = gql`
  query SearchPage($term: String!, $types: [TypeOfCollective], $isHost: Boolean, $limit: Int, $offset: Int) {
    search(term: $term, types: $types, isHost: $isHost, limit: $limit, offset: $offset, onlyActive: true) {
      collectives {
        id
        isActive
        type
        slug
        path
        name
        company
        imageUrl
        backgroundImage
        description
        longDescription
        website
        currency
        stats {
          id
          balance
          totalAmountSpent
          yearlyBudget
          backers {
            all
          }
        }
        parentCollective {
          id
          slug
        }
        memberOf(role: "BACKER") {
          id
        }
      }
      limit
      offset
      total
    }
  }
`;

export const addSearchPageData = graphql(searchPageQuery);

export default injectIntl(withRouter(addSearchPageData(SearchPage)));
