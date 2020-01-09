import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import { withRouter } from 'next/router';
import { Box, Flex } from '@rebass/grid';
import styled from 'styled-components';
import CollectiveCard from '../components/CollectiveCard';
import PledgedCollectiveCard from '../components/PledgedCollectiveCard';
import Container from '../components/Container';
import Page from '../components/Page';
import { H1, P } from '../components/Text';
import LoadingGrid from '../components/LoadingGrid';
import Pagination from '../components/Pagination';
import MessageBox from '../components/MessageBox';
import StyledSelect from '../components/StyledSelect';
import { Link } from '../server/pages';
import SearchForm from '../components/SearchForm';

const DiscoverPageDataQuery = gql`
  query DiscoverPageDataQuery(
    $offset: Int
    $tags: [String]
    $orderBy: CollectiveOrderField
    $limit: Int
    $isPledged: Boolean
    $isActive: Boolean
  ) {
    allCollectiveTags
    allCollectives(
      type: COLLECTIVE
      orderBy: $orderBy
      orderDirection: DESC
      offset: $offset
      tags: $tags
      limit: $limit
      isPledged: $isPledged
      isActive: $isActive
    ) {
      limit
      offset
      total
      collectives {
        id
        backgroundImage
        currency
        description
        longDescription
        image
        name
        settings
        slug
        type
        website
        githubHandle
        stats {
          id
          yearlyBudget
          backers {
            all
          }
        }
        isPledged
        memberOf {
          id
        }
        parentCollective {
          id
          slug
          settings
          backgroundImage
        }
        pledges: orders(status: PENDING) {
          id
          totalAmount
          currency
        }
      }
    }
  }
`;

const NavList = styled(Flex)`
  list-style: none;
  min-width: 20rem;
  text-align: right;
  align-items: center;
`;

const NavLinkContainer = styled(Box)`
  text-align: center;
`;
NavLinkContainer.defaultProps = {
  as: 'li',
  px: [1, 2, 3],
};

const NavLink = styled.a`
  color: #777777;
  font-size: 1.4rem;

  &.selected {
    color: #3385ff;
  }
`;

const SearchFormContainer = styled(Box)`
  width: 100%;
  max-width: 650px;
  min-width: 10rem;
`;

const sortOptions = [{ value: 'popularity' }, { value: 'newest' }];

const I18nSortLabels = defineMessages({
  popularity: {
    id: 'discover.sort.Popularity',
    defaultMessage: 'Most popular',
  },
  newest: {
    id: 'discover.sort.Newest',
    defaultMessage: 'Newest',
  },
});

