import { pick } from 'lodash';
import { activities } from '../constants';

/**
 * Sanitize an activity to make it suitable for posting on external webhooks
 */
export const sanitizeActivity = activity => {
  // Fields commons to all activity types
  const cleanActivity = pick(activity, ['createdAt', 'id', 'type', 'CollectiveId']);
  const type = cleanActivity.type;

  // Alway have an empty data object for activity
  cleanActivity.data = {};

  // Filter data based on activity type
  if (type === activities.COLLECTIVE_TRANSACTION_CREATED) {
    cleanActivity.data = pick(activity.data, [
      'fromCollective.type',
      'fromCollective.name',
      'fromCollective.image',
      'fromCollective.slug',
      'transaction.amount',
      'transaction.currency',
    ]);
  } else if (type === activities.COLLECTIVE_UPDATE_PUBLISHED) {
    cleanActivity.data = pick(activity.data, [
      'update.html',
      'update.title',
      'update.slug',
      'update.tags',
      'update.isPrivate',
    ]);
  } else if (type === activities.COLLECTIVE_EXPENSE_CREATED) {
    cleanActivity.data = pick(activity.data, [
      'fromCollective.type',
      'fromCollective.name',
      'fromCollective.image',
      'fromCollective.slug',
      'expense.id',
      'expense.description',
      'expense.amount',
      'expense.currency',
    ]);
  } else if (type === activities.COLLECTIVE_MEMBER_CREATED) {
    cleanActivity.data = pick(activity.data, [
      'member.role',
      'member.description',
      'member.since',
      'member.memberCollective.id',
      'member.memberCollective.type',
      'member.memberCollective.slug',
      'member.memberCollective.name',
      'member.memberCollective.company',
      'member.memberCollective.website',
      'member.memberCollective.twitterHandle',
      'member.memberCollective.githubHandle',
      'member.memberCollective.description',
      'member.memberCollective.previewImage',
      'member.order.id',
      'member.order.totalAmount',
      'member.order.currency',
      'member.order.description',
    ]);
  }

  return cleanActivity;
};
