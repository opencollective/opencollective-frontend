import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import {
  ArrowLeftRight as Transfer,
  BarChart3 as Chart,
  Coins,
  CreditCard,
  FileText,
  Globe2,
  Inbox,
  LayoutDashboard,
  Network,
  Receipt,
  Settings,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import hasFeature, { FEATURES } from '../../lib/allowed-features';
import { isHostAccount, isIndividualAccount, isInternalHost, isSelfHostedAccount } from '../../lib/collective.lib';
import { isOneOfTypes, isType } from '../../lib/collective-sections';
import { CollectiveType } from '../../lib/constants/collectives';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import {
  ABOUT_ORG_SECTIONS,
  ALL_SECTIONS,
  COLLECTIVE_SECTIONS,
  FISCAL_HOST_SECTIONS,
  HOST_DASHBOARD_SECTIONS,
  ORG_BUDGET_SECTIONS,
} from './constants';
import { DashboardContext } from './DashboardContext';
import { MenuGroup, MenuLink, MenuSectionHeader } from './MenuComponents';

const { USER, ORGANIZATION, COLLECTIVE, FUND, EVENT, PROJECT } = CollectiveType;

const Menu = ({ isAccountantOnly, onRoute }) => {
  const router = useRouter();
  const { account } = React.useContext(DashboardContext);
  const isHost = isHostAccount(account);
  const isIndividual = isIndividualAccount(account);

  React.useEffect(() => {
    if (onRoute) {
      router.events.on('routeChangeStart', onRoute);
    }
    return () => {
      if (onRoute) {
        router.events.off('routeChangeStart', onRoute);
      }
    };
  }, [router, onRoute]);

  return (
    <div className="space-y-4">
      <MenuLink
        href={getCollectivePageRoute(account)}
        Icon={Globe2}
        className="hover:bg-slate-50 hover:text-slate-700"
        external
      >
        <FormattedMessage id="PublicProfile" defaultMessage="Public profile" />
      </MenuLink>

      <MenuGroup if={isHost}>
        <MenuSectionHeader>
          <FormattedMessage id="HostDashboard" defaultMessage="Host Dashboard" />
        </MenuSectionHeader>
        <MenuLink section={HOST_DASHBOARD_SECTIONS.HOST_EXPENSES} Icon={Receipt} />
        <MenuLink section={HOST_DASHBOARD_SECTIONS.FINANCIAL_CONTRIBUTIONS} Icon={Coins} />
        <MenuLink section={HOST_DASHBOARD_SECTIONS.PENDING_CONTRIBUTIONS} Icon={Coins} if={!isAccountantOnly} />
        <MenuLink
          section={HOST_DASHBOARD_SECTIONS.HOST_AGREEMENTS}
          Icon={FileText}
          if={isInternalHost(account) || Boolean(get(account, 'settings.beta.HOST_AGREEMENTS'))}
        />
        <MenuLink section={HOST_DASHBOARD_SECTIONS.HOST_APPLICATIONS} Icon={Inbox} if={!isAccountantOnly} />
        <MenuLink section={HOST_DASHBOARD_SECTIONS.HOSTED_COLLECTIVES} Icon={Network} if={!isAccountantOnly} />
        <MenuLink
          section={HOST_DASHBOARD_SECTIONS.HOST_VIRTUAL_CARDS}
          Icon={CreditCard}
          if={!isAccountantOnly && hasFeature(account, FEATURES.VIRTUAL_CARDS)}
        />
        <MenuLink
          section={HOST_DASHBOARD_SECTIONS.HOST_VIRTUAL_CARD_REQUESTS}
          Icon={CreditCard}
          if={!isAccountantOnly && hasFeature(account, FEATURES.VIRTUAL_CARDS)}
        />
        <MenuLink section={HOST_DASHBOARD_SECTIONS.REPORTS} Icon={Chart} isBeta />

        <MenuLink
          Icon={Settings}
          if={isHost && !isAccountantOnly}
          section="FISCAL_HOST_SETTINGS"
          goToSection={FISCAL_HOST_SECTIONS.FISCAL_HOSTING}
          renderSubMenu={({ parentSection }) => (
            <React.Fragment>
              <MenuLink parentSection={parentSection} section={FISCAL_HOST_SECTIONS.FISCAL_HOSTING} />
              <MenuLink parentSection={parentSection} section={FISCAL_HOST_SECTIONS.INVOICES_RECEIPTS} />
              <MenuLink parentSection={parentSection} section={FISCAL_HOST_SECTIONS.RECEIVING_MONEY} />
              <MenuLink parentSection={parentSection} section={FISCAL_HOST_SECTIONS.SENDING_MONEY} />
              <MenuLink
                parentSection={parentSection}
                section={FISCAL_HOST_SECTIONS.HOST_VIRTUAL_CARDS_SETTINGS}
                if={hasFeature(account, FEATURES.VIRTUAL_CARDS)}
              />
              <MenuLink
                parentSection={parentSection}
                section={FISCAL_HOST_SECTIONS.POLICIES}
                if={isOneOfTypes(account, [USER, ORGANIZATION])}
              />
            </React.Fragment>
          )}
        >
          <FormattedMessage id="AdminPanel.FiscalHostSettings" defaultMessage="Fiscal Host Settings" />
        </MenuLink>
      </MenuGroup>

      {/** User/org/collective/event/project dashboard */}
      <MenuGroup>
        {isHost && (
          <MenuSectionHeader>
            {isType(account, ORGANIZATION) ? (
              <FormattedMessage id="OrganizationDashboard" defaultMessage="Organization Dashboard" />
            ) : isType(account, USER) ? (
              <FormattedMessage id="UserDashboard" defaultMessage="User Dashboard" />
            ) : isType(account, COLLECTIVE) ? (
              <FormattedMessage id="CollectiveDashboard" defaultMessage="Collective Dashboard" />
            ) : (
              <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
            )}
          </MenuSectionHeader>
        )}
        <MenuLink section={COLLECTIVE_SECTIONS.DASHBOARD_OVERVIEW} Icon={LayoutDashboard} if={isIndividual} />
        <MenuLink section={COLLECTIVE_SECTIONS.EXPENSES} Icon={Receipt} />
        <MenuLink section={COLLECTIVE_SECTIONS.CONTRIBUTORS} Icon={Users} if={!isIndividual} />
        <MenuLink section={COLLECTIVE_SECTIONS.CONTRIBUTIONS} Icon={Coins} />
        <MenuLink
          section={ORG_BUDGET_SECTIONS.FINANCIAL_CONTRIBUTIONS}
          Icon={Coins}
          if={isSelfHostedAccount(account) && !isAccountantOnly && isType(account, COLLECTIVE)}
        />
        <MenuLink section={COLLECTIVE_SECTIONS.TRANSACTIONS} Icon={Transfer} />
        <MenuLink
          Icon={Settings}
          if={!isType(account, ORGANIZATION)}
          section="SETTINGS"
          goToSection={COLLECTIVE_SECTIONS.INFO}
          renderSubMenu={({ parentSection }) => (
            <React.Fragment>
              <MenuLink parentSection={parentSection} section={COLLECTIVE_SECTIONS.INFO} />
              <MenuLink parentSection={parentSection} section={COLLECTIVE_SECTIONS.COLLECTIVE_PAGE} />
              <MenuLink
                parentSection={parentSection}
                section={COLLECTIVE_SECTIONS.COLLECTIVE_GOALS}
                if={isOneOfTypes(account, [COLLECTIVE, PROJECT])}
              />
              <MenuLink
                parentSection={parentSection}
                section={COLLECTIVE_SECTIONS.CONNECTED_ACCOUNTS}
                if={isType(account, COLLECTIVE)}
              />
              <MenuLink
                parentSection={parentSection}
                section={COLLECTIVE_SECTIONS.POLICIES}
                if={isOneOfTypes(account, [COLLECTIVE, FUND])}
              />
              <MenuLink
                parentSection={parentSection}
                section={COLLECTIVE_SECTIONS.CUSTOM_EMAIL}
                if={isOneOfTypes(account, [COLLECTIVE, EVENT, PROJECT])}
              />
              <MenuLink
                parentSection={parentSection}
                section={COLLECTIVE_SECTIONS.EXPORT}
                if={isOneOfTypes(account, [COLLECTIVE, EVENT, PROJECT])}
              />
              <MenuLink
                parentSection={parentSection}
                section={COLLECTIVE_SECTIONS.HOST}
                if={isOneOfTypes(account, [COLLECTIVE, FUND])}
              />
              <MenuLink
                parentSection={parentSection}
                section={COLLECTIVE_SECTIONS.TEAM}
                if={isOneOfTypes(account, [COLLECTIVE, FUND, ORGANIZATION, EVENT, PROJECT])}
              />
              <MenuLink
                parentSection={parentSection}
                section={COLLECTIVE_SECTIONS.PAYMENT_METHODS}
                if={['ACTIVE', 'AVAILABLE'].includes(account.features.USE_PAYMENT_METHODS)}
              />
              <MenuLink
                parentSection={parentSection}
                section={COLLECTIVE_SECTIONS.PAYMENT_RECEIPTS}
                if={isIndividual}
              />
              <MenuLink parentSection={parentSection} section={COLLECTIVE_SECTIONS.NOTIFICATIONS} if={isIndividual} />
              <MenuLink
                parentSection={parentSection}
                section={ORG_BUDGET_SECTIONS.GIFT_CARDS}
                if={['ACTIVE', 'AVAILABLE'].includes(account.features.EMIT_GIFT_CARDS)}
              />
              <MenuLink
                parentSection={parentSection}
                section={COLLECTIVE_SECTIONS.VIRTUAL_CARDS}
                if={
                  isOneOfTypes(account, [COLLECTIVE, FUND, EVENT, PROJECT]) &&
                  hasFeature(account.host, FEATURES.VIRTUAL_CARDS) &&
                  account.isApproved
                }
              />
              <MenuLink
                parentSection={parentSection}
                section={COLLECTIVE_SECTIONS.TICKETS}
                if={isType(account, EVENT)}
              />
              <MenuLink
                parentSection={parentSection}
                section={COLLECTIVE_SECTIONS.TIERS}
                if={isOneOfTypes(account, [COLLECTIVE, FUND, EVENT, PROJECT])}
              />
              <MenuLink parentSection={parentSection} section={COLLECTIVE_SECTIONS.WEBHOOKS} />
              <MenuLink
                parentSection={parentSection}
                section={COLLECTIVE_SECTIONS.AUTHORIZED_APPS}
                if={isType(account, USER)}
              />
              <MenuLink parentSection={parentSection} section={COLLECTIVE_SECTIONS.USER_SECURITY} if={isIndividual} />
              <MenuLink
                parentSection={parentSection}
                section={COLLECTIVE_SECTIONS.FOR_DEVELOPERS}
                if={isOneOfTypes(account, [COLLECTIVE, USER])}
              />
              <MenuLink parentSection={parentSection} section={COLLECTIVE_SECTIONS.ACTIVITY_LOG} />
              <MenuLink
                parentSection={parentSection}
                section={FISCAL_HOST_SECTIONS.SECURITY}
                if={isOneOfTypes(account, [COLLECTIVE, FUND, ORGANIZATION])}
              />
              <MenuLink parentSection={parentSection} section={COLLECTIVE_SECTIONS.ADVANCED} />
              <MenuGroup if={isSelfHostedAccount(account) && !isAccountantOnly} className="mt-6">
                <MenuLink parentSection={parentSection} section={FISCAL_HOST_SECTIONS.INVOICES_RECEIPTS} />
                <MenuLink parentSection={parentSection} section={FISCAL_HOST_SECTIONS.RECEIVING_MONEY} />
                <MenuLink parentSection={parentSection} section={FISCAL_HOST_SECTIONS.SENDING_MONEY} />
              </MenuGroup>
            </React.Fragment>
          )}
        >
          <FormattedMessage id="Settings" defaultMessage="Settings" />
        </MenuLink>

        {/* org settings */}
        <MenuLink
          Icon={Settings}
          if={isType(account, ORGANIZATION)}
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
                </React.Fragment>
              )}
            </React.Fragment>
          )}
        >
          {isHost ? (
            <FormattedMessage id="AdminPanel.OrganizationSettings" defaultMessage="Organization Settings" />
          ) : (
            <FormattedMessage id="Settings" defaultMessage="Settings" />
          )}
        </MenuLink>
      </MenuGroup>
    </div>
  );
};

Menu.propTypes = {
  isAccountantOnly: PropTypes.bool,
  onRoute: PropTypes.func,
};

export default Menu;
