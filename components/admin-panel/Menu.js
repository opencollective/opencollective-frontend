import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import hasFeature, { FEATURES } from '../../lib/allowed-features';
import { CollectiveType, getCollectiveTypeKey, isHost, isOneOfTypes, isType } from '../../lib/collective-sections';

import { HOST_SECTIONS } from '../host-dashboard/constants';

import {
  ABOUT_ORG_SECTIONS,
  ALL_SECTIONS,
  COLLECTIVE_SECTIONS,
  FISCAL_HOST_SECTIONS,
  ORG_BUDGET_SECTIONS,
  PAGE_TITLES,
} from './constants';
import { MenuGroup, MenuLink, MenuSectionHeader, useSubmenu } from './MenuComponents';

const { USER, ORGANIZATION, COLLECTIVE, FUND, EVENT, PROJECT } = CollectiveType;

const Menu = ({ collective }) => {
  const { formatMessage } = useIntl();
  const { menuContent, SubMenu } = useSubmenu();

  if (menuContent) {
    return menuContent;
  } else {
    return (
      <React.Fragment>
        <MenuGroup if={isHost(collective)} mb={24}>
          <MenuSectionHeader>
            <FormattedMessage id="HostDashboard" defaultMessage="Host Dashboard" />
          </MenuSectionHeader>
          <MenuLink collective={collective} section={HOST_SECTIONS.EXPENSES} />
          <MenuLink collective={collective} section={HOST_SECTIONS.FINANCIAL_CONTRIBUTIONS} />
          <MenuLink collective={collective} section={HOST_SECTIONS.PENDING_APPLICATIONS} />
          <MenuLink collective={collective} section={HOST_SECTIONS.HOSTED_COLLECTIVES} />
        </MenuGroup>
        <MenuGroup if={isHost(collective) || isType(collective, ORGANIZATION)}>
          <MenuSectionHeader>
            <FormattedMessage id="Settings" defaultMessage="Settings" />
          </MenuSectionHeader>
          <SubMenu
            label={formatMessage(PAGE_TITLES[getCollectiveTypeKey(collective.type)])}
            if={isType(collective, ORGANIZATION) || isHost(collective)}
          >
            <MenuLink collective={collective} section={ABOUT_ORG_SECTIONS.INFO} />
            <MenuLink collective={collective} section={ABOUT_ORG_SECTIONS.COLLECTIVE_PAGE} />
            <MenuLink collective={collective} section={ABOUT_ORG_SECTIONS.CONNECTED_ACCOUNTS} />
            <MenuLink collective={collective} section={ABOUT_ORG_SECTIONS.TEAM} />
            <MenuLink collective={collective} section={ORG_BUDGET_SECTIONS.PAYMENT_METHODS} />
            <MenuLink collective={collective} section={ORG_BUDGET_SECTIONS.PAYMENT_RECEIPTS} />
            <MenuLink collective={collective} section={ORG_BUDGET_SECTIONS.TIERS} />
            <MenuLink collective={collective} section={ORG_BUDGET_SECTIONS.GIFT_CARDS} />
            <MenuLink
              collective={collective}
              section={ORG_BUDGET_SECTIONS.PENDING_ORDERS}
              if={isType(collective, COLLECTIVE)}
            />
            <MenuLink collective={collective} section={ALL_SECTIONS.WEBHOOKS} />
            <MenuLink collective={collective} section={ALL_SECTIONS.ADVANCED} />
          </SubMenu>
          <SubMenu
            label={<FormattedMessage id="AdminPanel.FiscalHostSettings" defaultMessage="Fiscal Host Settings" />}
            if={isHost(collective) || (isType(collective, USER) && isHost(collective))}
          >
            <MenuLink collective={collective} section={FISCAL_HOST_SECTIONS.FISCAL_HOSTING} />
            <MenuGroup if={isHost(collective)}>
              <MenuLink collective={collective} section={FISCAL_HOST_SECTIONS.INVOICES_RECEIPTS} />
              <MenuLink collective={collective} section={FISCAL_HOST_SECTIONS.RECEIVING_MONEY} />
              <MenuLink collective={collective} section={FISCAL_HOST_SECTIONS.SENDING_MONEY} />
              <MenuLink
                collective={collective}
                section={FISCAL_HOST_SECTIONS.HOST_VIRTUAL_CARDS}
                if={hasFeature(collective, FEATURES.PRIVACY_VCC)}
              />
              <MenuLink collective={collective} section={FISCAL_HOST_SECTIONS.HOST_TWO_FACTOR_AUTH} />
              <MenuLink
                collective={collective}
                section={FISCAL_HOST_SECTIONS.POLICIES}
                if={isOneOfTypes(collective, [USER, ORGANIZATION])}
              />
              <MenuLink
                collective={collective}
                section={FISCAL_HOST_SECTIONS.HOST_PLAN}
                if={isOneOfTypes(collective, [USER, ORGANIZATION])}
              />
              <MenuLink
                collective={collective}
                section={FISCAL_HOST_SECTIONS.HOST_METRICS}
                if={isOneOfTypes(collective, [USER, ORGANIZATION])}
              />
            </MenuGroup>
          </SubMenu>
        </MenuGroup>

        <MenuGroup if={!isHost(collective) && !isType(collective, ORGANIZATION)}>
          <MenuLink collective={collective} section={COLLECTIVE_SECTIONS.INFO} />
          <MenuLink collective={collective} section={COLLECTIVE_SECTIONS.COLLECTIVE_PAGE} />
          <MenuLink
            collective={collective}
            section={COLLECTIVE_SECTIONS.COLLECTIVE_GOALS}
            if={isType(collective, COLLECTIVE)}
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
          <MenuLink collective={collective} section={COLLECTIVE_SECTIONS.EXPORT} if={isType(collective, COLLECTIVE)} />
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
            if={isType(collective, USER)}
          />
          <MenuLink
            collective={collective}
            section={COLLECTIVE_SECTIONS.PAYMENT_RECEIPTS}
            if={isType(collective, USER)}
          />

          <MenuLink
            collective={collective}
            section={COLLECTIVE_SECTIONS.VIRTUAL_CARDS}
            if={
              isOneOfTypes(collective, [COLLECTIVE, FUND]) &&
              hasFeature(collective.host, FEATURES.PRIVACY_VCC) &&
              collective.virtualCards?.totalCount > 0
            }
          />
          <MenuLink collective={collective} section={COLLECTIVE_SECTIONS.TICKETS} if={isType(collective, EVENT)} />
          <MenuLink
            collective={collective}
            section={COLLECTIVE_SECTIONS.TIERS}
            if={isOneOfTypes(collective, [COLLECTIVE, FUND, EVENT, PROJECT])}
          />
          <MenuLink
            collective={collective}
            section={COLLECTIVE_SECTIONS.WEBHOOKS}
            if={isOneOfTypes(collective, [COLLECTIVE, USER, EVENT])}
          />
          <MenuLink
            collective={collective}
            section={COLLECTIVE_SECTIONS.TWO_FACTOR_AUTH}
            if={isType(collective, USER)}
          />
          <MenuLink collective={collective} section={COLLECTIVE_SECTIONS.ADVANCED} />
        </MenuGroup>
      </React.Fragment>
    );
  }
};

Menu.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    isHost: PropTypes.bool,
  }),
};

export default Menu;
