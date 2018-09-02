/*
 * Constant strings used in the activity model
 */

export default {
  ACTIVITY_ALL: 'all',
  CONNECTED_ACCOUNT_CREATED: 'connected_account.created',
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
  COLLECTIVE_USER_ADDED: 'collective.user.added',
  ORGANIZATION_COLLECTIVE_CREATED: 'organization.collective.created',
  SUBSCRIPTION_CONFIRMED: 'subscription.confirmed',
  SUBSCRIPTION_CANCELED: 'subscription.canceled',
  TICKET_CONFIRMED: 'ticket.confirmed',
  USER_CREATED: 'user.created',
  WEBHOOK_STRIPE_RECEIVED: 'webhook.stripe.received',
  WEBHOOK_PAYPAL_RECEIVED: 'webhook.paypal.received',
  COLLECTIVE_MONTHLY: 'collective.monthly',

  // Not used anymore, leaving for historical reference
  COLLECTIVE_TRANSACTION_PAID: 'collective.transaction.paid', // replaced with COLLECTIVE_EXPENSE_PAID
};
