import React from 'react';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import { FixedSizeGrid } from 'react-window';
import { truncate } from 'lodash';

import Roles from '../constants/roles';
import { CollectiveType } from '../constants/collectives';
import formatMemberRole from '../lib/i18n-member-role';

import Link from '../components/Link';
import { P } from '../components/Text';
import StyledCard from '../components/StyledCard';
import Container from '../components/Container';
import Avatar from '../components/Avatar';
import withIntl from '../lib/withIntl';

/**
 * A grid to show contributors, with horizontal scroll to search them.
 */
const ContributorsGrid = ({ intl, members, width, nbRows }) => {
  const COLLECTIVE_CARD_MARGIN_X = 32;
  const COLLECTIVE_CARD_MARGIN_Y = 26;
  const COLLECTIVE_CARD_WIDTH = 144;
  const COLLECTIVE_CARD_HEIGHT = 226;
  const NB_COLS = Math.trunc(members.length / nbRows);

  // TODO itemKey

  return (
    <FixedSizeGrid
      columnCount={members.length / nbRows}
      columnWidth={COLLECTIVE_CARD_WIDTH + COLLECTIVE_CARD_MARGIN_X}
      height={(COLLECTIVE_CARD_HEIGHT + COLLECTIVE_CARD_MARGIN_Y) * 3 + COLLECTIVE_CARD_MARGIN_Y}
      rowCount={nbRows}
      rowHeight={COLLECTIVE_CARD_HEIGHT + COLLECTIVE_CARD_MARGIN_Y}
      width={width}
    >
      {({ columnIndex, rowIndex, style }) => {
        const idx = rowIndex * NB_COLS + columnIndex;
        if (idx > members.length) {
          return null;
        }

        const { id, role, collective } = members[rowIndex * NB_COLS + columnIndex];
        return (
          <StyledCard
            key={id}
            px={2}
            py={20}
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
          </StyledCard>
        );
      }}
    </FixedSizeGrid>
  );
};

ContributorsGrid.propTypes = {
  /** The members that contribute to this collective */
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
  nbRows: 3,
};

export default withIntl(ContributorsGrid);
