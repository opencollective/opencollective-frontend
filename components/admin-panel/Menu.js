import React from 'react';
import PropTypes from 'prop-types';
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
        {/** Host settings */}
        <MenuGroup if={isHost} mb={24}>
          <MenuSectionHeader>
            <FormattedMessage id="HostDashboard" defaultMessage="Host Dashboard" />
          </MenuSectionHeader>
          <MenuLink collective={collective} section={HOST_SECTIONS.EXPENSES} />
          <MenuLink collective={collective} section={HOST_SECTIONS.FINANCIAL_CONTRIBUTIONS} />
          <MenuLink
            collective={collective}
            section={HOST_DASHBOARD_SECTIONS.PENDING_CONTRIBUTIONS}
            if={!isAccountantOnly}
          />
          <MenuLink collective={collective} section={HOST_SECTIONS.PENDING_APPLICATIONS} if={!isAccountantOnly} />
          <MenuLink collective={collective} section={HOST_SECTIONS.HOSTED_COLLECTIVES} if={!isAccountantOnly} />
          <MenuLink
            collective={collective}
            section={HOST_DASHBOARD_SECTIONS.HOST_VIRTUAL_CARDS}
            if={!isAccountantOnly && hasFeature(collective, FEATURES.VIRTUAL_CARDS)}
          />
          <MenuLink collective={collective} section={HOST_SECTIONS.REPORTS} isBeta />
        </MenuGroup>

        {/** Organization settings */}
        <MenuGroup if={isHost || isType(collective, ORGANIZATION)}>
          <MenuSectionHeader>
            <FormattedMessage id="Settings" defaultMessage="Settings" />
          </MenuSectionHeader>
          <SubMenu
            label={formatMessage(PAGE_TITLES[getCollectiveTypeKey(collective.type)])}
            if={isType(collective, ORGANIZATION) && isHost}
          >
            <OrganizationSettingsMenuLinks collective={collective} isAccountantOnly={isAccountantOnly} />
            <MenuLink collective={collective} section={ORG_BUDGET_SECTIONS.TIERS} if={!isAccountantOnly} />
          </SubMenu>
          <SubMenu
            label={<FormattedMessage id="AdminPanel.FiscalHostSettings" defaultMessage="Fiscal Host Settings" />}
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

        {/** General non-host organization settings (hosts organizations have a dedicated sub-menu) */}
        <MenuGroup if={isSimpleOrg}>
          <OrganizationSettingsMenuLinks collective={collective} isAccountantOnly={isAccountantOnly} />
        </MenuGroup>

        {/** General settings for everyone except organizations */}
        <MenuGroup if={!isType(collective, ORGANIZATION) && !isAccountantOnly}>
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
        </MenuGroup>
        <MenuGroup if={isSelfHostedAccount(collective) && !isAccountantOnly} mt={24}>
          <MenuLink collective={collective} section={FISCAL_HOST_SECTIONS.INVOICES_RECEIPTS} />
          <MenuLink collective={collective} section={FISCAL_HOST_SECTIONS.RECEIVING_MONEY} />
          <MenuLink collective={collective} section={FISCAL_HOST_SECTIONS.SENDING_MONEY} />
          <MenuLink
            collective={collective}
            section={ORG_BUDGET_SECTIONS.FINANCIAL_CONTRIBUTIONS}
            if={isType(collective, COLLECTIVE)}
          />
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
