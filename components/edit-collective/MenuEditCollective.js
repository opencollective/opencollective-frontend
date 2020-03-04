import React from 'react';
import PropTypes from 'prop-types';
import { useIntl, defineMessages } from 'react-intl';
import { Flex } from '@rebass/grid';
import styled, { css } from 'styled-components';

import { CollectiveType } from '../../lib/constants/collectives';
import Link from '../Link';
import { isFeatureAllowedForCollectiveType, FEATURES } from '../../lib/allowed-features';

const MenuDivider = styled.div`
  margin-top: 34px;
`;

export const EDIT_COLLECTIVE_SECTIONS = {
  INFO: 'info', // First on purpose
  COLLECTIVE_GOALS: 'goals',
  CONNECTED_ACCOUNTS: 'connected-accounts',
  CONVERSATIONS: 'conversations',
  EXPENSES: 'expenses',
  EXPORT: 'export',
  HOST: 'host',
  IMAGES: 'images',
  MEMBERS: 'members',
  PAYMENT_METHODS: 'payment-methods',
  TIERS: 'tiers',
  VIRTUAL_CARDS: 'gift-cards',
  WEBHOOKS: 'webhooks',
  ADVANCED: 'advanced', // Last on purpose
  // Host Specific
  HOST_SETTINGS: 'hostSettings',
  INVOICES: 'invoices',
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
    id: 'Fiscalhost',
    defaultMessage: 'Fiscal Host',
  },
  [EDIT_COLLECTIVE_SECTIONS.HOST_SETTINGS]: {
    id: 'Host Plan',
    defaultMessage: 'Host Plan',
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
  [EDIT_COLLECTIVE_SECTIONS.EXPENSES]: isType(CollectiveType.COLLECTIVE),
  [EDIT_COLLECTIVE_SECTIONS.EXPORT]: isType(CollectiveType.COLLECTIVE),
  [EDIT_COLLECTIVE_SECTIONS.HOST]: isType(CollectiveType.COLLECTIVE),
  [EDIT_COLLECTIVE_SECTIONS.HOST_SETTINGS]: () => false,
  [EDIT_COLLECTIVE_SECTIONS.IMAGES]: isType(CollectiveType.EVENT),
  [EDIT_COLLECTIVE_SECTIONS.INVOICES]: () => false,
  [EDIT_COLLECTIVE_SECTIONS.MEMBERS]: isOneOfTypes(CollectiveType.COLLECTIVE, CollectiveType.ORGANIZATION),
  [EDIT_COLLECTIVE_SECTIONS.PAYMENT_METHODS]: isOneOfTypes(CollectiveType.USER, CollectiveType.ORGANIZATION),
  [EDIT_COLLECTIVE_SECTIONS.TIERS]: isOneOfTypes(CollectiveType.COLLECTIVE, CollectiveType.EVENT),
  [EDIT_COLLECTIVE_SECTIONS.VIRTUAL_CARDS]: isType(CollectiveType.ORGANIZATION),
  [EDIT_COLLECTIVE_SECTIONS.CONNECTED_ACCOUNTS]: isOneOfTypes(
    CollectiveType.COLLECTIVE,
    CollectiveType.ORGANIZATION,
    CollectiveType.USER,
  ),
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
  const getSectionInfo = section => ({
    label: SECTION_LABELS[section] ? formatMessage(SECTION_LABELS[section]) : section,
    isSelected: section === selectedSection,
    section,
  });
  const displayedSectionsInfos = displayedSections.map(getSectionInfo);
  const isEvent = collective.type === CollectiveType.EVENT;

  // eslint-disable-next-line react/prop-types
  const renderMenuItem = ({ section, label, isSelected }) => (
    <MenuItem
      key={section}
      selected={isSelected}
      route={isEvent ? 'editEvent' : 'editCollective'}
      params={
        isEvent
          ? { parentCollectiveSlug: collective.parentCollective.slug, eventSlug: collective.slug, section }
          : { slug: collective.slug, section }
      }
      data-cy={`menu-item-${section}`}
    >
      {label}
    </MenuItem>
  );

  return (
    <Flex width={0.2} flexDirection="column" mr={4} mb={3} flexWrap="wrap" css={{ flexGrow: 1, minWidth: 175 }}>
      {displayedSectionsInfos.map(renderMenuItem)}
      {collective.isHost && (
        <React.Fragment>
          <MenuDivider />
          {renderMenuItem(getSectionInfo(EDIT_COLLECTIVE_SECTIONS.EXPENSES))}
          {renderMenuItem(getSectionInfo(EDIT_COLLECTIVE_SECTIONS.HOST_SETTINGS))}
          {renderMenuItem(getSectionInfo(EDIT_COLLECTIVE_SECTIONS.INVOICES))}
        </React.Fragment>
      )}
    </Flex>
  );
};

MenuEditCollective.propTypes = {
  selectedSection: PropTypes.oneOf(Object.values(EDIT_COLLECTIVE_SECTIONS)),
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    type: PropTypes.oneOf(Object.values(CollectiveType)).isRequired,
    isHost: PropTypes.bool,
    parentCollective: PropTypes.shape({
      slug: PropTypes.string,
    }),
  }).isRequired,
};

export default React.memo(MenuEditCollective);
