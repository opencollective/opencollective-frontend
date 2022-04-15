import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { ShareAlt } from '@styled-icons/boxicons-regular';
import copy from 'copy-to-clipboard';
import { isNil, truncate } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import i18nSearchSortingOptions from '../lib/i18n/search-sorting-options';
import { parseToBoolean } from '../lib/utils';

import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import { Box, Flex } from '../components/Grid';
import { getI18nLink, I18nSupportLink } from '../components/I18nFormatters';
import Image from '../components/Image';
import InputTypeCountry from '../components/InputTypeCountry';
import Link from '../components/Link';
import LoadingGrid from '../components/LoadingGrid';
import Page from '../components/Page';
import Pagination from '../components/Pagination';
import PledgedCollectiveCard from '../components/search-page/PledgedCollectiveCard';
import SearchCollectiveCard from '../components/search-page/SearchCollectiveCard';
import SearchForm from '../components/SearchForm';
import StyledButton from '../components/StyledButton';
import StyledFilters from '../components/StyledFilters';
import StyledHr from '../components/StyledHr';
import { fadeIn } from '../components/StyledKeyframes';
import StyledLink from '../components/StyledLink';
import { StyledSelectFilter } from '../components/StyledSelectFilter';
import StyledTag from '../components/StyledTag';
import { H1, P, Span } from '../components/Text';
import { TOAST_TYPE, withToasts } from '../components/ToastProvider';

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

const FilterLabel = styled.label`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  text-transform: uppercase;
  padding-bottom: 8px;
  color: #4d4f51;
`;

const constructSortByQuery = sortByValue => {
  let query = {};
  if (sortByValue === 'ACTIVITY') {
    query = { field: 'ACTIVITY', direction: 'DESC' };
  } else if (sortByValue === 'CREATED_AT.DESC') {
    query = { field: 'CREATED_AT', direction: 'DESC' };
  } else if (sortByValue === 'CREATED_AT.ASC') {
    query = { field: 'CREATED_AT', direction: 'ASC' };
  }
  return query;
};

const FilterButton = styled(StyledButton).attrs({
  buttonSize: 'tiny',
  buttonStyle: 'standard',
})`
  height: 22px;
  background-color: #f1f2f3;
  margin-right: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  ${props =>
    props.$isSelected &&
    css`
      &,
      &:active,
      &:focus {
        background-color: ${props => props.theme.colors.primary[100]};
        color: ${props => props.theme.colors.primary[800]};
      }
    `}
`;

export const IGNORED_TAGS = ['community', 'user'];
const DEFAULT_SEARCH_TYPES = ['COLLECTIVE', 'EVENT', 'ORGANIZATION', 'FUND', 'PROJECT'];

class SearchPage extends React.Component {
  static getInitialProps({ query }) {
    return {
      term: query.q || '',
      type: query.type ? decodeURIComponent(query.type).split(',') : DEFAULT_SEARCH_TYPES,
      isHost: isNil(query.isHost) ? undefined : parseToBoolean(query.isHost),
      country: query.country || null,
      sortBy: query.sortBy || 'ACTIVITY',
      tag: query.tag?.length > 0 ? query.tag.split(',') : [],
      limit: Number(query.limit) || 20,
      offset: Number(query.offset) || 0,
    };
  }

