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
import { themeGet } from '@styled-system/theme-get';
import { ChevronsUpDown } from 'lucide-react';
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
import { SettingsContext } from '../../lib/SettingsContext';
import { cva } from 'class-variance-authority';
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

  ${props =>
    props.$isActive
      ? css({
          backgroundColor: 'slate.100',
        })
      : css({
          ':hover': {
            backgroundColor: 'slate.100',
          },
        })}
`;

const StyledDropdownContent = styled(DropdownContent)`
  border-radius: 8px;
  right: 0;
  left: 0;
  margin-top: 8px;
  max-height: 70vh;
  overflow-y: scroll;
`;

const getGroupedAdministratedAccounts = memoizeOne(loggedInUser => {
  let administratedAccounts =
    loggedInUser?.memberOf.filter(m => m.role === 'ADMIN' && !m.collective.isIncognito).map(m => m.collective) || [];

  // Filter out accounts if the user is also an admin of the parent of that account (since we already show the parent)
  const childAccountIds = flatten(administratedAccounts.map(a => a.children)).map((a: { id: number }) => a.id);
  administratedAccounts = administratedAccounts.filter(a => !childAccountIds.includes(a.id));
  administratedAccounts = uniqBy([...administratedAccounts], a => a.id).filter(Boolean);

  // Filter out Archived accounts and group it separately
  const archivedAccounts = administratedAccounts.filter(a => a.isArchived);
  const activeAccounts = administratedAccounts.filter(a => !a.isArchived);

  const groupedAccounts = groupBy(activeAccounts, a => a.type);
  if (archivedAccounts?.length > 0) {
    groupedAccounts.archived = archivedAccounts;
  }
  return groupedAccounts;
});

const MenuEntry = ({ account, activeSlug }) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="text-slate-900">
      <StyledMenuEntry
        key={account.id}
        href={`/dashboard/${account.slug}`}
        title={account.name}
        $isActive={activeSlug === account.slug}
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
        account?.children
          ?.slice() // Create a copy to that we can sort the otherwise immutable array
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(child => (
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
    </div>
  );
};

MenuEntry.propTypes = {
  account: PropTypes.object,
  activeSlug: PropTypes.string,
};

const AccountSwitcher = () => {
  const { LoggedInUser } = useLoggedInUser();
  const { settings } = React.useContext(SettingsContext);

  const intl = useIntl();
  const router = useRouter();
  const { slug } = router.query;
  const activeSlug = Array.isArray(slug) ? slug[0] : slug;

  const loggedInUserCollective = LoggedInUser?.collective;

  const groupedAccounts = getGroupedAdministratedAccounts(LoggedInUser);
  const rootAccounts = flatten(Object.values(groupedAccounts));
  const allAdministratedAccounts = [...rootAccounts, ...flatten(rootAccounts.map(a => a.children))];
  const activeAccount = allAdministratedAccounts.find(a => a.slug === activeSlug) || loggedInUserCollective;
  const isPersonalProfile = activeAccount?.slug === LoggedInUser?.collective.slug;
  return (
    <Dropdown trigger="click">
      {({ triggerProps, dropdownProps }) => (
        <div className="relative">
          <Flex alignItems="center">
            <button
              className={cva(
                'group flex w-full cursor-pointer items-center justify-between border-slate-200 hover:border-blue-700 p-2 outline-2 transition-colors ',
                {
                  variants: {
                    bg: {
                      white: ' bg-white  hover:bg-slate-50  ',
                      gray: ' bg-transparent hover:bg-white ',
                    },
                    border: {
                      true: 'border ',
                      false: 'border-0',
                    },
                    round: {
                      true: 'rounded-full',
                      false: 'rounded-lg',
                    },
                  },
                },
              )({ bg: settings.sidebarGrayBg ? 'gray' : 'white', border: true, round: false })}
              {...triggerProps}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                <Avatar collective={activeAccount} size={32} />
                {!isPersonalProfile && <div className="absolute z-20 -right-1 -bottom-1 w-1/2 h-1/2 rounded-full bg-white flex items-center justify-center"><Avatar collective={LoggedInUser?.collective} size={16} /></div>}
                </div>
                <div className="flex flex-col items-start truncate">
                <span className="truncate text-sm font-medium text-slate-900">{activeAccount?.name}</span>
                <span className="truncate text-xs text-slate-700">{isPersonalProfile ? "Personal profile" : activeAccount?.isHost ? "Fiscal Host Admin" : "Collective Admin"}</span>

                </div>
              </div>

              <ChevronsUpDown size={20} className="shrink-0 text-slate-500 group-hover:text-slate-900" />
            </button>
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
                  <Flex alignItems="center" gridGap="12px">
                    <Avatar collective={loggedInUserCollective} size={32} />
                    <span className="truncate text-slate-900">{loggedInUserCollective?.name}</span>
                  </Flex>
                </StyledMenuEntry>
                {Object.entries(groupedAccounts).map(([collectiveType, accounts]) => {
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
                      {accounts
                        ?.sort((a, b) => a.name.localeCompare(b.name))
                        .map(account => (
                          <MenuEntry key={account.id} account={account} activeSlug={activeSlug} />
                        ))}
                    </div>
                  );
                })}
              </Flex>
            </StyledDropdownContent>
          </Container>
        </div>
      )}
    </Dropdown>
  );
};

AccountSwitcher.propTypes = {
  collective: PropTypes.object,
  isLoading: PropTypes.bool,
};

export default AccountSwitcher;
