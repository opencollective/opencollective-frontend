import React from 'react';
import PropTypes from 'prop-types';
import { Plus } from '@styled-icons/boxicons-regular/Plus';
import { Settings } from '@styled-icons/feather/Settings';
import { groupBy, isEmpty, uniqBy } from 'lodash';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../lib/constants/collectives';
import { isPastEvent } from '../lib/events';
import { getSettingsRoute } from '../lib/url-helpers';

import Avatar from './Avatar';
import Collapse from './Collapse';
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

const MembershipLine = ({ user, membership }) => {
  const intl = useIntl();
  return (
    <CollectiveListItem py={1} display="flex" justifyContent="space-between" alignItems="center">
      <Link href={`/${membership.collective.slug}`} title={membership.collective.name}>
        <Flex alignItems="center">
          <Avatar collective={membership.collective} radius="32px" mr="12px" />
          <Flex flexDirection="column" maxWidth="150px">
            <P fontSize="14px" fontWeight="500" lineHeight="20px" color="black.800" truncateOverflow>
              {membership.collective.name}
            </P>
            <P fontSize="12px" lineHeight="18px" truncateOverflow color="black.700">
              @{membership.collective.slug}
            </P>
          </Flex>
        </Flex>
      </Link>
      {Boolean(user?.canSeeAdminPanel(membership.collective)) && (
        <StyledLink
          as={Link}
          href={getSettingsRoute(membership.collective)}
          ml={1}
          color="black.500"
          title={intl.formatMessage({ id: 'AdminPanel.button', defaultMessage: 'Admin' })}
        >
          <Settings opacity="0" size="1.2em" />
        </StyledLink>
      )}
    </CollectiveListItem>
  );
};

MembershipLine.propTypes = {
  user: PropTypes.object,
  membership: PropTypes.object,
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

const filterArchivedMemberships = memberships => {
  const archivedMemberships = memberships.filter(m => {
    if (
      m.role !== 'BACKER' &&
      m.collective.isArchived &&
      !(m.collective.type === 'EVENT' && isPastEvent(m.collective))
    ) {
      return true;
    } else {
      return false;
    }
  });

  return uniqBy(archivedMemberships, m => m.collective.id);
};

const filterMemberships = memberships => {
  const filteredMemberships = memberships.filter(m => {
    if (m.role === 'BACKER' || m.collective.isArchived) {
      return false;
    } else if (m.collective.type === 'EVENT' && isPastEvent(m.collective)) {
      return false;
    } else {
      return Boolean(m.collective);
    }
  });

  return uniqBy(filteredMemberships, m => m.collective.id);
};

const MembershipsList = ({ user, memberships }) => {
  return (
    <Box as="ul" p={0} my={2}>
      {sortMemberships(memberships).map(member => (
        <MembershipLine key={member.id} membership={member} user={user} />
      ))}
    </Box>
  );
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
    emptyMessage: defineMessage({ defaultMessage: 'Create a collective to collect and spend money transparently' }),
    plusButton: {
      text: defineMessage({ id: 'home.create', defaultMessage: 'Create a Collective' }),
      href: '/create',
    },
  },
  [CollectiveType.EVENT]: {
    title: defineMessage({ id: 'events', defaultMessage: 'My Events' }),
  },
  [CollectiveType.FUND]: {
    title: defineMessage({ id: 'funds', defaultMessage: 'My Funds' }),
    plusButton: {
      text: defineMessage({ id: 'createFund.create', defaultMessage: 'Create a Fund' }),
      href: '/fund/create',
    },
  },
  [CollectiveType.ORGANIZATION]: {
    title: defineMessage({ id: 'organization', defaultMessage: 'My Organizations' }),
    emptyMessage: defineMessage({
      defaultMessage: 'A profile representing a company or organization instead of an individual',
    }),
    plusButton: {
      text: defineMessage({ id: 'host.organization.create', defaultMessage: 'Create an Organization' }),
      href: '/organizations/new',
    },
  },
  ARCHIVED: {
    title: defineMessage({ id: 'Archived', defaultMessage: 'Archived' }),
  },
};

