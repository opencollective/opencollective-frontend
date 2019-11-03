import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Box } from '@rebass/grid';
import dynamic from 'next/dynamic';

import CreateNew from './CreateNew';
import ContributeTier from './ContributeTier';
import ContributeCustom from './ContributeCustom';

const ContributeTiersPanel = ({
  isAdmin,
  collective,
  sortedTiers,
  hasNoContributor,
  contributorsStats,
  handleSettingsUpdate,
  CONTRIBUTE_CARD_PADDING_X,
  financialContributorsWithoutTier,
}) => {
  const StyledDragDrop = dynamic(() => import(/* webpackChunkName: 'StyledDragDrop' */ '../StyledDragDrop'));

  if (!isAdmin) {
    return (
      <Fragment>
        <Box px={CONTRIBUTE_CARD_PADDING_X}>
          <ContributeCustom
            collective={collective}
            contributors={financialContributorsWithoutTier}
            stats={contributorsStats}
            hideContributors={hasNoContributor}
          />
        </Box>
        {sortedTiers.map(tier => (
          <Box key={tier.id} px={CONTRIBUTE_CARD_PADDING_X}>
            <ContributeTier collective={collective} tier={tier} hideContributors={hasNoContributor} />
          </Box>
        ))}
      </Fragment>
    );
  } else
    return (
      <Fragment>
        <Box px={CONTRIBUTE_CARD_PADDING_X}>
          <CreateNew data-cy="create-contribute-tier" route={`/${collective.slug}/edit/tiers`}>
            <FormattedMessage id="Contribute.CreateTier" defaultMessage="Create Contribution Tier" />
          </CreateNew>
        </Box>
        <Box px={CONTRIBUTE_CARD_PADDING_X}>
          <ContributeCustom
            collective={collective}
            contributors={financialContributorsWithoutTier}
            stats={contributorsStats}
            hideContributors={hasNoContributor}
          />
        </Box>
        {sortedTiers.map(tier => (
          <Box key={tier.id} px={CONTRIBUTE_CARD_PADDING_X}>
            <ContributeTier collective={collective} tier={tier} hideContributors={hasNoContributor} />
          </Box>
        ))}
      </Fragment>
    );
};

ContributeTiersPanel.propTypes = {
  isAdmin: PropTypes.bool.isRequired,
  collective: PropTypes.object.isRequired,
  sortedTiers: PropTypes.array.isRequired,
  hasNoContributor: PropTypes.bool.isRequired,
  contributorsStats: PropTypes.object,
  handleSettingsUpdate: PropTypes.func.isRequired,
  CONTRIBUTE_CARD_PADDING_X: PropTypes.array.isRequired,
  financialContributorsWithoutTier: PropTypes.array.isRequired,
};

export default ContributeTiersPanel;
