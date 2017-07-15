/*
 * Constant strings used in the activity model
 */

export default {
  ACTIVITY_ALL: 'all',
  CONNECTED_ACCOUNT_CREATED: 'connected_account.created',
  GROUP_CREATED: 'collective.created',
  GROUP_COMMENT_CREATED: 'collective.comment.created',
  GROUP_COMMENT_DELETED: 'collective.comment.deleted',
  GROUP_COMMENT_UPDATED: 'collective.comment.updated',
  GROUP_DONATION_CREATED: 'collective.donation.created',
  GROUP_EXPENSE_CREATED: 'collective.expense.created',
  GROUP_EXPENSE_DELETED: 'collective.expense.deleted',
  GROUP_EXPENSE_UPDATED: 'collective.expense.updated',
  GROUP_EXPENSE_REJECTED: 'collective.expense.rejected',
  GROUP_EXPENSE_APPROVED: 'collective.expense.approved',
  GROUP_EXPENSE_PAID: 'collective.expense.paid',
  GROUP_TRANSACTION_CREATED: 'collective.transaction.created',
  GROUP_USER_ADDED: 'collective.user.added',
  SUBSCRIPTION_CONFIRMED: 'subscription.confirmed',
  SUBSCRIPTION_CANCELED: 'subscription.canceled',
  USER_CREATED: 'user.created',
  WEBHOOK_STRIPE_RECEIVED: 'webhook.stripe.received',
  WEBHOOK_PAYPAL_RECEIVED: 'webhook.paypal.received',
  GROUP_MONTHLY: 'collective.monthly',

  // Not used anymore, leaving for historical reference
  GROUP_TRANSACTION_PAID: 'collective.transaction.paid', // replaced with GROUP_EXPENSE_PAID
};
