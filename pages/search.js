import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { isNil } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl, useIntl } from 'react-intl';
import styled from 'styled-components';

import expenseTypes from '../lib/constants/expenseTypes';
import { i18nExpenseType } from '../lib/i18n/expense';
import { parseToBoolean } from '../lib/utils';

import Container from '../components/Container';
import PledgedCollectiveCard from '../components/discover/PledgedCollectiveCard';
import ErrorPage from '../components/ErrorPage';
import { Box, Flex } from '../components/Grid';
import InputTypeCountry from '../components/InputTypeCountry';
import Link from '../components/Link';
import LoadingGrid from '../components/LoadingGrid';
import Page from '../components/Page';
import Pagination from '../components/Pagination';
import SearchCollectiveCard from '../components/search-page/SearchCollectiveCard';
import SearchForm from '../components/SearchForm';
import StyledFilters from '../components/StyledFilters';
import StyledHr from '../components/StyledHr';
import { fadeIn } from '../components/StyledKeyframes';
import StyledLink from '../components/StyledLink';
import { StyledSelectFilter } from '../components/StyledSelectFilter';
import { H1, P } from '../components/Text';

const CollectiveCardContainer = styled.div`
  width: 275px;
  animation: ${fadeIn} 0.2s;
`;

const FILTERS = {
  ALL: 'ALL',
  COLLECTIVE: 'COLLECTIVE',
  EVENT: 'EVENT',
  ORGANIZATION: 'ORGANIZATION',
  HOST: 'HOST',
  PROJECT: 'PROJECT',
  FUND: 'FUND',
};

const I18nFilters = defineMessages({
  [FILTERS.ALL]: {
    id: 'Amount.AllShort',
    defaultMessage: 'All',
  },
  [FILTERS.COLLECTIVE]: {
    id: 'Collectives',
    defaultMessage: 'Collectives',
  },
  [FILTERS.EVENT]: {
    id: 'Events',
    defaultMessage: 'Events',
  },
  [FILTERS.ORGANIZATION]: {
    id: 'TopContributors.Organizations',
    defaultMessage: 'Organizations',
  },
  [FILTERS.HOST]: {
    id: 'searchFilter.host',
    defaultMessage: 'Fiscal hosts',
  },
  [FILTERS.PROJECT]: {
    id: 'Projects',
    defaultMessage: 'Projects',
  },
  [FILTERS.FUND]: {
    defaultMessage: 'Funds',
  },
});

const SearchFormContainer = styled(Box)`
  height: 58px;
  width: 608px;
  min-width: 10rem;
`;

const DEFAULT_SEARCH_TYPES = ['COLLECTIVE', 'EVENT', 'ORGANIZATION', 'FUND', 'PROJECT'];

const FilterLabel = styled.label`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  text-transform: uppercase;
  padding-bottom: 8px;
  color: #4d4f51;
`;

const CountryFilter = ({ onChange, value, ...props }) => {
  const intl = useIntl();
  const getOption = value => ({ label: i18nExpenseType(intl, value), value });

  const expenseTypeKeys = Object.keys(expenseTypes).filter(key => !['DEFAULT', 'FUNDING_REQUEST'].includes(key));
  expenseTypeKeys.unshift('ALL');

  return (
    <StyledSelectFilter
      inputId="expenses-type-filter"
      onChange={({ value }) => onChange(value)}
      value={getOption(value || 'ALL')}
      options={expenseTypeKeys.map(getOption)}
      {...props}
    />
  );
};

CountryFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

class SearchPage extends React.Component {
  static getInitialProps({ query }) {
    return {
      term: query.q || '',
      types: query.types ? decodeURIComponent(query.types).split(',') : DEFAULT_SEARCH_TYPES,
      isHost: isNil(query.isHost) ? undefined : parseToBoolean(query.isHost),
      countries: query.countries || null,
      limit: Number(query.limit) || 20,
      offset: Number(query.offset) || 0,
    };
  }

