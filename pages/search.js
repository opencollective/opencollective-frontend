import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { ShareAlt } from '@styled-icons/boxicons-regular/ShareAlt';
import copy from 'copy-to-clipboard';
import { differenceWith, isNil, pickBy, toLower, truncate, uniqBy } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { IGNORED_TAGS } from '../lib/constants/collectives';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import i18nSearchSortingOptions from '../lib/i18n/search-sorting-options';
import { parseToBoolean } from '../lib/utils';

import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import { Box, Flex, Grid } from '../components/Grid';
import Hide from '../components/Hide';
import { getI18nLink, I18nSupportLink } from '../components/I18nFormatters';
import Image from '../components/Image';
import InputTypeCountry from '../components/InputTypeCountry';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import Page from '../components/Page';
import Pagination from '../components/Pagination';
import SearchCollectiveCard from '../components/search-page/SearchCollectiveCard';
import SearchForm from '../components/SearchForm';
import StyledButton from '../components/StyledButton';
import StyledFilters from '../components/StyledFilters';
import StyledHr from '../components/StyledHr';
import { fadeIn } from '../components/StyledKeyframes';
import { StyledSelectFilter } from '../components/StyledSelectFilter';
import StyledTag from '../components/StyledTag';
import { H1, P, Span } from '../components/Text';
import { TOAST_TYPE, withToasts } from '../components/ToastProvider';

const CollectiveCardContainer = styled.div`
  animation: ${fadeIn} 0.2s;
`;

