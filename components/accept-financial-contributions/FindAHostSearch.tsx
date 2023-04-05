import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { Account, Host } from '../../lib/graphql/types/v2/graphql';

import { Box } from '../Grid';
import Loading from '../Loading';
import MessageBox from '../MessageBox';
import { P } from '../Text';

import FeaturedFiscalHostResults from './FeaturedFiscalHostResults';
import OtherFiscalHostResults from './OtherFiscalHostResults';

function useNonEmptyResultCache(data) {
  const nonEmptyResult = React.useRef(data);
  React.useEffect(() => {
    if (data && data?.hosts?.nodes?.length !== 0) {
      nonEmptyResult.current = data;
    }
  }, [data]);

  return nonEmptyResult.current;
}

const FindAFiscalHostQuery = gql`
  query FindAFiscalHostQuery($tags: [String], $limit: Int, $country: [CountryISO], $currency: String) {
    hosts(tag: $tags, limit: $limit, tagSearchOperator: OR, country: $country, currency: $currency) {
      totalCount
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

export default function FindAHostSearch(props: {
  communityTags: string[];
  selectedCountry: string;
  selectedCurrency: string;
  collective: Account;
  onHostApplyClick: (host: Partial<Host>) => void;
}) {
  const { data, loading } = useQuery<{
    hosts: {
      totalCount: number;
      nodes: Pick<Host, 'slug' | 'currency' | 'totalHostedCollectives' | 'hostFeePercent' | 'isTrustedHost'>[];
    };
  }>(FindAFiscalHostQuery, {
    variables: {
      tags: props.communityTags.length !== 0 ? props.communityTags : undefined,
      country: props.selectedCountry !== 'ALL' ? [props.selectedCountry] : null,
      currency: props.selectedCurrency !== 'ANY' ? props.selectedCurrency : null,
      limit: 50,
    },
    context: API_V2_CONTEXT,
  });

  const cachedNonEmptyResult = useNonEmptyResultCache(data);

  if (loading) {
    return (
      <Box mt={2}>
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
  const otherHosts = hosts.filter(host => !host.isTrustedHost);

  return (
    <React.Fragment>
      {isEmpty && (
        <MessageBox mb={3} type="warning">
          <FormattedMessage defaultMessage="We could not find a host that matches all your criteria." />
        </MessageBox>
      )}

      {featuredHosts.length !== 0 && (
        <Box mb={3}>
          <FeaturedFiscalHostResults
            collective={props.collective}
            hosts={featuredHosts}
            onHostApplyClick={props.onHostApplyClick}
          />
        </Box>
      )}
      {otherHosts.length !== 0 && (
        <Box padding={4}>
          <OtherFiscalHostResults
            collective={props.collective}
            hosts={otherHosts}
            totalCount={displayData.hosts.totalCount - featuredHosts.length}
            onHostApplyClick={props.onHostApplyClick}
          />
        </Box>
      )}
    </React.Fragment>
  );
}
