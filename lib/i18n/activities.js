import { defineMessages } from 'react-intl';

export const ActivityLabelI18n = defineMessages({
  COLLECTIVE_CREATED: {
    defaultMessage: 'Account created',
  },
  COLLECTIVE_APPLY: {
    id: 'WebhookEvents.COLLECTIVE_APPLY',
    defaultMessage: 'New collective application',
  },
  COLLECTIVE_APPROVED: {
    id: 'WebhookEvents.COLLECTIVE_APPROVED',
    defaultMessage: 'Collective application approved',
  },
  COLLECTIVE_COMMENT_CREATED: {
    id: 'WebhookEvents.COLLECTIVE_COMMENT_CREATED',
    defaultMessage: 'New comment',
  },
  COLLECTIVE_EXPENSE_CREATED: {
    id: 'WebhookEvents.COLLECTIVE_EXPENSE_CREATED',
    defaultMessage: 'New expenses',
  },
  COLLECTIVE_EXPENSE_DELETED: {
    id: 'WebhookEvents.COLLECTIVE_EXPENSE_DELETED',
    defaultMessage: 'Expense deleted',
  },
  COLLECTIVE_MEMBER_CREATED: {
    id: 'WebhookEvents.COLLECTIVE_MEMBER_CREATED',
    defaultMessage: 'New member',
  },
  COLLECTIVE_TRANSACTION_CREATED: {
    id: 'WebhookEvents.COLLECTIVE_TRANSACTION_CREATED',
    defaultMessage: 'New transaction',
  },
  COLLECTIVE_UPDATE_CREATED: {
    id: 'WebhookEvents.COLLECTIVE_UPDATE_CREATED',
    defaultMessage: 'New update draft',
  },
  CONNECTED_ACCOUNT_CREATED: {
    id: 'WebhookEvents.CONNECTED_ACCOUNT_CREATED',
    defaultMessage: 'Connected account added',
  },
  SUBSCRIPTION_CANCELED: {
    id: 'WebhookEvents.SUBSCRIPTION_CANCELED',
    defaultMessage: 'Subscription cancelled',
  },
  TICKET_CONFIRMED: {
    id: 'WebhookEvents.TICKET_CONFIRMED',
    defaultMessage: 'Ticket confirmed',
  },
});

export const ActivityCategoryLabelI18n = defineMessages({
  ALL: {
    id: 'AllActivity',
    defaultMessage: 'All activities',
  },
  COLLECTIVE: {
    id: 'CollectiveActivity',
    defaultMessage: 'Collective activity',
  },
  EXPENSES: {
    id: 'ExpensesActivity',
    defaultMessage: 'Expenses activity',
  },
  CONTRIBUTIONS: {
    id: 'ContributionsActivity',
    defaultMessage: 'Contributions activity',
  },
  ACTIVITIES_UPDATES: {
    id: 'UpdatesActivity',
    defaultMessage: 'Updates activity',
  },
  VIRTUAL_CARDS: {
    id: 'VirtualCardActivity',
    defaultMessage: 'Virtual Card activity',
  },
  FUND_EVENTS: {
    id: 'FundEventActivity',
    defaultMessage: 'Fund Event activity',
  },
  REPORTS: {
    id: 'ReportsActivity',
    defaultMessage: 'Reports activity',
  },
});
