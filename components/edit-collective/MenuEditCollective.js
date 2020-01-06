import React from 'react';
import PropTypes from 'prop-types';
import { useIntl, defineMessages } from 'react-intl';
import { sortBy } from 'lodash';
import { Flex } from '@rebass/grid';
import styled, { css } from 'styled-components';

import { CollectiveType } from '../../lib/constants/collectives';
import Link from '../Link';
import { isFeatureAllowedForCollectiveType, FEATURES } from '../../lib/allowed-features';

export const EDIT_COLLECTIVE_SECTIONS = {
  ADVANCED: 'advanced',
  COLLECTIVE_GOALS: 'goals',
  CONNECTED_ACCOUNTS: 'connected-accounts',
  CONVERSATIONS: 'conversations',
  EXPENSES: 'expenses',
  EXPORT: 'export',
  HOST: 'host',
  HOST_SETTINGS: 'hostSettings',
  IMAGES: 'images',
  INFO: 'info',
  INVOICES: 'invoices',
  MEMBERS: 'members',
  PAYMENT_METHODS: 'payment-methods',
  TIERS: 'tiers',
  VIRTUAL_CARDS: 'gift-cards',
  WEBHOOKS: 'webhooks',
};

const SECTION_LABELS = defineMessages({
  [EDIT_COLLECTIVE_SECTIONS.ADVANCED]: {
    id: 'editCollective.menu.advanced',
    defaultMessage: 'Advanced',
  },
  [EDIT_COLLECTIVE_SECTIONS.COLLECTIVE_GOALS]: {
    id: 'editCollective.menu.goals',
    defaultMessage: 'Collective Goals',
  },
  [EDIT_COLLECTIVE_SECTIONS.CONNECTED_ACCOUNTS]: {
    id: 'editCollective.menu.connectedAccounts',
    defaultMessage: 'Connected Accounts',
  },
  [EDIT_COLLECTIVE_SECTIONS.CONVERSATIONS]: {
    id: 'conversations',
    defaultMessage: 'Conversations',
  },
  [EDIT_COLLECTIVE_SECTIONS.EXPORT]: {
    id: 'editCollective.menu.export',
    defaultMessage: 'Export',
  },
  [EDIT_COLLECTIVE_SECTIONS.EXPENSES]: {
    id: 'editCollective.menu.expenses',
    defaultMessage: 'Expenses Policy',
  },
  [EDIT_COLLECTIVE_SECTIONS.HOST]: {
    id: 'editCollective.menu.host',
    defaultMessage: 'Fiscal Host',
  },
  [EDIT_COLLECTIVE_SECTIONS.HOST_SETTINGS]: {
    id: 'editCollective.menu.hostSettings',
    defaultMessage: 'Host Plans',
  },
  [EDIT_COLLECTIVE_SECTIONS.IMAGES]: {
    id: 'editCollective.menu.images',
    defaultMessage: 'Images',
  },
  [EDIT_COLLECTIVE_SECTIONS.INFO]: {
    id: 'editCollective.menu.info',
    defaultMessage: 'Info',
  },
  [EDIT_COLLECTIVE_SECTIONS.INVOICES]: {
    id: 'editCollective.menu.invoicesAndReceipts',
    defaultMessage: 'Invoices & Receipts',
  },
  [EDIT_COLLECTIVE_SECTIONS.MEMBERS]: {
    id: 'editCollective.menu.members',
    defaultMessage: 'Core Contributors',
  },
  [EDIT_COLLECTIVE_SECTIONS.PAYMENT_METHODS]: {
    id: 'editCollective.menu.paymentMethods',
    defaultMessage: 'Payment Methods',
  },
  [EDIT_COLLECTIVE_SECTIONS.TIERS]: {
    id: 'editCollective.menu.tiers',
    defaultMessage: 'Tiers',
  },
  [EDIT_COLLECTIVE_SECTIONS.VIRTUAL_CARDS]: {
    id: 'editCollective.menu.virtualCards',
    defaultMessage: 'Gift Cards',
  },
  [EDIT_COLLECTIVE_SECTIONS.WEBHOOKS]: {
    id: 'editCollective.menu.webhooks',
    defaultMessage: 'Webhooks',
  },
});