const DiscoverPage = ({ router, intl }) => {
  const { query } = router;

  const params = {
    offset: Number(query.offset) || 0,
    tags: !query.show || query.show === 'all' ? undefined : [query.show],
    orderBy: query.sort === 'newest' ? 'createdAt' : 'totalDonations',
    limit: Number(query.limit) || 50,
    isActive: query.show !== 'pledged',
    isPledged: query.show === 'pledged',
  };

  const setRouteParam = (name, value) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, offset: 0, [name]: value },
    });
  };

  const selectedSort = sortOptions.find(({ value }) => value === query.sort) || sortOptions[0];

  const handleSubmit = event => {
    const searchInput = event.target.elements.q;
    setRouteParam('show', searchInput.value);
    event.preventDefault();
  };

  return (
    <Page title="Discover">
      {({ LoggedInUser }) => (
        <Query query={DiscoverPageDataQuery} variables={params}>
          {({ data, error, loading }) => (
            <Fragment>
              <Container
                alignItems="center"
                backgroundImage="url(/static/images/discover-bg.svg)"
                backgroundPosition="center top"
                backgroundSize="cover"
                backgroundRepeat="no-repeat"
                display="flex"
                flexDirection="column"
                height={328}
                justifyContent="center"
                textAlign="center"
              >
                <H1 color="white.full" fontSize={['H3', null, 'H2']} lineHeight={['H3', null, 'H2']}>
                  <FormattedMessage id="discover.title" defaultMessage="Discover awesome collectives to support" />
                </H1>
                <P color="white.full" fontSize="H5" lineHeight="H5" mt={1}>
                  <FormattedMessage id="discover.subTitle" defaultMessage="Let's make great things together." />
                </P>

                <Flex justifyContent="center" flex="1 1 1" marginTop={50} width={0.8}>
                  <SearchFormContainer p={2}>
                    <SearchForm placeholder="Search tag" onSubmit={handleSubmit} />
                  </SearchFormContainer>
                </Flex>
              </Container>
              <Container
                alignItems="center"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                maxWidth={1200}
                mx="auto"
                position="relative"
                px={2}
                py={[20, 80]}
                width={1}
              >
                <Flex width={[1]} justifyContent="left" flexWrap="wrap" mb={4}>
                  <Flex width={[1, 0.8]} my={3}>
                    <NavList as="ul" p={0} justifyContent="space-between" width={1} css={{ maxWidth: 650 }}>
                      <NavLinkContainer>
                        <Link route="discover" params={{ show: 'all', sort: query.sort }}>
                          <NavLink
                            className={
                              query.show == 'all' || query.show == '' || query.show == undefined ? 'selected' : ''
                            }
                          >
                            <FormattedMessage id="discover.allCollectives" defaultMessage="All collectives" />
                          </NavLink>
                        </Link>
                      </NavLinkContainer>
                      <NavLinkContainer>
                        <Link route="discover" params={{ show: 'open source', sort: query.sort }}>
                          <NavLink className={query.show == 'open source' ? 'selected' : ''}>
                            <FormattedMessage
                              id="discover.openSourceCollectives"
                              defaultMessage="Open source collectives"
                            />
                          </NavLink>
                        </Link>
                      </NavLinkContainer>
                      <NavLinkContainer>
                        <Link route="discover" params={{ show: 'pledged', sort: query.sort }}>
                          <NavLink className={query.show == 'pledged' ? 'selected' : ''}>
                            <FormattedMessage id="discover.pledgedCollectives" defaultMessage="Pledged collectives" />
                          </NavLink>
                        </Link>
                      </NavLinkContainer>
                      <NavLinkContainer>
                        <Link route="discover" params={{ show: 'other', sort: query.sort }}>
                          <NavLink className={query.show == 'other' ? 'selected' : ''}>
                            <FormattedMessage id="discover.other" defaultMessage="Other" />
                          </NavLink>
                        </Link>
                      </NavLinkContainer>
                    </NavList>
                  </Flex>

                  <Flex width={[1, 0.2]} justifyContent={['center', 'flex-end']} alignItems="center">
                    <StyledSelect
                      name="sort"
                      id="sort"
                      options={sortOptions}
                      defaultValue={selectedSort}
                      placeholder={'Sort by'}
                      minWidth={140}
                      getOptionLabel={({ value }) => intl.formatMessage(I18nSortLabels[value])}
                      onChange={({ value }) => setRouteParam('sort', value)}
                    />
                  </Flex>
                </Flex>

                {loading && (
                  <Box py={6}>
                    <LoadingGrid />
                  </Box>
                )}

                {error && (
                  <MessageBox type="error" withIcon mt={6}>
                    {error.message}
                  </MessageBox>
                )}

                {!error && !loading && data && data.allCollectives && (
                  <Fragment>
                    <Flex flexWrap="wrap" width={1} justifyContent="left">
                      {get(data, 'allCollectives.collectives', []).map(c => (
                        <Flex key={c.id} width={[1, 1 / 2, 1 / 4, 1 / 4, 1 / 5]} mb={3} justifyContent="center">
                          {c.isPledged ? (
                            <PledgedCollectiveCard collective={c} />
                          ) : (
                            <CollectiveCard collective={c} LoggedInUser={LoggedInUser} />
                          )}
                        </Flex>
                      ))}
                    </Flex>
                    {data.allCollectives.total > data.allCollectives.limit && (
                      <Flex justifyContent="center" mt={3}>
                        <Pagination
                          offset={data.allCollectives.offset}
                          total={data.allCollectives.total}
                          limit={data.allCollectives.limit}
                          scrollToTopOnChange
                        />
                      </Flex>
                    )}
                  </Fragment>
                )}

                {data && data.allCollectives && data.allCollectives.total === 0 && (
                  <MessageBox my={5} type="info">
                    <FormattedMessage
                      id="discover.searchNoResult"
                      defaultMessage="No collective matches the current search."
                    />
                  </MessageBox>
                )}
              </Container>
            </Fragment>
          )}
        </Query>
      )}
    </Page>
  );
};

DiscoverPage.propTypes = {
  /** @ignore from withRouter */
  router: PropTypes.object,
  /** @ignore from injectIntl */
  intl: PropTypes.object,
};

export default withRouter(injectIntl(DiscoverPage));
