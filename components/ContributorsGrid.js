import React from 'react';
import get from 'lodash-es/get';
import { Grid } from 'react-window';
import { styled } from 'styled-components';

import { CustomScrollbarCSS } from '../lib/styled-components-shared-styles';
import withViewport, { VIEWPORTS } from '../lib/withViewport';

import ContributorCard from './ContributorCard';
import { fadeIn } from './StyledKeyframes';
import { withUser } from './UserProvider';

// Define static dimensions
const COLLECTIVE_CARD_MARGIN_X = 32;
const COLLECTIVE_CARD_MARGIN_Y = 26;
const COLLECTIVE_CARD_WIDTH = 144;
const COLLECTIVE_CARD_HEIGHT = 220;
const COLLECTIVE_CARD_FULL_WIDTH = COLLECTIVE_CARD_WIDTH + COLLECTIVE_CARD_MARGIN_X;

/** Adds custom scrollbar for Chrome */
const StyledContributorsGrid = styled(Grid)`
  ${CustomScrollbarCSS}

  /** Hide scrollbar when not hovered */
  &:not(:hover) {
    &::-webkit-scrollbar-thumb {
      background: transparent;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }
`;

/** Cards to show individual contributors */
const ContributorCardContainer = styled.div`
  animation: ${fadeIn} 0.3s;
  position: absolute;
`;

/** Get an index in a single dimension array from a matrix coordinate */
const getContributorIdx = (colIndex, rowIndex, nbRows, nbCols, hasScroll) => {
  return hasScroll ? rowIndex + nbRows * colIndex : rowIndex * nbCols + colIndex;
};

/** Get the items repartition, aka the number of columns and rows. */
const getItemsRepartition = (nbItems, width, maxNbRows) => {
  const maxVisibleNbCols = Math.trunc(width / COLLECTIVE_CARD_FULL_WIDTH);
  const maxVisibleItems = maxVisibleNbCols * maxNbRows;

  if (nbItems <= maxVisibleItems) {
    // If all items can fit in the view without scrolling, we arrange the view
    // to fit them all by showing fully filled lines
    const nbCols = Math.min(maxVisibleNbCols, nbItems);
    const nbRows = Math.ceil(nbItems / maxVisibleNbCols);
    return [nbCols, nbRows];
  } else {
    // Otherwise we just place the items equally amongs maxNbRows
    const nbCols = Math.ceil(nbItems / maxNbRows);
    const nbRows = maxNbRows;
    return [nbCols, nbRows];
  }
};

/**
 * Compute the proper padding left to center the content according to max width
 */
const computePaddingLeft = (width, rowWidth, nbRows, maxWidthWhenNotFull) => {
  if (width < maxWidthWhenNotFull) {
    // No need for padding on screens small enough so they don't have padding
    return 0;
  } else if (nbRows > 1) {
    if (rowWidth <= width) {
      // If multiline and possible center contributors cards
      const cardsLeftOffset = COLLECTIVE_CARD_MARGIN_X / 2;
      return (width - rowWidth) / 2 - cardsLeftOffset;
    } else {
      // Otherwise if multiline and the grid is full, just use the full screen
      return 0;
    }
  } else {
    // Otherwise add a normal section padding on the left
    const cardsLeftOffset = COLLECTIVE_CARD_MARGIN_X / 2;
    return (width - Math.max(maxWidthWhenNotFull, rowWidth)) / 2 - cardsLeftOffset;
  }
};

const ContributorCell = ({
  columnIndex,
  rowIndex,
  style,
  contributors,
  nbRows,
  nbCols,
  hasScroll,
  currency,
  collectiveId,
  loggedUserCollectiveId,
}) => {
  const idx = getContributorIdx(columnIndex, rowIndex, nbRows, nbCols, hasScroll);
  const contributor = contributors[idx];
  return !contributor ? null : (
    <ContributorCardContainer
      style={{ left: style.left + COLLECTIVE_CARD_MARGIN_X, top: style.top + COLLECTIVE_CARD_MARGIN_Y }}
    >
      <ContributorCard
        data-cy="ContributorsGrid_ContributorCard"
        width={COLLECTIVE_CARD_WIDTH}
        height={COLLECTIVE_CARD_HEIGHT}
        contributor={contributor}
        currency={currency}
        collectiveId={collectiveId}
        isLoggedUser={contributor.collectiveId && loggedUserCollectiveId === contributor.collectiveId}
      />
    </ContributorCardContainer>
  );
};

const DEFAULT_MAX_NB_ROWS_FOR_VIEWPORTS = {
  [VIEWPORTS.UNKNOWN]: 1,
  [VIEWPORTS.XSMALL]: 1,
  [VIEWPORTS.SMALL]: 2,
  [VIEWPORTS.MEDIUM]: 3,
  [VIEWPORTS.LARGE]: 3,
};

/**
 * A grid to show contributors, with horizontal scroll to search them.
 */
const ContributorsGrid = ({
  contributors,
  width,
  maxNbRowsForViewports = DEFAULT_MAX_NB_ROWS_FOR_VIEWPORTS,
  viewport,
  maxWidthWhenNotFull,
  currency,
  LoggedInUser,
  collectiveId,
  gridRef,
}) => {
  const maxNbRows = maxNbRowsForViewports[viewport];
  const [nbCols, nbRows] = getItemsRepartition(contributors.length, width, maxNbRows);

  // Preload more items when viewport width is unknown to avoid displaying blank spaces on SSR
  const viewWidth = viewport === VIEWPORTS.UNKNOWN ? width * 3 : width;
  const rowWidth = nbCols * COLLECTIVE_CARD_FULL_WIDTH + COLLECTIVE_CARD_MARGIN_X;
  const paddingLeft = computePaddingLeft(width, rowWidth, nbRows, maxWidthWhenNotFull);
  const hasScroll = rowWidth + paddingLeft > width;
  const loggedUserCollectiveId = get(LoggedInUser, 'CollectiveId');
  const gridHeight = (COLLECTIVE_CARD_HEIGHT + COLLECTIVE_CARD_MARGIN_Y) * nbRows + COLLECTIVE_CARD_MARGIN_Y;

  return (
    <StyledContributorsGrid
      data-cy="contributors-grid"
      cellComponent={ContributorCell}
      cellProps={{
        contributors,
        nbRows,
        nbCols,
        hasScroll,
        currency,
        collectiveId,
        loggedUserCollectiveId,
      }}
      columnCount={nbCols}
      columnWidth={COLLECTIVE_CARD_FULL_WIDTH}
      rowCount={nbRows}
      rowHeight={COLLECTIVE_CARD_HEIGHT + COLLECTIVE_CARD_MARGIN_Y}
      defaultHeight={gridHeight}
      defaultWidth={viewWidth}
      style={{
        height: gridHeight,
        width: '100%',
        paddingLeft,
        paddingRight: COLLECTIVE_CARD_MARGIN_X,
        overflowX: hasScroll ? 'auto' : 'hidden',
      }}
      gridRef={gridRef}
    />
  );
};

export default withViewport(withUser(ContributorsGrid), { withWidth: true });
