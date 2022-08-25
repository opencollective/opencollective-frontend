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
    id: 'Amount.AllShort',
    defaultMessage: 'All',
  },
  COLLECTIVE: {
    id: 'Collective',
    defaultMessage: 'Collective',
  },
  EXPENSES: {
    id: 'Expenses',
    defaultMessage: 'Expenses',
  },
  CONTRIBUTIONS: {
    id: 'Contributions',
    defaultMessage: 'Contributions',
  },
  ACTIVITIES_UPDATES: {
    id: 'updates',
    defaultMessage: 'Updates',
  },
  VIRTUAL_CARDS: {
    id: 'PayoutMethod.Type.VirtualCard',
    defaultMessage: 'Virtual Card',
  },
  FUND_EVENTS: {
    id: 'FundEvent',
    defaultMessage: 'Fund & Event',
  },
});

export const ActivityAttributionI18n = defineMessages({
  ALL: {
    id: 'ActivityAttribution.AllShort',
    defaultMessage: 'All',
  },
  AUTHORED: {
    id: 'ActivityAttribution.AUTHORED',
    defaultMessage: 'Authored',
  },
  RECEIVED: {
    id: 'ActivityAttribution.RECEIVED',
    defaultMessage: 'Received',
  },
  SELF: {
    id: 'ActivityAttribution.SELF',
    defaultMessage: 'Self actions',
  },
  HOSTED_ACCOUNTS: {
    defaultMessage: 'Hosted Accounts',
  },
});
