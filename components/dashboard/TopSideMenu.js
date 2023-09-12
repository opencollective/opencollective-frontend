import React from 'react';
import PropTypes from 'prop-types';
import {
  ArrowLeftRight,
  BarChart3 as Chart,
  Coins,
  CreditCard,
  FileText,
  Home,
  Inbox,
  Network,
  Receipt,
  Settings,
} from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import hasFeature, { FEATURES } from '../../lib/allowed-features';
import { isHostAccount, isIndividualAccount, isInternalHost, isSelfHostedAccount } from '../../lib/collective.lib';
import { isOneOfTypes, isType } from '../../lib/collective-sections';
import { CollectiveType } from '../../lib/constants/collectives';

import Container from '../Container';

import {
  ABOUT_ORG_SECTIONS,
  ALL_SECTIONS,
  COLLECTIVE_SECTIONS,
  FISCAL_HOST_SECTIONS,
  HOST_DASHBOARD_SECTIONS,
  ORG_BUDGET_SECTIONS,
} from './constants';
import { DashboardContext } from './DashboardContext';
import { MenuGroup, MenuLink, MenuSectionHeader } from './TopSideMenuComponents';

const { USER, ORGANIZATION, COLLECTIVE, FUND, EVENT, PROJECT } = CollectiveType;

