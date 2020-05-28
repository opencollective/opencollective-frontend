import React from 'react';
import PropTypes from 'prop-types';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';

import ContributeCardsContainer from '../collective-page/ContributeCardsContainer';

import ContributeCardContainer from './ContributeCardContainer';
import CreateNew from './CreateNew';
import DraggableContributeCardWrapper from './DraggableContributeCardWrapper';

/**
 * Display a list of contribution cards wrapped in a DragAndDrop provider
 */
const AdminContributeCardsContainer = ({ collective, cards, onContributionCardMove, onContributionCardDrop }) => {
  const isEvent = collective.type === CollectiveType.EVENT;
  const createContributionTierRoute = isEvent
    ? `/${collective.parentCollective?.slug || 'collective'}/events/${collective.slug}/edit#tiers`
    : `/${collective.slug}/edit/tiers`;

  return (
    <DndProvider backend={HTML5Backend}>
      <ContributeCardsContainer>
        {cards.map(({ key, Component, componentProps }, index) => (
          <ContributeCardContainer key={key}>
            <DraggableContributeCardWrapper
              key={key}
              Component={Component}
              componentProps={componentProps}
              index={index}
              onMove={onContributionCardMove}
              onDrop={onContributionCardDrop}
            />
          </ContributeCardContainer>
        ))}
        <ContributeCardContainer>
          <CreateNew data-cy="create-contribute-tier" route={createContributionTierRoute}>
            <FormattedMessage id="Contribute.CreateTier" defaultMessage="Create Contribution Tier" />
          </CreateNew>
        </ContributeCardContainer>
      </ContributeCardsContainer>
    </DndProvider>
  );
};

AdminContributeCardsContainer.propTypes = {
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  ).isRequired,
  collective: PropTypes.shape({
    slug: PropTypes.string,
    type: PropTypes.string,
    parentCollective: PropTypes.shape({
      slug: PropTypes.string,
    }),
  }).isRequired,
  onContributionCardMove: PropTypes.func.isRequired,
  onContributionCardDrop: PropTypes.func.isRequired,
};

export default AdminContributeCardsContainer;
