import React from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/heroicons-outline/ChevronDown';
import { ChevronUp } from '@styled-icons/heroicons-outline/ChevronUp';
import { ChevronUpDown } from '@styled-icons/heroicons-outline/ChevronUpDown';
import { css } from '@styled-system/css';
import { flatten, groupBy, uniqBy } from 'lodash';
import memoizeOne from 'memoize-one';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import formatCollectiveType from '../../lib/i18n/collective-type';

import Avatar from '../Avatar';
import Container from '../Container';
import { Flex } from '../Grid';
import Link from '../Link';
import { Dropdown, DropdownContent } from '../StyledDropdown';
import StyledHr from '../StyledHr';
import StyledRoundButton from '../StyledRoundButton';
import { Span } from '../Text';

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

const StyledDropdownContent = styled(DropdownContent)`
  border-radius: 8px;
  right: 0;
  left: 0;
  margin-top: 8px;
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

const MenuEntry = ({ account, activeSlug }) => {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <React.Fragment>
      <StyledMenuEntry
        key={account.id}
        href={`/dashboard/${account.slug}`}
        title={account.name}
        $isActive={activeSlug === account.sug}
      >
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
        account?.children?.map(child => (
          <StyledMenuEntry
            key={child?.id}
            href={`/dashboard/${child.slug}`}
            title={child.name}
            $isActive={activeSlug === child.slug}
          >
            <Flex overflow="hidden" alignItems="center" gridGap="12px">
              <Avatar ml={4} collective={child} size={32} />
              <Span truncateOverflow>{child.name}</Span>
            </Flex>
          </StyledMenuEntry>
        ))}
    </React.Fragment>
  );
};

MenuEntry.propTypes = {
  account: PropTypes.object,
  activeSlug: PropTypes.string,
};

const AccountSwitcher = () => {
  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const router = useRouter();
  const { slug } = router.query;
  const activeSlug = Array.isArray(slug) ? slug[0] : slug;

  const loggedInUserCollective = LoggedInUser?.collective;

  const allMemberships = getAllAdminMemberships(LoggedInUser);
  const rootActiveMemberships = getAdminMemberships(LoggedInUser);
  const rootArchivedMemberships = getAdminMembershipsForArchived(LoggedInUser);
  const groupedMemberships = groupBy(rootActiveMemberships, m => m.collective.type);

  if (rootArchivedMemberships.length > 0) {
    groupedMemberships.ARCHIVED = rootArchivedMemberships;
  }

  const activeAccount = allMemberships.find(m => m.collective.slug === slug)?.collective || loggedInUserCollective;

  return (
    <Dropdown trigger="click">
      {({ triggerProps, dropdownProps }) => (
        <React.Fragment>
          <Flex alignItems="center">
            <DropdownButton {...triggerProps}>
              <div>
                <Avatar collective={activeAccount} size={32} />
                <Span truncateOverflow>{activeAccount?.name}</Span>
              </div>

              <ChevronUpDown size={20} />
            </DropdownButton>
          </Flex>
          <Container maxWidth={'100%'} {...dropdownProps}>
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
                        <MenuEntry key={account.id} account={account} activeSlug={activeSlug} />
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
  );
};

AccountSwitcher.propTypes = {
  collective: PropTypes.object,
  isLoading: PropTypes.bool,
};

export default AccountSwitcher;
