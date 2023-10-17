import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { omit, omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../../../lib/constants/collectives';
import { parseDateInterval } from '../../../../lib/date-utils';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';

import Collapse from '../../../Collapse';
import { Box, Flex, Grid } from '../../../Grid';
import HTMLContent from '../../../HTMLContent';
import { getI18nLink } from '../../../I18nFormatters';
import Loading from '../../../Loading';
import Pagination from '../../../Pagination';
import { P } from '../../../Text';
import VirtualCard from '../../VirtualCard';

import VirtualCardFilters from './VirtualCardFilters';

const virtualCardsQuery = gql`
  query AccountVirtualCards(
    $slug: String
    $limit: Int!
    $offset: Int!
    $state: String
    $merchantAccount: AccountReferenceInput
    $dateFrom: DateTime
    $dateTo: DateTime
  ) {
    account(slug: $slug) {
      id
      legacyId
      slug
      type
      name
      imageUrl
      currency
      ... on AccountWithHost {
        isApproved
        host {
          legacyId
          slug
          id
          type
          name
          imageUrl
          settings
          currency
        }
      }
      virtualCards(
        limit: $limit
        offset: $offset
        state: $state
        merchantAccount: $merchantAccount
        dateFrom: $dateFrom
        dateTo: $dateTo
      ) {
        totalCount
        limit
        offset
        nodes {
          id
          name
          last4
          data
          currency
          provider
          privateData
          createdAt
          spendingLimitAmount
          spendingLimitInterval
          spendingLimitRenewsOn
          remainingLimit
          account {
            id
            slug
            name
            imageUrl
          }
          assignee {
            id
            name
            slug
            imageUrl
          }
        }
      }
      virtualCardMerchants {
        nodes {
          id
          type
          slug
          name
          currency
          location {
            id
            address
            country
          }
          imageUrl(height: 64)
        }
      }
    }
  }
`;

const VIRTUAL_CARDS_PER_PAGE = 6;

const VirtualCards = ({ accountSlug, isDashboard }) => {
  const router = useRouter();
  const routerQuery = omit(router.query, ['slug', 'section']);
  const offset = parseInt(routerQuery.offset) || 0;
  const { state, merchant, period } = routerQuery;
  const { from: dateFrom, to: dateTo } = parseDateInterval(period);
  const { loading, data } = useQuery(virtualCardsQuery, {
    context: API_V2_CONTEXT,
    variables: {
      slug: accountSlug,
      limit: VIRTUAL_CARDS_PER_PAGE,
      offset,
      state,
      merchantAccount: { slug: merchant },
      dateFrom: dateFrom,
      dateTo: dateTo,
    },
  });

  if (loading) {
    return <Loading />;
  }
  const pageRoute = isDashboard ? `/dashboard/${accountSlug}/virtual-cards` : `/${accountSlug}/admin/virtual-cards`;

  const handleUpdateFilters = queryParams => {
    return router.push({
      pathname: pageRoute,
      query: omitBy({ ...routerQuery, ...queryParams }, value => !value),
    });
  };

  return (
    <Box>
      <Box>
        {!isDashboard && (
          <P>
            <FormattedMessage
              id="VirtualCards.Description"
              defaultMessage="Use a virtual card to spend from your collective's budget. You can request multiple cards (review the host's policy to see how many). Your fiscal host will create the card for you and assign it a limit and a merchant. You will be notified by email once the card is assigned. <learnMoreLink>Learn more</learnMoreLink>"
              values={{
                learnMoreLink: getI18nLink({
                  href: 'https://docs.opencollective.com/help/expenses-and-getting-paid/virtual-cards',
                  openInNewTabNoFollow: true,
                }),
              }}
            />
          </P>
        )}

        {data.account.host?.settings?.virtualcards?.policy && (
          <P mt={3}>
            <Collapse
              title={
                <FormattedMessage
                  id="VirtualCards.Policy.Reminder"
                  defaultMessage="{hostName} Virtual Card use Policy"
                  values={{
                    hostName: data.account.host.name,
                  }}
                />
              }
            >
              <HTMLContent content={data.account.host?.settings?.virtualcards?.policy} />
            </Collapse>
          </P>
        )}
        <Flex mt={3} flexDirection={['row', 'column']}>
          <VirtualCardFilters
            filters={routerQuery}
            collective={data.account}
            host={data.account.host}
            virtualCardMerchants={data.account.virtualCardMerchants.nodes}
            onChange={queryParams => handleUpdateFilters({ ...queryParams, offset: null })}
            displayPeriodFilter
          />
        </Flex>
      </Box>
      <Grid mt={4} gridTemplateColumns={['100%', '366px 366px']} gridGap="32px 24px">
        {data.account.virtualCards.nodes.map(virtualCard => (
          <VirtualCard
            host={data.account.host}
            canEditVirtualCard={virtualCard.data.status === 'active'}
            canPauseOrResumeVirtualCard
            canDeleteVirtualCard
            confirmOnPauseCard={data.account.type === CollectiveType.COLLECTIVE}
            key={virtualCard.id}
            virtualCard={virtualCard}
            onDeleteRefetchQuery="AccountVirtualCards"
          />
        ))}
      </Grid>
      <Flex mt={5} justifyContent="center">
        <Pagination
          route={pageRoute}
          total={data.account.virtualCards.totalCount}
          limit={VIRTUAL_CARDS_PER_PAGE}
          offset={offset}
          ignoredQueryParams={['slug', 'section']}
        />
      </Flex>
    </Box>
  );
};

VirtualCards.propTypes = {
  accountSlug: PropTypes.string.isRequired,
  isDashboard: PropTypes.bool,
};

export default VirtualCards;