const MenuSectionHeader = ({ section, hidePlusIcon }) => {
  const intl = useIntl();
  const { title, plusButton } = MENU_SECTIONS[section];
  return (
    <Flex alignItems="center">
      <P
        color="black.700"
        fontSize="12px"
        fontWeight="500"
        letterSpacing="0.06em"
        pr={2}
        textTransform="uppercase"
        whiteSpace="nowrap"
      >
        {intl.formatMessage(title)}
      </P>
      <StyledHr flex="1" borderStyle="solid" borderColor="#DCDEE0" />
      {Boolean(!hidePlusIcon && plusButton) && (
        <Link href={plusButton.href} title={intl.formatMessage(plusButton.text)}>
          <StyledRoundButton ml={2} size={24} color="#C4C7CC">
            <Plus size={12} color="#76777A" />
          </StyledRoundButton>
        </Link>
      )}
    </Flex>
  );
};

MenuSectionHeader.propTypes = {
  section: PropTypes.oneOf(Object.keys(MENU_SECTIONS)).isRequired,
  hidePlusIcon: PropTypes.bool,
};

const ProfileMenuMemberships = ({ user }) => {
  const intl = useIntl();
  const memberships = filterMemberships(user.memberOf);
  const archivedMemberships = filterArchivedMemberships(user.memberOf);
  const groupedMemberships = groupBy(memberships, m => m.collective.type);
  groupedMemberships.ARCHIVED = archivedMemberships;
  const hasNoMemberships = isEmpty(memberships);
  const shouldDisplaySection = section => {
    return MENU_SECTIONS[section].emptyMessage || !isEmpty(groupedMemberships[section]);
  };

  return (
    <React.Fragment>
      {hasNoMemberships && (
        <P color="blue.900" fontSize="20px" lineHeight="28px" fontWeight="bold" mt="8px" mb="12px">
          <FormattedMessage id="ProfileMenuMemberships.Empty" defaultMessage="Make the most out of Open Collective" />
        </P>
      )}
      {Object.keys(MENU_SECTIONS)
        .filter(shouldDisplaySection)
        .map(accountType => {
          const memberships = groupedMemberships[accountType];
          const sectionIsEmpty = isEmpty(memberships);
          const sectionData = MENU_SECTIONS[accountType];
          return (
            <Box key={accountType} mb={3}>
              {accountType !== 'ARCHIVED' && <MenuSectionHeader section={accountType} hidePlusIcon={sectionIsEmpty} />}
              {sectionIsEmpty ? (
                <Box my={2}>
                  <P fontSize="12px" lineHeight="18px" color="black.700">
                    {intl.formatMessage(sectionData.emptyMessage)}
                  </P>
                  {Boolean(sectionData.plusButton) && (
                    <Link href={sectionData.plusButton.href}>
                      <StyledButton mt="12px" mb="16px" borderRadius="8px" width="100%" fontSize="12px">
                        <Flex alignItems="center" justifyContent="center">
                          <Container
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            borderRadius="100%"
                            border="1px solid #C4C7CC"
                            mr="16px"
                            size="24px"
                          >
                            <Plus size={12} />
                          </Container>
                          <span>{intl.formatMessage(sectionData.plusButton.text)}</span>
                        </Flex>
                      </StyledButton>
                    </Link>
                  )}
                </Box>
              ) : accountType === 'ARCHIVED' ? (
                <Collapse
                  defaultIsOpen={false}
                  title={<MenuSectionHeader section={accountType} hidePlusIcon={sectionIsEmpty} />}
                >
                  <MembershipsList memberships={memberships} user={user} />
                </Collapse>
              ) : (
                <MembershipsList memberships={memberships} user={user} />
              )}
            </Box>
          );
        })}
      {hasNoMemberships && (
        <P textAlign="center" mb={2}>
          <StyledLink as={Link} href="/search" color="blue.900">
            <FormattedMessage defaultMessage="Discover Collectives to Support" />
          </StyledLink>
        </P>
      )}
    </React.Fragment>
  );
};

ProfileMenuMemberships.propTypes = {
  user: PropTypes.shape({
    memberOf: PropTypes.arrayOf(PropTypes.object),
  }),
};

export default React.memo(ProfileMenuMemberships);