  static propTypes = {
    term: PropTypes.string, // for addSearchQueryData
    countries: PropTypes.arrayOf(PropTypes.string), // for addSearchQueryData
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

  changeCountry = country => {
    const { router, term } = this.props;
    router.push({ pathname: router.pathname, query: { q: term, types: router.query.types, countries: [country] } });
  };

  refetch = event => {
    event.preventDefault();

    const { target: form } = event;
    const { router } = this.props;
    const { q } = form;

    const query = { q: q.value, types: router.query.types };
    if (router.query.countries) {
      query.countries = router.query.countries;
    }
    router.push({ pathname: router.pathname, query });
  };

  onClick = filter => {
    const { term, router } = this.props;
    let query;

    if (filter === 'HOST') {
      query = { q: term, isHost: true };
    } else if (filter !== 'ALL') {
      query = { q: term, types: filter };
    } else {
      query = { q: term };
    }

    if (router.query.countries) {
      query.countries = router.query.countries;
    }

    router.push({ pathname: '/search', query });
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

    const filters = ['ALL', 'COLLECTIVE', 'EVENT', 'ORGANIZATION', 'HOST', 'PROJECT', 'FUND'];
    const { collectives, limit = 20, offset, total = 0 } = search || {};
    const showCollectives = term.trim() !== '' && !!collectives;

    return (
      <Page title="Search" showSearch={false}>
        <Container mx="auto" px={3} py={[4, '40px']} width={[1, 0.85]} maxWidth={1200}>
          <Container
            alignItems="center"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            textAlign="center"
          >
            <H1 fontSize="32px" fontWeight="700">
              <FormattedMessage defaultMessage="Search in Open Collective" />
            </H1>
            <Flex justifyContent="center" flex="1 1 1" marginTop={16} width={1}>
              <SearchFormContainer p={2}>
                <SearchForm
                  borderRadius="100px"
                  fontSize="16px"
                  py="1px"
                  placeholder="Search by name, slug, tag, description..."
                  defaultValue={term}
                  onSubmit={this.refetch}
                />
              </SearchFormContainer>
            </Flex>
          </Container>
          {term && (
            <Flex mt={4} mb={4} mx="auto" justifyContent="center">
              <StyledFilters
                filters={filters}
                getLabel={key => intl.formatMessage(I18nFilters[key])}
                selected={this.state.filter}
                justifyContent="left"
                minButtonWidth={140}
                onChange={filter => {
                  this.setState({ filter: filter });
                  this.onClick(filter);
                }}
              />
            </Flex>
          )}
          <StyledHr mt="30px" mb="24px" flex="1" borderStyle="solid" borderColor="rgba(50, 51, 52, 0.2)" />
          <Container width={[1, 1 / 4]}>
            <FilterLabel htmlFor="country-filter-type">
              <FormattedMessage id="collective.country.label" defaultMessage="Country" />
            </FilterLabel>
            <InputTypeCountry
              inputId="search-country-filter"
              defaultValue="ALL"
              customOptions={[{ label: <FormattedMessage defaultMessage="All countries" />, value: 'ALL' }]}
              onChange={country => this.changeCountry(country)}
            />
          </Container>
          <Flex justifyContent={['center', 'center', 'flex-start']} flexWrap="wrap">
            {loading && !collectives && (
              <Flex py={3} width={1} justifyContent="center">
                <LoadingGrid />
              </Flex>
            )}
            {showCollectives &&
              collectives.map(collective => (
                <Flex key={collective.slug} my={3} mx={2}>
                  {collective.isPledged ? (
                    <CollectiveCardContainer key={collective.id}>
                      <PledgedCollectiveCard collective={collective} />
                    </CollectiveCardContainer>
                  ) : (
                    <CollectiveCardContainer key={collective.id}>
                      <SearchCollectiveCard collective={collective} />
                    </CollectiveCardContainer>
                  )}
                </Flex>
              ))}

            {/* TODO: add suggested collectives when the result is empty */}
            {showCollectives && collectives.length === 0 && (
              <Flex py={3} width={1} justifyContent="center" flexDirection="column" alignItems="center">
                <P my={4}>
                  <em>
                    <FormattedMessage id="search.noResult" defaultMessage="Your search did not match any result" />
                  </em>
                </P>
                {
                  <Link href={{ pathname: '/pledges/new', query: { name: term } }}>
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
  query SearchPage(
    $term: String!
    $types: [TypeOfCollective]
    $isHost: Boolean
    $limit: Int
    $offset: Int
    $countries: [String]
  ) {
    search(
      term: $term
      types: $types
      isHost: $isHost
      limit: $limit
      offset: $offset
      skipRecentAccounts: true
      countries: $countries
    ) {
      collectives {
        id
        isActive
        type
        slug
        path
        name
        location {
          country
        }
        tags
        isHost
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
          collectives {
            hosted
          }
          totalAmountReceived
        }
        hostFeePercent
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
