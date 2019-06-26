import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

import { withRouter } from 'next/router';
import withIntl from '../lib/withIntl';

import { Box, Flex } from '@rebass/grid';
import CollectiveCard from '../components/CollectiveCard';
import Container from '../components/Container';
import Page from '../components/Page';
import { H1, P } from '../components/Text';
import LoadingGrid from '../components/LoadingGrid';
import Pagination from '../components/Pagination';
import MessageBox from '../components/MessageBox';

const DiscoverPageDataQuery = gql`
  query DiscoverPageDataQuery($offset: Int, $tags: [String], $orderBy: CollectiveOrderField, $limit: Int) {
    allCollectiveTags
    allCollectives(
      type: COLLECTIVE
      orderBy: $orderBy
      orderDirection: DESC
      offset: $offset
      tags: $tags
      limit: $limit
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
        stats {
          yearlyBudget
          backers {
            all
          }
        }
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

const prepareTags = tags => {
  return ['all'].concat(tags.map(tag => tag.toLowerCase()).sort());
};

const DiscoverPage = ({ router }) => {
  const { query } = router;

  const params = {
    offset: Number(query.offset) || 0,
    tags: !query.show || query.show === 'all' ? undefined : [query.show],
    orderBy: query.sort === 'newest' ? 'createdAt' : 'totalDonations',
    limit: 12,
  };

  const onChange = event => {
    const { name, value } = event.target;
    router.push({
      pathname: router.pathname,
      query: { ...router.query, offset: 0, [name]: value },
    });
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
                height={560}
                justifyContent="center"
                textAlign="center"
              >
                <H1 color="white.full" fontSize={['H3', null, 'H2']} lineHeight={['H3', null, 'H2']}>
                  Discover awesome Collectives to support
                </H1>
                <P color="white.full" fontSize="H4" lineHeight="H4" mt={4}>
                  Let&apos;s make great things together.
                </P>
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
                top={-120}
                width={1}
              >
                <Flex width={[1, 0.8, 0.6]} justifyContent="space-evenly" flexWrap="wrap" mb={4}>
                  <Flex width={[1, null, 0.5]} justifyContent="center" alignItems="center" mb={[3, null, 0]}>
                    <P as="label" htmlFor="sort" color="white.full" fontSize="LeadParagraph" pr={2}>
                      Sort By
                    </P>
                    <select name="sort" id="sort" value={query.sort || 'totalDonations'} onChange={onChange}>
                      <option value="totalDonations">Most Popular</option>
                      <option value="newest">Newest</option>
                    </select>
                  </Flex>

                  <Flex width={[1, null, 0.5]} justifyContent="center" alignItems="center">
                    <P as="label" htmlFor="show" color="white.full" fontSize="LeadParagraph" pr={2}>
                      Show
                    </P>
                    <select name="show" id="show" value={params.tags} onChange={onChange}>
                      {prepareTags(get(data, 'allCollectiveTags', [])).map(tag => (
                        <option key={tag} value={tag}>
                          {tag}
                        </option>
                      ))}
                    </select>
                  </Flex>
                </Flex>

                {loading && (
                  <Box pt={6}>
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
                    <Flex flexWrap="wrap" width={1} justifyContent="center">
                      {get(data, 'allCollectives.collectives', []).map(c => (
                        <Flex key={c.id} width={[1, 1 / 2, 1 / 4]} mb={3} justifyContent="center">
                          <CollectiveCard collective={c} LoggedInUser={LoggedInUser} />
                        </Flex>
                      ))}
                    </Flex>
                    {data.allCollectives.total > data.allCollectives.limit && (
                      <Flex justifyContent="center" mt={3}>
                        <Pagination
                          offset={data.allCollectives.offset}
                          total={data.allCollectives.total}
                          limit={data.allCollectives.limit}
                        />
                      </Flex>
                    )}
                  </Fragment>
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
  router: PropTypes.object,
};

export default withIntl(withRouter(DiscoverPage));
