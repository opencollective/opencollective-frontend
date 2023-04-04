import React from 'react';
import PropTypes from 'prop-types';
import { BarChartAlt2 as Chart } from '@styled-icons/boxicons-regular/BarChartAlt2';
import { Cog } from '@styled-icons/boxicons-regular/Cog';
import { Coin } from '@styled-icons/boxicons-regular/Coin';
import { CreditCard } from '@styled-icons/boxicons-regular/CreditCard';
import { NetworkChart } from '@styled-icons/boxicons-regular/NetworkChart';
import { Receipt } from '@styled-icons/boxicons-regular/Receipt';
import { Transfer } from '@styled-icons/boxicons-regular/Transfer';
import { Inbox } from '@styled-icons/octicons/Inbox';
import { FormattedMessage } from 'react-intl';

import hasFeature, { FEATURES } from '../../lib/allowed-features';
import { isHostAccount, isIndividualAccount, isSelfHostedAccount } from '../../lib/collective.lib';
import { isOneOfTypes, isType } from '../../lib/collective-sections';
import { CollectiveType } from '../../lib/constants/collectives';

import { HOST_SECTIONS } from '../host-dashboard/constants';

import {
  ABOUT_ORG_SECTIONS,
  ALL_SECTIONS,
  COLLECTIVE_SECTIONS,
  FISCAL_HOST_SECTIONS,
  HOST_DASHBOARD_SECTIONS,
  ORG_BUDGET_SECTIONS,
} from './constants';
import { MenuGroup, MenuLink, MenuSectionHeader } from './MenuComponents';

const { USER, ORGANIZATION, COLLECTIVE, FUND, EVENT, PROJECT } = CollectiveType;

