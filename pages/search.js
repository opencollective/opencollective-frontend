import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { isNil } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import { parseToBoolean } from '../lib/utils';

import Container from '../components/Container';
import PledgedCollectiveCard from '../components/discover/PledgedCollectiveCard';
import ErrorPage from '../components/ErrorPage';
import { Box, Flex } from '../components/Grid';
import { getI18nLink, I18nSupportLink } from '../components/I18nFormatters';
import Image from '../components/Image';
import Link from '../components/Link';
import LoadingGrid from '../components/LoadingGrid';
import Page from '../components/Page';
import Pagination from '../components/Pagination';
import SearchCollectiveCard from '../components/search-page/SearchCollectiveCard';
import SearchForm from '../components/SearchForm';
import StyledFilters from '../components/StyledFilters';
import { fadeIn } from '../components/StyledKeyframes';
import StyledLink from '../components/StyledLink';
import { H1, P, Span } from '../components/Text';

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

class SearchPage extends React.Component {
  static getInitialProps({ query }) {
    return {
      term: query.q || '',
      type: query.type ? decodeURIComponent(query.type).split(',') : DEFAULT_SEARCH_TYPES,
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

    router.push({ pathname: router.pathname, query: { q: q.value, type: router.query.type } });
  };

  onClick = filter => {
    const { term } = this.props;

    if (filter === 'HOST') {
      this.props.router.push({ pathname: '/search', query: { q: term, isHost: true } });
    } else if (filter !== 'ALL') {
      this.props.router.push({ pathname: '/search', query: { q: term, type: filter } });
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
    const { error, loading, accounts } = data || {};

    if (error) {
      return <ErrorPage data={this.props.data} />;
    }

    const filters = ['ALL', 'COLLECTIVE', 'EVENT', 'ORGANIZATION', 'HOST', 'PROJECT', 'FUND'];
    const { limit = 20, offset, totalCount = 0 } = accounts || {};
    const showCollectives = term.trim() !== '' && !!accounts?.nodes;

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
            <Box mt={4} mb={4} mx="auto">
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
            </Box>
          )}
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
          {showCollectives && accounts?.nodes?.length !== 0 && totalCount > limit && (
            <Container display="flex" justifyContent="center" fontSize="14px" my={3}>
              <Pagination offset={offset} total={totalCount} limit={limit} />
            </Container>
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
  query SearchPage($term: String!, $type: [AccountType], $isHost: Boolean, $limit: Int, $offset: Int) {
    accounts(
      searchTerm: $term
      type: $type
      isHost: $isHost
      limit: $limit
      offset: $offset
      skipRecentAccounts: true
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
  }
`;

export const addSearchPageData = graphql(searchPageQuery, {
  skip: props => !props.term,
  options: { context: API_V2_CONTEXT },
});

export default injectIntl(withRouter(addSearchPageData(SearchPage)));
