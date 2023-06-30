import React from 'react';
import PropTypes from 'prop-types';
import { groupBy, isEmpty, uniqBy } from 'lodash';
import { Home, Plus } from 'lucide-react';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../../lib/constants/collectives';
import { isPastEvent } from '../../lib/events';
import { getDashboardRoute } from '../../lib/url-helpers';

import Avatar from '../Avatar';
import Collapse from '../Collapse';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import StyledButton from '../StyledButton';
import StyledRoundButton from '../StyledRoundButton';
import { P } from '../Text';

const AccountList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 4px 16px;
  border-top: 1px solid #f3f4f6;
  padding-top: 12px;
  h3 {
    font-size: 12px;
    font-weight: 600;
    color: #656d76;
    letter-spacing: 0;
    line-height: 20px;
    margin: 0;

    padding: 0 8px;
  }
`;

const MenuLink = styled(Link)`
  display: flex;
  align-items: center;
  grid-gap: 8px;
  cursor: pointer;
  &:hover {
    background: #f7f8fa;
    color: #1f2328;
  }
  positon: relative;
  padding: 8px;
  border-radius: 8px;
  color: #1f2328;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  svg {
    color: #4b5563;
  }
`;

const DashboardLink = styled(Link)`
  border: 1px solid #e5e7eb;
  background: white;
  color: #1f2937;
  opacity: 0;
  display: flex;
  align-items: center;
  padding: 0 6px;
  border-radius: 8px;
  position: absolute;
  right: 4px;
  top: 4px;
  bottom: 4px;
  transition: opacity 0.1s, background-color 0.1s, color 0.1s;
  &:hover {
    background: #030712;
    color: white;
  }
`;

const CollectiveListItem = styled.div`
  position: relative;
  @media (hover: hover) {
    :hover a.dashboardLink {
      opacity: 1;
    }
  }
  @media (hover: none) {
    a.dashboardLink {
      opacity: 1;
    }
  }
`;

const MembershipLine = ({ user, membership, closeDrawer }) => {
  const intl = useIntl();
  return (
    <CollectiveListItem>
      <MenuLink href={`/${membership.collective.slug}`} onClick={closeDrawer}>
        <Avatar collective={membership.collective} radius={16} />
        <P
          fontSize="inherit"
          fontWeight="inherit"
          lineHeight="inherit"
          color="inherit"
          letterSpacing={0}
          truncateOverflow
        >
          {membership.collective.name}
        </P>
      </MenuLink>
      {Boolean(user?.canSeeAdminPanel(membership.collective)) && (
        <DashboardLink
          className="dashboardLink"
          href={getDashboardRoute(membership.collective)}
          color="black.500"
          title={intl.formatMessage({ id: 'Dashboard', defaultMessage: 'Dashboard' })}
          onClick={closeDrawer}
        >
          <Home size="14px" strokeWidth={1.5} />
        </DashboardLink>
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

const MembershipsList = ({ user, memberships, closeDrawer }) => {
  return (
    <Box as="ul" p={0} my={2}>
      {sortMemberships(memberships).map(member => (
        <MembershipLine key={member.id} membership={member} user={user} closeDrawer={closeDrawer} />
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

const MenuSectionHeader = ({ section, hidePlusIcon, closeDrawer }) => {
  const intl = useIntl();
  const { title, plusButton } = MENU_SECTIONS[section];
  return (
    <Flex alignItems="center" justifyContent="space-between">
      <h3>{intl.formatMessage(title)}</h3>

      {Boolean(!hidePlusIcon && plusButton) && (
        <Link href={plusButton.href} title={intl.formatMessage(plusButton.text)} onClick={closeDrawer}>
          <StyledRoundButton
            mr={'6px'}
            size={24}
            color="#C4C7CC"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
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
  closeDrawer: PropTypes.func,
};

const ProfileMenuMemberships = ({ user, closeDrawer }) => {
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
            <AccountList key={accountType}>
              {accountType !== 'ARCHIVED' && (
                <MenuSectionHeader section={accountType} hidePlusIcon={sectionIsEmpty} closeDrawer={closeDrawer} />
              )}
              {sectionIsEmpty ? (
                <Box my={2}>
                  <P fontSize="12px" lineHeight="18px" color="black.700">
                    {intl.formatMessage(sectionData.emptyMessage)}
                  </P>
                  {Boolean(sectionData.plusButton) && (
                    <Link href={sectionData.plusButton.href} onClick={closeDrawer}>
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
                  buttonSize={24}
                  defaultIsOpen={false}
                  title={
                    <MenuSectionHeader section={accountType} hidePlusIcon={sectionIsEmpty} closeDrawer={closeDrawer} />
                  }
                >
                  <MembershipsList memberships={memberships} user={user} closeDrawer={closeDrawer} />
                </Collapse>
              ) : (
                <MembershipsList memberships={memberships} user={user} closeDrawer={closeDrawer} />
              )}
            </AccountList>
          );
        })}
    </React.Fragment>
  );
};

ProfileMenuMemberships.propTypes = {
  user: PropTypes.shape({
    memberOf: PropTypes.arrayOf(PropTypes.object),
  }),
  closeDrawer: PropTypes.func,
};

export default React.memo(ProfileMenuMemberships);
