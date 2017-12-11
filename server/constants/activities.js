/*
 * Constant strings used in the activity model
 */

export default {
  ACTIVITY_ALL: 'all',
  CONNECTED_ACCOUNT_CREATED: 'connected_account.created',
  COLLECTIVE_CREATED: 'collective.created',
  COLLECTIVE_EXPENSE_CREATED: 'collective.expense.created',
  COLLECTIVE_EXPENSE_DELETED: 'collective.expense.deleted',
  COLLECTIVE_EXPENSE_UPDATED: 'collective.expense.updated',
  COLLECTIVE_EXPENSE_REJECTED: 'collective.expense.rejected',
  COLLECTIVE_EXPENSE_APPROVED: 'collective.expense.approved',
  COLLECTIVE_EXPENSE_PAID: 'collective.expense.paid',
  COLLECTIVE_MEMBER_CREATED: 'collective.member.created',
  COLLECTIVE_TRANSACTION_CREATED: 'collective.transaction.created',
  COLLECTIVE_USER_ADDED: 'collective.user.added',
  SUBSCRIPTION_CONFIRMED: 'subscription.confirmed',
  SUBSCRIPTION_CANCELED: 'subscription.canceled',
  USER_CREATED: 'user.created',
  WEBHOOK_STRIPE_RECEIVED: 'webhook.stripe.received',
  WEBHOOK_PAYPAL_RECEIVED: 'webhook.paypal.received',
  COLLECTIVE_MONTHLY: 'collective.monthly',

  // Not used anymore, leaving for historical reference
  COLLECTIVE_TRANSACTION_PAID: 'collective.transaction.paid', // replaced with COLLECTIVE_EXPENSE_PAID
};
