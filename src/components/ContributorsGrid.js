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

import Link from './Link';
import { P } from './Text';
import StyledCard from './StyledCard';
import Container from './Container';
import Avatar from './Avatar';
import { fadeIn } from './StyledKeyframes';

/**
 * Override the default grid to disable fixed width. As we use the full screen width
 * this is not necessary.
 */
const GridContainer = React.forwardRef(({ style, ...props }, ref) => {
  return <div ref={ref} style={omit(style, ['width'])} {...props} />;
});

GridContainer.displayName = 'GridContainer';

/**
 * Add margin to the inner container width
 */
const GridInnerContainer = ({ style, ...props }) => {
  return <div style={{ ...style, width: style.width + 32 }} {...props} />;
};

/** Cards to show individual contributors */
const ContributorCard = styled(StyledCard)`
  animation: ${fadeIn} 0.3s;
  padding: 20px 8px;

  a {
    text-decoration: none;
  }
`;

const getIdx = (columnIndex, rowIndex, NB_COLS) => {
  return rowIndex * NB_COLS + columnIndex;
};

/**
 * A grid to show contributors, with horizontal scroll to search them.
 */
const ContributorsGrid = ({ intl, members, width, nbRows }) => {
  const COLLECTIVE_CARD_MARGIN_X = 32;
  const COLLECTIVE_CARD_MARGIN_Y = 26;
  const COLLECTIVE_CARD_WIDTH = 144;
  const COLLECTIVE_CARD_HEIGHT = 226;
  const NB_COLS = Math.trunc(members.length / nbRows);

  return (
    <FixedSizeGrid
      columnCount={members.length / nbRows}
      columnWidth={COLLECTIVE_CARD_WIDTH + COLLECTIVE_CARD_MARGIN_X}
      height={(COLLECTIVE_CARD_HEIGHT + COLLECTIVE_CARD_MARGIN_Y) * nbRows + COLLECTIVE_CARD_MARGIN_Y}
      rowCount={nbRows}
      rowHeight={COLLECTIVE_CARD_HEIGHT + COLLECTIVE_CARD_MARGIN_Y}
      width={width}
      outerElementType={GridContainer}
      innerElementType={GridInnerContainer}
      itemKey={({ columnIndex, rowIndex }) => {
        const idx = getIdx(columnIndex, rowIndex, NB_COLS);
        return idx <= members.length ? members[idx].id : `empty-${idx}`;
      }}
    >
      {({ columnIndex, rowIndex, style }) => {
        const idx = getIdx(columnIndex, rowIndex, NB_COLS);
        if (idx > members.length) {
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

  /** Number of rows to display */
  nbRows: PropTypes.number.isRequired,

  /** Width of the viewport */
  width: PropTypes.number.isRequired,

  /** @ignore from withIntl */
  intl: PropTypes.object.isRequired,
};

ContributorsGrid.defaultProps = {
  limit: 30,
  maxHeight: 850,
  nbRows: 1,
};

export default withIntl(ContributorsGrid);