const MenuItem = styled(Link)`
  display: block;
  border-radius: 5px;
  padding: 5px 10px;
  color: #888;
  cursor: pointer;
  &:hover,
  a:hover {
    color: black;
  }
  ${({ selected }) =>
    selected &&
    css`
      background-color: #eee;
      color: black;
    `};
`;

// Some condition helpers
const isType = collectiveType => ({ type }) => type === collectiveType;
const isOneOfTypes = (...collectiveTypes) => ({ type }) => collectiveTypes.includes(type);
const isFeatureAllowed = feature => ({ type }) => isFeatureAllowedForCollectiveType(type, feature);
const sectionsDisplayConditions = {
  [EDIT_COLLECTIVE_SECTIONS.COLLECTIVE_GOALS]: isType(CollectiveType.COLLECTIVE),
  [EDIT_COLLECTIVE_SECTIONS.CONVERSATIONS]: isFeatureAllowed(FEATURES.CONVERSATIONS),
  [EDIT_COLLECTIVE_SECTIONS.EXPENSES]: ({ type, isHost }) => type === CollectiveType.COLLECTIVE || isHost,
  [EDIT_COLLECTIVE_SECTIONS.EXPORT]: isType(CollectiveType.COLLECTIVE),
  [EDIT_COLLECTIVE_SECTIONS.HOST]: isType(CollectiveType.COLLECTIVE),
  [EDIT_COLLECTIVE_SECTIONS.IMAGES]: isType(CollectiveType.EVENT),
  [EDIT_COLLECTIVE_SECTIONS.INVOICES]: ({ isHost }) => Boolean(isHost),
  [EDIT_COLLECTIVE_SECTIONS.MEMBERS]: isOneOfTypes(CollectiveType.COLLECTIVE, CollectiveType.ORGANIZATION),
  [EDIT_COLLECTIVE_SECTIONS.PAYMENT_METHODS]: isOneOfTypes(CollectiveType.USER, CollectiveType.ORGANIZATION),
  [EDIT_COLLECTIVE_SECTIONS.TIERS]: isType(CollectiveType.COLLECTIVE),
  [EDIT_COLLECTIVE_SECTIONS.VIRTUAL_CARDS]: isType(CollectiveType.ORGANIZATION),
};

const shouldDisplaySection = (collective, section) => {
  return sectionsDisplayConditions[section] ? sectionsDisplayConditions[section](collective) : true;
};

/**
 * Displays the menu for the edit collective page
 */
const MenuEditCollective = ({ collective, selectedSection }) => {
  const { formatMessage } = useIntl();
  const allSections = Object.values(EDIT_COLLECTIVE_SECTIONS);
  const displayedSections = allSections.filter(section => shouldDisplaySection(collective, section));
  const displayedSectionsInfos = displayedSections.map(section => ({
    label: SECTION_LABELS[section] ? formatMessage(SECTION_LABELS[section]) : section,
    isSelected: section === selectedSection,
    section,
  }));

  return (
    <Flex width={0.2} flexDirection="column" mr={4} mb={3} flexWrap="wrap" css={{ flexGrow: 1, minWidth: 175 }}>
      {sortBy(displayedSectionsInfos, 'label').map(({ section, label, isSelected }) => (
        <MenuItem
          key={section}
          selected={isSelected}
          route="editCollective"
          params={{ slug: collective.slug, section }}
          data-cy={`menu-item-${section}`}
        >
          {label}
        </MenuItem>
      ))}
    </Flex>
  );
};

MenuEditCollective.propTypes = {
  selectedSection: PropTypes.oneOf(Object.values(EDIT_COLLECTIVE_SECTIONS)),
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    type: PropTypes.oneOf(Object.values(CollectiveType)).isRequired,
    isHost: PropTypes.bool,
  }).isRequired,
};

export default React.memo(MenuEditCollective);
