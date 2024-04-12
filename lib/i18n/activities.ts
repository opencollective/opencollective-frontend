import { defineMessages, MessageDescriptor } from 'react-intl';

import { ActivityTypes } from '../constants/activities';

interface TimelineMessageDescriptor extends MessageDescriptor {
  avatar?: 'fromAccount' | 'account' | 'individual'; // Used to determine which avatar to display (default is Individual)
  content?: 'update' | 'conversation'; // Used to determine which content card to display
}

export const ActivityTimelineMessageI18n = defineMessages<string, TimelineMessageDescriptor>({
  COLLECTIVE_EXPENSE_CREATED: {
    defaultMessage:
      '<Individual></Individual> submitted expense <Expense>{expenseDescription}</Expense> to <Account></Account>',
    id: '8EI+IL',
  },
  COLLECTIVE_EXPENSE_APPROVED: {
    defaultMessage: '<Individual></Individual> approved <Expense>{expenseDescription}</Expense>',
    id: 'ub/vNK',
  },
  COLLECTIVE_EXPENSE_ERROR: {
    defaultMessage: '<FromAccount></FromAccount> expense <Expense>{expenseDescription}</Expense> payment failed',
    id: 'wciHmV',
    avatar: 'fromAccount',
  },
  COLLECTIVE_EXPENSE_MARKED_AS_INCOMPLETE: {
    defaultMessage: '<Individual></Individual> marked <Expense>{expenseDescription}</Expense> as incomplete',
    id: 'Uzut+A',
  },
  COLLECTIVE_EXPENSE_MARKED_AS_SPAM: {
    defaultMessage: '<Individual></Individual> marked <Expense>{expenseDescription}</Expense> as spam',
    id: 'hfCFQ9',
  },
  COLLECTIVE_EXPENSE_MARKED_AS_UNPAID: {
    defaultMessage: '<Individual></Individual> marked <Expense>{expenseDescription}</Expense> as unpaid',
    id: 'x91S7e',
  },
  COLLECTIVE_EXPENSE_RE_APPROVAL_REQUESTED: {
    defaultMessage: '<Individual></Individual> requested re-approval of <Expense>{expenseDescription}</Expense>',
    id: '+5TQLy',
  },
  COLLECTIVE_EXPENSE_PAID: {
    defaultMessage:
      '<Individual></Individual> paid <Amount></Amount> to <Payee></Payee> for <Expense>{expenseDescription}</Expense>',
    id: '/eA1Ga',
  },
  COLLECTIVE_EXPENSE_REJECTED: {
    defaultMessage: '<Individual></Individual> rejected <Expense>{expenseDescription}</Expense>',
    id: 'dye8kC',
  },
  COLLECTIVE_EXPENSE_UNAPPROVED: {
    defaultMessage: '<Individual></Individual> unapproved expense <Expense>{expenseDescription}</Expense>',
    id: 'faRZML',
  },
  COLLECTIVE_EXPENSE_UPDATED: {
    defaultMessage: '<Individual></Individual> updated expense <Expense>{expenseDescription}</Expense>',
    id: 'nWf9h8',
  },
  EXPENSE_COMMENT_CREATED: {
    defaultMessage: '<Individual></Individual> commented on <Expense>{expenseDescription}</Expense>',
    id: 'joNiQk',
  },
  COLLECTIVE_EXPENSE_INVITE_DRAFTED: {
    defaultMessage:
      '<Individual></Individual> drafted an <Expense>{expenseDescription}</Expense> on <Account></Account>',
    id: 'B+NQ+r',
  },
  COLLECTIVE_EXPENSE_RECURRING_DRAFTED: {
    defaultMessage:
      '<Individual></Individual> recurring <Expense>{expenseDescription}</Expense> expense drafted on <Account></Account>',
    id: 'HaWQNA',
  },
  COLLECTIVE_UPDATE_PUBLISHED: {
    defaultMessage: '<Individual></Individual> published a new update on <Account></Account>',
    id: 'uuJbG9',
    content: 'update',
  },
  UPDATE_COMMENT_CREATED: {
    defaultMessage: '<Individual></Individual> commented on update <Update>{updateTitle}</Update>',
    id: '21IyOj',
  },
  ORDER_PAYMENT_FAILED: {
    defaultMessage: `<Individual></Individual>'s contribution to <Account></Account> failed`,
    id: 'YKqXR6',
  },
  PAYMENT_FAILED: {
    defaultMessage: `<Individual></Individual>'s payment for <Order>contribution</Order> to <Account></Account> failed`,
    id: 'zw0B0K',
  },
  COLLECTIVE_MEMBER_CREATED: {
    defaultMessage: '<FromAccount></FromAccount> joined <Account></Account> as <MemberRole></MemberRole>',
    id: 'blBwBm',
    avatar: 'fromAccount',
  },
  CONTRIBUTION_REJECTED: {
    defaultMessage:
      // Individual not always available here (added to activity 2024-02-22), using Account as fallback
      '<IndividualOrAccount></IndividualOrAccount> rejected contribution from <FromAccount></FromAccount>',
    id: 'AZmsFu',
  },
  COLLECTIVE_CONVERSATION_CREATED: {
    defaultMessage: '<Individual></Individual> started a new conversation on <Account></Account>',
    id: '6PKjA9',
    content: 'conversation',
  },
  CONVERSATION_COMMENT_CREATED: {
    defaultMessage:
      '<Individual></Individual> commented on conversation <Conversation>{conversationTitle}</Conversation>',
    id: 'CCaOhC',
  },
  COLLECTIVE_VIRTUAL_CARD_REQUEST_APPROVED: {
    defaultMessage: '<Individual></Individual> approved request for virtual card to <Account></Account>',
    id: 'VJNKy6',
  },
  COLLECTIVE_VIRTUAL_CARD_REQUEST_REJECTED: {
    defaultMessage: '<Individual></Individual> rejected request for virtual card to <Account></Account>',
    id: 'Sg4yBm',
  },
  COLLECTIVE_VIRTUAL_CARD_ADDED: {
    defaultMessage: '<Individual></Individual> added a new virtual card to <Account></Account>',
    id: '+qn/KC',
  },
  COLLECTIVE_VIRTUAL_CARD_SUSPENDED: {
    defaultMessage: '<Individual></Individual> suspended virtual card on <Account></Account>',
    id: '7jB1+y',
  },
  VIRTUAL_CARD_REQUESTED: {
    defaultMessage: '<Individual></Individual> requested a virtual card for <Account></Account> from <Host></Host>',
    id: 'R8rMFM',
  },
  VIRTUAL_CARD_PURCHASE: {
    defaultMessage: '<Individual></Individual> made purchase <Expense>{expenseDescription}</Expense> with virtual card',
    id: '5ASOpu',
  },
  SUBSCRIPTION_CANCELED: {
    defaultMessage: "<FromAccount></FromAccount>'s <Order>recurring contribution</Order> has been cancelled",
    id: 'pfrLXw',
    avatar: 'fromAccount',
  },
  SUBSCRIPTION_PAUSED: {
    defaultMessage: "<FromAccount></FromAccount>'s <Order>recurring contribution</Order> has been paused",
    id: 'i7d4by',
    avatar: 'fromAccount',
  },
  ORDER_PENDING_CONTRIBUTION_NEW: {
    defaultMessage: '<Individual></Individual> created new pending <Order>contribution</Order> to <Account></Account>',
    id: 'MapeUk',
  },
});

