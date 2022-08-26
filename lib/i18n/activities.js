import { defineMessages } from 'react-intl';

export const ActivityDescriptionI18n = defineMessages({
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
  // TODO Link comment entity (expense, update or conversation)
  COLLECTIVE_COMMENT_CREATED: {
    defaultMessage: 'New comment on <Account></Account>',
  },
  // TODO Link conversation
  COLLECTIVE_CONVERSATION_CREATED: {
    defaultMessage: 'New conversation started on <Account></Account>',
  },
  COLLECTIVE_EXPENSE_CREATED: {
    defaultMessage: 'New <Expense>expense</Expense> from <FromAccount></FromAccount> to <Account></Account>',
  },
  COLLECTIVE_EXPENSE_UPDATED: {
    defaultMessage: '<Expense>Expense</Expense> updated on <Account></Account>',
  },
  COLLECTIVE_EXPENSE_INVITE_DRAFTED: {
    defaultMessage: 'Invited someone to submit an <Expense>expense</Expense> to <Account></Account>',
  },
  COLLECTIVE_EXPENSE_PROCESSING: {
    defaultMessage: '<Expense>Expense</Expense> processing',
  },
  COLLECTIVE_EXPENSE_ERROR: {
    defaultMessage: '<Expense>Expense</Expense> errored',
  },
  COLLECTIVE_EXPENSE_SCHEDULED_FOR_PAYMENT: {
    defaultMessage: '<Expense>Expense</Expense> scheduled for payment',
  },
  COLLECTIVE_EXPENSE_PAID: {
    defaultMessage: 'Paid <Expense>expense</Expense> on <Account></Account>',
  },
  COLLECTIVE_EXPENSE_MARKED_AS_UNPAID: {
    defaultMessage: 'Marked <Expense>expense</Expense> as unpaid',
  },
  COLLECTIVE_EXPENSE_APPROVED: {
    defaultMessage: 'Approved <Expense>expense</Expense> for <Account></Account>',
  },
  COLLECTIVE_EXPENSE_UNAPPROVED: {
    defaultMessage: 'Unapproved <Expense>expense</Expense> for <Account></Account>',
  },
  COLLECTIVE_EXPENSE_REJECTED: {
    defaultMessage: 'Rejected <Expense>expense</Expense> for <Account></Account>',
  },
  COLLECTIVE_EXPENSE_MOVED: {
    defaultMessage: '<Expense>Expense</Expense> moved from <FromAccount></FromAccount> to <Account></Account>',
  },
  COLLECTIVE_EXPENSE_DELETED: {
    id: 'WebhookEvents.COLLECTIVE_EXPENSE_DELETED',
    defaultMessage: 'Expense deleted',
  },
  COLLECTIVE_MEMBER_CREATED: {
    defaultMessage: '<FromAccount></FromAccount> joined <Account></Account> as a <MemberRole></MemberRole>',
  },
  COLLECTIVE_TRANSACTION_CREATED: {
    defaultMessage: 'New transaction from <FromAccount></FromAccount> to <Account></Account>',
  },
  COLLECTIVE_UPDATE_CREATED: {
    defaultMessage: 'New update drafted on <Account></Account>',
  },
  COLLECTIVE_UPDATE_PUBLISHED: {
    defaultMessage: 'Update published on <Account></Account>',
  },
  COLLECTIVE_VIRTUAL_CARD_CREATED: {
    defaultMessage: 'New virtual card created on <Account></Account>',
  },
  CONNECTED_ACCOUNT_CREATED: {
    id: 'WebhookEvents.CONNECTED_ACCOUNT_CREATED',
    defaultMessage: 'Connected account added',
  },
  SUBSCRIPTION_CANCELED: {
    defaultMessage: 'Subscription for <Order>order</Order> cancelled',
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
    defaultMessage: 'Accounts',
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
