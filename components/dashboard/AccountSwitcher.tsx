import React from 'react';
import { css } from '@styled-system/css';
import { flatten, groupBy, omit, uniqBy } from 'lodash';
import { ArrowRight, ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import memoizeOne from 'memoize-one';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import formatCollectiveType from '../../lib/i18n/collective-type';

import Avatar from '../Avatar';
import Container from '../Container';
import { Flex, Box } from '../Grid';
import Link from '../Link';
import { Dropdown, DropdownContent } from '../StyledDropdown';
import StyledRoundButton from '../StyledRoundButton';
import StyledTooltip from '../StyledTooltip';
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
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  grid-gap: 4px;
  color: ${props => props.theme.colors.black[800]} !important;
  letter-spacing: 0;

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
  display: flex;
  background: white;
  height: 100%;
  font-size: 14px;
  flex-shrink: 0;
  border: 0;
  align-items: center;
  justify-content: space-between;
  transition: all 50ms ease-out;
  cursor: pointer;
  overflow: hidden;
  padding-left: 8px;
  padding-right: 6px;
  flex: 1;
  border-radius: 100px 0 0 100px;
  grid-gap: 8px;
  &:hover,
  :active,
  :focus-visible {
    background: #f9fafb;
    svg {
      flex-shrink: 0;
      color: #1f2937;
    }
  }
  svg {
    flex-shrink: 0;
    color: #9ca3af;
  }

  div {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const StyledDropdownContent = styled(DropdownContent)`
  border-radius: 12px;
  right: 0;
  left: 0;
  max-width: 100%;
  margin-top: 8px;
  max-height: 70vh;
  overflow: hidden;
`;

const AccountSwitcherButtonContainer = styled.div`
  display: flex;
  background: white;
  border: 1px solid #e6e8eb;
  width: 100%;
  border-radius: 100px;
  font-size: 14px;
  flex-shrink: 0;
  align-items: stretch;
  height: 36px;
`;
const ProfileLink = styled(Link)`
  width: 34px;
  padding-right: 4px;
  border-left: 1px solid #f3f4f6;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0 100px 100px 0;

  &:hover,
  :active,
  :focus-visible {
    background: #f9fafb;
    svg {
      flex-shrink: 0;
      color: #1f2937;
    }
  }
  svg {
    flex-shrink: 0;
    color: #9ca3af;
  }
`;

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

  const groupedAccounts = groupBy(activeAccounts, a => a.type);
  if (archivedAccounts?.length > 0) {
    groupedAccounts.archived = archivedAccounts;
  }
  return groupedAccounts;
});

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
        <Flex overflow="hidden" alignItems="center" gridGap="8px">
          <Avatar collective={account} size={24} />
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
          .filter(child => !child.isArchived)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(child => (
            <StyledMenuEntry
              key={child?.id}
              href={`/dashboard/${child.slug}`}
              title={child.name}
              $isActive={activeSlug === child.slug}
            >
              <Flex overflow="hidden" alignItems="center" gridGap="8px">
                <Avatar ml={4} collective={child} size={24} />
                <Span truncateOverflow>{child.name}</Span>
              </Flex>
            </StyledMenuEntry>
          ))}
    </React.Fragment>
  );
};

const AccountSwitcher = ({ activeSlug }: { activeSlug: string }) => {
  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();

  const loggedInUserCollective = LoggedInUser?.collective;

  const groupedAccounts = getGroupedAdministratedAccounts(LoggedInUser);
  const rootAccounts = flatten(Object.values(groupedAccounts));
  const allAdministratedAccounts = [...rootAccounts, ...flatten(rootAccounts.map(a => a.children))];
  const activeAccount = allAdministratedAccounts.find(a => a.slug === activeSlug) || loggedInUserCollective;

  return (
    <div style={{ position: 'relative', maxWidth: '100%' }}>
      <Dropdown trigger="click">
        {({ triggerProps, dropdownProps }) => (
          <React.Fragment>
            <AccountSwitcherButtonContainer>
              <DropdownButton {...triggerProps}>
                <Flex alignItems="center" gridGap="8px">
                  <Avatar collective={activeAccount} size={24} />
                  <div>
                    <P color="#0f172a" lineHeight="20px" letterSpacing="0" fontWeight="500" truncateOverflow>
                      {activeAccount?.name}
                    </P>
                  </div>
                </Flex>

                <ChevronsUpDown size={18} strokeWidth={2} />
              </DropdownButton>
              <StyledTooltip
                content={intl.formatMessage({ id: 'GoToProfilePage', defaultMessage: 'Go to Profile page' })}
                place="right"
                noArrow
                delayHide={0}
              >
                {props => (
                  <Flex {...props}>
                    <ProfileLink href={`/${activeAccount?.slug}`}>
                      <ArrowRight size={16} strokeWidth={2} />
                    </ProfileLink>
                  </Flex>
                )}
              </StyledTooltip>
            </AccountSwitcherButtonContainer>
            <StyledDropdownContent {...dropdownProps}>
              <Flex p={2} overflowY="auto" flexDirection="column" gridGap={2}>
                <P mb={0} px={1} color="black.800" fontSize="12px" fontWeight="600">
                  <FormattedMessage id="Dashboard.SwitchDashboardContext" defaultMessage="Switch dashboard context" />
                </P>
                <StyledMenuEntry
                  key={loggedInUserCollective?.id}
                  href={`/dashboard/${loggedInUserCollective?.slug}`}
                  title={loggedInUserCollective?.name}
                  $isActive={activeSlug === loggedInUserCollective?.slug}
                >
                  <Flex alignItems="center" gridGap="12px">
                    <Avatar collective={loggedInUserCollective} size={24} />
                    <Span truncateOverflow>{loggedInUserCollective?.name}</Span>
                  </Flex>
                </StyledMenuEntry>
                {Object.entries(omit(groupedAccounts, 'archived')).map(([collectiveType, accounts]) => {
                  return (
                    <div key={collectiveType}>
                      <Flex alignItems="center" px={1} mb={1}>
                        <Span fontWeight="600" color="#656d76" fontSize="12px" lineHeight="20px" letterSpacing="0">
                          {formatCollectiveType(intl, collectiveType, 2)}
                        </Span>
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
          </React.Fragment>
        )}
      </Dropdown>
    </div>
  );
};

export default AccountSwitcher;
