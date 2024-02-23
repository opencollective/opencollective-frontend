import React from 'react';
import { useQuery } from '@apollo/client';
import { take } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import type { Account, Host } from '../../lib/graphql/types/v2/graphql';

import { Box, Flex } from '../Grid';
import Loading from '../Loading';
import MessageBox from '../MessageBox';
import Pagination from '../Pagination';
import { P } from '../Text';

import FeaturedFiscalHostResults from './FeaturedFiscalHostResults';
import OtherFiscalHostResults from './OtherFiscalHostResults';

function useNonEmptyResultCache<T extends { hosts: { nodes: unknown[] } }>(data: T) {
  const nonEmptyResult = React.useRef(data);
  React.useEffect(() => {
    if (data && data?.hosts?.nodes?.length !== 0) {
      nonEmptyResult.current = data;
    }
  }, [data]);

  return nonEmptyResult.current;
}

const FindAFiscalHostQuery = gql`
  query FindAFiscalHost(
    $tags: [String]
    $limit: Int
    $offset: Int
    $country: [CountryISO]
    $currency: String
    $searchTerm: String
  ) {
    hosts(
      tag: $tags
      limit: $limit
      offset: $offset
      tagSearchOperator: OR
      country: $country
      currency: $currency
      searchTerm: $searchTerm
    ) {
      totalCount
      limit
      offset
      nodes {
        id
        legacyId
        createdAt
        settings
        type
        name
        slug
        description
        longDescription
        currency
        totalHostedCollectives
        hostFeePercent
        isTrustedHost
        location {
          id
          country
        }
        tags
      }
    }
  }
`;

const NB_HOST_PER_PAGE = 30;

export default function FindAHostSearch(props: {
  communityTags: string[];
  selectedCountry: string;
  selectedCurrency: string;
  searchTerm: string;
  collective: Account;
  onHostApplyClick: (host: Partial<Host>) => void;
}) {
  const scrollRef = React.useRef<HTMLDivElement>();
  const [queryPage, setQueryPage] = React.useState(1);

  // Return to first page when filters change.
  React.useEffect(() => {
    setQueryPage(1);
  }, [props.communityTags, props.selectedCountry, props.selectedCurrency, props.searchTerm]);

  const onPageChange = React.useCallback(
    (page: number) => {
      setQueryPage(page);
      scrollRef.current.scrollIntoView();
    },
    [scrollRef],
  );

  const { data, loading } = useQuery<{
    hosts: {
      totalCount: number;
      limit: number;
      offset: number;
      nodes: Pick<Host, 'slug' | 'currency' | 'totalHostedCollectives' | 'hostFeePercent' | 'isTrustedHost'>[];
    };
  }>(FindAFiscalHostQuery, {
    variables: {
      searchTerm: props.searchTerm,
      tags: props.communityTags.length !== 0 ? props.communityTags : undefined,
      country: props.selectedCountry !== 'ALL' ? [props.selectedCountry] : null,
      currency: props.selectedCurrency !== 'ANY' ? props.selectedCurrency : null,
      limit: NB_HOST_PER_PAGE,
      offset: (queryPage - 1) * NB_HOST_PER_PAGE,
    },
    context: API_V2_CONTEXT,
  });

  const cachedNonEmptyResult = useNonEmptyResultCache(data);

  if (loading) {
    return (
      <Box mt={3}>
        <P fontSize="24px" lineHeight="32px" fontWeight="700" color="black.900">
          <FormattedMessage defaultMessage="Finding the right host for you..." />
        </P>
        <Loading />
      </Box>
    );
  }

  const isEmpty = data?.hosts?.nodes?.length === 0;
  const displayData = isEmpty ? cachedNonEmptyResult : data;

  const hosts = displayData?.hosts?.nodes || [];

  const featuredHosts = hosts.filter(host => host.isTrustedHost);
  const topHosts = take(featuredHosts, 3);
  const otherHosts = [...featuredHosts.slice(topHosts.length), ...hosts.filter(host => !host.isTrustedHost)];

  return (
    <React.Fragment>
      <div ref={scrollRef} />

      {isEmpty && (
        <MessageBox mt={3} mb={4} type="warning">
          <FormattedMessage defaultMessage="We could not find a host that matches all your criteria." />
        </MessageBox>
      )}

      {topHosts.length !== 0 && (
        <Box my={4}>
          <FeaturedFiscalHostResults
            collective={props.collective}
            hosts={topHosts}
            onHostApplyClick={props.onHostApplyClick}
          />
        </Box>
      )}
      {otherHosts.length !== 0 && (
        <Box my={4} padding={4}>
          <OtherFiscalHostResults
            collective={props.collective}
            hosts={otherHosts}
            totalCount={displayData.hosts.totalCount - topHosts.length}
            onHostApplyClick={props.onHostApplyClick}
          />
        </Box>
      )}

      <Flex justifyContent="center">
        <Pagination
          variant="list"
          offset={displayData.hosts.offset}
          limit={displayData.hosts.limit}
          total={displayData.hosts.totalCount}
          onPageChange={onPageChange}
        />
      </Flex>
    </React.Fragment>
  );
}
