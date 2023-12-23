import React from 'react';
import { ExclamationTriangle } from '@styled-icons/fa-solid/ExclamationTriangle';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import slugify from 'slugify';
import styled, { css } from 'styled-components';

import AuthenticatedPage from '../components/AuthenticatedPage';
import Container from '../components/Container';
import { Box, Grid } from '../components/Grid';
import Link from '../components/Link';
import MessageBox from '../components/MessageBox';
import AccountSettings from '../components/root-actions/AccountSettings';
import AccountType from '../components/root-actions/AccountType';
import BanAccounts from '../components/root-actions/BanAccounts';
import BanAccountsWithSearch from '../components/root-actions/BanAccountsWithSearch';
import ClearCacheForAccountForm from '../components/root-actions/ClearCacheForAccountForm';
import ConnectAccountsForm from '../components/root-actions/ConnectAccountsForm';
import MergeAccountsForm from '../components/root-actions/MergeAccountsForm';
import MoveAuthoredContributions from '../components/root-actions/MoveAuthoredContributions';
import MoveExpenses from '../components/root-actions/MoveExpenses';
import MoveReceivedContributions from '../components/root-actions/MoveReceivedContributions';
import RecurringContributions from '../components/root-actions/RecurringContributions';
import RootActivityLog from '../components/root-actions/RootActivityLog';
import UnhostAccountForm from '../components/root-actions/UnhostAccountForm';
import StyledCard from '../components/StyledCard';
import StyledHr from '../components/StyledHr';
import { H2, H3, P, Span } from '../components/Text';

const GRID_TEMPLATE_COLUMNS = ['1fr', 'minmax(220px, 1fr) 6fr'];

const MENU = [
  {
    id: 'Accounts',
    type: 'category',
  },
  { id: 'Clear cache', title: 'Clear cache for account', Component: ClearCacheForAccountForm },
  { id: 'Connect accounts', Component: ConnectAccountsForm },
  {
    id: 'Merge accounts',
    isDangerous: true,
    Component: MergeAccountsForm,
    description: `Before merging user accounts, you must always make sure that the person who requested it own both emails. Merging means payment methods are merged too, so if we just merge 2 accounts because someones ask for it without verifying we could end up in a very bad situation.\nA simple way to do that is to send a unique random code to the other account they want to claim and ask them to share this code.`,
  },
  { id: 'Unhost account', Component: UnhostAccountForm },
  { id: 'Account Settings', Component: AccountSettings },
  {
    id: 'Account Type',
    Component: AccountType,
    description: `This tool is meant to convert a User account to an Organization type. The organization account will have the fields copied from the initial user account. Please notify the user to go through and update the organization account details after this is done. The location data for the user (if exists) will become public for the organization.`,
  },
  {
    id: 'Recurring Contributions',
    Component: RecurringContributions,
    description: `This tool is designed to help root admins to update recurring contributions of users`,
    useCard: false,
  },
  { id: 'Activity Log', Component: RootActivityLog, useCard: false },
  {
    id: 'Contributions & Expenses',
    type: 'category',
  },
  {
    id: 'Move authored contributions',
    Component: MoveAuthoredContributions,
    description: `This tool is meant to edit the account that authored one or more contributions. It can be used to mark contributions as "Incognito" by picking the contributor's incognito profile in "Move to". The payment methods used for the contributions are re-affected to the new profile, so make sure they have the permission to use them.`,
  },
  {
    id: 'Move received contributions',
    Component: MoveReceivedContributions,
    description: `This tool is meant to edit the account that received a contribution. Use it to move contributions to different tiers, sub-projects, events, etc.`,
  },
  {
    id: 'Move expenses',
    Component: MoveExpenses,
    description: `This tool is meant to move expenses to another account.`,
  },
  {
    id: 'Moderation',
    type: 'category',
  },
  {
    id: 'Ban accounts',
    Component: BanAccounts,
    isDangerous: true,
    description: 'Use this action to ban an account or a network of accounts.',
  },
  {
    id: 'Search & ban',
    Component: BanAccountsWithSearch,
    isDangerous: true,
  },
];

// Add slug for menu sections
MENU.forEach(menu => (menu.slug = slugify(menu.id, { lower: true })));

const MenuEntry = styled.div`
  display: block;
  background: white;
  padding: 16px;
  cursor: pointer;
  background: none;
  color: inherit;
  border: none;
  font: inherit;
  outline: inherit;
  width: 100%;
  text-align: left;

  ${props =>
    props.$isActive &&
    css`
      font-weight: 800;
      background: #f5faff;
    `}

  &: hover {
    background: #f9f9f9;
  }

  ${props =>
    props.$type === 'category' &&
    css`
      cursor: default;
      background: #f9f9f9;
      border-bottom: 1px solid #eaeaea;
      box-shadow: 0px 3px 6px #eaeaea;
    `}
`;

const RootActionsPage = () => {
  const router = useRouter();
  const intl = useIntl();
  const selectedMenuEntry = MENU.find(m => m.slug === router.query.section) || MENU[1];
  const showHiddenActions = Boolean(router.query.showHiddenActions);
  return (
    <AuthenticatedPage
      disableSignup
      rootOnly
      navTitle={intl.formatMessage({ id: 'RootActions', defaultMessage: 'Root Actions' })}
    >
      <Grid gridTemplateColumns={GRID_TEMPLATE_COLUMNS} maxWidth={1400} m="0 auto">
        <Container borderRight="1px solid #e5e5e5" fontSize="14px">
          {MENU.filter(e => showHiddenActions || !e.isHidden).map(menuEntry =>
            menuEntry.type === 'category' ? (
              <MenuEntry key={menuEntry.id} title={menuEntry.title || menuEntry.id} $type="category">
                {menuEntry.id}
              </MenuEntry>
            ) : (
              <MenuEntry
                key={menuEntry.id}
                as={Link}
                href={`/opencollective/root-actions/${menuEntry.slug}`}
                shallow
                title={menuEntry.title || menuEntry.id}
                $isActive={selectedMenuEntry.id === menuEntry.id}
                $type={menuEntry.type}
              >
                {menuEntry.id}
              </MenuEntry>
            ),
          )}
        </Container>
        <div>
          <H3 lineHeight="30px" fontSize="24px" backgroundColor="black.50" color="black.800" p={3}>
            {selectedMenuEntry.title || selectedMenuEntry.id}
          </H3>
          <Box px={[2, 3, 4]}>
            {selectedMenuEntry.isDangerous && (
              <Container textAlign="center" my={4}>
                <H2 fontSize="30px" css={{ textShadow: '0px 2px 2px red' }}>
                  <ExclamationTriangle color="red" size={30} />
                  <Span ml={3} css={{ verticalAlign: 'middle' }}>
                    DANGEROUS ACTION
                  </Span>
                </H2>
                <P mt={2}>Please be super careful with the action below, and double check everything you do.</P>
                <StyledHr width="100%" mt={4} />
              </Container>
            )}

            {selectedMenuEntry.description && (
              <MessageBox type="info" withIcon my={3} lineHeight="20px" whiteSpace="pre-wrap">
                {selectedMenuEntry.description}
              </MessageBox>
            )}
            {selectedMenuEntry.useCard === false ? (
              <selectedMenuEntry.Component />
            ) : (
              <StyledCard p={4} my={4} width="100%">
                <selectedMenuEntry.Component />
              </StyledCard>
            )}
          </Box>
        </div>
      </Grid>
    </AuthenticatedPage>
  );
};

RootActionsPage.propTypes = {};

// ignore unused exports default
// next.js export
export default RootActionsPage;