const OrganizationSettingsMenuLinks = ({ collective, isAccountantOnly }) => {
  return (
    <React.Fragment>
      {!isAccountantOnly && (
        <React.Fragment>
          <MenuLink isSub collective={collective} section={ABOUT_ORG_SECTIONS.INFO} />
          <MenuLink isSub collective={collective} section={ABOUT_ORG_SECTIONS.COLLECTIVE_PAGE} />
          <MenuLink isSub collective={collective} section={ABOUT_ORG_SECTIONS.CONNECTED_ACCOUNTS} />
          <MenuLink isSub collective={collective} section={ABOUT_ORG_SECTIONS.TEAM} />
          <MenuLink isSub collective={collective} section={ORG_BUDGET_SECTIONS.PAYMENT_METHODS} />
        </React.Fragment>
      )}
      <MenuLink isSub collective={collective} section={ORG_BUDGET_SECTIONS.PAYMENT_RECEIPTS} />
      {!isAccountantOnly && (
        <React.Fragment>
          <MenuLink isSub collective={collective} section={ORG_BUDGET_SECTIONS.GIFT_CARDS} />
          <MenuLink isSub collective={collective} section={ALL_SECTIONS.WEBHOOKS} />
          <MenuLink isSub collective={collective} section={COLLECTIVE_SECTIONS.FOR_DEVELOPERS} />
          <MenuLink isSub collective={collective} section={COLLECTIVE_SECTIONS.ACTIVITY_LOG} />
          <MenuLink isSub collective={collective} section={FISCAL_HOST_SECTIONS.SECURITY} />
          <MenuLink isSub collective={collective} section={ALL_SECTIONS.ADVANCED} />
          {!isHostAccount(collective) && (
            <MenuLink isSub collective={collective} section={ALL_SECTIONS.FISCAL_HOSTING} />
          )}
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
  // const { formatMessage } = useIntl();
  const isHost = isHostAccount(collective);
  const isIndividual = isIndividualAccount(collective);
  // const isSimpleOrg = collective.type === 'ORGANIZATION' && !isHost;
  const [expandedSection, setExpanded] = React.useState(null);

  return (
    <React.Fragment>
      {/** Host dashboard */}
      <MenuGroup if={isHost} mb={24}>
        <MenuSectionHeader>
          <FormattedMessage id="HostDashboard" defaultMessage="Host Dashboard" />
        </MenuSectionHeader>
        <MenuLink
          setExpanded={setExpanded}
          collective={collective}
          section={HOST_SECTIONS.HOST_EXPENSES}
          icon={<Receipt size={16} />}
        />
        <MenuLink
          collective={collective}
          section={HOST_SECTIONS.FINANCIAL_CONTRIBUTIONS}
          icon={<Coin size={16} />}
          setExpanded={setExpanded}
          expanded={expandedSection === HOST_SECTIONS.FINANCIAL_CONTRIBUTIONS}
        />

        <MenuLink
          collective={collective}
          section={HOST_DASHBOARD_SECTIONS.PENDING_CONTRIBUTIONS}
          icon={<Coin size={16} />}
          if={!isAccountantOnly}
        />

        <MenuLink
          collective={collective}
          section={HOST_SECTIONS.PENDING_APPLICATIONS}
          if={!isAccountantOnly}
          icon={<Inbox size={16} />}
          setExpanded={setExpanded}
        >
          Applications
        </MenuLink>
        <MenuLink
          collective={collective}
          section={HOST_SECTIONS.HOSTED_COLLECTIVES}
          if={!isAccountantOnly}
          icon={<NetworkChart size={16} />}
          setExpanded={setExpanded}
        />
        <MenuLink
          collective={collective}
          section={HOST_DASHBOARD_SECTIONS.HOST_VIRTUAL_CARDS}
          icon={<CreditCard size={16} />}
          if={!isAccountantOnly && hasFeature(collective, FEATURES.VIRTUAL_CARDS)}
          setExpanded={setExpanded}
        />
        <MenuLink
          collective={collective}
          section={HOST_SECTIONS.REPORTS}
          isBeta
          icon={<Chart size={16} />}
          setExpanded={setExpanded}
        />

        <MenuLink
          collective={collective}
          icon={<Cog size={16} />}
          if={isHost && !isAccountantOnly}
          setExpanded={setExpanded}
          section="SETTINGS"
          goToSection={FISCAL_HOST_SECTIONS.FISCAL_HOSTING}
          expanded={expandedSection === 'SETTINGS'}
          subMenu={
            <React.Fragment>
              <MenuLink isSub collective={collective} section={FISCAL_HOST_SECTIONS.FISCAL_HOSTING} />

              <MenuLink isSub collective={collective} section={FISCAL_HOST_SECTIONS.INVOICES_RECEIPTS} />
              <MenuLink isSub collective={collective} section={FISCAL_HOST_SECTIONS.RECEIVING_MONEY} />
              <MenuLink isSub collective={collective} section={FISCAL_HOST_SECTIONS.SENDING_MONEY} />
              <MenuLink
                isSub
                collective={collective}
                section={FISCAL_HOST_SECTIONS.HOST_VIRTUAL_CARDS_SETTINGS}
                if={hasFeature(collective, FEATURES.VIRTUAL_CARDS)}
              />
              <MenuLink
                isSub
                collective={collective}
                section={FISCAL_HOST_SECTIONS.POLICIES}
                if={isOneOfTypes(collective, [USER, ORGANIZATION])}
              />
            </React.Fragment>
          }
        >
          Fiscal Host Settings
        </MenuLink>
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

        <MenuLink
          collective={collective}
          section={COLLECTIVE_SECTIONS.MANAGE_CONTRIBUTIONS}
          icon={<Coin size={16} />}
          setExpanded={setExpanded}
        />
        <MenuLink
          setExpanded={setExpanded}
          collective={collective}
          section={ORG_BUDGET_SECTIONS.FINANCIAL_CONTRIBUTIONS}
          icon={<Coin size={16} />}
          if={isSelfHostedAccount(collective) && !isAccountantOnly && isType(collective, COLLECTIVE)}
        />
        <MenuLink
          setExpanded={setExpanded}
          collective={collective}
          section={COLLECTIVE_SECTIONS.EXPENSES}
          icon={<Receipt size={16} />}
        />
        <MenuLink
          setExpanded={setExpanded}
          collective={collective}
          section={COLLECTIVE_SECTIONS.TRANSACTIONS}
          icon={<Transfer size={16} />}
        />

        <MenuLink
          collective={collective}
          section={COLLECTIVE_SECTIONS.VIRTUAL_CARDS}
          icon={<CreditCard size={16} />}
          if={
            isOneOfTypes(collective, [COLLECTIVE, FUND, EVENT, PROJECT]) &&
            hasFeature(collective.host, FEATURES.VIRTUAL_CARDS) &&
            collective.isApproved
          }
        />

        <MenuLink
          collective={collective}
          icon={<Cog size={16} />}
          if={!isHost}
          setExpanded={setExpanded}
          section="COLL_SETTINGS"
          goToSection={COLLECTIVE_SECTIONS.INFO}
          expanded={expandedSection === 'COLL_SETTINGS'}
          subMenu={
            <React.Fragment>
              <MenuLink isSub collective={collective} section={COLLECTIVE_SECTIONS.INFO} />
              <MenuLink isSub collective={collective} section={COLLECTIVE_SECTIONS.COLLECTIVE_PAGE} />
              <MenuLink
                isSub
                collective={collective}
                section={COLLECTIVE_SECTIONS.COLLECTIVE_GOALS}
                if={isOneOfTypes(collective, [COLLECTIVE, PROJECT])}
              />
              <MenuLink
                isSub
                collective={collective}
                section={COLLECTIVE_SECTIONS.CONNECTED_ACCOUNTS}
                if={isType(collective, COLLECTIVE)}
              />
              <MenuLink
                isSub
                collective={collective}
                section={COLLECTIVE_SECTIONS.VIRTUAL_CARDS}
                if={
                  isOneOfTypes(collective, [COLLECTIVE, FUND, EVENT, PROJECT]) &&
                  hasFeature(collective.host, FEATURES.VIRTUAL_CARDS) &&
                  collective.isApproved
                }
              />
              <MenuLink
                isSub
                collective={collective}
                section={COLLECTIVE_SECTIONS.POLICIES}
                if={isOneOfTypes(collective, [COLLECTIVE, FUND])}
              />
              <MenuLink
                isSub
                collective={collective}
                section={COLLECTIVE_SECTIONS.CUSTOM_EMAIL}
                if={isOneOfTypes(collective, [COLLECTIVE, EVENT, PROJECT])}
              />
              <MenuLink
                isSub
                collective={collective}
                section={COLLECTIVE_SECTIONS.EXPORT}
                if={isOneOfTypes(collective, [COLLECTIVE, EVENT, PROJECT])}
              />
              <MenuLink
                isSub
                collective={collective}
                section={COLLECTIVE_SECTIONS.HOST}
                if={isOneOfTypes(collective, [COLLECTIVE, FUND])}
              />
              <MenuLink
                isSub
                collective={collective}
                section={COLLECTIVE_SECTIONS.TEAM}
                if={isOneOfTypes(collective, [COLLECTIVE, FUND, ORGANIZATION, EVENT, PROJECT])}
              />
              <MenuLink
                isSub
                collective={collective}
                section={COLLECTIVE_SECTIONS.PAYMENT_METHODS}
                if={['ACTIVE', 'AVAILABLE'].includes(collective.features.USE_PAYMENT_METHODS)}
              />
              <MenuLink
                isSub
                collective={collective}
                section={COLLECTIVE_SECTIONS.PAYMENT_RECEIPTS}
                if={isIndividual}
              />
              <MenuLink isSub collective={collective} section={COLLECTIVE_SECTIONS.NOTIFICATIONS} if={isIndividual} />
              <MenuLink
                isSub
                collective={collective}
                section={ORG_BUDGET_SECTIONS.GIFT_CARDS}
                if={['ACTIVE', 'AVAILABLE'].includes(collective.features.EMIT_GIFT_CARDS)}
              />
              <MenuLink
                isSub
                collective={collective}
                section={COLLECTIVE_SECTIONS.VIRTUAL_CARDS}
                if={
                  isOneOfTypes(collective, [COLLECTIVE, FUND, EVENT, PROJECT]) &&
                  hasFeature(collective.host, FEATURES.VIRTUAL_CARDS) &&
                  collective.isApproved
                }
              />
              <MenuLink
                isSub
                collective={collective}
                section={COLLECTIVE_SECTIONS.TICKETS}
                if={isType(collective, EVENT)}
              />
              <MenuLink
                isSub
                collective={collective}
                section={COLLECTIVE_SECTIONS.TIERS}
                if={isOneOfTypes(collective, [COLLECTIVE, FUND, EVENT, PROJECT])}
              />
              <MenuLink isSub collective={collective} section={COLLECTIVE_SECTIONS.WEBHOOKS} />
              <MenuLink
                isSub
                collective={collective}
                section={COLLECTIVE_SECTIONS.AUTHORIZED_APPS}
                if={isType(collective, USER)}
              />
              <MenuLink isSub collective={collective} section={COLLECTIVE_SECTIONS.USER_SECURITY} if={isIndividual} />
              <MenuLink
                isSub
                collective={collective}
                section={COLLECTIVE_SECTIONS.FOR_DEVELOPERS}
                if={isOneOfTypes(collective, [COLLECTIVE, USER])}
              />
              <MenuLink isSub collective={collective} section={COLLECTIVE_SECTIONS.ACTIVITY_LOG} />
              <MenuLink
                isSub
                collective={collective}
                section={FISCAL_HOST_SECTIONS.SECURITY}
                if={isOneOfTypes(collective, [COLLECTIVE, FUND, ORGANIZATION])}
              />
              <MenuLink isSub collective={collective} section={COLLECTIVE_SECTIONS.ADVANCED} />
              <MenuGroup if={isSelfHostedAccount(collective) && !isAccountantOnly} mt={24}>
                <MenuLink isSub collective={collective} section={FISCAL_HOST_SECTIONS.INVOICES_RECEIPTS} />
                <MenuLink isSub collective={collective} section={FISCAL_HOST_SECTIONS.RECEIVING_MONEY} />
                <MenuLink isSub collective={collective} section={FISCAL_HOST_SECTIONS.SENDING_MONEY} />
              </MenuGroup>
            </React.Fragment>
          }
        >
          Settings
        </MenuLink>

        {/* org settings for hosts */}

        <MenuLink
          collective={collective}
          icon={<Cog size={16} />}
          if={isType(collective, ORGANIZATION) && isHost}
          setExpanded={setExpanded}
          section="ORG_SETTINGS"
          goToSection={ABOUT_ORG_SECTIONS.INFO}
          expanded={expandedSection === 'ORG_SETTINGS'}
          subMenu={
            <React.Fragment>
              <OrganizationSettingsMenuLinks collective={collective} isAccountantOnly={isAccountantOnly} />
              <MenuLink isSub collective={collective} section={ORG_BUDGET_SECTIONS.TIERS} if={!isAccountantOnly} />
            </React.Fragment>
          }
        >
          Organization Settings
        </MenuLink>
      </MenuGroup>
    </React.Fragment>
  );
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
