import React from 'react';
import { css } from '@styled-system/css';
import { flatten, groupBy, uniqBy } from 'lodash';
import { ChevronDown, ChevronsUpDown, ChevronUp, Plus } from 'lucide-react';
import memoizeOne from 'memoize-one';
import type { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { space } from 'styled-system';

import { CollectiveType } from '../../lib/constants/collectives';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';

import Avatar from '../Avatar';
import Container from '../Container';
import { Flex } from '../Grid';
import Link from '../Link';
import { Dropdown, DropdownContent } from '../StyledDropdown';
import StyledHr from '../StyledHr';
import StyledRoundButton from '../StyledRoundButton';
import { P, Span } from '../Text';

const StyledMenuEntry = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  padding: 8px;
  margin-bottom: 4px;
  cursor: pointer;
  color: inherit;
  border: none;
  font: inherit;
  max-width: 100%;
  text-align: left;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  grid-gap: 4px;
  ${space}

  ${props =>
    props.$isActive
      ? css({
          backgroundColor: '#f3f4f6',
        })
      : css({
          ':hover': {
            backgroundColor: '#f3f4f6',
          },
        })}
`;

const DropdownButton = styled.button`
  all: unset;
  display: flex;
  background: white;
  border: 1px solid #e6e8eb;
  width: 100%;
  border-radius: 24px;
  padding: 8px 12px;
  margin: 0 -4px;
  align-items: center;
  justify-content: space-between;
  transition: all 50ms ease-out;
  cursor: pointer;
  overflow: hidden;
  &:hover,
  :active,
  :focus {
    background: #f8fafc;
  }

  div {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  svg {
    flex-shrink: 0;
    color: #4b5563;
  }
`;

const StyledDropdownContent = styled(DropdownContent)`
  border-radius: 12px;
  right: 0;
  left: 0;
  max-width: 100%;
  margin-top: 8px;
  max-height: 70vh;
  overflow-y: scroll;
`;

const CREATE_NEW_LINKS = {
  ORGANIZATION: '/organizations/new',
  FUND: '/fund/create',
  COLLECTIVE: '/create',
};

const EMPTY_GROUP_STATE = {
  [CollectiveType.COLLECTIVE]: {
    emptyMessage: <FormattedMessage defaultMessage="Create a collective to collect and spend money transparently" />,
    linkLabel: <FormattedMessage id="home.create" defaultMessage="Create a Collective" />,
  },
  [CollectiveType.ORGANIZATION]: {
    emptyMessage: (
      <FormattedMessage defaultMessage="A profile representing a company or organization instead of an individual" />
    ),
    linkLabel: <FormattedMessage id="host.organization.create" defaultMessage="Create an Organization" />,
  },
};

const getGroupedAdministratedAccounts = memoizeOne(loggedInUser => {
  const isAdministratedAccount = m => ['ADMIN', 'ACCOUNTANT'].includes(m.role) && !m.collective.isIncognito;
  let administratedAccounts = loggedInUser?.memberOf.filter(isAdministratedAccount).map(m => m.collective) || [];

  // Filter out accounts if the user is also an admin of the parent of that account (since we already show the parent)
  const childAccountIds = flatten(administratedAccounts.map(a => a.children)).map((a: { id: number }) => a.id);
  administratedAccounts = administratedAccounts.filter(a => !childAccountIds.includes(a.id));
  administratedAccounts = uniqBy([...administratedAccounts], a => a.id).filter(Boolean);

  // Filter out Archived accounts and group it separately
  const archivedAccounts = administratedAccounts.filter(a => a.isArchived);
  const activeAccounts = administratedAccounts.filter(a => !a.isArchived);

  const groupedAccounts = {
    [CollectiveType.COLLECTIVE]: [],
    [CollectiveType.ORGANIZATION]: [],
    ...groupBy(activeAccounts, a => a.type),
  };
  if (archivedAccounts?.length > 0) {
    groupedAccounts.ARCHIVED = archivedAccounts;
  }
  return groupedAccounts;
});

const Option = ({
  collective,
  description,
  isChild,
  ...props
}: {
  collective: any;
  description?: string | ReactElement;
  isChild?: boolean;
}) => {
  description = description || (
    <FormattedMessage
      id="AccountSwitcher.Description"
      defaultMessage="{type, select, USER {Personal profile} COLLECTIVE {Collective admin} ORGANIZATION {Organization admin} EVENT {Event admin} FUND {Fund admin} PROJECT {Project admin} other {}}"
      values={{ type: collective?.type }}
    />
  );
  return (
    <Flex alignItems="center" gridGap="12px" overflow="hidden" {...props}>
      <Avatar collective={collective} size={isChild ? 20 : 32} useIcon={isChild} />
      <Flex flexDirection="column" overflow="hidden">
        <P color="black.800" fontSize="14px" letterSpacing="0" fontWeight="500" truncateOverflow>
          {collective?.name}
        </P>
        <P color="black.700" fontSize="12px" letterSpacing="0" fontWeight="400" truncateOverflow>
          {description}
        </P>
      </Flex>
    </Flex>
  );
};

const MenuEntry = ({ account, activeSlug }: { account: any; activeSlug: string }) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <React.Fragment>
      <StyledMenuEntry
        key={account.id}
        href={`/dashboard/${account.slug}`}
        title={account.name}
        $isActive={activeSlug === account.slug}
      >
        <Option collective={account} />
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
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {expanded ? <ChevronUp size="16px" /> : <ChevronDown size="16px" />}
          </StyledRoundButton>
        )}
      </StyledMenuEntry>
      {expanded &&
        account?.children
          ?.slice() // Create a copy to that we can sort the otherwise immutable array
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(child => (
            <StyledMenuEntry
              key={child?.id}
              href={`/dashboard/${child.slug}`}
              title={child.name}
              $isActive={activeSlug === child.slug}
              ml={3}
            >
              <Option collective={child} isChild />
            </StyledMenuEntry>
          ))}
    </React.Fragment>
  );
};

const AccountSwitcher = ({ activeSlug }: { activeSlug: string }) => {
  const { LoggedInUser } = useLoggedInUser();

  const loggedInUserCollective = LoggedInUser?.collective;

  const groupedAccounts = getGroupedAdministratedAccounts(LoggedInUser);
  const rootAccounts = flatten(Object.values(groupedAccounts));
  const allAdministratedAccounts = [...rootAccounts, ...flatten(rootAccounts.map(a => a.children))];
  const activeAccount = allAdministratedAccounts.find(a => a.slug === activeSlug) || loggedInUserCollective;

  return (
    <Dropdown trigger="click" className="flex-grow">
      {({ triggerProps, dropdownProps }) => (
        <React.Fragment>
          <Flex alignItems="center" flex={0}>
            <DropdownButton {...triggerProps}>
              <Option collective={activeAccount} />
              <ChevronsUpDown size={18} />
            </DropdownButton>
          </Flex>
          <Container maxWidth={'100%'} {...dropdownProps}>
            <StyledDropdownContent>
              <Flex p={2} flexDirection="column" gridGap={3}>
                <StyledMenuEntry
                  key={loggedInUserCollective?.id}
                  href={`/dashboard/${loggedInUserCollective?.slug}`}
                  title={loggedInUserCollective?.name}
                  $isActive={activeSlug === loggedInUserCollective?.slug}
                >
                  <Option collective={loggedInUserCollective} />
                </StyledMenuEntry>
                {Object.entries(groupedAccounts).map(([collectiveType, accounts]) => {
                  return (
                    <div key={collectiveType}>
                      <Flex alignItems="center" px={1} mb={1} gap="8px">
                        <Span
                          fontWeight="500"
                          color="black.600"
                          textTransform="uppercase"
                          letterSpacing="0"
                          fontSize="12px"
                          whiteSpace="nowrap"
                        >
                          <FormattedMessage
                            id="AccountSwitcher.Category.Titles"
                            defaultMessage="{type, select, USER {My workspace} COLLECTIVE {My Collectives} ORGANIZATION {My Organizations} EVENT {My Events} FUND {My Funds} PROJECT {My Projects} ARCHIVED {Archived} other {}}"
                            values={{ type: collectiveType }}
                          />
                        </Span>
                        <StyledHr width="100%" borderColor="black.300" />
                        {CREATE_NEW_LINKS[collectiveType] && accounts.length > 0 && (
                          <Link href={CREATE_NEW_LINKS[collectiveType]}>
                            <StyledRoundButton
                              minWidth={24}
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
                      {EMPTY_GROUP_STATE[collectiveType] && accounts.length === 0 && (
                        <div className="mx-1 flex flex-col">
                          <p className="text-xs text-muted-foreground">
                            {EMPTY_GROUP_STATE[collectiveType].emptyMessage}
                          </p>
                          <Link
                            className="my-3 inline-flex items-center rounded-lg border border-input px-6 py-4 text-accent-foreground shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                            href="/create"
                          >
                            <div className="mr-3 rounded-full border bg-white p-2 text-muted-foreground">
                              <Plus size={12} />
                            </div>
                            {EMPTY_GROUP_STATE[collectiveType].linkLabel}
                          </Link>
                        </div>
                      )}
                      {accounts
                        ?.sort((a, b) => a.name.localeCompare(b.name))
                        .map(account => <MenuEntry key={account.id} account={account} activeSlug={activeSlug} />)}
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

export default AccountSwitcher;