export const ActivityDescriptionI18n = defineMessages({
  ACCOUNTING_CATEGORIES_EDITED: {
    defaultMessage: 'Chart of account edited',
    id: 'F3FkEv',
  },
  // Collective creation & applications
  COLLECTIVE_CREATED: {
    defaultMessage:
      '<AccountType></AccountType> <Account></Account> created{hasParent, select, true { under <AccountParent></AccountParent>} other {}}',
    id: 'vWYg/k',
  },
  COLLECTIVE_EDITED: {
    defaultMessage: '<Account></Account> edited',
    id: 'A4+n4H',
  },
  COLLECTIVE_REJECTED: {
    defaultMessage: '<Account></Account> application rejected',
    id: 'BZnKES',
  },
  ORGANIZATION_COLLECTIVE_CREATED: {
    defaultMessage: '<Account></Account> created',
    id: 'mrEGhM',
  },
  COLLECTIVE_CREATED_GITHUB: {
    defaultMessage: '<Account></Account> created through GitHub',
    id: '+UdXIM',
  },
  COLLECTIVE_APPLY: {
    defaultMessage: '<Account></Account> applied to be hosted by <Host></Host>',
    id: 'K9BlUB',
  },
  COLLECTIVE_APPROVED: {
    defaultMessage: '<Account></Account> application approved',
    id: 'elfKB7',
  },
  COLLECTIVE_UNHOSTED: {
    defaultMessage: '<Account></Account> unhosted',
    id: 'soEGOn',
  },
  // Freezing collectives
  COLLECTIVE_FROZEN: {
    defaultMessage: '<Account></Account> frozen',
    id: 'A5sIUw',
  },
  COLLECTIVE_UNFROZEN: {
    defaultMessage: '<Account></Account> unfrozen',
    id: 'axn2o/',
  },
  // Comments & conversations
  COLLECTIVE_COMMENT_CREATED: {
    defaultMessage: 'New comment on <CommentEntity></CommentEntity>',
    id: 'DhxIpu',
  },
  UPDATE_COMMENT_CREATED: {
    defaultMessage: 'New comment on update <Update>{updateTitle}</Update>',
    id: 'X0Cbkk',
  },
  EXPENSE_COMMENT_CREATED: {
    defaultMessage: 'New comment on expense <Expense>{expenseDescription}</Expense>',
    id: 'CAmz1n',
  },
  CONVERSATION_COMMENT_CREATED: {
    defaultMessage: 'New comment on conversation <Conversation>{conversationTitle}</Conversation>',
    id: 'AyOLNN',
  },
  COLLECTIVE_CONVERSATION_CREATED: {
    defaultMessage: 'New conversation <Conversation>{conversationTitle}</Conversation> started on <Account></Account>',
    id: 'L2vMgh',
  },
  // Expenses
  COLLECTIVE_EXPENSE_CREATED: {
    defaultMessage:
      'Expense <Expense>{expenseDescription}</Expense> created from <FromAccount></FromAccount> to <Account></Account>',
    id: 'tbPgmU',
  },
  COLLECTIVE_EXPENSE_DELETED: {
    defaultMessage: 'Expense deleted',
    id: 'KYXMJ6',
  },
  COLLECTIVE_EXPENSE_UPDATED: {
    defaultMessage:
      'Expense <Expense>{expenseDescription}</Expense> from <FromAccount></FromAccount> to <Account></Account> updated',
    id: '/smQQF',
  },
  COLLECTIVE_EXPENSE_REJECTED: {
    defaultMessage:
      'Rejected expense <Expense>{expenseDescription}</Expense> from <FromAccount></FromAccount> to <Account></Account>',
    id: 'O9VCf1',
  },
  COLLECTIVE_EXPENSE_APPROVED: {
    defaultMessage:
      'Approved expense <Expense>{expenseDescription}</Expense> from <FromAccount></FromAccount> to <Account></Account>',
    id: 'C7dxIO',
  },
  COLLECTIVE_EXPENSE_UNAPPROVED: {
    defaultMessage:
      'Unapproved expense <Expense>{expenseDescription}</Expense> from <FromAccount></FromAccount> to <Account></Account>',
    id: 'lRbFqE',
  },
  COLLECTIVE_EXPENSE_MOVED: {
    defaultMessage:
      'Expense <Expense>{expenseDescription}</Expense> moved from <FromAccount></FromAccount> to <Account></Account>',
    id: 'TdeE3/',
  },
  COLLECTIVE_EXPENSE_PAID: {
    defaultMessage:
      'Paid expense <Expense>{expenseDescription}</Expense> from <FromAccount></FromAccount> to <Account></Account>',
    id: 'yuJl3e',
  },
  COLLECTIVE_EXPENSE_MARKED_AS_UNPAID: {
    defaultMessage: 'Marked expense <Expense>{expenseDescription}</Expense> as unpaid',
    id: 'Ttlx2B',
  },
  COLLECTIVE_EXPENSE_MARKED_AS_SPAM: {
    defaultMessage: 'Marked expense <Expense>{expenseDescription}</Expense> as SPAM',
    id: 'J3FStm',
  },
  COLLECTIVE_EXPENSE_MARKED_AS_INCOMPLETE: {
    defaultMessage: 'Marked expense <Expense>{expenseDescription}</Expense> as incomplete',
    id: '/mqxVR',
  },
  COLLECTIVE_EXPENSE_PROCESSING: {
    defaultMessage: 'Expense <Expense>{expenseDescription}</Expense> is being processed',
    id: 'qbG+ka',
  },
  COLLECTIVE_EXPENSE_SCHEDULED_FOR_PAYMENT: {
    defaultMessage: 'Expense <Expense>{expenseDescription}</Expense> scheduled for payment',
    id: 'e1Zd2a',
  },
  COLLECTIVE_EXPENSE_ERROR: {
    defaultMessage: 'Expense <Expense>{expenseDescription}</Expense> payment failed',
    id: 'M4DHuK',
  },
  COLLECTIVE_EXPENSE_RE_APPROVAL_REQUESTED: {
    defaultMessage: 'Requested re-approval of <Expense>{expenseDescription}</Expense>',
    id: 'GoA9Rd',
  },
  COLLECTIVE_EXPENSE_INVITE_DRAFTED: {
    defaultMessage: 'Invited someone to submit expense <Expense>{expenseDescription}</Expense> to <Account></Account>',
    id: 'VL8DTm',
  },
  COLLECTIVE_EXPENSE_RECURRING_DRAFTED: {
    defaultMessage: 'New draft created for <Expense>recurring expense</Expense> on <Account></Account>',
    id: 'ecapW0',
  },
  COLLECTIVE_EXPENSE_MISSING_RECEIPT: {
    defaultMessage:
      'Notified admins about a missing receipt for expense <Expense>{expenseDescription}</Expense> on <Account></Account>',
    id: 'H8ux/L',
  },
  COLLECTIVE_EXPENSE_PUT_ON_HOLD: {
    defaultMessage: 'Put expense <Expense>{expenseDescription}</Expense> on hold',
    id: 'cU92dw',
  },
  COLLECTIVE_EXPENSE_RELEASED_FROM_HOLD: {
    defaultMessage: 'Released hold on expense <Expense>{expenseDescription}</Expense>',
    id: 'o60jEo',
  },
  TAXFORM_REQUEST: {
    defaultMessage: 'Tax form request sent to <Account></Account>',
    id: 'p8x23o',
  },
  TAXFORM_RECEIVED: {
    defaultMessage: 'Tax form received for <Account></Account>',
  },
  // Members
  COLLECTIVE_MEMBER_CREATED: {
    defaultMessage: '<FromAccount></FromAccount> joined <Account></Account> as <MemberRole></MemberRole>',
    id: 'blBwBm',
  },
  COLLECTIVE_MEMBER_INVITED: {
    defaultMessage: '<FromAccount></FromAccount> was invited to join <Account></Account> as <MemberRole></MemberRole>',
    id: 'MAL7pS',
  },
  COLLECTIVE_CORE_MEMBER_INVITED: {
    defaultMessage: '<FromAccount></FromAccount> was invited to join <Account></Account> as <MemberRole></MemberRole>',
    id: 'MAL7pS',
  },
  COLLECTIVE_CORE_MEMBER_INVITATION_DECLINED: {
    defaultMessage:
      '<FromAccount></FromAccount> declined the invitation to join <Account></Account> as <MemberRole></MemberRole>',
    id: 'jVW1Qw',
  },
  COLLECTIVE_CORE_MEMBER_ADDED: {
    defaultMessage:
      '<FromAccount></FromAccount> was added to <Account></Account> with the role <MemberRole></MemberRole>',
    id: 'yziJEf',
  },
  COLLECTIVE_CORE_MEMBER_EDITED: {
    defaultMessage: 'Edited <FromAccount></FromAccount> membership to <Account></Account>',
    id: 'qpaFgk',
  },
  COLLECTIVE_CORE_MEMBER_REMOVED: {
    defaultMessage: '<FromAccount></FromAccount> removed as <MemberRole></MemberRole> of <Account></Account>',
    id: '0Wi41l',
  },
  // Transactions
  COLLECTIVE_TRANSACTION_CREATED: {
    defaultMessage: 'New transaction from <FromAccount></FromAccount> to <Account></Account>',
    id: 'WHvzwC',
  },
  // Updates
  COLLECTIVE_UPDATE_CREATED: {
    defaultMessage: 'New update drafted on <Account></Account>',
    id: 'z1f/0u',
  },
  COLLECTIVE_UPDATE_PUBLISHED: {
    defaultMessage: 'Update published on <Account></Account>: {updateTitle}',
    id: 'ejoArz',
  },
  // Contact
  COLLECTIVE_CONTACT: {
    defaultMessage: '<FromAccount></FromAccount> contacted <Account></Account>',
    id: 'PjKtqv',
  },
  // Virtual cards
  // TODO: Link virtual cards and/or admin page
  COLLECTIVE_VIRTUAL_CARD_ADDED: {
    defaultMessage: 'New virtual card added to <Account></Account>',
    id: 'BqfMx5',
  },
  COLLECTIVE_VIRTUAL_CARD_CREATED: {
    defaultMessage: 'New virtual card created on <Account></Account>',
    id: 'WjU8+x',
  },
  COLLECTIVE_VIRTUAL_CARD_MISSING_RECEIPTS: {
    defaultMessage: 'Notified admins about a missing receipt for <Expense>expense</Expense> on <Account></Account>',
    id: '2E8GCk',
  },
  COLLECTIVE_VIRTUAL_CARD_SUSPENDED: {
    defaultMessage: 'Virtual card suspended on <Account></Account>',
    id: 'a1lJXS',
  },
  VIRTUAL_CARD_REQUESTED: {
    defaultMessage: 'Requested a virtual card for <Account></Account>',
    id: 'YscZ4w',
  },
  VIRTUAL_CARD_PURCHASE: {
    defaultMessage: 'New purchase <Expense>{expenseDescription}</Expense> with virtual card',
    id: 'qJWMMZ',
  },
  VIRTUAL_CARD_CHARGE_DECLINED: {
    defaultMessage: 'Virtual card charge declined on <Account></Account>',
    id: 'yKslCj',
  },
  // Connected accounts
  CONNECTED_ACCOUNT_CREATED: {
    id: 'WebhookEvents.CONNECTED_ACCOUNT_CREATED',
    defaultMessage: 'Connected account added',
  },
  // Contributions
  SUBSCRIPTION_CANCELED: {
    defaultMessage: "<FromAccount></FromAccount>'s <Order>recurring contribution</Order> cancelled",
    id: 'gXMGr2',
  },
  SUBSCRIPTION_PAUSED: {
    defaultMessage: "<FromAccount></FromAccount>'s <Order>recurring contribution</Order> paused",
    id: 'XEZlSZ',
  },
  TICKET_CONFIRMED: {
    id: 'WebhookEvents.TICKET_CONFIRMED',
    defaultMessage: 'Ticket confirmed',
  },
  CONTRIBUTION_REJECTED: {
    defaultMessage: 'Contribution from <FromAccount></FromAccount> rejected by <Account></Account>',
    id: 'nxBQAa',
  },
  ORDER_CANCELED_ARCHIVED_COLLECTIVE: {
    defaultMessage: '<Order>Recurring contribution</Order> cancelled on <Account></Account> (archived)',
    id: 'wHUZBr',
  },
  ORDER_PROCESSING: {
    defaultMessage:
      '<Order>Contribution</Order> from <FromAccount></FromAccount> to <Account></Account> set as processing',
    id: 'LZTaeF',
  },
  ORDER_PROCESSING_CRYPTO: {
    defaultMessage:
      'Crypto <Order>contribution</Order> from <FromAccount></FromAccount> to <Account></Account> set as processing',
    id: '6QW6MJ',
  },
  ORDER_PENDING_CONTRIBUTION_NEW: {
    defaultMessage: 'New pending <Order>contribution</Order> from <FromAccount></FromAccount> to <Account></Account>',
    id: 'xrcsxW',
  },
  ORDER_PENDING_CONTRIBUTION_REMINDER: {
    defaultMessage:
      'Sent reminder to <FromAccount></FromAccount> about pending <Order>contribution</Order> to <Account></Account>',
    id: 'PPUTPf',
  },
  BACKYOURSTACK_DISPATCH_CONFIRMED: {
    defaultMessage: 'BackYourStack dispatch confirmed for <Account></Account>',
    id: 'T0S/DK',
  },
  ORDER_PAYMENT_FAILED: {
    defaultMessage:
      'Payment from <FromAccount></FromAccount> to <Account></Account> for <Order>contribution</Order> failed',
    id: 'w/DRNl',
  },
  PAYMENT_FAILED: {
    defaultMessage:
      'Payment from <FromAccount></FromAccount> to <Account></Account> for <Order>contribution</Order> failed',
    id: 'w/DRNl',
  },
  PAYMENT_CREDITCARD_CONFIRMATION: {
    defaultMessage: 'Asked for credit card confirmation for <Order>contribution</Order> on <Account></Account>',
    id: 'nGXhAY',
  },
  PAYMENT_CREDITCARD_EXPIRING: {
    defaultMessage: 'Sent a reminder about expiring credit card to <Account></Account>',
    id: '++1FQ+',
  },
  USER_PAYMENT_METHOD_CREATED: {
    defaultMessage: 'Created a new payment method for <Account></Account>',
    id: 'afrSHa',
  },
  // Sign in
  USER_NEW_TOKEN: {
    defaultMessage: 'Requested a new sign in token',
    id: 'd//GCi', // Deprecated and replaced by USER_SIGNIN
  },
  USER_SIGNIN: {
    defaultMessage: 'Signed In',
    id: '9JgEIv',
  },
  OAUTH_APPLICATION_AUTHORIZED: {
    defaultMessage: 'Authorized a new OAuth application',
    id: 'X0h+Qz',
  },
  USER_CHANGE_EMAIL: {
    defaultMessage: 'Changed email address',
    id: 'w4ydKA',
  },
  USER_PASSWORD_SET: {
    defaultMessage: 'Changed password',
    id: '+H9kRE',
  },
  TWO_FACTOR_METHOD_ADDED: {
    defaultMessage: 'Two factor authentication added',
    id: 'vEQcqS',
  },
  TWO_FACTOR_METHOD_DELETED: {
    defaultMessage: 'Two factor authentication removed',
    id: 'qAF9zY',
  },
  TWO_FACTOR_CODE_REQUESTED: {
    defaultMessage: 'Two factor authentication code requested',
    id: 'CkcTj3',
  },
  // Gift cards
  USER_CARD_CLAIMED: {
    defaultMessage: 'Claimed a gift card from <FromAccount></FromAccount>',
    id: 'jHHcR5',
  },
  USER_CARD_INVITED: {
    defaultMessage: 'Generated a new gift card for <Account></Account>',
    id: 'CSCASZ',
  },
  // Host
  ACTIVATED_COLLECTIVE_AS_HOST: {
    defaultMessage: 'Activated <Account></Account> as a host',
    id: '/rbxQW',
  },
  ACTIVATED_COLLECTIVE_AS_INDEPENDENT: {
    defaultMessage: 'Activated <Account></Account> as an independent collective',
    id: 'okucEz',
  },
  DEACTIVATED_COLLECTIVE_AS_HOST: {
    defaultMessage: 'Deactivated <Account></Account> as a host',
    id: 'aaWtVL',
  },
  VENDOR_EDITED: {
    defaultMessage: 'Vendor <Vendor></Vendor> edited',
    id: 'q1szYC',
  },
  VENDOR_CREATED: {
    defaultMessage: 'Vendor <Vendor></Vendor> created',
    id: 'IUlgDG',
  },
});

