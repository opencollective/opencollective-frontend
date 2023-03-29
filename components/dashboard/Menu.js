import React from 'react';
import PropTypes from 'prop-types';
import { BarChartAlt2 as Chart } from '@styled-icons/boxicons-regular/BarChartAlt2';
import { Cog } from '@styled-icons/boxicons-regular/Cog';
import { Coin } from '@styled-icons/boxicons-regular/Coin';
import { CreditCard } from '@styled-icons/boxicons-regular/CreditCard';
import { NetworkChart } from '@styled-icons/boxicons-regular/NetworkChart';
import { Receipt } from '@styled-icons/boxicons-regular/Receipt';
import { Transfer } from '@styled-icons/boxicons-regular/Transfer';
// import { Inbox } from '@styled-icons/bootstrap/Inbox';
import { Inbox } from '@styled-icons/octicons/Inbox';
import { FormattedMessage, useIntl } from 'react-intl';

import hasFeature, { FEATURES } from '../../lib/allowed-features';
import { isHostAccount, isIndividualAccount, isSelfHostedAccount } from '../../lib/collective.lib';
import { getCollectiveTypeKey, isOneOfTypes, isType } from '../../lib/collective-sections';
import { CollectiveType } from '../../lib/constants/collectives';

import { HOST_SECTIONS } from '../host-dashboard/constants';

import {
  ABOUT_ORG_SECTIONS,
  ALL_SECTIONS,
  COLLECTIVE_SECTIONS,
  FISCAL_HOST_SECTIONS,
  HOST_DASHBOARD_SECTIONS,
  ORG_BUDGET_SECTIONS,
  PAGE_TITLES,
} from './constants';
import { MenuGroup, MenuLink, MenuSectionHeader, useSubmenu } from './MenuComponents';

const { USER, ORGANIZATION, COLLECTIVE, FUND, EVENT, PROJECT } = CollectiveType;

