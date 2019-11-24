import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Box } from '@rebass/grid';
import dynamic from 'next/dynamic';

import { Pencil } from 'styled-icons/boxicons-solid/Pencil';
import { Move } from 'styled-icons/boxicons-regular/Move';
import { Close } from 'styled-icons/material/Close';
import styled from 'styled-components';
import memoizeOne from 'memoize-one';
import { get, concat, set } from 'lodash';

import CreateNew from './CreateNew';
import ContributeTier from './ContributeTier';
import ContributeCustom from './ContributeCustom';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { CONTRIBUTE_CARD_WIDTH } from './Contribute';
import colors from '../../lib/constants/colors';

const Handle = styled.div`
  background-color: ${({ bgColor }) => bgColor || colors.white};
  box-shadow: 1px 1px 1px ${colors.darkgray};
  opacity: ${({ hide }) => (hide ? 0 : 1)};
  transition: all 0.3s ease-out;
  justify-content: center;
  color: ${colors.white};
  align-items: center;
  margin-bottom: 5px;
  border-radius: 50%;
  outline: none;
  display: flex;
  height: 30px;
  width: 30px;
  > * {
    color: ${({ color }) => color || colors.darkgray};
  }
`;

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
  const CONTRIBUTE_CARD_HEIGHT = 341;

  const StyledDragDropPlaceHolder = () => (
    <LoadingPlaceholder width={CONTRIBUTE_CARD_WIDTH} heigth={CONTRIBUTE_CARD_HEIGHT} />
  );
  const dynamicOptions = { loading: StyledDragDropPlaceHolder, ssr: true };
  const StyledDragDrop = dynamic(
    () => import(/* webpackChunkName: 'StyledDragDrop' */ '../StyledDragDrop'),
    dynamicOptions,
  );

  const getTiersOrder = memoizeOne(() => {
    return get(collective, 'settings.collectivePage.tiersOrder', []).filter(i => i !== 'custom');
  });

  const handleShuffle = newTiersOrder => {
    const settings = get(collective, 'settings', {});

    set(settings, 'collectivePage.tiersOrder', concat(['custom'], newTiersOrder));

    handleSettingsUpdate(settings);
  };

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
        <StyledDragDrop
          handle={true}
          id={collective.id}
          items={sortedTiers}
          direction="horizontal"
          onShuffle={handleShuffle}
          itemsOrder={getTiersOrder()}
        >
          {({ item, cssHelper, handleProps: { wrapper, dragProps, hideDuringDrag } }) => (
            <Fragment>
              {wrapper(
                <Handle key={'move'} bgColor={colors.black} color={colors.white} {...dragProps}>
                  <Move size={15} />
                </Handle>,
                <Handle key={'pencil'} hide={hideDuringDrag}>
                  <Pencil size={15} />
                </Handle>,
                <Handle key={'close'} hide={hideDuringDrag}>
                  <Close size={15} />
                </Handle>,
              )}
              <Box key={item.id} px={CONTRIBUTE_CARD_PADDING_X}>
                <ContributeTier
                  css={cssHelper}
                  collective={collective}
                  tier={item}
                  hideContributors={hasNoContributor}
                />
              </Box>
            </Fragment>
          )}
        </StyledDragDrop>
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

export default React.memo(ContributeTiersPanel);
