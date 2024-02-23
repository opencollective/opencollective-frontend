import React from 'react';
import PropTypes from 'prop-types';
import { groupBy, isEmpty, uniqBy } from 'lodash';
import { LayoutDashboard, Plus } from 'lucide-react';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../../lib/constants/collectives';
import type { LoggedInUser } from '../../lib/custom_typings/LoggedInUser';
import { isPastEvent } from '../../lib/events';
import { getDashboardRoute } from '../../lib/url-helpers';

import Avatar from '../Avatar';
import Collapse from '../Collapse';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import StyledButton from '../StyledButton';
import { P } from '../Text';
import { Separator } from '../ui/Separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

const AccountList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 4px 8px;
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
    background: #f8fafc;
  }
  positon: relative;
  padding: 8px;
  border-radius: 8px;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  svg {
    color: #4b5563;
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
  return (
    <CollectiveListItem className="group h-9">
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
        <div className="absolute bottom-1 right-1 top-1">
          <Tooltip>
            <TooltipTrigger>
              <Link
                className="flex h-7 w-7 items-center justify-center rounded-md border bg-white text-slate-950 opacity-0 transition-all hover:border-white hover:bg-slate-900 hover:text-white group-hover:opacity-100"
                href={getDashboardRoute(membership.collective)}
                onClick={closeDrawer}
              >
                <LayoutDashboard size="14px" strokeWidth={1.5} />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="left">
              <FormattedMessage defaultMessage="Go to Dashboard" />
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </CollectiveListItem>
  );
};

MembershipLine.propTypes = {
  user: PropTypes.object,
  membership: PropTypes.object,
  closeDrawer: PropTypes.func,
};

const sortMemberships = (memberships: LoggedInUser['memberOf']) => {
  if (!memberships?.length) {
    return [];
  } else {
    return memberships.sort((a, b) => {
      return a.collective.slug.localeCompare(b.collective.slug);
    });
  }
};

const filterArchivedMemberships = (memberships: LoggedInUser['memberOf']) => {
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

const filterMemberships = (memberships: LoggedInUser['memberOf']) => {
  const filteredMemberships = memberships.filter(m => {
    if (!['ADMIN', 'ACCOUNTANT', 'HOST'].includes(m.role) || m.collective.isArchived) {
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
  closeDrawer: PropTypes.func,
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
      <p className="px-2 text-xs font-medium text-slate-600">{intl.formatMessage(title)}</p>

      {Boolean(!hidePlusIcon && plusButton) && (
        <Tooltip>
          <TooltipTrigger>
            <Link
              href={plusButton.href}
              aria-label={intl.formatMessage(plusButton.text)}
              onClick={closeDrawer}
              tabIndex={-1}
              className="mr-1.5 flex h-6 w-6 items-center justify-center rounded-full border"
            >
              <Plus size={12} color="#76777A" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="left">{intl.formatMessage(plusButton.text)}</TooltipContent>
        </Tooltip>
      )}
    </Flex>
  );
};

type ProfileMenuMembershipsProps = {
  user: LoggedInUser;
  closeDrawer: () => void;
};

const ProfileMenuMemberships = ({ user, closeDrawer }: ProfileMenuMembershipsProps) => {
  const intl = useIntl();
  const memberships = filterMemberships(user.memberOf);
  const archivedMemberships = filterArchivedMemberships(user.memberOf);
  const groupedMemberships = groupBy(memberships, m => m.collective.type);
  groupedMemberships.ARCHIVED = archivedMemberships;
  const shouldDisplaySection = section => {
    return MENU_SECTIONS[section].emptyMessage || !isEmpty(groupedMemberships[section]);
  };

  return (
    <React.Fragment>
      {Object.keys(MENU_SECTIONS)
        .filter(shouldDisplaySection)
        .map((accountType, i) => {
          const memberships = groupedMemberships[accountType];
          const sectionIsEmpty = isEmpty(memberships);
          const sectionData = MENU_SECTIONS[accountType];
          return (
            <React.Fragment key={accountType}>
              {i !== 0 && <Separator />}
              <AccountList>
                {accountType !== 'ARCHIVED' && (
                  <MenuSectionHeader section={accountType} hidePlusIcon={sectionIsEmpty} closeDrawer={closeDrawer} />
                )}
                {sectionIsEmpty ? (
                  <div className="m-2">
                    <p className="text-xs text-muted-foreground">{intl.formatMessage(sectionData.emptyMessage)}</p>
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
                              width="24px"
                              height="24px"
                            >
                              <Plus size={12} />
                            </Container>
                            <span>{intl.formatMessage(sectionData.plusButton.text)}</span>
                          </Flex>
                        </StyledButton>
                      </Link>
                    )}
                  </div>
                ) : accountType === 'ARCHIVED' ? (
                  <Collapse
                    buttonSize={24}
                    defaultIsOpen={false}
                    mr={'6px'}
                    title={
                      <MenuSectionHeader
                        section={accountType}
                        hidePlusIcon={sectionIsEmpty}
                        closeDrawer={closeDrawer}
                      />
                    }
                  >
                    <MembershipsList memberships={memberships} user={user} closeDrawer={closeDrawer} />
                  </Collapse>
                ) : (
                  <MembershipsList memberships={memberships} user={user} closeDrawer={closeDrawer} />
                )}
              </AccountList>
            </React.Fragment>
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
