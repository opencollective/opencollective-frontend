import React, { Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import fetch from 'node-fetch';
import { pick } from 'lodash';

import { withRouter } from 'next/router';
import withIntl from '../lib/withIntl';

import { getBaseApiUrl } from '../lib/utils';
import { queryString } from '../lib/api';
import styled from 'styled-components';
import Link from 'next/link';
import { FormattedMessage } from 'react-intl';
import { Box, Flex } from '@rebass/grid';

import Container from '../components/Container';
import Page from '../components/Page';
import { H1, P } from '../components/Text';
import LoadingGrid from '../components/LoadingGrid';
import Pagination from '../components/Pagination';
import SearchForm from '../components/SearchForm';

import CollectiveCard from '../components/CollectiveCard';
import PledgedCollectiveCard from '../components/PledgeCollectiveCard';

const NavList = styled(Flex)`
  list-style: none;
  min-width: 20rem;
  text-align: right;
`;

const SelectWrapper = styled.select`
  background: white;
  padding: 5px;
  border: 1px solid silver;
`;

const Nava = styled.a`
  color: grey;
  :hover {
    color: blue;
    cursor: pointer;
  }
`;
const SearchFormContainer = styled(Box)`
  max-width: 30rem;
  min-width: 83rem;
  padding: 64px;
`;
const SearchInput = styled(Box)`
  appearance: none;
  background-color: white;
  font-size: 1.2rem;
  letter-spacing: 0.1rem;
`;

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

  const onLoadCollectives = (e, value) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, offset: 0, show: value },
    });
  };

  const collectiveChecks = {};

  collectiveChecks.isPledge = () => router.asPath.includes('/discover?offset=0&show=pledged');
  collectiveChecks.isOpenSource = () => router.asPath.includes('/discover?offset=0&show=open%20source');
  collectiveChecks.isOther = () => router.asPath.includes('/discover?offset=0&show=other');

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
            height={364}
            justifyContent="center"
            textAlign="center"
          >
            <H1 color="white.full" fontSize={['H3', null, 'H2']} lineHeight={['H3', null, 'H2']}>
              Discover awesome collectives to support
            </H1>
            <P color="white.full" fontSize="H4" lineHeight="H4">
              Let&apos;s make great things together.
            </P>
            <SearchFormContainer p={2}>
              <SearchInput />
              <SearchForm />
            </SearchFormContainer>
          </Container>
          <Container
            alignItems="center"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            maxWidth={1200}
            mx="auto"
            padding="34px"
            px={2}
            top={58}
            width={1}
          >
            <Flex justifyContent="space-evenly" flexWrap="wrap" mb={4} width="100%">
              <NavList as="ul" p={0} m={0} justifyContent="space-around" css="margin-right: 256px;">
                <Box as="li" px={3}>
                  <Link href="/discover" passHref scroll={false}>
                    <Nava>
                      <FormattedMessage id="menu.allCollectives" defaultMessage="All Collectives" />
                    </Nava>
                  </Link>
                </Box>
                <Box as="li" px={3}>
                  <Link href="/discover?offset=0&show=open%20source" passHref scroll={false}>
                    <Nava>
                      <FormattedMessage id="menu.openSourceCollectives" defaultMessage="OpenSource Collectives" />
                    </Nava>
                  </Link>
                </Box>
                <Box as="li" px={3}>
                  <Link href="/discover?offset=0&show=pledged" passHref scroll={false}>
                    <Nava>
                      <FormattedMessage id="menu.pledgedCollective" defaultMessage="Pledged Collectives" />
                    </Nava>
                  </Link>
                </Box>
                <Box as="li" px={3}>
                  <Link href="/discover?offset=0&show=other" passHref scroll={false}>
                    <Nava>
                      <FormattedMessage id="menu.others" defaultMessage="Others" />
                    </Nava>
                  </Link>
                </Box>
              </NavList>
              <NavList as="ul" p={0} m={0} justifyContent="space-around" css="margin: 0;">
                <Box as="li" px={3}>
                  <SelectWrapper name="show" id="show" value={show} onChange={onChange}>
                    {tagOptions.map(tag => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </SelectWrapper>
                </Box>
              </NavList>
            </Flex>

            {collectives && (
              <Fragment>
                <Flex flexWrap="wrap" width={1} justifyContent="center">
                  {collectives.map(c => {
                    return (
                      <Flex key={c.id} width={[1, 1 / 2, 1 / 4]} mb={3} justifyContent="center">
                        {collectiveChecks.isPledge() ? (
                          <PledgedCollectiveCard collective={c} LoggedInUser={LoggedInUser} />
                        ) : (
                          <CollectiveCard collective={c} LoggedInUser={LoggedInUser} />
                        )}
                      </Flex>
                    );
                  })}
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