const AllCardsContainer = styled(Grid).attrs({
  width: '100%',
  maxWidth: 1200,
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 2fr))',
})``;

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
  } else if (sortByValue === 'RANK') {
    query = { field: 'RANK', direction: 'DESC' };
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

const DEFAULT_SEARCH_TYPES = ['COLLECTIVE', 'EVENT', 'ORGANIZATION', 'FUND', 'PROJECT'];

class SearchPage extends React.Component {
  static getInitialProps({ query }) {
    return {
      term: query.q || '',
      type: query.type ? decodeURIComponent(query.type).split(',') : DEFAULT_SEARCH_TYPES,
      isHost: isNil(query.isHost) ? undefined : parseToBoolean(query.isHost),
      country: query.country || null,
      sortBy: query.sortBy || (query.q ? 'RANK' : 'ACTIVITY'),
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
    isHost: PropTypes.bool,
    type: PropTypes.array,
  };

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    const term = props.term;
    if (this.props.isHost) {
      this.state = { filter: 'HOST', term };
    } else if (this.props.type.length === 1) {
      this.state = { filter: this.props.type[0], term };
    } else {
      this.state = { filter: 'ALL', term };
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.term !== this.props.term) {
      this.setState({ term: this.props.term });
    }
  }

  changeCountry = country => {
    const { router, term } = this.props;
    const query = { q: term, type: router.query.type, sortBy: router.query.sortBy, tag: router.query.tag };
    if (country !== 'ALL') {
      query.country = [country];
    }
    router.push({ pathname: router.pathname, query: pickBy(query, value => !isNil(value)) });
  };

  changeSort = sortBy => {
    const { router, term } = this.props;
    const query = {
      q: term,
      type: router.query.type,
      isHost: router.query.isHost,
      country: router.query.country,
      tag: router.query.tag,
      sortBy: sortBy.value,
    };
    router.push({ pathname: router.pathname, query: pickBy(query, value => !isNil(value)) });
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

    const query = { q: term, type: router.query.type, country: router.query.country, sortBy: router.query.sortBy };
    if (tags.length > 0) {
      query.tag = tags.join();
    }
    router.push({ pathname: router.pathname, query: pickBy(query, value => !isNil(value)) });
  };

  refetch = event => {
    event.preventDefault();

    const { target: form } = event;
    const { router } = this.props;
    const { q } = form;

    const query = {
      q: q.value,
      type: router.query.type,
      country: router.query.country,
      sortBy: q.value === '' && router.query.sortBy === 'RANK' ? 'ACTIVITY' : router.query.sortBy,
    };
    router.push({ pathname: router.pathname, query: pickBy(query, value => !isNil(value)) });
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

    router.push({ pathname: '/search', query: pickBy(query, value => !isNil(value)) });
  };

  handleCopy = () => {
    copy(window.location.href);
    this.props.addToast({
      type: TOAST_TYPE.SUCCESS,
      message: <FormattedMessage defaultMessage="Search Result Copied!" />,
    });
  };

  render() {
    const { data, intl } = this.props;
    const { error, loading, accounts, tagStats } = data || {};
    const tags = this.props.tag || [];
    const hiddenSelectedTags = differenceWith(tags, tagStats?.nodes, (selectedTag, { tag }) => selectedTag === tag);

    if (error) {
      return <ErrorPage data={this.props.data} />;
    }

    const { limit = 20, offset, totalCount = 0 } = accounts || {};
    const showTagFilterSection = (accounts?.nodes?.length > 0 || tags.length > 0) && tagStats?.nodes?.length > 0;
    const getSortOption = value => ({ label: i18nSearchSortingOptions(intl, value), value });
    const sortOptions = [
      getSortOption('ACTIVITY'),
      this.props.term ? getSortOption('RANK') : undefined,
      getSortOption('CREATED_AT.DESC'),
      getSortOption('CREATED_AT.ASC'),
    ];
    const selectedTypeFilter = this.props.isHost ? 'HOST' : this.props.type.length === 1 ? this.props.type[0] : 'ALL';

    return (
      <Page title="Search" showSearch={false}>
        <Container
          backgroundImage="url(/static/images/home/fiscalhost-blue-bg-lg.png)"
          style={{ transform: 'rotate(180deg)' }}
          backgroundPosition="center top"
          backgroundSize="cover"
          backgroundRepeat="no-repeat"
          height={['136px', '230px']}
          data-cy="search-banner"
          alignItems="center"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          textAlign="center"
        >
          <Flex justifyContent="center" flex="1 1 1" width={['288px', 1]} style={{ transform: 'rotate(180deg)' }}>
            <SearchFormContainer mb={['20px', '48px']}>
              <SearchForm
                borderRadius="100px"
                fontSize="16px"
                height="58px"
                placeholder={intl.formatMessage({ defaultMessage: 'Search by name, slug, tag, description...' })}
                value={this.state.term}
                onChange={value => this.setState({ term: value })}
                onSubmit={this.refetch}
                showSearchButton
                searchButtonStyles={{ minWidth: '40px', height: '40px' }}
              />
            </SearchFormContainer>
          </Flex>
        </Container>
        <Container mx="auto" px={3} width={1} maxWidth={1200}>
          <Flex mb={4} mx="auto" flexDirection={['column', 'row']} justifyContent="center">
            <Hide xs sm>
              <StyledFilters
                filters={Object.keys(FILTERS)}
                getLabel={key => intl.formatMessage(I18nFilters[key], { count: 10 })}
                selected={selectedTypeFilter}
                minButtonWidth="95px"
                onChange={filter => {
                  this.setState({ filter: filter });
                  this.onClick(filter);
                }}
              />
            </Hide>
            <Hide md lg>
              <FilterLabel htmlFor="collective-filter-type">
                <FormattedMessage defaultMessage="Profile Type" />
              </FilterLabel>
              <StyledSelectFilter
                inputId="collective-type-filter"
                value={{ label: intl.formatMessage(I18nFilters[selectedTypeFilter]), value: selectedTypeFilter }}
                options={Object.keys(FILTERS).map(key => ({ label: intl.formatMessage(I18nFilters[key]), value: key }))}
                onChange={({ value }) => {
                  this.setState({ filter: value });
                  this.onClick(value);
                }}
              />
            </Hide>
          </Flex>
          <StyledHr mt="30px" mb="24px" flex="1" borderStyle="solid" borderColor="rgba(50, 51, 52, 0.2)" />
          <Flex flexDirection={['column', 'row']}>
            <Container pr={[0, '19px']}>
              <FilterLabel htmlFor="sort-filter-type">
                <FormattedMessage defaultMessage="Sort" />
              </FilterLabel>
              <StyledSelectFilter
                inputId="sort-filter"
                value={this.props.sortBy ? getSortOption(this.props.sortBy) : sortOptions[0]}
                options={sortOptions.filter(sortOption => sortOption)}
                onChange={sortBy => this.changeSort(sortBy)}
                minWidth={[0, '200px']}
              />
            </Container>
            <Container pt={['20px', 0]}>
              <FilterLabel htmlFor="country-filter-type">
                <FormattedMessage id="collective.country.label" defaultMessage="Country" />
              </FilterLabel>
              <InputTypeCountry
                inputId="search-country-filter"
                as={StyledSelectFilter}
                value={this.props.country || 'ALL'}
                customOptions={[{ label: <FormattedMessage defaultMessage="All countries" />, value: 'ALL' }]}
                onChange={country => this.changeCountry(country)}
                minWidth={[0, '200px']}
                fontSize="12px"
              />
            </Container>
            {showTagFilterSection && (
              <Container pl={[0, '23px']} pt={['20px', 0]}>
                <FilterLabel htmlFor="tag-filter-type">
                  <FormattedMessage id="Tags" defaultMessage="Tags" />
                </FilterLabel>
                <Flex flexWrap="wrap">
                  {uniqBy(
                    tagStats?.nodes.map(node => node.tag),
                    toLower,
                  )
                    ?.filter(tag => !IGNORED_TAGS.includes(tag))
                    .map(tag => (
                      <FilterButton
                        as={StyledTag}
                        key={tag}
                        title={tag}
                        variant="rounded-right"
                        $isSelected={tags.includes(tag)}
                        onClick={() => this.changeTags(tag)}
                      >
                        {truncate(tag, { length: 20 })}
                      </FilterButton>
                    ))}
                  {hiddenSelectedTags?.map(tag => (
                    <FilterButton
                      as={StyledTag}
                      key={tag}
                      title={tag}
                      variant="rounded-right"
                      $isSelected={tags.includes(tag)}
                      onClick={() => this.changeTags(tag)}
                    >
                      {truncate(tag, { length: 20 })}
                    </FilterButton>
                  ))}
                </Flex>
              </Container>
            )}
          </Flex>
          <Flex mb="64px" justifyContent="center" flexWrap="wrap">
            <AllCardsContainer>
              {loading
                ? Array.from(new Array(12)).map((_, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <Box key={index} my={3} mx={2}>
                      <CollectiveCardContainer>
                        <LoadingPlaceholder height={336} borderRadius="16px" />
                      </CollectiveCardContainer>
                    </Box>
                  ))
                : accounts?.nodes?.map(collective => (
                    <Box key={collective.slug} my={3} mx={2}>
                      <CollectiveCardContainer key={collective.id}>
                        <SearchCollectiveCard collective={collective} />
                      </CollectiveCardContainer>
                    </Box>
                  ))}
            </AllCardsContainer>

            {accounts?.nodes?.length === 0 && (
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
                      defaultMessage="Still no luck? Contact <SupportLink>support</SupportLink> or find us in <SlackLink>Slack</SlackLink>"
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
          {accounts?.nodes?.length !== 0 && totalCount > limit && (
            <Container display="flex" justifyContent="center" fontSize="14px" my={3}>
              <Pagination offset={offset} total={totalCount} limit={limit} />
            </Container>
          )}

          {accounts?.nodes?.length !== 0 && (
            <Flex flexDirection="column" alignItems="center">
              <StyledButton onClick={this.handleCopy}>
                <Span pr={1} fontSize="14px" fontWeight={500}>
                  <FormattedMessage defaultMessage="Share results" />
                </Span>
                <ShareAlt size="14px" />
              </StyledButton>
            </Flex>
          )}
          {accounts?.nodes?.length !== 0 && (
            <Flex py={3} width={1} justifyContent="center" flexDirection="column" alignItems="center">
              <P pt={3} pb={3} borderTop="1px solid #E6E6E6">
                <em>
                  <FormattedMessage
                    defaultMessage="Can't find what you're looking for? Check our <Link>Docs & Help!</Link>"
                    values={{
                      Link: getI18nLink({
                        href: 'https://opencollective.com/help',
                        openInNewTab: true,
                      }),
                    }}
                  />
                </em>
              </P>
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
          id
          country
        }
        tags
        isHost
        imageUrl(height: 96)
        backgroundImageUrl(height: 208)
        description
        website
        currency
        stats {
          id
          totalAmountReceived(useCache: true) {
            currency
            valueInCents
          }
          totalAmountSpent {
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
            location {
              id
              country
            }
          }
        }
        backers: members(role: BACKER) {
          totalCount
        }
      }
      limit
      offset
      totalCount
    }

    tagStats(searchTerm: $term) {
      nodes {
        id
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