  static propTypes = {
    term: PropTypes.string, // for addSearchQueryData
    country: PropTypes.arrayOf(PropTypes.string), // for addSearchQueryData
    sortBy: PropTypes.string, // for addSearchQueryData
    tag: PropTypes.array, // for addSearchQueryData
    limit: PropTypes.number, // for addSearchQueryData
    offset: PropTypes.number, // for addSearchQueryData
    router: PropTypes.object, // from next.js
    data: PropTypes.object.isRequired, // from withData
    intl: PropTypes.object,
    addToast: PropTypes.func.isRequired, // from withToasts
  };

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.state = { filter: 'ALL' };
  }

  changeCountry = country => {
    const { router, term } = this.props;
    const query = { q: term, types: router.query.types, sortBy: router.query.sortBy, tag: router.query.tag };
    if (country !== 'ALL') {
      query.country = [country];
    }
    router.push({ pathname: router.pathname, query });
  };

  changeSort = sortBy => {
    const { router, term } = this.props;
    const query = {
      q: term,
      types: router.query.types,
      isHost: router.query.isHost,
      country: router.query.country,
      tag: router.query.tag,
      sortBy: sortBy.value,
    };
    router.push({ pathname: router.pathname, query });
  };

  changeTags = tag => {
    const { router, term } = this.props;
    let tags = router.query?.tag?.split(',');
    if (!tags || router.query?.tag?.length === 0) {
      tags = [tag];
    } else if (tags.includes(tag)) {
      tags = tags.filter(value => value !== tag);
    } else {
      tags.push(tag);
    }

    const query = { q: term, types: router.query.types, country: router.query.country, sortBy: router.query.sortBy };
    if (tags.length > 0) {
      query.tag = tags.join();
    }
    router.push({ pathname: router.pathname, query });
  };

  refetch = event => {
    event.preventDefault();

    const { target: form } = event;
    const { router } = this.props;
    const { q } = form;

    const query = { q: q.value, type: router.query.type };
    router.push({ pathname: router.pathname, query });
  };

  onClick = filter => {
    const { term, router } = this.props;
    let query;

    if (filter === 'HOST') {
      query = { q: term, isHost: true };
    } else if (filter !== 'ALL') {
      query = { q: term, type: filter };
    } else {
      query = { q: term };
    }

    if (router.query.country) {
      query.country = router.query.country;
    }

    if (router.query.tag) {
      query.tag = router.query.tag;
    }

    query.sortBy = router.query.sortBy;

    router.push({ pathname: '/search', query });
  };

  changePage = offset => {
    const { router } = this.props;
    this.props.router.push({ pathname: '/search', query: { ...router.query, offset } });
  };

  handleCopy = () => {
    copy(window.location.href);
    this.props.addToast({
      type: TOAST_TYPE.SUCCESS,
      message: <FormattedMessage defaultMessage="Search Result Copied!" />,
    });
  };

  render() {
    const { router, data, term = '', intl } = this.props;
    const { error, loading, accounts, tagStats } = data || {};
    const tags = router?.query?.tag?.split(',') || [];

    if (error) {
      return <ErrorPage data={this.props.data} />;
    }

    const filters = ['ALL', 'COLLECTIVE', 'EVENT', 'ORGANIZATION', 'HOST', 'PROJECT', 'FUND'];
    const { limit = 20, offset, totalCount = 0 } = accounts || {};
    const showCollectives = !!accounts?.nodes;
    const getOption = value => ({ label: i18nSearchSortingOptions(intl, value), value });
    const options = [getOption('ACTIVITY'), getOption('CREATED_AT.DESC'), getOption('CREATED_AT.ASC')];

    return (
      <Page title="Search" showSearch={false}>
        <Container mx="auto" px={3} py={[4, '40px']} width={[1, 0.85]} maxWidth={1200}>
          <Container
            alignItems="center"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            textAlign="center"
            data-cy="search-banner"
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
          <Flex mt={4} mb={4} mx="auto" flexDirection={['column', 'row']}>
            <Container width={[1, 4 / 5]}>
              <StyledFilters
                filters={filters}
                getLabel={key => intl.formatMessage(I18nFilters[key], { count: 10 })}
                selected={this.state.filter}
                justifyContent="left"
                minButtonWidth="95px"
                onChange={filter => {
                  this.setState({ filter: filter });
                  this.onClick(filter);
                }}
              />
            </Container>
            <Container width={[1, 1 / 5]} pt={[2, 0]}>
              <StyledSelectFilter
                inputId="sort-filter"
                value={this.props.sortBy ? getOption(this.props.sortBy) : options[0]}
                options={options}
                onChange={sortBy => this.changeSort(sortBy)}
              />
            </Container>
          </Flex>
          <StyledHr mt="30px" mb="24px" flex="1" borderStyle="solid" borderColor="rgba(50, 51, 52, 0.2)" />
          <Flex flexDirection={['column', 'row']}>
            <Container width={[1, '200px']}>
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
            {tagStats?.nodes?.length > 0 && (
              <Container width={[1, 3 / 4]} pl={[0, '23px']} pt={[2, 0]}>
                <FilterLabel htmlFor="tag-filter-type">
                  <FormattedMessage defaultMessage="Tags" />
                </FilterLabel>
                <Flex flexWrap="wrap" width={[null, '1000px']}>
                  {tagStats?.nodes
                    ?.filter(node => !IGNORED_TAGS.includes(node.tag))
                    .map(node => (
                      <FilterButton
                        as={StyledTag}
                        key={node.tag}
                        title={node.tag}
                        variant="rounded-right"
                        $isSelected={tags.includes(node.tag)}
                        onClick={() => this.changeTags(node.tag)}
                      >
                        {truncate(node.tag, { length: 20 })}
                      </FilterButton>
                    ))}
                </Flex>
              </Container>
            )}
          </Flex>
          <Flex justifyContent={['center', 'center', 'flex-start']} flexWrap="wrap">
            {loading && accounts?.nodes?.length > 0 && (
              <Flex py={3} width={1} justifyContent="center">
                <LoadingGrid />
              </Flex>
            )}
            {showCollectives &&
              accounts?.nodes?.map(collective => (
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

            {showCollectives && accounts?.nodes?.length === 0 && (
              <Flex py={3} width={1} justifyContent="center" flexDirection="column" alignItems="center">
                <H1 fontSize="32px" lineHeight="40px" color="black.700" fontWeight={500}>
                  <FormattedMessage defaultMessage="No results match your search" />
                </H1>
                <Container py={32}>
                  <Image src="/static/images/empty-search.png" alt="No Search Results" width={101.98} height={87.47} />
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
                        <Span pt="8px">
                          <FormattedMessage defaultMessage="Broaden your search (e.g. search 'garden' instead of 'community garden')" />
                        </Span>
                      </li>
                      <li>
                        <Span pt="8px">
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
          {showCollectives && accounts?.nodes?.length !== 0 && totalCount > limit && (
            <Container display="flex" justifyContent="center" fontSize="14px" my={3}>
              <Pagination offset={offset} total={totalCount} limit={limit} />
            </Container>
          )}

          {showCollectives && accounts?.nodes?.length !== 0 && (
            <Flex flexDirection="column" alignItems="center">
              <StyledButton onClick={this.handleCopy}>
                <Span pr={1} fontSize="14px" fontWeight={500}>
                  <FormattedMessage defaultMessage="Share results" />
                </Span>
                <ShareAlt size="14px" />
              </StyledButton>
            </Flex>
          )}

          {showCollectives && accounts?.nodes?.length !== 0 && (
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

export const searchPageQuery = gqlV2/* GraphQL */ `
  query SearchPage(
    $term: String!
    $type: [AccountType]
    $country: [CountryISO]
    $tag: [String]
    $sortBy: OrderByInput
    $isHost: Boolean
    $limit: Int
    $offset: Int
  ) {
    accounts(
      searchTerm: $term
      type: $type
      isHost: $isHost
      limit: $limit
      offset: $offset
      skipRecentAccounts: true
      country: $country
      orderBy: $sortBy
      tag: $tag
    ) {
      nodes {
        id
        isActive
        type
        slug
        name
        location {
          country
        }
        tags
        isHost
        imageUrl
        backgroundImageUrl
        description
        longDescription
        website
        currency
        stats {
          id
          totalAmountSpent {
            currency
            valueInCents
          }
          yearlyBudget {
            currency
            valueInCents
          }
          totalAmountReceived {
            currency
            valueInCents
          }
        }
        ... on Organization {
          host {
            id
            hostFeePercent
            totalHostedCollectives
          }
        }
        ... on AccountWithParent {
          parent {
            id
            slug
            backgroundImageUrl
          }
        }
        backers: members(role: BACKER) {
          totalCount
        }
        memberOf(role: BACKER) {
          totalCount
        }
      }
      limit
      offset
      totalCount
    }

    tagStats(searchTerm: $term) {
      nodes {
        tag
      }
    }
  }
`;

export const addSearchPageData = graphql(searchPageQuery, {
  options: props => ({
    context: API_V2_CONTEXT,
    variables: {
      term: props.term,
      type: props.type,
      isHost: props.isHost,
      limit: props.limit,
      offset: props.offset,
      country: props.country,
      tag: props.tag,
      sortBy: constructSortByQuery(props.sortBy),
    },
  }),
});

export default withToasts(injectIntl(withRouter(addSearchPageData(SearchPage))));
