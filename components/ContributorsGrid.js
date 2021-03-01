import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import { FixedSizeGrid } from 'react-window';
import styled from 'styled-components';

import { CustomScrollbarCSS } from '../lib/styled-components-shared-styles';
import withViewport, { VIEWPORTS } from '../lib/withViewport';

import ContributorCard from './ContributorCard';
import { fadeIn } from './StyledKeyframes';
import { withUser } from './UserProvider';

// Define static dimensions
export const COLLECTIVE_CARD_MARGIN_X = 32;
const COLLECTIVE_CARD_MARGIN_Y = 26;
const COLLECTIVE_CARD_WIDTH = 144;
const COLLECTIVE_CARD_HEIGHT = 272;
const COLLECTIVE_CARD_FULL_WIDTH = COLLECTIVE_CARD_WIDTH + COLLECTIVE_CARD_MARGIN_X;

/** Adds custom scrollbar for Chrome */
const StyledGridContainer = styled.div`
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

/**
 * We have to define the outer container here because react-window doesn't
 * let you pass custom props to outer container.
 */
const getGridContainer = (paddingLeft, hasScroll) => {
  // eslint-disable-next-line react/prop-types
  const GridContainer = ({ style, ...props }, ref) => {
    return (
      <StyledGridContainer
        data-cy="contributors-grid"
        ref={ref}
        style={{
          ...style,
          width: '100%',
          paddingLeft,
          overflowX: hasScroll ? 'auto' : 'hidden',
        }}
        {...props}
      />
    );
  };

  return React.forwardRef(GridContainer);
};

/**
 * Add margin to the inner container width
 */
const GridInnerContainer = ({ style, ...props }) => {
  return <div style={{ ...style, position: 'relative', width: style.width + COLLECTIVE_CARD_MARGIN_X }} {...props} />;
};

GridInnerContainer.propTypes = {
  style: PropTypes.object,
};

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
 * A grid to show contributors, with horizontal scroll to search them.
 */
const ContributorsGrid = ({
  contributors,
  width,
  maxNbRowsForViewports,
  viewport,
  getPaddingLeft,
  currency,
  LoggedInUser,
  collectiveId,
}) => {
  const maxNbRows = maxNbRowsForViewports[viewport];
  const [nbCols, nbRows] = getItemsRepartition(contributors.length, width, maxNbRows);

  // Preload more items when viewport width is unknown to avoid displaying blank spaces on SSR
  const viewWidth = viewport === VIEWPORTS.UNKNOWN ? width * 3 : width;
  const rowWidth = nbCols * COLLECTIVE_CARD_FULL_WIDTH + COLLECTIVE_CARD_MARGIN_X;
  const paddingLeft = getPaddingLeft ? getPaddingLeft({ width, rowWidth, nbRows }) : 0;
  const hasScroll = rowWidth + paddingLeft > width;
  const loggedUserCollectiveId = get(LoggedInUser, 'CollectiveId');
  return (
    <FixedSizeGrid
      columnCount={nbCols}
      columnWidth={COLLECTIVE_CARD_FULL_WIDTH}
      height={(COLLECTIVE_CARD_HEIGHT + COLLECTIVE_CARD_MARGIN_Y) * nbRows + COLLECTIVE_CARD_MARGIN_Y}
      rowCount={nbRows}
      rowHeight={COLLECTIVE_CARD_HEIGHT + COLLECTIVE_CARD_MARGIN_Y}
      width={viewWidth}
      outerElementType={getGridContainer(paddingLeft, hasScroll)}
      innerElementType={GridInnerContainer}
      itemKey={({ columnIndex, rowIndex }) => {
        const idx = getContributorIdx(columnIndex, rowIndex, nbRows, nbCols, hasScroll);
        return idx < contributors.length ? contributors[idx].id : `empty-${idx}`;
      }}
    >
      {({ columnIndex, rowIndex, style }) => {
        const idx = getContributorIdx(columnIndex, rowIndex, nbRows, nbCols, hasScroll);
        const contributor = contributors[idx];
        return !contributor ? null : (
          <ContributorCardContainer
            key={contributor.id}
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
      }}
    </FixedSizeGrid>
  );
};

ContributorsGrid.propTypes = {
  /** The contributors */
  contributors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      collectiveId: PropTypes.number,
    }),
  ),

  /** Maximum number of rows for different viewports. Will fallback on `defaultNbRows` if not provided */
  maxNbRowsForViewports: PropTypes.shape({
    [VIEWPORTS.UNKNOWN]: PropTypes.number,
    [VIEWPORTS.XSMALL]: PropTypes.number,
    [VIEWPORTS.SMALL]: PropTypes.number,
    [VIEWPORTS.MEDIUM]: PropTypes.number,
    [VIEWPORTS.LARGE]: PropTypes.number,
  }).isRequired,

  /** A callback to calculate left padding */
  getPaddingLeft: PropTypes.func,

  /** Currency used for contributions */
  currency: PropTypes.string,

  /** @ignore from withViewport */
  viewport: PropTypes.oneOf(Object.values(VIEWPORTS)),

  /** @ignore from withViewport */
  width: PropTypes.number.isRequired,

  /** @ignore from withUser */
  LoggedInUser: PropTypes.shape({
    CollectiveId: PropTypes.number,
  }),

  /** Collective id */
  collectiveId: PropTypes.number,
};

ContributorsGrid.defaultProps = {
  limit: 30,
  defaultNbRows: 1,
  maxNbRowsForViewports: {
    [VIEWPORTS.UNKNOWN]: 1,
    [VIEWPORTS.XSMALL]: 1,
    [VIEWPORTS.SMALL]: 2,
    [VIEWPORTS.MEDIUM]: 3,
    [VIEWPORTS.LARGE]: 3,
  },
};

export default withViewport(withUser(ContributorsGrid), { withWidth: true });
