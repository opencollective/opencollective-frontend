import React from 'react';
import PropTypes from 'prop-types';
import { Plus } from '@styled-icons/boxicons-regular';
import { Settings } from '@styled-icons/feather/Settings';
import { Check } from '@styled-icons/heroicons-outline/Check';
import { themeGet } from '@styled-system/theme-get';
import { groupBy, isEmpty, uniqBy } from 'lodash';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../lib/constants/collectives';
import { isPastEvent } from '../lib/events';
import { getSettingsRoute } from '../lib/url-helpers';

import Avatar from './Avatar';
import Container from './Container';
import { Box, Flex } from './Grid';
import Link from './Link';
import ListItem from './ListItem';
import StyledButton from './StyledButton';
import StyledHr from './StyledHr';
import StyledLink from './StyledLink';
import StyledRoundButton from './StyledRoundButton';
import { P } from './Text';

const CollectiveListItem = styled(ListItem)`
  &:hover {
    background: #f7f8fa;
  }
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding-right: 8px;
  border-radius: 8px;
  color: ${themeGet('colors.black.700')};
  @media (hover: hover) {
    :hover svg {
      opacity: 1;
    }
  }
  @media (hover: none) {
    svg {
      opacity: 1;
    }
  }
`;

const upperCaseFirstLetter = string => `${string.slice(0, 1).toUpperCase()}${string.slice(1).toLowerCase()}`;

const MembershipLine = ({ user, membership, activeCollective, setActiveCollective }) => {
  console.log({ membership, user });
  const intl = useIntl();
  return (
    <Link
      href={`/${membership.collective.slug}`}
      title={membership.collective.name}
      onClick={() => setActiveCollective({ ...membership.collective, role: membership.role })}
    >
      <CollectiveListItem p={1} flex={1} display="flex" justifyContent="space-between" alignItems="center">
        <Flex alignItems="center" overflow={'hidden'} gap={'8px'}>
          <Avatar collective={membership.collective} radius="32px" mr="2px" />
          <Flex flexDirection="column" overflow="hidden" truncateOverflow>
            <P fontSize="14px" fontWeight="500" lineHeight="20px" color="black.800" truncateOverflow>
              {membership.collective.name}
            </P>
            <P fontSize="12px" lineHeight="18px" truncateOverflow color="black.700">
              {upperCaseFirstLetter(membership.role === 'MEMBER' ? 'Core contributor' : membership.role)}
            </P>
          </Flex>
        </Flex>
        {membership.collective.id === activeCollective.id && (
          <Box flexShrink={0}>
            <Check size="22" />
          </Box>
        )}
      </CollectiveListItem>
    </Link>
  );
};

MembershipLine.propTypes = {
  user: PropTypes.object,
  membership: PropTypes.object,
  activeCollective: PropTypes.object,
  setActiveCollective: PropTypes.func,
};

const sortMemberships = memberships => {
  if (!memberships?.length) {
    return [];
  } else {
    return memberships.sort((a, b) => {
      return a.collective.slug.localeCompare(b.collective.slug);
    });
  }
};

const filterMemberships = memberships => {
  const filteredMemberships = memberships.filter(m => {
    if (m.role === 'BACKER') {
      return false;
    } else if (m.collective.type === 'EVENT' && isPastEvent(m.collective)) {
      return false;
    } else {
      return Boolean(m.collective);
    }
  });

  return uniqBy(filteredMemberships, m => m.collective.id);
};

const MembershipsList = ({ user, memberships, activeCollective, setActiveCollective }) => {
  return sortMemberships(memberships).map(member => (
    <MembershipLine
      key={member.id}
      membership={member}
      user={user}
      activeCollective={activeCollective}
      setActiveCollective={setActiveCollective}
    />
  ));
};

MembershipsList.propTypes = {
  user: PropTypes.object,
  memberships: PropTypes.array,
};

