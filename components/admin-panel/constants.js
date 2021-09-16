import { defineMessages } from 'react-intl';

export const HOST_DASHBOARD_SECTIONS = {
  // New Host Dashboard
  BUDGET_MANAGEMENT: 'budget',
  COLLECTIVES: 'collectives',
  OVERVIEW: 'info',
  REPORTS: 'reports',
  // Existing Host Dashboard Sections
  EXPENSES: 'expenses',
  FINANCIAL_CONTRIBUTIONS: 'orders',
  HOSTED_COLLECTIVES: 'hosted-collectives',
  PENDING_APPLICATIONS: 'pending-applications',
};

export const ABOUT_ORG_SECTIONS = {
  COLLECTIVE_PAGE: 'collective-page',
  CONNECTED_ACCOUNTS: 'connected-accounts',
  INFO: 'info',
  TEAM: 'members',
};

export const ORG_BUDGET_SECTIONS = {
  GIFT_CARDS: 'gift-cards',
  PAYMENT_METHODS: 'payment-methods',
  PAYMENT_RECEIPTS: 'payment-receipts',
  PENDING_ORDERS: 'pending-orders',
  TIERS: 'tiers',
  // Manage Contributions
};

export const FISCAL_HOST_SECTIONS = {
  FISCAL_HOSTING: 'fiscal-hosting',
  HOST_METRICS: 'host-metrics',
  HOST_PLAN: 'host-plan',
  HOST_TWO_FACTOR_AUTH: 'host-two-factor-auth',
  HOST_VIRTUAL_CARDS: 'host-virtual-cards',
  INVOICES_RECEIPTS: 'invoices-receipts',
  POLICIES: 'policies',
  RECEIVING_MONEY: 'receiving-money',
  SENDING_MONEY: 'sending-money',
};

export const COLLECTIVE_SECTIONS = {
  ADVANCED: 'advanced',
  COLLECTIVE_GOALS: 'goals',
  COLLECTIVE_PAGE: 'collective-page',
  CONNECTED_ACCOUNTS: 'connected-accounts',
  EXPORT: 'export',
  HOST: 'host',
  INFO: 'info',
  PAYMENT_METHODS: 'payment-methods',
  PAYMENT_RECEIPTS: 'payment-receipts',
  POLICIES: 'policies',
  TEAM: 'members',
  TICKETS: 'tickets',
  TIERS: 'tiers',
  TWO_FACTOR_AUTH: 'two-factor-auth',
  VIRTUAL_CARDS: 'virtual-cards',
  WEBHOOKS: 'webhooks',
};

export const LEGACY_COLLECTIVE_SETTINGS_SECTIONS = {
  ...COLLECTIVE_SECTIONS,
  ...ABOUT_ORG_SECTIONS,
  ...ORG_BUDGET_SECTIONS,
  ...FISCAL_HOST_SECTIONS,
};

export const ALL_SECTIONS = {
  ...COLLECTIVE_SECTIONS,
  ...ABOUT_ORG_SECTIONS,
  ...ORG_BUDGET_SECTIONS,
  ...FISCAL_HOST_SECTIONS,
  ...HOST_DASHBOARD_SECTIONS,
};

