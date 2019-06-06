import React from 'react';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import { FixedSizeGrid } from 'react-window';
import { truncate, omit } from 'lodash';
import styled from 'styled-components';

import Roles from '../constants/roles';
import { CollectiveType } from '../constants/collectives';
import formatMemberRole from '../lib/i18n-member-role';
import withIntl from '../lib/withIntl';
import withViewport, { VIEWPORTS } from '../lib/withViewport';

import Link from './Link';
import { P } from './Text';
import StyledCard from './StyledCard';
import Container from './Container';
import Avatar from './Avatar';
import { fadeIn } from './StyledKeyframes';

// Define static dimensions
const COLLECTIVE_CARD_MARGIN_X = 32;
const COLLECTIVE_CARD_MARGIN_Y = 26;
const COLLECTIVE_CARD_WIDTH = 144;
const COLLECTIVE_CARD_HEIGHT = 226;
const COLLECTIVE_CARD_FULL_WIDTH = COLLECTIVE_CARD_WIDTH + COLLECTIVE_CARD_MARGIN_X;

/**
 * Override the default grid to disable fixed width. As we use the full screen width
 * this is not necessary.
 */
const GridContainer = React.forwardRef(({ style, ...props }, ref) => {
  return <div ref={ref} style={omit(style, ['width'])} {...props} />;
});

GridContainer.displayName = 'GridContainer';

GridContainer.propTypes = {
  style: PropTypes.object,
};

/**
 * Add margin to the inner container width
 */
const GridInnerContainer = ({ style, ...props }) => {
  return <div style={{ ...style, width: style.width + 32 }} {...props} />;
};

GridInnerContainer.propTypes = {
  style: PropTypes.object,
};

/** Cards to show individual contributors */
const ContributorCard = styled(StyledCard)`
  animation: ${fadeIn} 0.3s;
  padding: 20px 8px;

  a {
    text-decoration: none;
  }
`;

/** Get an index in a single dimension array from a matrix coordinate */
const getIdx = (colIndex, rowIndex, nbCols) => {
  return rowIndex * nbCols + colIndex;
};

/** Get the items repartition, aka the number of columns and rows. */
const getItemsRepartition = (nbItems, width, maxNbRows) => {
  const maxVisibleNbCols = Math.trunc(width / COLLECTIVE_CARD_FULL_WIDTH);
  const maxVisibleItems = maxVisibleNbCols * maxNbRows;

  if (nbItems <= maxVisibleItems) {
    // If all items can fit in the view without scrolling, we arrange the view
    // to fit them all by showing fully filled lines
    const nbCols = maxVisibleNbCols;
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
const ContributorsGrid = ({ intl, members, width, maxNbRowsForViewports, viewport }) => {
  const maxNbRows = maxNbRowsForViewports[viewport];
  const [nbCols, nbRows] = getItemsRepartition(members.length, width, maxNbRows);

  // Preload more items when viewport width is unknown to avoid displaying blank spaces on SSR
  const viewWidth = viewport === VIEWPORTS.UNKNOWN ? width * 3 : width;

  return (
    <FixedSizeGrid
      columnCount={nbCols}
      columnWidth={COLLECTIVE_CARD_FULL_WIDTH}
      height={(COLLECTIVE_CARD_HEIGHT + COLLECTIVE_CARD_MARGIN_Y) * nbRows + COLLECTIVE_CARD_MARGIN_Y}
      rowCount={nbRows}
      rowHeight={COLLECTIVE_CARD_HEIGHT + COLLECTIVE_CARD_MARGIN_Y}
      width={viewWidth}
      outerElementType={GridContainer}
      innerElementType={GridInnerContainer}
      itemKey={({ columnIndex, rowIndex }) => {
        const idx = getIdx(columnIndex, rowIndex, nbCols);
        return idx < members.length ? members[idx].id : `empty-${idx}`;
      }}
    >
      {({ columnIndex, rowIndex, style }) => {
        const idx = getIdx(columnIndex, rowIndex, nbCols);
        if (idx >= members.length) {
          return null;
        }

        const { id, role, collective } = members[idx];
        return (
          <ContributorCard
            key={id}
            style={{
              ...style,
              left: style.left + COLLECTIVE_CARD_MARGIN_X,
              top: style.top + COLLECTIVE_CARD_MARGIN_Y,
              width: style.width - COLLECTIVE_CARD_MARGIN_X,
              height: style.height - COLLECTIVE_CARD_MARGIN_Y,
            }}
          >
            <Flex justifyContent="center" mb={3}>
              <Link route="collective" params={{ slug: collective.slug }}>
                <Avatar src={collective.image} radius={56} name={collective.name} />
              </Link>
            </Flex>
            <Container display="flex" textAlign="center" flexDirection="column" justifyContent="center">
              <Link route="collective" passHref params={{ slug: collective.slug }} title={collective.name}>
                <P fontSize="Paragraph" fontWeight="bold" lineHeight="Caption" color="black.900">
                  {truncate(collective.name, { length: 42 })}
                </P>
              </Link>
              <P fontSize="Tiny" lineHeight="Caption" color="black.500">
                {formatMemberRole(intl, role)}
              </P>
            </Container>
          </ContributorCard>
        );
      }}
    </FixedSizeGrid>
  );
};

ContributorsGrid.propTypes = {
  /** The members */
  members: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      role: PropTypes.oneOf(Object.values(Roles)).isRequired,
      collective: PropTypes.shape({
        id: PropTypes.number.isRequired,
        type: PropTypes.oneOf(Object.values(CollectiveType)).isRequired,
        slug: PropTypes.string.isRequired,
        name: PropTypes.string,
        image: PropTypes.string,
      }).isRequired,
    }),
  ),

  /** Maximum number of rows for different viewports. Will fallback on `defaultNbRows` if not provided */
  maxNbRowsForViewports: PropTypes.shape({
    [VIEWPORTS.UNKNOWN]: PropTypes.number,
    [VIEWPORTS.MOBILE]: PropTypes.number,
    [VIEWPORTS.TABLET]: PropTypes.number,
    [VIEWPORTS.DESKTOP]: PropTypes.number,
    [VIEWPORTS.WIDESCREEN]: PropTypes.number,
  }).isRequired,

  /** @ignore from withViewport */
  viewport: PropTypes.oneOf(Object.values(VIEWPORTS)),

  /** @ignore from withViewport */
  width: PropTypes.number.isRequired,

  /** @ignore from withIntl */
  intl: PropTypes.object.isRequired,
};

ContributorsGrid.defaultProps = {
  limit: 30,
  defaultNbRows: 1,
  maxNbRowsForViewports: {
    [VIEWPORTS.UNKNOWN]: 1,
    [VIEWPORTS.MOBILE]: 1,
    [VIEWPORTS.TABLET]: 2,
    [VIEWPORTS.DESKTOP]: 3,
    [VIEWPORTS.WIDESCREEN]: 3,
  },
};

export default withIntl(withViewport(ContributorsGrid, { withWidth: true }));