type ActivityTranslations = Partial<Record<keyof typeof ActivityTypes, MessageDescriptor>>;

export const ActivityTypeI18n: ActivityTranslations = defineMessages({
  ACTIVITY_ALL: {
    id: 'WebhookEvents.All',
    defaultMessage: 'All',
  },
  CONNECTED_ACCOUNT_CREATED: {
    id: 'WebhookEvents.CONNECTED_ACCOUNT_CREATED',
    defaultMessage: 'Connected account added',
  },
  COLLECTIVE_APPLY: {
    id: 'WebhookEvents.COLLECTIVE_APPLY',
    defaultMessage: 'New collective application',
  },
  COLLECTIVE_APPROVED: {
    id: 'WebhookEvents.COLLECTIVE_APPROVED',
    defaultMessage: 'Collective application approved',
  },
  COLLECTIVE_REJECTED: {
    id: 'WebhookEvents.COLLECTIVE_REJECTED',
    defaultMessage: 'Collective application rejected',
  },
  COLLECTIVE_CREATED: {
    id: 'WebhookEvents.COLLECTIVE_CREATED',
    defaultMessage: 'Collective created',
  },
  COLLECTIVE_UNHOSTED: {
    defaultMessage: 'Collective unhosted',
    id: 'iA/2nx',
  },
  ORGANIZATION_COLLECTIVE_CREATED: {
    defaultMessage: 'Organization created',
    id: 'lehIHr',
  },
  USER_CREATED: {
    defaultMessage: 'User profile created',
    id: 'RUJAuW',
  },
  USER_NEW_TOKEN: {
    defaultMessage: 'Signed in',
    id: '77MbQy',
  },
  USER_CHANGE_EMAIL: {
    defaultMessage: 'Changed email address',
    id: 'w4ydKA',
  },
  USER_CARD_CLAIMED: {
    defaultMessage: 'Gift card claimed',
    id: 'tAVMip',
  },
  USER_CARD_INVITED: {
    defaultMessage: 'Gift card invited',
    id: 'l9N8X3',
  },
  USER_PAYMENT_METHOD_CREATED: {
    defaultMessage: 'New payment method',
    id: 'L3WVIm',
  },
  COLLECTIVE_CREATED_GITHUB: {
    defaultMessage: 'Collective created via GitHub',
    id: 'luw/5Y',
  },
  COLLECTIVE_EDITED: {
    defaultMessage: 'Account edited',
    id: 'wzG+16',
  },
  COLLECTIVE_CONVERSATION_CREATED: {
    id: 'Conversation.created',
    defaultMessage: 'Conversation created',
  },
  COLLECTIVE_EXPENSE_CREATED: {
    id: 'WebhookEvents.COLLECTIVE_EXPENSE_CREATED',
    defaultMessage: 'New expenses',
  },
  COLLECTIVE_EXPENSE_UNAPPROVED: {
    id: 'Expense.Activity.Unapproved',
    defaultMessage: 'Expense unapproved',
  },
  COLLECTIVE_EXPENSE_DELETED: {
    defaultMessage: 'Expense deleted',
    id: 'KYXMJ6',
  },
  COLLECTIVE_EXPENSE_UPDATED: {
    id: 'Expense.Activity.Updated',
    defaultMessage: 'Expense updated',
  },
  COLLECTIVE_EXPENSE_REJECTED: {
    id: 'Expense.Activity.Rejected',
    defaultMessage: 'Expense rejected',
  },
  COLLECTIVE_EXPENSE_RE_APPROVAL_REQUESTED: {
    id: 'Expense.Activity.ReApprovalRequested',
    defaultMessage: 'Re-approval requested',
  },
  COLLECTIVE_EXPENSE_APPROVED: {
    id: 'Expense.Activity.Approved',
    defaultMessage: 'Expense approved',
  },
  COLLECTIVE_EXPENSE_PAID: {
    id: 'Expense.Activity.Paid',
    defaultMessage: 'Expense paid',
  },
  COLLECTIVE_EXPENSE_MOVED: {
    defaultMessage: 'Expense moved',
    id: 'rj9VjD',
  },
  COLLECTIVE_EXPENSE_MARKED_AS_UNPAID: {
    id: 'Expense.Activity.MarkedAsUnpaid',
    defaultMessage: 'Expense marked as unpaid',
  },
  COLLECTIVE_EXPENSE_INVITE_DRAFTED: {
    id: 'Expense.Activity.Invite.Drafted',
    defaultMessage: 'Expense invited',
  },
  COLLECTIVE_EXPENSE_PROCESSING: {
    id: 'Expense.Activity.Processing',
    defaultMessage: 'Expense processing',
  },
  COLLECTIVE_EXPENSE_SCHEDULED_FOR_PAYMENT: {
    id: 'Expense.Activity.ScheduledForPayment',
    defaultMessage: 'Expense scheduled for payment',
  },
  COLLECTIVE_EXPENSE_ERROR: {
    id: 'Expense.Activity.Error',
    defaultMessage: 'Expense error',
  },
  COLLECTIVE_EXPENSE_MARKED_AS_SPAM: {
    id: 'Expense.Activity.MarkedAsSpam',
    defaultMessage: 'Expense marked as spam',
  },
  COLLECTIVE_EXPENSE_MARKED_AS_INCOMPLETE: {
    id: 'Expense.Activity.MarkedAsIncomplete',
    defaultMessage: 'Expense marked as incomplete',
  },
  COLLECTIVE_EXPENSE_RECURRING_DRAFTED: {
    defaultMessage: 'Recurring expense drafted',
    id: '+yHjyj',
  },
  COLLECTIVE_MEMBER_CREATED: {
    id: 'WebhookEvents.COLLECTIVE_MEMBER_CREATED',
    defaultMessage: 'New member',
  },
  COLLECTIVE_FROZEN: {
    defaultMessage: 'Frozen account',
    id: 'JlQbWz',
  },
  COLLECTIVE_UNFROZEN: {
    defaultMessage: 'Unfrozen account',
    id: 'l7vp2G',
  },
  COLLECTIVE_MEMBER_INVITED: {
    defaultMessage: 'Invited members',
    id: 'hP+c6G',
  },
  COLLECTIVE_CORE_MEMBER_ADDED: {
    defaultMessage: 'Core member added',
    id: 'W533GZ',
  },
  COLLECTIVE_CORE_MEMBER_INVITED: {
    defaultMessage: 'Core member invited',
    id: 'RaVvOv',
  },
  COLLECTIVE_CORE_MEMBER_INVITATION_DECLINED: {
    defaultMessage: 'Core member invitation declined',
    id: 'lc+Sfp',
  },
  COLLECTIVE_CORE_MEMBER_REMOVED: {
    defaultMessage: 'Core member removed',
    id: 'Vp7WY+',
  },
  COLLECTIVE_CORE_MEMBER_EDITED: {
    defaultMessage: 'Core member edited',
    id: '4uNER1',
  },
  COLLECTIVE_CONTACT: {
    id: 'Contact',
    defaultMessage: 'Contact',
  },
  COLLECTIVE_VIRTUAL_CARD_SUSPENDED: {
    defaultMessage: 'Virtual card suspended',
    id: 'It1slB',
  },
  COLLECTIVE_VIRTUAL_CARD_ADDED: {
    defaultMessage: 'Virtual card added',
    id: 'FLqc8O',
  },
  VIRTUAL_CARD_REQUESTED: {
    defaultMessage: 'Virtual card requested',
    id: 'p57bhB',
  },
  VIRTUAL_CARD_CHARGE_DECLINED: {
    defaultMessage: 'Virtual card charge declined',
    id: 'qpg0Od',
  },
  CONTRIBUTION_REJECTED: {
    defaultMessage: 'Contribution rejected',
    id: 'lhiC+5',
  },
  COLLECTIVE_TRANSACTION_CREATED: {
    id: 'WebhookEvents.COLLECTIVE_TRANSACTION_CREATED',
    defaultMessage: 'New transaction',
  },
  COLLECTIVE_UPDATE_CREATED: {
    id: 'WebhookEvents.COLLECTIVE_UPDATE_CREATED',
    defaultMessage: 'New update drafted',
  },
  COLLECTIVE_UPDATE_PUBLISHED: {
    id: 'connectedAccounts.twitter.updatePublished.toggle.label',
    defaultMessage: 'Update published',
  },
  SUBSCRIPTION_CANCELED: {
    defaultMessage: 'Recurring contribution cancelled',
    id: 'p9V1Z4',
  },
  SUBSCRIPTION_ACTIVATED: {
    defaultMessage: 'Recurring contribution activated',
    id: 'sRTg0N',
  },
  SUBSCRIPTION_CONFIRMED: {
    defaultMessage: 'Recurring contribution confirmed',
    id: 'e2zrxE',
  },
  TICKET_CONFIRMED: {
    id: 'WebhookEvents.TICKET_CONFIRMED',
    defaultMessage: 'Ticket confirmed',
  },
  ORDER_CANCELED_ARCHIVED_COLLECTIVE: {
    defaultMessage: 'Contribution canceled (archived collective)',
    id: 'bD8eWy',
  },
  ORDER_PROCESSING: {
    defaultMessage: 'Contribution processing',
    id: 'EEO+n7',
  },
  ORDER_PROCESSING_CRYPTO: {
    defaultMessage: 'Contribution processing (crypto)',
    id: 'oisSUu',
  },
  ORDER_PENDING_CONTRIBUTION_NEW: {
    defaultMessage: 'New pending contribution',
    id: 'PRfgGt',
  },
  ORDER_THANKYOU: {
    defaultMessage: 'New contribution',
    id: 'raUlsb',
  },
  ORDERS_SUSPICIOUS: {
    defaultMessage: 'Suspicious contribution',
    id: 'oocfGT',
  },
  ACTIVATED_COLLECTIVE_AS_HOST: {
    defaultMessage: 'Activated as host',
    id: 'bOSDd3',
  },
  ACTIVATED_COLLECTIVE_AS_INDEPENDENT: {
    defaultMessage: 'Activated as independent',
    id: 'sPXJ/7',
  },
  DEACTIVATED_COLLECTIVE_AS_HOST: {
    defaultMessage: 'Deactivated as host',
    id: '8Np7Fc',
  },
  PAYMENT_FAILED: {
    defaultMessage: 'Payment failed',
    id: 'qV+TFm',
  },
  TAXFORM_REQUEST: {
    defaultMessage: 'Tax form request',
    id: 'w/zcEG',
  },
  TAXFORM_RECEIVED: {
    defaultMessage: 'Tax form received',
  },
  COLLECTIVE_COMMENT_CREATED: {
    defaultMessage: 'Comment posted',
    id: 'VTN7xO',
  },
  CONVERSATION_COMMENT_CREATED: {
    defaultMessage: 'New comment on conversation',
    id: '6mlPiP',
  },
  UPDATE_COMMENT_CREATED: {
    defaultMessage: 'New comment on update',
    id: 'fqHI7A',
  },
  EXPENSE_COMMENT_CREATED: {
    defaultMessage: 'New comment on expense',
    id: 'dHCod9',
  },
});
