import React from 'react';
import { useQuery } from '@apollo/client';
import { shuffle, take } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { gql } from '../../lib/graphql/helpers';
import type {
  Account,
  CountryIso,
  FindAFiscalHostQuery,
  FindAFiscalHostQueryVariables,
} from '../../lib/graphql/types/v2/graphql';

import { Box, Flex } from '../Grid';
import Loading from '../Loading';
import MessageBox from '../MessageBox';
import Pagination from '../Pagination';

import FeaturedFiscalHostResults from './FeaturedFiscalHostResults';
import OtherFiscalHostResults from './OtherFiscalHostResults';

function useNonEmptyResultCache(data: FindAFiscalHostQuery) {
  const nonEmptyResult = React.useRef(data);
  React.useEffect(() => {
    if (data && data?.hosts?.nodes?.length !== 0) {
      nonEmptyResult.current = data;
    }
  }, [data]);

  return nonEmptyResult.current;
}

const findAFiscalHostQuery = gql`
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
        isFirstPartyHost
        isVerified
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
}) {
  const scrollRef = React.useRef<HTMLDivElement>(undefined);
  const [queryPage, setQueryPage] = React.useState(1);
  const hasSearchTerm = props.searchTerm?.length > 0;
  const hasSearchParams =
    hasSearchTerm ||
    props.communityTags.length > 0 ||
    props.selectedCountry !== 'ALL' ||
    props.selectedCurrency !== 'ANY';

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

  const { data, loading } = useQuery<FindAFiscalHostQuery, FindAFiscalHostQueryVariables>(findAFiscalHostQuery, {
    variables: {
      searchTerm: hasSearchTerm ? props.searchTerm : undefined,
      tags: props.communityTags.length !== 0 ? props.communityTags : undefined,
      country: props.selectedCountry !== 'ALL' ? [props.selectedCountry as CountryIso] : null,
      currency: props.selectedCurrency !== 'ANY' ? props.selectedCurrency : null,
      limit: NB_HOST_PER_PAGE,
      offset: (queryPage - 1) * NB_HOST_PER_PAGE,
    },
  });

  const cachedNonEmptyResult = useNonEmptyResultCache(data);

  if (loading) {
    return (
      <div className="my-12 flex flex-col items-center gap-4">
        <h1 className="animate-pulse text-2xl font-bold">
          <FormattedMessage defaultMessage="Finding the right host for you..." id="D1CbmW" />
        </h1>
        <Loading />
      </div>
    );
  }

  const isEmpty = data?.hosts?.nodes?.length === 0;
  const displayData = isEmpty ? cachedNonEmptyResult : data;
  const hosts = displayData?.hosts?.nodes || [];
  const featuredHosts = hosts.filter(host => host.isFirstPartyHost);
  // We take top 6 matches when filtering, else we randomize to provide fair ordering
  const oficoMembers = hasSearchParams ? take(featuredHosts, 6) : shuffle(featuredHosts);
  const otherHosts = [...featuredHosts.slice(oficoMembers.length), ...hosts.filter(host => !host.isFirstPartyHost)];

  return (
    <React.Fragment>
      <div ref={scrollRef} />

      {isEmpty && (
        <MessageBox mt={3} mb={4} type="warning">
          <FormattedMessage defaultMessage="We could not find a host that matches all your criteria." id="3A7J9A" />
        </MessageBox>
      )}

      {oficoMembers.length !== 0 && (
        <Box my={4}>
          <FeaturedFiscalHostResults collective={props.collective} hosts={oficoMembers} />
        </Box>
      )}
      {otherHosts.length !== 0 && (
        <Box my={4} padding={4}>
          <OtherFiscalHostResults
            collective={props.collective}
            hosts={otherHosts}
            totalCount={displayData.hosts.totalCount - oficoMembers.length}
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