export const SECTION_LABELS = defineMessages({
  [ALL_SECTIONS.EXPENSES]: {
    id: 'AdminPanel.Menu.Expenses',
    defaultMessage: 'Expenses',
  },
  [ALL_SECTIONS.FINANCIAL_CONTRIBUTIONS]: {
    id: 'AdminPanel.Menu.FinancialContributions',
    defaultMessage: 'Financial Contributions',
  },
  [ALL_SECTIONS.PENDING_APPLICATIONS]: {
    id: 'AdminPanel.Menu.PendingApplications',
    defaultMessage: 'Pending Applications',
  },
  [ALL_SECTIONS.OVERVIEW]: {
    id: 'AdminPanel.Menu.Overview',
    defaultMessage: 'Overview',
  },
  [ALL_SECTIONS.BUDGET_MANAGEMENT]: {
    id: 'AdminPanel.Menu.BudgetManagement',
    defaultMessage: 'Overview',
  },
  [ALL_SECTIONS.COLLECTIVES]: {
    id: 'AdminPanel.Menu.Collectives',
    defaultMessage: 'Collectives',
  },
  [ALL_SECTIONS.REPORTS]: {
    id: 'AdminPanel.Menu.Reports',
    defaultMessage: 'Reports',
  },
  [ALL_SECTIONS.ADVANCED]: {
    id: 'editCollective.menu.advanced',
    defaultMessage: 'Advanced',
  },
  [ALL_SECTIONS.COLLECTIVE_GOALS]: {
    id: 'Goals',
    defaultMessage: 'Goals',
  },
  [ALL_SECTIONS.COLLECTIVE_PAGE]: {
    id: 'editCollective.menu.collectivePage',
    defaultMessage: 'Profile Page',
  },
  [ALL_SECTIONS.CONNECTED_ACCOUNTS]: {
    id: 'editCollective.menu.connectedAccounts',
    defaultMessage: 'Connected Accounts',
  },
  [ALL_SECTIONS.UPDATES]: {
    id: 'updates',
    defaultMessage: 'Updates',
  },
  [ALL_SECTIONS.CONVERSATIONS]: {
    id: 'conversations',
    defaultMessage: 'Conversations',
  },
  [ALL_SECTIONS.EXPORT]: {
    id: 'editCollective.menu.export',
    defaultMessage: 'Export',
  },
  [ALL_SECTIONS.POLICIES]: {
    id: 'editCollective.menu.policies',
    defaultMessage: 'Policies',
  },
  [ALL_SECTIONS.HOST]: {
    id: 'Fiscalhost',
    defaultMessage: 'Fiscal Host',
  },
  [ALL_SECTIONS.HOST_PLAN]: {
    id: 'Host.Plan',
    defaultMessage: 'Host Plan',
  },
  [ALL_SECTIONS.HOST_METRICS]: {
    id: 'Host.Metrics',
    defaultMessage: 'Host Metrics',
  },
  [ALL_SECTIONS.INFO]: {
    id: 'editCollective.menu.info',
    defaultMessage: 'Info',
  },
  [ALL_SECTIONS.INVOICES_RECEIPTS]: {
    id: 'becomeASponsor.invoiceReceipts',
    defaultMessage: 'Invoices & Receipts',
  },
  [ALL_SECTIONS.RECEIVING_MONEY]: {
    id: 'editCollective.receivingMoney',
    defaultMessage: 'Receiving Money',
  },
  [ALL_SECTIONS.PENDING_ORDERS]: {
    id: 'PendingBankTransfers',
    defaultMessage: 'Pending bank transfers',
  },
  [ALL_SECTIONS.SENDING_MONEY]: {
    id: 'editCollective.sendingMoney',
    defaultMessage: 'Sending Money',
  },
  [ALL_SECTIONS.FISCAL_HOSTING]: {
    id: 'editCollective.fiscalHosting',
    defaultMessage: 'Fiscal Hosting',
  },
  [ALL_SECTIONS.TEAM]: {
    id: 'ContributorsFilter.Core',
    defaultMessage: 'Team',
  },
  [ALL_SECTIONS.PAYMENT_METHODS]: {
    id: 'editCollective.menu.paymentMethods',
    defaultMessage: 'Payment Methods',
  },
  [ALL_SECTIONS.TIERS]: {
    id: 'editCollective.menu.tiers',
    defaultMessage: 'Tiers',
  },
  [ALL_SECTIONS.GIFT_CARDS]: {
    id: 'editCollective.menu.giftCards',
    defaultMessage: 'Gift Cards',
  },
  [ALL_SECTIONS.WEBHOOKS]: {
    id: 'editCollective.menu.webhooks',
    defaultMessage: 'Webhooks',
  },
  [ALL_SECTIONS.TICKETS]: {
    id: 'section.tickets.title',
    defaultMessage: 'Tickets',
  },
  [ALL_SECTIONS.TWO_FACTOR_AUTH]: {
    id: 'TwoFactorAuth',
    defaultMessage: 'Two-factor authentication',
  },
  [ALL_SECTIONS.PAYMENT_RECEIPTS]: {
    id: 'editCollective.menu.paymentReceipts',
    defaultMessage: 'Payment Receipts',
  },
  [ALL_SECTIONS.HOST_TWO_FACTOR_AUTH]: {
    id: 'TwoFactorAuth',
    defaultMessage: 'Two-factor authentication',
  },
  [ALL_SECTIONS.HOST_VIRTUAL_CARDS]: {
    id: 'VirtualCards.Title',
    defaultMessage: 'Virtual Cards',
  },
  [ALL_SECTIONS.VIRTUAL_CARDS]: {
    id: 'VirtualCards.Title',
    defaultMessage: 'Virtual Cards',
  },
  [ALL_SECTIONS.HOSTED_COLLECTIVES]: {
    id: 'AdminPanel.Menu.HostedCollectives',
    defaultMessage: 'Hosted Collectives',
  },
});
