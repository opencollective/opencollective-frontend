import React, { Fragment } from 'react';
import fetch from 'node-fetch';
import { compose, lifecycle, withHandlers } from 'recompose';
import { isEqual, pick } from 'lodash';

import { withRouter } from 'next/router';
import withIntl from '../lib/withIntl';

import { getBaseApiUrl } from '../lib/utils';
import { queryString } from '../lib/api';

import { Box, Flex } from 'grid-styled';
import CollectiveCard from '../components/CollectiveCard';
import Container from '../components/Container';
import Page from '../components/Page';
import { H1, P } from '../components/Text';
import LoadingGrid from '../components/LoadingGrid';
import Pagination from '../components/Pagination';

const fetchCollectives = lifecycle({
  async componentDidMount() {
    const { query } = this.props.router;
    const params = {
      offset: query.offset || 0,
      show: query.show || 'all',
      sort: query.sort || 'most popular',
    };

    try {
      const endpoints = [`/discover?${queryString(params)}`, '/groups/tags'];
      const [data, tags] = await Promise.all(endpoints.map(e => fetch(`${getBaseApiUrl()}${e}`).then(r => r.json())));
      this.setState({
        ...pick(data, ['offset', 'total']),
        ...params,
        tags,
        collectives: data.collectives.map(this.transformData),
        router: this.props.router,
      });
    } catch (error) {
      this.setState({ error });
    }
  },

  async componentDidUpdate(prevProps) {
    const { query } = this.props.router;

    if (!isEqual(query, prevProps.router.query)) {
      const params = {
        offset: query.offset || 0,
        show: query.show || 'all',
        sort: query.sort || 'most popular',
      };

      try {
        const response = await fetch(`${getBaseApiUrl()}/discover?${queryString(params)}`);
        const data = await response.json();
        this.setState({
          ...pick(data, ['offset', 'total']),
          ...params,
          collectives: data.collectives.map(this.transformData),
          router: this.props.router,
        });
      } catch (error) {
        this.setState({ error });
      }
    }
  },

  // needed to match data expected by CollectiveCard
  transformData(collective) {
    return {
      ...collective,
      stats: {
        backers: {
          all: collective.backersCount,
        },
        yearlyBudget: collective.yearlyIncome,
      },
      type: 'COLLECTIVE',
    };
  },
});

const handleChange = withHandlers({
  onChange: props => event => {
    const { name, value } = event.target;
    props.router.push({
      pathname: props.router.pathname,
      query: { ...props.router.query, offset: 0, [name]: value },
    });
  },
});

const DiscoverPage = ({ collectives, onChange, offset, total, show, sort, tags = [] }) => {
  const tagOptions = ['all'].concat(tags.map(tag => tag.toLowerCase()).sort());
  const limit = 12;

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
                <P is="label" htmlFor="sort" color="white.full" fontSize="LeadParagraph" pr={2}>
                  Sort By
                </P>
                <select name="sort" id="sort" value={sort} onChange={onChange}>
                  <option value="most popular">Most Popular</option>
                  <option value="newest">Newest</option>
                </select>
              </Flex>

              <Flex width={[1, null, 0.5]} justifyContent="center" alignItems="center">
                <P is="label" htmlFor="show" color="white.full" fontSize="LeadParagraph" pr={2}>
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

export default withIntl(
  withRouter(
    compose(
      fetchCollectives,
      handleChange,
    )(DiscoverPage),
  ),
);