const Menu = ({ isAccountantOnly }) => {
  const { account } = React.useContext(DashboardContext);
  const isHost = isHostAccount(account);
  const isUserHost = account.isHost === true && isType(account, USER); // for legacy compatibility for users who are hosts
  const isIndividual = isIndividualAccount(account);
  return (
    <Container>
      {/** Host dashboard */}
      <MenuGroup if={isHost} mb={24}>
        <MenuLink parentSection={'FISCAL_HOST_SETTINGS'} section={FISCAL_HOST_SECTIONS.FISCAL_HOSTING} />
        <MenuLink parentSection={'FISCAL_HOST_SETTINGS'} section={FISCAL_HOST_SECTIONS.INVOICES_RECEIPTS} />
        <MenuLink parentSection={'FISCAL_HOST_SETTINGS'} section={FISCAL_HOST_SECTIONS.RECEIVING_MONEY} />
        <MenuLink parentSection={'FISCAL_HOST_SETTINGS'} section={FISCAL_HOST_SECTIONS.SENDING_MONEY} />
        <MenuLink
          parentSection={'FISCAL_HOST_SETTINGS'}
          section={FISCAL_HOST_SECTIONS.HOST_VIRTUAL_CARDS_SETTINGS}
          if={hasFeature(account, FEATURES.VIRTUAL_CARDS)}
        />
        <MenuLink
          parentSection={'FISCAL_HOST_SETTINGS'}
          section={FISCAL_HOST_SECTIONS.POLICIES}
          if={isOneOfTypes(account, [USER, ORGANIZATION])}
        />
      </MenuGroup>

      {/** User/org/collective/event/project dashboard */}
      <MenuGroup if={!isHost || isUserHost}>
        <MenuLink parentSection={'SETTINGS'} section={COLLECTIVE_SECTIONS.INFO} />
        <MenuLink parentSection={'SETTINGS'} section={COLLECTIVE_SECTIONS.COLLECTIVE_PAGE} />
        <MenuLink
          parentSection={'SETTINGS'}
          section={COLLECTIVE_SECTIONS.COLLECTIVE_GOALS}
          if={isOneOfTypes(account, [COLLECTIVE, PROJECT])}
        />
        <MenuLink
          parentSection={'SETTINGS'}
          section={COLLECTIVE_SECTIONS.CONNECTED_ACCOUNTS}
          if={isType(account, COLLECTIVE)}
        />
        <MenuLink
          parentSection={'SETTINGS'}
          section={COLLECTIVE_SECTIONS.POLICIES}
          if={isOneOfTypes(account, [COLLECTIVE, FUND])}
        />
        <MenuLink
          parentSection={'SETTINGS'}
          section={COLLECTIVE_SECTIONS.CUSTOM_EMAIL}
          if={isOneOfTypes(account, [COLLECTIVE, EVENT, PROJECT])}
        />
        <MenuLink
          parentSection={'SETTINGS'}
          section={COLLECTIVE_SECTIONS.EXPORT}
          if={isOneOfTypes(account, [COLLECTIVE, EVENT, PROJECT])}
        />
        <MenuLink
          parentSection={'SETTINGS'}
          section={COLLECTIVE_SECTIONS.HOST}
          if={isOneOfTypes(account, [COLLECTIVE, FUND])}
        />
        <MenuLink
          parentSection={'SETTINGS'}
          section={COLLECTIVE_SECTIONS.TEAM}
          if={isOneOfTypes(account, [COLLECTIVE, FUND, ORGANIZATION, EVENT, PROJECT])}
        />
        <MenuLink
          parentSection={'SETTINGS'}
          section={COLLECTIVE_SECTIONS.PAYMENT_METHODS}
          if={['ACTIVE', 'AVAILABLE'].includes(account.features.USE_PAYMENT_METHODS)}
        />
        <MenuLink parentSection={'SETTINGS'} section={COLLECTIVE_SECTIONS.PAYMENT_RECEIPTS} if={isIndividual} />
        <MenuLink parentSection={'SETTINGS'} section={COLLECTIVE_SECTIONS.NOTIFICATIONS} if={isIndividual} />
        <MenuLink
          parentSection={'SETTINGS'}
          section={ORG_BUDGET_SECTIONS.GIFT_CARDS}
          if={['ACTIVE', 'AVAILABLE'].includes(account.features.EMIT_GIFT_CARDS)}
        />
        <MenuLink
          parentSection={'SETTINGS'}
          section={COLLECTIVE_SECTIONS.VIRTUAL_CARDS}
          if={
            isOneOfTypes(account, [COLLECTIVE, FUND, EVENT, PROJECT]) &&
            hasFeature(account.host, FEATURES.VIRTUAL_CARDS) &&
            account.isApproved
          }
        />
        <MenuLink parentSection={'SETTINGS'} section={COLLECTIVE_SECTIONS.TICKETS} if={isType(account, EVENT)} />
        <MenuLink
          parentSection={'SETTINGS'}
          section={COLLECTIVE_SECTIONS.TIERS}
          if={isOneOfTypes(account, [COLLECTIVE, FUND, EVENT, PROJECT])}
        />
        <MenuLink parentSection={'SETTINGS'} section={COLLECTIVE_SECTIONS.WEBHOOKS} />
        <MenuLink parentSection={'SETTINGS'} section={COLLECTIVE_SECTIONS.AUTHORIZED_APPS} if={isType(account, USER)} />
        <MenuLink parentSection={'SETTINGS'} section={COLLECTIVE_SECTIONS.USER_SECURITY} if={isIndividual} />
        <MenuLink
          parentSection={'SETTINGS'}
          section={COLLECTIVE_SECTIONS.FOR_DEVELOPERS}
          if={isOneOfTypes(account, [COLLECTIVE, USER])}
        />
        <MenuLink parentSection={'SETTINGS'} section={COLLECTIVE_SECTIONS.ACTIVITY_LOG} />
        <MenuLink
          parentSection={'SETTINGS'}
          section={FISCAL_HOST_SECTIONS.SECURITY}
          if={isOneOfTypes(account, [COLLECTIVE, FUND, ORGANIZATION])}
        />
        <MenuLink parentSection={'SETTINGS'} section={COLLECTIVE_SECTIONS.ADVANCED} />
        <MenuGroup if={isSelfHostedAccount(account) && !isAccountantOnly} mt={24}>
          <MenuLink parentSection={'SETTINGS'} section={FISCAL_HOST_SECTIONS.INVOICES_RECEIPTS} />
          <MenuLink parentSection={'SETTINGS'} section={FISCAL_HOST_SECTIONS.RECEIVING_MONEY} />
          <MenuLink parentSection={'SETTINGS'} section={FISCAL_HOST_SECTIONS.SENDING_MONEY} />
        </MenuGroup>
      </MenuGroup>

      {/* org settings for hosts */}
      <MenuLink
        icon={{ component: Settings }}
        if={isType(account, ORGANIZATION) && isHost}
        section="ORG_SETTINGS"
        goToSection={isAccountantOnly ? ALL_SECTIONS.PAYMENT_RECEIPTS : ABOUT_ORG_SECTIONS.INFO}
        renderSubMenu={({ parentSection }) => (
          <React.Fragment>
            {!isAccountantOnly && (
              <React.Fragment>
                <MenuLink parentSection={parentSection} section={ABOUT_ORG_SECTIONS.INFO} />
                <MenuLink parentSection={parentSection} section={ABOUT_ORG_SECTIONS.COLLECTIVE_PAGE} />
                <MenuLink parentSection={parentSection} section={ABOUT_ORG_SECTIONS.CONNECTED_ACCOUNTS} />
                <MenuLink parentSection={parentSection} section={ABOUT_ORG_SECTIONS.TEAM} />
                <MenuLink parentSection={parentSection} section={ORG_BUDGET_SECTIONS.PAYMENT_METHODS} />
              </React.Fragment>
            )}
            <MenuLink parentSection={parentSection} section={ORG_BUDGET_SECTIONS.PAYMENT_RECEIPTS} />
            <MenuLink parentSection={parentSection} section={ORG_BUDGET_SECTIONS.TIERS} if={!isAccountantOnly} />
            {!isAccountantOnly && (
              <React.Fragment>
                <MenuLink parentSection={parentSection} section={ORG_BUDGET_SECTIONS.GIFT_CARDS} />
                <MenuLink parentSection={parentSection} section={ALL_SECTIONS.WEBHOOKS} />
                <MenuLink parentSection={parentSection} section={COLLECTIVE_SECTIONS.FOR_DEVELOPERS} />
                <MenuLink parentSection={parentSection} section={COLLECTIVE_SECTIONS.ACTIVITY_LOG} />
                <MenuLink parentSection={parentSection} section={FISCAL_HOST_SECTIONS.SECURITY} />
                <MenuLink parentSection={parentSection} section={ALL_SECTIONS.ADVANCED} />
                {!isHostAccount(account) && (
                  <MenuLink parentSection={parentSection} section={ALL_SECTIONS.FISCAL_HOSTING} />
                )}
              </React.Fragment>
            )}
          </React.Fragment>
        )}
      >
        <FormattedMessage id="AdminPanel.OrganizationSettings" defaultMessage="Organization Settings" />
      </MenuLink>
    </Container>
  );
};

Menu.propTypes = {
  isAccountantOnly: PropTypes.bool,
};

export default Menu;
