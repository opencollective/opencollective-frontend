import React from 'react';
import PropTypes from 'prop-types';
import { Plus } from '@styled-icons/fa-solid/Plus';
import { ChevronDown } from '@styled-icons/feather/ChevronDown';
import { ChevronUp } from '@styled-icons/feather/ChevronUp';
import { css } from '@styled-system/css';
import { flatten, groupBy, isNil, mapValues, omitBy, orderBy, uniqBy } from 'lodash';
import memoizeOne from 'memoize-one';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../../lib/constants/collectives';
import { isPastEvent } from '../../lib/events';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import formatCollectiveType from '../../lib/i18n/collective-type';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import Avatar from '../Avatar';
import Collapse from '../Collapse';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { Dropdown, DropdownContent } from '../StyledDropdown';
import StyledHr from '../StyledHr';
import StyledRoundButton from '../StyledRoundButton';
import { H1, P, Span } from '../Text';

const StyledMenuEntry = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  padding: 8px;
  margin-bottom: 4px;
  cursor: pointer;
  background: none;
  color: inherit;
  border: none;
  font: inherit;
  outline: inherit;
  max-width: 100%;
  text-align: left;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  grid-gap: 4px;

  ${props =>
    props.$isActive
      ? css({
          backgroundColor: 'primary.100',
        })
      : css({
          ':hover': {
            backgroundColor: 'black.50',
          },
        })}
`;

const DropdownButton = styled.button`
  display: flex;
  background: white;
  border: 1px solid #e6e8eb;
  outline: none;
  width: 100%;
  border-radius: 6px;
  padding: 8px;
  align-items: center;
  justify-content: space-between;
  transition: all 50ms ease-out;
  &:hover {
    background: #f9f9f9;
  }
  div {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    grid-gap: 12px;
    align-items: center;
  }

  svg {
    flex-shrink: 0;
  }
`;

const ChevronUpDown = ({ style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={style}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
  </svg>
);

const StyledDropdownContent = styled(DropdownContent)`
  border-radius: 8px;
  right: 0;
  left: 0;
