// Webhook notification events

export const WebhookEvents = {
  ALL: 'all',
  CONNECTED_ACCOUNT_CREATED: 'connected_account.created',
  COLLECTIVE_APPLY: 'collective.apply',
  COLLECTIVE_APPROVED: 'collective.approved',
  COLLECTIVE_CREATED: 'collective.created',
  COLLECTIVE_COMMENT_CREATED: 'collective.comment.created',
  COLLECTIVE_EXPENSE_CREATED: 'collective.expense.created',
  COLLECTIVE_EXPENSE_DELETED: 'collective.expense.deleted',
  COLLECTIVE_EXPENSE_UPDATED: 'collective.expense.updated',
  COLLECTIVE_EXPENSE_REJECTED: 'collective.expense.rejected',
  COLLECTIVE_EXPENSE_APPROVED: 'collective.expense.approved',
  COLLECTIVE_EXPENSE_PAID: 'collective.expense.paid',
  COLLECTIVE_MEMBER_CREATED: 'collective.member.created',
  COLLECTIVE_TRANSACTION_CREATED: 'collective.transaction.created',
  COLLECTIVE_UPDATE_CREATED: 'collective.update.created',
  COLLECTIVE_UPDATE_PUBLISHED: 'collective.update.published',
  ORDER_THANKYOU: 'order.thankyou',
  SUBSCRIPTION_CANCELED: 'subscription.canceled',
  TICKET_CONFIRMED: 'ticket.confirmed',
  VIRTUAL_CARD_PURCHASE: 'virtualcard.purchase',
};

export const WebhookEventsList = Object.values(WebhookEvents).sort();
