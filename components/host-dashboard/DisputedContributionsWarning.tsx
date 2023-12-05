import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import { Box, Flex } from '../Grid';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import { P } from '../Text';

type DisputedContributionsWarningProps = {
  hasDisputedOrders: boolean;
  hasInReviewOrders: boolean;
  hostSlug: string;
};

const disputesQuery = gql`
  query DisputedContributionsWarning($hostSlug: String!) {
    host(slug: $hostSlug) {
      id
      slug
      hasDisputedOrders
      hasInReviewOrders
    }
  }
`;

export const DisputedContributionsWarning = ({ hostSlug }: DisputedContributionsWarningProps) => {
  const { data, loading } = useQuery(disputesQuery, { variables: { hostSlug }, context: API_V2_CONTEXT });
  const { host } = data || {};
  if (!host || (!host.hasDisputedOrders && !host.hasInReviewOrders)) {
    return null;
  }

  return (
    <Box mb={4}>
      {loading ? (
        <LoadingPlaceholder height={98} />
      ) : (
        <MessageBox type="warning" withIcon>
          <Flex
            flexDirection={host.hasDisputedOrders && host.hasInReviewOrders ? 'column' : 'row'}
            gridGap={'8px'}
            flexWrap={'wrap'}
          >
            <P fontWeight={700}>
              <FormattedMessage id="host.fraudProtectionWarning" defaultMessage="Fraud Protection Warning" />
            </P>
            {host.hasDisputedOrders && (
              <P>
                <FormattedMessage
                  id="host.disputes.warning"
                  defaultMessage="There are disputed charges that need review."
                />{' '}
                <Link href={`/${hostSlug}/admin/orders?status=DISPUTED`}>
                  <FormattedMessage defaultMessage="Disputed Contributions" />
                </Link>
              </P>
            )}
            {host.hasInReviewOrders && (
              <P>
                <FormattedMessage
                  id="host.in_review.warning"
                  defaultMessage="There are charges under review that need attention."
                />{' '}
                <Link href={`/${hostSlug}/admin/orders?status=IN_REVIEW`}>
                  <FormattedMessage defaultMessage="In Review Contributions" />
                </Link>
              </P>
            )}
          </Flex>
        </MessageBox>
      )}
    </Box>
  );
};
