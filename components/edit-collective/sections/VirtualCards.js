import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import { Box, Flex, Grid } from '../../Grid';
import Loading from '../../Loading';
import Pagination from '../../Pagination';
import { P } from '../../Text';
import SettingsTitle from '../SettingsTitle';
import VirtualCard from '../VirtualCard';

const virtualCardsQuery = gqlV2/* GraphQL */ `
  query CollectiveVirtualCards($slug: String, $limit: Int!, $offset: Int!) {
    collective(slug: $slug) {
      id
      legacyId
      slug
      virtualCards(limit: $limit, offset: $offset) {
        totalCount
        limit
        offset
        nodes {
          id
          name
          last4
          data
          privateData
          createdAt
          account {
            id
            name
            imageUrl
          }
        }
      }
    }
  }
`;

const VIRTUAL_CARDS_PER_PAGE = 6;

const VirtualCards = props => {
  const router = useRouter();
  const offset = parseInt(router.query.offset) || 0;

  const { loading, data } = useQuery(virtualCardsQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: props.collective.slug, limit: VIRTUAL_CARDS_PER_PAGE, offset },
  });

  if (loading) {
    return <Loading />;
  }

  return (
    <Fragment>
      <SettingsTitle>
        <FormattedMessage id="VirtualCards.Title" defaultMessage="Virtual Cards" />
      </SettingsTitle>

      <Box>
        <P>
          <FormattedMessage
            id="VirtualCards.Description"
            defaultMessage="Use a virtual card to spend your collective's budget. You can request multiple ones. You Fiscal Host will create them for you and assign a limit and a merchant to them."
          />
        </P>
      </Box>
      <Grid mt={4} gridTemplateColumns={['100%', '366px 366px']} gridGap="32px 24px">
        {data.collective.virtualCards.nodes.map(vc => (
          <VirtualCard key={vc.id} {...vc} />
        ))}
      </Grid>
      <Flex mt={5} justifyContent="center">
        <Pagination
          route={`/${props.collective.slug}/edit/virtual-cards`}
          total={data.collective.virtualCards.totalCount}
          limit={VIRTUAL_CARDS_PER_PAGE}
          offset={offset}
          ignoredQueryParams={['slug', 'section']}
          scrollToTopOnChange
        />
      </Flex>
    </Fragment>
  );
};

VirtualCards.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string,
    virtualCards: PropTypes.object,
  }),
  hideTopsection: PropTypes.func,
};

export default VirtualCards;