/**
 * Keys must be collective types, as they're used to filter the `groupedMemberships`.
 * The order of the keys in this object defines order in the menu.
 *
 * Properties:
 * - title: i18n string for the title
 * - emptyMessage: (optional) i18n string for the message when there are no memberships. If not provided, the section will not be shown.
 * - plusButton: (optional) properties to display a (+) button next to the title
 *  - href: link to the page to open when the button is clicked
 *  - text: i18n alt string for the button (accessibility)
 */
const MENU_SECTIONS = {
  [CollectiveType.COLLECTIVE]: {
    title: defineMessage({ id: 'collective', defaultMessage: 'My Collectives' }),
  },
  [CollectiveType.EVENT]: {
    title: defineMessage({ id: 'events', defaultMessage: 'My Events' }),
  },
  [CollectiveType.FUND]: {
    title: defineMessage({ id: 'funds', defaultMessage: 'My Funds' }),
  },
  [CollectiveType.ORGANIZATION]: {
    title: defineMessage({ id: 'organization', defaultMessage: 'My Organizations' }),
  },
  [CollectiveType.INDIVIDUAL]: {
    title: defineMessage({ id: 'myAccount', defaultMessage: 'My Account' }),
  },
};

function figureOutRole(collective, role) {
  if (role === 'Personal profile') {return role;}
  if (collective.type === 'ORGANIZATION') {
    if (collective.isHost) {
      return role === 'ADMIN' ? 'Fiscal host admin' : 'Member';
    }
    return role === 'ADMIN' ? 'Organization admin' : 'Organization member';
  } else if (collective.type === 'HOST') {
    return role === 'ADMIN' ? 'Fiscal host admin' : 'Member';
  } else {
    return role === 'ADMIN' ? 'Collective admin' : 'Core contributor';
  }
}

const MenuSectionHeader = ({ section }) => {
  const intl = useIntl();
  const { title } = MENU_SECTIONS[section];
  return (
    <Flex alignItems="center">
      <P
        color="black.600"
        fontSize="11px"
        fontWeight="500"
        letterSpacing="0.06em"
        pr={2}
        mt={2}
        textTransform="uppercase"
        whiteSpace="nowrap"
      >
        {intl.formatMessage(title)}
      </P>
      <StyledHr flex="1" borderStyle="solid" borderColor="#DCDEE0" />
    </Flex>
  );
};

MenuSectionHeader.propTypes = {
  section: PropTypes.oneOf(Object.keys(MENU_SECTIONS)).isRequired,
  hidePlusIcon: PropTypes.bool,
};

const ProfileMenuMemberships = ({ user, activeCollective, setActiveCollective }) => {
  const memberships = filterMemberships(user.memberOf);
  const groupedMemberships = groupBy(memberships, m => m.collective.type);
  const hasNoMemberships = isEmpty(memberships);
  const shouldDisplaySection = section => {
    return MENU_SECTIONS[section].emptyMessage || !isEmpty(groupedMemberships[section]);
  };

  return (
    <Flex flexDirection="column" gap="4px">
      {Object.keys(MENU_SECTIONS)
        .filter(shouldDisplaySection)
        .map(accountType => {
          const memberships = groupedMemberships[accountType];

          return (
            <MembershipsList
              key={accountType}
              memberships={memberships}
              user={user}
              activeCollective={activeCollective}
              setActiveCollective={setActiveCollective}
            />
          );
        })}
      <MembershipsList
        memberships={[{ ...user, id: '24', role: 'Personal profile' }]}
        user={user}
        activeCollective={activeCollective}
        setActiveCollective={setActiveCollective}
      />
    </Flex>
  );
};

ProfileMenuMemberships.propTypes = {
  user: PropTypes.shape({
    memberOf: PropTypes.arrayOf(PropTypes.object),
  }),
  activeCollective: PropTypes.object,
  setActiveCollective: PropTypes.func,
};

export default React.memo(ProfileMenuMemberships);
