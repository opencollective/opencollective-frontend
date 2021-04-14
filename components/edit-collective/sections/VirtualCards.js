import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import { Box, Grid } from '../../Grid';
import Loading from '../../Loading';
import { P } from '../../Text';
import SettingsTitle from '../SettingsTitle';
import VirtualCard from '../VirtualCard';

const virtualCardsQuery = gqlV2/* GraphQL */ `
  query CollectiveVirtualCards($slug: String) {
    collective(slug: $slug) {
      id
      legacyId
      slug
      virtualCards {
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
`;

const VirtualCards = props => {
  const { loading, data } = useQuery(virtualCardsQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: props.collective.slug },
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
        {data.collective.virtualCards.map(vc => (
          <VirtualCard key={vc.id} {...vc} />
        ))}
      </Grid>
    </Fragment>
  );
};

VirtualCards.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string,
  }),
  hideTopsection: PropTypes.func,
};

export default VirtualCards;
