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
      ... on AccountWithHost {
        host {
          legacyId
          slug
          id
          type
          name
          imageUrl
          settings
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

const VirtualCards = props => {
  const router = useRouter();
  const routerQuery = omit(router.query, ['slug', 'section']);
  const offset = parseInt(routerQuery.offset) || 0;
  const { state, merchant, period } = routerQuery;
  const { from: dateFrom, to: dateTo } = parseDateInterval(period);
  const { loading, data } = useQuery(virtualCardsQuery, {
    context: API_V2_CONTEXT,
    variables: {
      slug: props.collective.slug,
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

  const handleUpdateFilters = queryParams => {
    return router.push({
      pathname: `/${props.collective.slug}/admin/virtual-cards`,
      query: omitBy({ ...routerQuery, ...queryParams }, value => !value),
    });
  };

  return (
    <Box width={['366px', '764px']}>
      <Box>
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
        {props.collective.host?.settings?.virtualcards?.policy && (
          <P mt={3}>
            <Collapse
              title={
                <FormattedMessage
                  id="VirtualCards.Policy.Reminder"
                  defaultMessage="{hostName} Virtual Card use Policy"
                  values={{
                    hostName: props.collective.host.name,
                  }}
                />
              }
            >
              <HTMLContent content={props.collective.host?.settings?.virtualcards?.policy} />
            </Collapse>
          </P>
        )}
        <Flex mt={3} flexDirection={['row', 'column']}>
          <VirtualCardFilters
            filters={routerQuery}
            collective={props.collective}
            host={props.collective.host}
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
            confirmOnPauseCard={props.collective.type === CollectiveType.COLLECTIVE}
            key={virtualCard.id}
            virtualCard={virtualCard}
            onDeleteRefetchQuery="AccountVirtualCards"
          />
        ))}
      </Grid>
      <Flex mt={5} justifyContent="center">
        <Pagination
          route={`/${props.collective.slug}/admin/virtual-cards`}
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
  collective: PropTypes.shape({
    slug: PropTypes.string,
    type: PropTypes.string,
    virtualCards: PropTypes.object,
    virtualCardMerchants: PropTypes.array,
    host: PropTypes.object,
  }),
  hideTopsection: PropTypes.func,
};

export default VirtualCards;
