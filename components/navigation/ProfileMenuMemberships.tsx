import React from 'react';
import PropTypes from 'prop-types';
import { groupBy, isEmpty, uniqBy } from 'lodash';
import { Plus } from 'lucide-react';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../../lib/constants/collectives';
import { LoggedInUser } from '../../lib/custom_typings/LoggedInUser';
import { isPastEvent } from '../../lib/events';

import Avatar from '../Avatar';
import Collapse from '../Collapse';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import StyledButton from '../StyledButton';
import { P } from '../Text';

const MenuLink = styled(Link)`
  all: unset;
  display: flex;
  align-items: center;
  grid-gap: 8px;
  padding: 0px 8px;

  positon: relative;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: 20px;
  cursor: pointer;
  color: ${props => props.theme.colors.black[700]};

  &:hover {
    color: ${props => props.theme.colors.black[600]};
  }
`;

const MembershipLine = ({ membership, closeDrawer }) => (
  <MenuLink href={`/${membership.collective.slug}`} onClick={closeDrawer}>
    <Avatar collective={membership.collective} radius={24} />
    <P fontSize="14px" fontWeight="500" lineHeight="20px" color="inherit" truncateOverflow>
      {membership.collective.name}
    </P>
  </MenuLink>
);

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
      return a.collective.name.localeCompare(b.collective.name);
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

type ProfileMenuMembershipsProps = {
  user: LoggedInUser;
  closeDrawer: () => void;
} & Parameters<typeof Flex>[0];

const ProfileMenuMemberships = ({ user, closeDrawer, ...props }: ProfileMenuMembershipsProps) => {
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
      <Flex gap="32px" flexDirection="column" {...props}>
        {Object.keys(MENU_SECTIONS)
          .filter(shouldDisplaySection)
          .map(accountType => {
            const memberships = groupedMemberships[accountType];
            const sectionIsEmpty = isEmpty(memberships);
            const sectionData = MENU_SECTIONS[accountType];
            return (
              <Flex flexDirection="column" key={accountType}>
                {accountType !== 'ARCHIVED' && (
                  <P color="black.800" fontSize="14px" lineHeight="20px" fontWeight="700" mb="26px">
                    {intl.formatMessage(sectionData.title)}
                  </P>
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
                    mr={'6px'}
                    title={
                      <P color="black.800" fontSize="14px" lineHeight="20px" fontWeight="700">
                        {intl.formatMessage(sectionData.title)}
                      </P>
                    }
                  >
                    <Flex as="ul" p={0} my={0} mt="26px" gap="24px" flexDirection="column">
                      {sortMemberships(memberships).map(member => (
                        <MembershipLine key={member.id} membership={member} user={user} closeDrawer={closeDrawer} />
                      ))}
                    </Flex>
                  </Collapse>
                ) : (
                  <Flex as="ul" p={0} my={0} gap="24px" flexDirection="column">
                    {sortMemberships(memberships).map(member => (
                      <MembershipLine key={member.id} membership={member} user={user} closeDrawer={closeDrawer} />
                    ))}
                  </Flex>
                )}
              </Flex>
            );
          })}
      </Flex>
    </React.Fragment>
  );
};

export default React.memo(ProfileMenuMemberships);