`;

const getAllAdminMemberships = memoizeOne(loggedInUser => {
  // Personal profile already includes incognito contributions
  const adminMemberships = loggedInUser?.memberOf?.filter(m => m.role === 'ADMIN' && !m.collective.isIncognito);
  const childrenAdminMemberships = flatten(adminMemberships?.map(m => m.collective.children)).map(c => ({
    collective: c,
    role: 'ADMIN', // Admin role is inherited from parent
  }));
  const uniqueMemberships = uniqBy([...(adminMemberships ?? []), ...childrenAdminMemberships], m => m.collective.id);

  return uniqueMemberships.filter(Boolean);
});

const getAdminMemberships = memoizeOne(loggedInUser => {
  // Personal profile already includes incognito contributions
  const adminMemberships = loggedInUser?.memberOf?.filter(
    m => m.role === 'ADMIN' && !m.collective.isIncognito && !m.collective.isArchived,
  );

  // Filter out something if I am also an admin of the parent
  const childrenAdminAccountIds = flatten(adminMemberships?.map(m => m.collective.children)).map((c: any) => c.id);

  return adminMemberships?.filter(m => !childrenAdminAccountIds.includes(m.collective.id));
});

const getAdminMembershipsForArchived = memoizeOne(loggedInUser => {
  // Personal profile already includes incognito contributions
  const adminMembershipsForArchived = loggedInUser?.memberOf?.filter(
    m => m.role === 'ADMIN' && !m.collective.isIncognito && m.collective.isArchived,
  );
  return adminMembershipsForArchived;
});

const MenuEntry = ({ account, isActive, activeSlug }) => {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <React.Fragment>
      <StyledMenuEntry key={account.id} href={`/dashboard/${account.slug}`} title={account.name} $isActive={isActive}>
        <Flex overflow="hidden" alignItems="center" gridGap="12px">
          <Avatar collective={account} size={32} />
          <Span truncateOverflow>{account.name}</Span>
        </Flex>
        {account.children?.length > 0 && (
          <StyledRoundButton
            ml={2}
            size={24}
            color="#C4C7CC"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            flexShrink={0}
          >
            {expanded ? <ChevronUp size="16px" /> : <ChevronDown size="16px" />}
          </StyledRoundButton>
        )}
      </StyledMenuEntry>
      {expanded &&
        account.children?.map(account => (
          <StyledMenuEntry
            key={account.id}
            href={`/dashboard/${account.slug}`}
            title={account.name}
            $isActive={activeSlug === account.slug}
          >
            <Flex overflow="hidden" alignItems="center" gridGap="12px">
              <Avatar ml={4} collective={account} size={32} />
              <Span truncateOverflow>{account.name}</Span>
            </Flex>
          </StyledMenuEntry>
        ))}
    </React.Fragment>
  );
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
// const MENU_SECTIONS = {
//   [CollectiveType.COLLECTIVE]: {
//     title: defineMessage({ id: 'collective', defaultMessage: 'My Collectives' }),
//     emptyMessage: defineMessage({ defaultMessage: 'Create a collective to collect and spend money transparently' }),
//     plusButton: {
//       text: defineMessage({ id: 'home.create', defaultMessage: 'Create a Collective' }),
//       href: '/create',
//     },
//   },
//   [CollectiveType.EVENT]: {
//     title: defineMessage({ id: 'events', defaultMessage: 'My Events' }),
//   },
//   [CollectiveType.FUND]: {
//     title: defineMessage({ id: 'funds', defaultMessage: 'My Funds' }),
//     plusButton: {
//       text: defineMessage({ id: 'createFund.create', defaultMessage: 'Create a Fund' }),
//       href: '/fund/create',
//     },
//   },
//   [CollectiveType.ORGANIZATION]: {
//     title: defineMessage({ id: 'organization', defaultMessage: 'My Organizations' }),
//     emptyMessage: defineMessage({
//       defaultMessage: 'A profile representing a company or organization instead of an individual',
//     }),
//     plusButton: {
//       text: defineMessage({ id: 'host.organization.create', defaultMessage: 'Create an Organization' }),
//       href: '/organizations/new',
//     },
//   },
//   ARCHIVED: {
//     title: defineMessage({ id: 'Archived', defaultMessage: 'Archived' }),
//   },
// };

const sortMemberships = memberships => {
  if (!memberships?.length) {
    return [];
  } else {
    return memberships.sort((a, b) => {
      return a.collective.slug.localeCompare(b.collective.slug);
    });
  }
};

const MembershipsList = ({ memberships, activeSlug }) => {
  return (
    <Box as="ul" p={0} my={2}>
      {sortMemberships(memberships).map(({ collective: account }) => (
        <MenuEntry key={account.id} account={account} isActive={account.slug === activeSlug} activeSlug={activeSlug} />
      ))}
    </Box>
  );
};

MembershipsList.propTypes = {
  user: PropTypes.object,
  memberships: PropTypes.array,
};

const Switcher = () => {
  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const router = useRouter();
  const { slug } = router.query;

  const loggedInUserCollective = LoggedInUser?.collective;

  const allMemberships = getAllAdminMemberships(LoggedInUser);
  const rootActiveMemberships = getAdminMemberships(LoggedInUser);
  const rootArchivedMemberships = getAdminMembershipsForArchived(LoggedInUser);
  const groupedMemberships = groupBy(rootActiveMemberships, m => m.collective.type);
  groupedMemberships.ARCHIVED = rootArchivedMemberships;

  const activeAccount = allMemberships.find(m => m.collective.slug === slug)?.collective || loggedInUserCollective;

  return (
    <React.Fragment>
      <Dropdown trigger="click">
        {({ triggerProps, dropdownProps }) => (
          <React.Fragment>
            <Flex alignItems="center">
              <DropdownButton {...triggerProps}>
                <div>
                  <Avatar collective={activeAccount} size={32} />
                  <Span truncateOverflow>{activeAccount?.name}</Span>
                </div>

                <ChevronUpDown style={{ height: 20, width: 20 }} />
              </DropdownButton>
            </Flex>
            <Container mt={2} maxWidth={'100%'} {...dropdownProps}>
              <StyledDropdownContent>
                <Flex p={2} flexDirection="column" gridGap={3}>
                  <StyledMenuEntry
                    key={loggedInUserCollective?.id}
                    href={`/dashboard/${loggedInUserCollective?.slug}`}
                    title={loggedInUserCollective?.name}
                    $isActive={slug === loggedInUserCollective?.slug}
                  >
                    <Flex alignItems="center" gridGap="12px">
                      <Avatar collective={loggedInUserCollective} size={32} />
                      <Span truncateOverflow>{loggedInUserCollective?.name}</Span>
                    </Flex>
                  </StyledMenuEntry>
                  {Object.entries(groupedMemberships).map(([collectiveType, memberships]) => {
                    return (
                      <div key={collectiveType}>
                        <Flex alignItems="center" px={1} mb={1}>
                          <Span
                            mr={2}
                            fontWeight="500"
                            color="black.600"
                            textTransform="uppercase"
                            letterSpacing="0"
                            fontSize="12px"
                          >
                            {formatCollectiveType(intl, collectiveType, 2)}
                          </Span>
                          <StyledHr width="100%" borderColor="black.300" />
                        </Flex>
                        {memberships?.map(({ collective: account }) => (
                          <MenuEntry
                            key={account.id}
                            account={account}
                            isActive={account.slug === slug}
                            activeSlug={slug}
                          />
                        ))}
                      </div>
                    );
                  })}
                </Flex>
              </StyledDropdownContent>
            </Container>
          </React.Fragment>
        )}
      </Dropdown>
    </React.Fragment>
  );
};

Switcher.propTypes = {
  collective: PropTypes.object,
  isLoading: PropTypes.bool,
};

export default Switcher;
