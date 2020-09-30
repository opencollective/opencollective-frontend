import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';

import ContributeCardsContainer from '../collective-page/ContributeCardsContainer';
import DndProviderHTML5Backend from '../DndProviderHTML5Backend';

import ContributeCardContainer from './ContributeCardContainer';
import CreateNew from './CreateNew';
import DraggableContributeCardWrapper from './DraggableContributeCardWrapper';

/**
 * Display a list of contribution cards wrapped in a DragAndDrop provider
 */
const AdminContributeCardsContainer = ({
  collective,
  cards,
  onContributionCardMove,
  onContributionCardDrop,
  onMount,
}) => {
  const isEvent = collective.type === CollectiveType.EVENT;
  const createContributionTierRoute = isEvent
    ? `/${collective.parentCollective?.slug || 'collective'}/events/${collective.slug}/edit/tiers`
    : `/${collective.slug}/edit/tiers`;

  React.useEffect(() => {
    if (onMount) {
      onMount();
    }
  }, [onMount]);

  return (
    <DndProviderHTML5Backend>
      <ContributeCardsContainer>
        {cards.map(({ key, Component, componentProps }, index) => (
          <ContributeCardContainer key={key}>
            {cards.length === 1 ? (
              <Component {...componentProps} />
            ) : (
              <DraggableContributeCardWrapper
                Component={Component}
                componentProps={componentProps}
                index={index}
                onMove={onContributionCardMove}
                onDrop={onContributionCardDrop}
              />
            )}
          </ContributeCardContainer>
        ))}
        <ContributeCardContainer>
          <CreateNew data-cy="create-contribute-tier" route={createContributionTierRoute}>
            <FormattedMessage id="Contribute.CreateTier" defaultMessage="Create Contribution Tier" />
          </CreateNew>
        </ContributeCardContainer>
      </ContributeCardsContainer>
    </DndProviderHTML5Backend>
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
  onMount: PropTypes.func,
};

export default AdminContributeCardsContainer;
