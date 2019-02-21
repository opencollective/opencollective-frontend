import React, { Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import fetch from 'node-fetch';
import { pick } from 'lodash';

import { withRouter } from 'next/router';
import withIntl from '../lib/withIntl';

import { getBaseApiUrl } from '../lib/utils';
import { queryString } from '../lib/api';

import { Box, Flex } from '@rebass/grid';
import CollectiveCard from '../components/CollectiveCard';
import Container from '../components/Container';
import Page from '../components/Page';
import { H1, P } from '../components/Text';
import LoadingGrid from '../components/LoadingGrid';
import Pagination from '../components/Pagination';

const _transformData = collective => ({
  ...collective,
  stats: {
    backers: {
      all: collective.backersCount,
    },
    yearlyBudget: collective.yearlyIncome,
  },
  type: 'COLLECTIVE',
});

function useCollectives(query) {
  const [state, setState] = useState({ error: null });
  const params = {
    offset: query.offset || 0,
    show: query.show || 'all',
    sort: query.sort || 'most popular',
  };

  const fetchDiscoverData = async () => {
    try {
      const endpoints = [`/discover?${queryString(params)}`, '/groups/tags'];
      const [data, tags] = await Promise.all(endpoints.map(e => fetch(`${getBaseApiUrl()}${e}`).then(r => r.json())));
      setState({
        ...pick(data, ['offset', 'total']),
        ...params,
        tags,
        collectives: data.collectives.map(_transformData),
      });
    } catch (error) {
      setState({ error });
    }
  };

  useEffect(() => {
    fetchDiscoverData();
  }, [query]);

  return state;
}

const DiscoverPage = ({ router }) => {
  const { query } = router;
  const { collectives, offset, total, show, sort, tags = [] } = useCollectives(query);
  const tagOptions = ['all'].concat(tags.map(tag => tag.toLowerCase()).sort());
  const limit = 12;

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
              Discover awesome collectives to support
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
                <select name="sort" id="sort" value={sort} onChange={onChange}>
                  <option value="most popular">Most Popular</option>
                  <option value="newest">Newest</option>
                </select>
              </Flex>

              <Flex width={[1, null, 0.5]} justifyContent="center" alignItems="center">
                <P as="label" htmlFor="show" color="white.full" fontSize="LeadParagraph" pr={2}>
                  Show
                </P>
                <select name="show" id="show" value={show} onChange={onChange}>
                  {tagOptions.map(tag => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </Flex>
            </Flex>

            {collectives && (
              <Fragment>
                <Flex flexWrap="wrap" width={1} justifyContent="center">
                  {collectives.map(c => (
                    <Flex key={c.id} width={[1, 1 / 2, 1 / 4]} mb={3} justifyContent="center">
                      <CollectiveCard collective={c} LoggedInUser={LoggedInUser} />
                    </Flex>
                  ))}
                </Flex>
                {total > limit && (
                  <Flex justifyContent="center" mt={3}>
                    <Pagination offset={Number(offset)} total={total} limit={limit} />
                  </Flex>
                )}
              </Fragment>
            )}
            {!collectives && (
              <Box pt={6}>
                <LoadingGrid />
              </Box>
            )}
          </Container>
        </Fragment>
      )}
    </Page>
  );
};

DiscoverPage.propTypes = {
  router: PropTypes.object,
};

export default withIntl(withRouter(DiscoverPage));
