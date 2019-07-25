import React from 'react';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import { FixedSizeGrid } from 'react-window';
import { truncate } from 'lodash';
import styled from 'styled-components';
import { injectIntl } from 'react-intl';

import roles from '../lib/constants/roles';
import formatMemberRole from '../lib/i18n-member-role';
import withViewport, { VIEWPORTS } from '../lib/withViewport';
import { CustomScrollbarCSS } from '../lib/styled-components-shared-styles';

import Link from './Link';
import { P } from './Text';
import Container from './Container';
import { ContributorAvatar } from './Avatar';
import { fadeIn } from './StyledKeyframes';
import { CollectiveType } from '../lib/constants/collectives';

// Define static dimensions
export const COLLECTIVE_CARD_MARGIN_X = 32;
const COLLECTIVE_CARD_MARGIN_Y = 26;
const COLLECTIVE_CARD_WIDTH = 144;
const COLLECTIVE_CARD_HEIGHT = 226;
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
const StyledContributorCard = styled.div.attrs(props => ({
  style: { top: props.top, left: props.left },
}))`
  animation: ${fadeIn} 0.3s;
  padding: 20px 8px;
  border: 1px solid #dcdee0;
  border-radius: 8px;
  background-color: #ffffff;
  overflow: hidden;
  width: 144px;
  position: absolute;
  height: 226px;

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

/** Returns the main role for contributor as a string */
const getRole = (contributor, intl) => {
  // Order of the if / else if makes the priority to decide which role we want to
  // show first. The priority order should be:
  // ADMIN > BACKER > FUNDRAISER > *
  // Everything that comes after follower is considered same priority so we just
  // take the first role in the list.
  if (contributor.isCore) {
    return formatMemberRole(intl, roles.ADMIN);
  } else if (contributor.isBacker) {
    return formatMemberRole(intl, roles.BACKER);
  } else if (contributor.isFundraiser) {
    return formatMemberRole(intl, roles.FUNDRAISER);
  } else {
    return formatMemberRole(intl, contributor.roles[0]);
  }
};

/**
 * A single contributor card, implemented as a PureComponent to improve performances
 */
class ContributorCard extends React.PureComponent {
  static propTypes = {
    intl: PropTypes.object.isRequired,
    contributor: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      roles: PropTypes.arrayOf(PropTypes.string.isRequired),
      type: PropTypes.oneOf(Object.values(CollectiveType)).isRequired,
      isCore: PropTypes.bool.isRequired,
      isBacker: PropTypes.bool.isRequired,
      isFundraiser: PropTypes.bool.isRequired,
      description: PropTypes.string,
      publicMessage: PropTypes.string,
      collectiveSlug: PropTypes.string,
    }).isRequired,
    left: PropTypes.number.isRequired,
    top: PropTypes.number.isRequired,
  };

  render() {
    const { left, top, contributor, intl } = this.props;
    const { collectiveSlug, name, description, publicMessage } = contributor;

    // Collective slug is optional, for example Github contributors won't have
    // a collective slug. This helper renders the link only if needed
    const withCollectiveLink = !collectiveSlug
      ? children => children
      : children => (
          <Link route="collective" params={{ slug: collectiveSlug }}>
            {children}
          </Link>
        );

    return (
      <StyledContributorCard left={left + COLLECTIVE_CARD_MARGIN_X} top={top + COLLECTIVE_CARD_MARGIN_Y}>
        <Flex justifyContent="center" mb={3}>
          {withCollectiveLink(<ContributorAvatar contributor={contributor} radius={56} />)}
        </Flex>
        <Container display="flex" textAlign="center" flexDirection="column" justifyContent="center">
          {withCollectiveLink(
            <P fontSize="Paragraph" fontWeight="bold" lineHeight="Caption" color="black.900" title={name}>
              {truncate(name, { length: 18 })}
            </P>,
          )}
          <P fontSize="Tiny" lineHeight="Caption" color="black.500">
            {getRole(contributor, intl)}
          </P>
          <P fontSize="Caption" fontWeight="bold" title={description}>
            {truncate(description, { length: 20 })}
          </P>
          {publicMessage && (
            <Container textAlign="center" color="black.600" fontSize="Tiny" my={2} title={publicMessage}>
              “{truncate(publicMessage, { length: 60 })}”
            </Container>
          )}
        </Container>
      </StyledContributorCard>
    );
  }
}

/**
 * A grid to show contributors, with horizontal scroll to search them.
 */
const ContributorsGrid = ({ intl, contributors, width, maxNbRowsForViewports, viewport, getPaddingLeft }) => {
  const maxNbRows = maxNbRowsForViewports[viewport];
  const [nbCols, nbRows] = getItemsRepartition(contributors.length, width, maxNbRows);

  // Preload more items when viewport width is unknown to avoid displaying blank spaces on SSR
  const viewWidth = viewport === VIEWPORTS.UNKNOWN ? width * 3 : width;
  const rowWidth = nbCols * COLLECTIVE_CARD_FULL_WIDTH + COLLECTIVE_CARD_MARGIN_X;
  const paddingLeft = getPaddingLeft ? getPaddingLeft({ width, rowWidth, nbRows }) : 0;
  const hasScroll = rowWidth + paddingLeft > width;

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
        const idx = getIdx(columnIndex, rowIndex, nbCols);
        return idx < contributors.length ? contributors[idx].id : `empty-${idx}`;
      }}
    >
      {({ columnIndex, rowIndex, style }) => {
        const idx = getIdx(columnIndex, rowIndex, nbCols);
        const contributor = contributors[idx];

        if (!contributor) {
          return null;
        }

        return (
          <ContributorCard
            key={contributor.id}
            contributor={contributor}
            left={style.left}
            top={style.top}
            intl={intl}
          />
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
      name: PropTypes.string.isRequired,
      roles: PropTypes.arrayOf(PropTypes.string.isRequired),
      isCore: PropTypes.bool.isRequired,
      isBacker: PropTypes.bool.isRequired,
      isFundraiser: PropTypes.bool.isRequired,
      description: PropTypes.string,
      collectiveSlug: PropTypes.string,
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

  /** A callback to calculate left padding */
  getPaddingLeft: PropTypes.func,

  /** @ignore from withViewport */
  viewport: PropTypes.oneOf(Object.values(VIEWPORTS)),

  /** @ignore from withViewport */
  width: PropTypes.number.isRequired,

  /** @ignore from injectIntl */
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

export default injectIntl(withViewport(ContributorsGrid, { withWidth: true }));
