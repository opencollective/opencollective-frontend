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
    id: 'AllActivities',
    defaultMessage: 'All activities',
  },
  COLLECTIVE: {
    id: 'CollectiveActivities',
    defaultMessage: 'Collective activities',
  },
  EXPENSES: {
    id: 'ExpensesActivities',
    defaultMessage: 'Expenses activities',
  },
  CONTRIBUTIONS: {
    id: 'ContributionsActivities',
    defaultMessage: 'Contributions activities',
  },
  ACTIVITIES_UPDATES: {
    id: 'UpdatesActivities',
    defaultMessage: 'Updates activities',
  },
  VIRTUAL_CARDS: {
    id: 'VirtualCardActivities',
    defaultMessage: 'Virtual Card activities',
  },
  FUND_EVENTS: {
    id: 'FundEventActivities',
    defaultMessage: 'Fund & Event activities',
  },
});