const OrganizationSettingsMenuLinks = ({ collective, isAccountantOnly }) => {
  return (
    <React.Fragment>
      {!isAccountantOnly && (
        <React.Fragment>
          <MenuLink collective={collective} section={ABOUT_ORG_SECTIONS.INFO} />
          <MenuLink collective={collective} section={ABOUT_ORG_SECTIONS.COLLECTIVE_PAGE} />
          <MenuLink collective={collective} section={ABOUT_ORG_SECTIONS.CONNECTED_ACCOUNTS} />
          <MenuLink collective={collective} section={ABOUT_ORG_SECTIONS.TEAM} />
          <MenuLink collective={collective} section={ORG_BUDGET_SECTIONS.PAYMENT_METHODS} />
        </React.Fragment>
      )}
      <MenuLink collective={collective} section={ORG_BUDGET_SECTIONS.PAYMENT_RECEIPTS} />
      {!isAccountantOnly && (
        <React.Fragment>
          <MenuLink collective={collective} section={ORG_BUDGET_SECTIONS.GIFT_CARDS} />
          <MenuLink collective={collective} section={ALL_SECTIONS.WEBHOOKS} />
          <MenuLink collective={collective} section={COLLECTIVE_SECTIONS.FOR_DEVELOPERS} />
          <MenuLink collective={collective} section={COLLECTIVE_SECTIONS.ACTIVITY_LOG} />
          <MenuLink collective={collective} section={FISCAL_HOST_SECTIONS.SECURITY} />
          <MenuLink collective={collective} section={ALL_SECTIONS.ADVANCED} />
          {!isHostAccount(collective) && <MenuLink collective={collective} section={ALL_SECTIONS.FISCAL_HOSTING} />}
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

OrganizationSettingsMenuLinks.propTypes = {
  collective: PropTypes.object,
  isAccountantOnly: PropTypes.bool,
};

const Menu = ({ collective, isAccountantOnly }) => {
  const { formatMessage } = useIntl();
  const isHost = isHostAccount(collective);
  const isIndividual = isIndividualAccount(collective);
  const isSimpleOrg = collective.type === 'ORGANIZATION' && !isHost;
  const { menuContent, SubMenu } = useSubmenu();

  if (menuContent) {
    return menuContent;
  } else {
    return (
      <React.Fragment>
        {/** Host dashboard */}
        <MenuGroup if={isHost} mb={24}>
          <MenuSectionHeader>
            <FormattedMessage id="HostDashboard" defaultMessage="Host Dashboard" />
          </MenuSectionHeader>
          <MenuLink collective={collective} section={HOST_SECTIONS.HOST_EXPENSES} icon={<Receipt size={16} />} />
          <MenuLink collective={collective} section={HOST_SECTIONS.FINANCIAL_CONTRIBUTIONS} icon={<Coin size={16} />} />
          <MenuLink
            collective={collective}
            section={HOST_DASHBOARD_SECTIONS.PENDING_CONTRIBUTIONS}
            if={!isAccountantOnly}
            icon={<Coin size={16} />}
          />
          <MenuLink
            collective={collective}
            section={HOST_SECTIONS.PENDING_APPLICATIONS}
            if={!isAccountantOnly}
            icon={<Inbox size={16} />}
          />
          <MenuLink
            collective={collective}
            section={HOST_SECTIONS.HOSTED_COLLECTIVES}
            if={!isAccountantOnly}
            icon={<NetworkChart size={16} />}
          />
          <MenuLink
            collective={collective}
            section={HOST_DASHBOARD_SECTIONS.HOST_VIRTUAL_CARDS}
            icon={<CreditCard size={16} />}
            if={!isAccountantOnly && hasFeature(collective, FEATURES.VIRTUAL_CARDS)}
          />
          <MenuLink collective={collective} section={HOST_SECTIONS.REPORTS} isBeta icon={<Chart size={16} />} />

          <SubMenu
            label={<FormattedMessage id="AdminPanel.FiscalHostSettings" defaultMessage="Fiscal Host Settings" />}
            icon={<Cog size={16} />}
            if={isHost && !isAccountantOnly}
          >
            <MenuLink collective={collective} section={FISCAL_HOST_SECTIONS.FISCAL_HOSTING} />
            <MenuGroup if={isHost}>
              <MenuLink collective={collective} section={FISCAL_HOST_SECTIONS.INVOICES_RECEIPTS} />
              <MenuLink collective={collective} section={FISCAL_HOST_SECTIONS.RECEIVING_MONEY} />
              <MenuLink collective={collective} section={FISCAL_HOST_SECTIONS.SENDING_MONEY} />
              <MenuLink
                collective={collective}
                section={FISCAL_HOST_SECTIONS.HOST_VIRTUAL_CARDS_SETTINGS}
                if={hasFeature(collective, FEATURES.VIRTUAL_CARDS)}
              />
              <MenuLink
                collective={collective}
                section={FISCAL_HOST_SECTIONS.POLICIES}
                if={isOneOfTypes(collective, [USER, ORGANIZATION])}
              />
            </MenuGroup>
          </SubMenu>
        </MenuGroup>

        {/** User/org/collective/event/project dashbord */}
        <MenuGroup>
          <MenuSectionHeader>
            {isType(collective, ORGANIZATION) ? (
              <FormattedMessage defaultMessage="Organization Dashboard" />
            ) : isType(collective, USER) ? (
              <FormattedMessage defaultMessage="User Dashboard" />
            ) : isType(collective, COLLECTIVE) ? (
              <FormattedMessage defaultMessage="Collective Dashboard" />
            ) : (
              <FormattedMessage defaultMessage="Dashboard" />
            )}
          </MenuSectionHeader>
          {/* <MenuLink collective={collective} section={COLLECTIVE_SECTIONS.HOME} /> */}

          <MenuLink
            collective={collective}
            section={COLLECTIVE_SECTIONS.MANAGE_CONTRIBUTIONS}
            icon={<Coin size={16} />}
          />
          <MenuLink collective={collective} section={COLLECTIVE_SECTIONS.EXPENSES} icon={<Receipt size={16} />} />
          <MenuLink collective={collective} section={COLLECTIVE_SECTIONS.TRANSACTIONS} icon={<Transfer size={16} />} />
          <MenuLink
            collective={collective}
            section={ORG_BUDGET_SECTIONS.FINANCIAL_CONTRIBUTIONS}
            if={isSelfHostedAccount(collective) && !isAccountantOnly && isType(collective, COLLECTIVE)}
          />

          {/* general settings */}
          <SubMenu
            if={!isHost}
            icon={<Cog size={16} />}
            label={<FormattedMessage id="Settings" defaultMessage="Settings" />}
          >
            <MenuLink collective={collective} section={COLLECTIVE_SECTIONS.INFO} />
            <MenuLink collective={collective} section={COLLECTIVE_SECTIONS.COLLECTIVE_PAGE} />
            <MenuLink
              collective={collective}
              section={COLLECTIVE_SECTIONS.COLLECTIVE_GOALS}
              if={isOneOfTypes(collective, [COLLECTIVE, PROJECT])}
            />
            <MenuLink
              collective={collective}
              section={COLLECTIVE_SECTIONS.CONNECTED_ACCOUNTS}
              if={isType(collective, COLLECTIVE)}
            />
            <MenuLink
              collective={collective}
              section={COLLECTIVE_SECTIONS.VIRTUAL_CARDS}
              if={
                isOneOfTypes(collective, [COLLECTIVE, FUND, EVENT, PROJECT]) &&
                hasFeature(collective.host, FEATURES.VIRTUAL_CARDS) &&
                collective.isApproved
              }
            />
            <MenuLink
              collective={collective}
              section={COLLECTIVE_SECTIONS.POLICIES}
              if={isOneOfTypes(collective, [COLLECTIVE, FUND])}
            />
            <MenuLink
              collective={collective}
              section={COLLECTIVE_SECTIONS.CUSTOM_EMAIL}
              if={isOneOfTypes(collective, [COLLECTIVE, EVENT, PROJECT])}
            />
            <MenuLink
              collective={collective}
              section={COLLECTIVE_SECTIONS.EXPORT}
              if={isOneOfTypes(collective, [COLLECTIVE, EVENT, PROJECT])}
            />
            <MenuLink
              collective={collective}
              section={COLLECTIVE_SECTIONS.HOST}
              if={isOneOfTypes(collective, [COLLECTIVE, FUND])}
            />
            <MenuLink
              collective={collective}
              section={COLLECTIVE_SECTIONS.TEAM}
              if={isOneOfTypes(collective, [COLLECTIVE, FUND, ORGANIZATION, EVENT, PROJECT])}
            />
            <MenuLink
              collective={collective}
              section={COLLECTIVE_SECTIONS.PAYMENT_METHODS}
              if={['ACTIVE', 'AVAILABLE'].includes(collective.features.USE_PAYMENT_METHODS)}
            />
            <MenuLink collective={collective} section={COLLECTIVE_SECTIONS.PAYMENT_RECEIPTS} if={isIndividual} />
            <MenuLink collective={collective} section={COLLECTIVE_SECTIONS.NOTIFICATIONS} if={isIndividual} />
            <MenuLink
              collective={collective}
              section={ORG_BUDGET_SECTIONS.GIFT_CARDS}
              if={['ACTIVE', 'AVAILABLE'].includes(collective.features.EMIT_GIFT_CARDS)}
            />
            <MenuLink
              collective={collective}
              section={COLLECTIVE_SECTIONS.VIRTUAL_CARDS}
              if={
                isOneOfTypes(collective, [COLLECTIVE, FUND, EVENT, PROJECT]) &&
                hasFeature(collective.host, FEATURES.VIRTUAL_CARDS) &&
                collective.isApproved
              }
            />
            <MenuLink collective={collective} section={COLLECTIVE_SECTIONS.TICKETS} if={isType(collective, EVENT)} />
            <MenuLink
              collective={collective}
              section={COLLECTIVE_SECTIONS.TIERS}
              if={isOneOfTypes(collective, [COLLECTIVE, FUND, EVENT, PROJECT])}
            />
            <MenuLink collective={collective} section={COLLECTIVE_SECTIONS.WEBHOOKS} />
            <MenuLink
              collective={collective}
              section={COLLECTIVE_SECTIONS.AUTHORIZED_APPS}
              if={isType(collective, USER)}
            />
            <MenuLink collective={collective} section={COLLECTIVE_SECTIONS.USER_SECURITY} if={isIndividual} />
            <MenuLink
              collective={collective}
              section={COLLECTIVE_SECTIONS.FOR_DEVELOPERS}
              if={isOneOfTypes(collective, [COLLECTIVE, USER])}
            />
            <MenuLink collective={collective} section={COLLECTIVE_SECTIONS.ACTIVITY_LOG} />
            <MenuLink
              collective={collective}
              section={FISCAL_HOST_SECTIONS.SECURITY}
              if={isOneOfTypes(collective, [COLLECTIVE, FUND, ORGANIZATION])}
            />
            <MenuLink collective={collective} section={COLLECTIVE_SECTIONS.ADVANCED} />
            <MenuGroup if={isSelfHostedAccount(collective) && !isAccountantOnly} mt={24}>
              <MenuLink collective={collective} section={FISCAL_HOST_SECTIONS.INVOICES_RECEIPTS} />
              <MenuLink collective={collective} section={FISCAL_HOST_SECTIONS.RECEIVING_MONEY} />
              <MenuLink collective={collective} section={FISCAL_HOST_SECTIONS.SENDING_MONEY} />
            </MenuGroup>
          </SubMenu>

          {/* org settings for hosts */}
          <SubMenu
            label={formatMessage(PAGE_TITLES[getCollectiveTypeKey(collective.type)])}
            icon={<Cog size={16} />}
            if={isType(collective, ORGANIZATION) && isHost}
          >
            <OrganizationSettingsMenuLinks collective={collective} isAccountantOnly={isAccountantOnly} />
            <MenuLink collective={collective} section={ORG_BUDGET_SECTIONS.TIERS} if={!isAccountantOnly} />
          </SubMenu>
          {/* <MenuLink
            collective={collective}
            section={COLLECTIVE_SECTIONS.VIRTUAL_CARDS}
            if={
              isOneOfTypes(collective, [COLLECTIVE, FUND, EVENT, PROJECT]) &&
              hasFeature(collective.host, FEATURES.VIRTUAL_CARDS) &&
              collective.isApproved
            }
          /> */}

          {/* Below hould go to settings submenu */}
        </MenuGroup>
      </React.Fragment>
    );
  }
};

Menu.propTypes = {
  isAccountantOnly: PropTypes.bool,
  collective: PropTypes.shape({
    slug: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    isHost: PropTypes.bool,
    host: PropTypes.object,
    settings: PropTypes.object,
    features: PropTypes.shape({
      USE_PAYMENT_METHODS: PropTypes.string,
      EMIT_GIFT_CARDS: PropTypes.string,
    }),
    isApproved: PropTypes.bool,
  }),
};

export default Menu;
