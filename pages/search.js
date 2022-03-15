import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { Search } from '@styled-icons/octicons/Search';
import { isNil } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { parseToBoolean } from '../lib/utils';

import CollectiveCard from '../components/CollectiveCard';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import { Box, Flex } from '../components/Grid';
import { getI18nLink, I18nSupportLink } from '../components/I18nFormatters';
import Image from '../components/Image';
import Link from '../components/Link';
import LoadingGrid from '../components/LoadingGrid';
import Page from '../components/Page';
import Pagination from '../components/Pagination';
import StyledButton from '../components/StyledButton';
import StyledFilters from '../components/StyledFilters';
import StyledInput from '../components/StyledInput';
import StyledLink from '../components/StyledLink';
import { H1, P, Span } from '../components/Text';

const SearchInput = styled(StyledInput)`
  border: none;
  border-bottom: 2px solid ${props => props.theme.colors.primary[500]};
  border-radius: 0;
  box-shadow: none;
  display: block;
  height: 3.4rem;
  width: 100%;
  padding: 0 4px;
  font-size: 16px;
  margin-right: 8px;

  @media (min-width: 64em) {
    font-size: 18px;
  }

  &::placeholder {
    color: #999;
    opacity: 1;
  }
`;

const SearchButton = styled(StyledButton).attrs({
  buttonStyle: 'primary',
  buttonSize: 'small',
})`
  && {
    padding: 0.5rem 2rem;
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
      types: query.types ? decodeURIComponent(query.types).split(',') : DEFAULT_SEARCH_TYPES,
      isHost: isNil(query.isHost) ? undefined : parseToBoolean(query.isHost),
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

    router.push({ pathname: router.pathname, query: { q: q.value, types: router.query.types } });
  };

  onClick = filter => {
    const { term } = this.props;

    if (filter === 'HOST') {
      this.props.router.push({ pathname: '/search', query: { q: term, isHost: true } });
    } else if (filter !== 'ALL') {
      this.props.router.push({ pathname: '/search', query: { q: term, types: filter } });
    } else {
      this.props.router.push({ pathname: '/search', query: { q: term } });
    }
  };

  changePage = offset => {
    const { router } = this.props;
    this.props.router.push({ pathname: '/search', query: { ...router.query, offset } });
  };

  render() {
    const { data, term = '', intl } = this.props;
    const { error, loading, search } = data || {};

    if (error) {
      return <ErrorPage data={this.props.data} />;
    }

    const filters = ['ALL', 'COLLECTIVE', 'EVENT', 'ORGANIZATION', 'HOST'];
    const { collectives, limit = 20, offset, total = 0 } = search || {};
    const showCollectives = term.trim() !== '' && !!collectives;

    return (
      <Page title="Search" showSearch={false}>
        <Container mx="auto" px={3} py={[4, 5]} width={[1, 0.85]} maxWidth={1200}>
          <Box width={1}>
            <form method="GET" onSubmit={this.refetch}>
              <H1 fontSize="36px" fontWeight="500">
                <FormattedMessage id="search.OpenCollective" defaultMessage="Search Open Collective..." />
              </H1>
              <Flex alignItems="flex-end" my={3}>
                <SearchInput type="search" name="q" placeholder="open source" defaultValue={term} />
                <SearchButton type="submit">
                  <Search size="1em" />
                </SearchButton>
              </Flex>
            </form>
          </Box>
          {term && (
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
          )}
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

            {showCollectives && collectives.length === 0 && (
              <Flex py={3} width={1} justifyContent="center" flexDirection="column" alignItems="center">
                <H1 fontSize="32px" lineHeight="40px" color="black.700" fontWeight={500}>
                  <FormattedMessage defaultMessage="No results match your search" />
                </H1>
                <Container py={32}>
                  <Image src="/static/images/empty-search.svg" alt="No Search Results" width={101.98} height={87.47} />
                </Container>
                <Container color="black.800" fontWeight={400}>
                  <Container fontSize="18px" lineHeight="26px" textAlign="center">
                    <FormattedMessage defaultMessage="Try refining your search, here are some tips:" />
                  </Container>
                  <Container fontSize="15px" lineHeight="22px">
                    <ul>
                      <li>
                        <FormattedMessage defaultMessage="Make sure your spelling is correct" />
                      </li>
                      <li>
                        <Span pt={8}>
                          <FormattedMessage defaultMessage="Broaden your search (e.g. search 'garden' instead of 'community garden')" />
                        </Span>
                      </li>
                      <li>
                        <Span pt={8}>
                          <FormattedMessage
                            defaultMessage="Search our <Link>Docs</Link> for more info about using the Open Collective platform"
                            values={{
                              Link: getI18nLink({
                                openInNewTab: true,
                                href: 'https://opencollective.com/help',
                              }),
                            }}
                          />
                        </Span>
                      </li>
                    </ul>
                  </Container>
                  <Container fontSize="18px" lineHeight="26px" pt={16}>
                    <FormattedMessage
                      defaultMessage="Still no luck? Contact <SupportLink></SupportLink> or find us in <SlackLink>Slack</SlackLink>"
                      values={{
                        SupportLink: I18nSupportLink,
                        SlackLink: getI18nLink({
                          openInNewTab: true,
                          href: 'https://slack.opencollective.com/',
                        }),
                      }}
                    />
                  </Container>
                </Container>
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
                <Link href={{ pathname: '/pledges/new', query: { name: term } }}>
                  <StyledLink
                    as={Container}
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
    search(term: $term, types: $types, isHost: $isHost, limit: $limit, offset: $offset, skipRecentAccounts: true) {
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

export const addSearchPageData = graphql(searchPageQuery, { skip: props => !props.term });

export default injectIntl(withRouter(addSearchPageData(SearchPage)));
