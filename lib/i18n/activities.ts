import type { MessageDescriptor } from 'react-intl';
import { defineMessages } from 'react-intl';

import type { ActivityTypes } from '../constants/activities';
import type { ActivityType } from '../graphql/types/v2/schema';

interface TimelineMessageDescriptor extends MessageDescriptor {
  avatar?: 'fromAccount' | 'account' | 'individual'; // Used to determine which avatar to display (default is Individual)
  content?: 'update' | 'conversation'; // Used to determine which content card to display
}

type ActivityWithMandatoryMessageDescriptor = Exclude<
  ActivityType,
  | ActivityType.ACTIVITY_ALL
  | ActivityType.BACKYOURSTACK_DISPATCH_CONFIRMED
  | ActivityType.ORDER_PENDING_CRYPTO
  | ActivityType.PAYMENT_CREDITCARD_CONFIRMATION
  | ActivityType.PAYMENT_CREDITCARD_EXPIRING
  | ActivityType.PLATFORM_BILLING_ADDITIONAL_CHARGES_NOTIFICATION
  | ActivityType.PLATFORM_BILLING_OVERDUE_REMINDER
  | ActivityType.TWO_FACTOR_CODE_REQUESTED
  | ActivityType.SUBSCRIPTION_READY_TO_BE_RESUMED
  | ActivityType.ORDER_CANCELED_ARCHIVED_COLLECTIVE
  | ActivityType.VIRTUAL_CARD_CHARGE_DECLINED
  | ActivityType.WEBHOOK_PAYPAL_RECEIVED
  | ActivityType.WEBHOOK_STRIPE_RECEIVED
  | ActivityType.USER_RESET_PASSWORD
  | ActivityType.USER_OTP_REQUESTED
  | ActivityType.USER_NEW_TOKEN
>;

export const ActivityTimelineMessageI18n = defineMessages<
  ActivityWithMandatoryMessageDescriptor,
  TimelineMessageDescriptor
>({
  ACCOUNTING_CATEGORIES_EDITED: {
    defaultMessage: '<Individual></Individual> edited chart of accounts for <Account></Account>',
    id: 'vXqXJu',
  },
  ACTIVATED_COLLECTIVE_AS_HOST: {
    defaultMessage: '<Individual></Individual> activated <Account></Account> as a host',
    id: 'ZAcGq3',
  },
  ACTIVATED_COLLECTIVE_AS_INDEPENDENT: {
    defaultMessage: '<Individual></Individual> activated <Account></Account> as an independent collective',
    id: '8qE+vL',
  },
  ADDED_FUNDS_EDITED: {
    defaultMessage: '<Individual></Individual> edited added funds for <Account></Account>',
    id: 'UFBGcv',
  },
  ADDED_FUND_TO_ORG: {
    defaultMessage: '<Individual></Individual> added fund to <Account></Account>',
    id: 'NCvxh0',
  },
  AGREEMENT_CREATED: {
    defaultMessage: '<Individual></Individual> created agreement for <Account></Account>',
    id: '0AVbic',
  },
  AGREEMENT_DELETED: {
    defaultMessage: '<Individual></Individual> deleted agreement for <Account></Account>',
    id: 'lpd5ac',
  },
  AGREEMENT_EDITED: {
    defaultMessage: '<Individual></Individual> edited agreement for <Account></Account>',
    id: '8gvcEv',
  },
  COLLECTIVE_APPROVED: {
    defaultMessage: "<Individual></Individual> approved <Account></Account>'s application to be hosted",
    id: 'tMbYww',
  },
  COLLECTIVE_CORE_MEMBER_ADDED: {
    defaultMessage:
      '<Individual></Individual> added <FromAccount></FromAccount> as an <MemberRole></MemberRole> for <Account></Account>',
    id: '2FxRMv',
  },
  COLLECTIVE_CORE_MEMBER_REMOVED: {
    defaultMessage:
      '<Individual></Individual> removed <FromAccount></FromAccount> as an <MemberRole></MemberRole> for <Account></Account>',
    id: '6J42kW',
  },
  COLLECTIVE_CORE_MEMBER_EDITED: {
    defaultMessage: '<Individual></Individual> edited <FromAccount></FromAccount> membership to <Account></Account>',
    id: 'VVHub9',
  },
  COLLECTIVE_CORE_MEMBER_INVITATION_DECLINED: {
    defaultMessage: '<FromAccount></FromAccount> declined invitation to join <Account></Account>',
    id: 'VIpCLM',
    avatar: 'fromAccount',
  },
  COLLECTIVE_CORE_MEMBER_INVITED: {
    defaultMessage:
      '<Individual></Individual> invited <FromAccount></FromAccount> to join <Account></Account> as <MemberRole></MemberRole>',
    id: 'CAcrDA',
  },
  COLLECTIVE_COMMENT_CREATED: {
    defaultMessage: '<Individual></Individual> commented on <CommentEntity></CommentEntity>',
    id: '/KsYzO',
  },
  COLLECTIVE_CONTACT: {
    defaultMessage: '<FromAccount></FromAccount> contacted <Account></Account>',
    id: 'PjKtqv',
    avatar: 'fromAccount',
  },
  COLLECTIVE_CREATED: {
    defaultMessage: '<Individual></Individual> created <Account></Account>',
    id: 'DOhe/o',
  },
  COLLECTIVE_CREATED_GITHUB: {
    defaultMessage: '<Individual></Individual> created <Account></Account> through GitHub',
    id: '7Baxl1',
  },
  COLLECTIVE_DELETED: {
    defaultMessage: '<Individual></Individual> deleted <Account></Account>',
    id: 'QJQk3+',
  },
  COLLECTIVE_EDITED: {
    defaultMessage: '<Individual></Individual> edited <Account></Account>',
    id: 'Ib5AtK',
  },
  COLLECTIVE_EXPENSE_DELETED: {
    defaultMessage: '<Individual></Individual> deleted expense',
    id: 'tET5c6',
  },
  COLLECTIVE_EXPENSE_INVITE_DECLINED: {
    defaultMessage: '<FromAccount></FromAccount> declined expense invite',
    id: 'vOMwSM',
    avatar: 'fromAccount',
  },
  COLLECTIVE_EXPENSE_MISSING_RECEIPT: {
    defaultMessage:
      '<Individual></Individual> notified admins about missing receipt for expense <Expense>{expenseDescription}</Expense>',
    id: 'ZqUuF1',
  },
  COLLECTIVE_EXPENSE_MOVED: {
    defaultMessage: '<Individual></Individual> moved expense <Expense>{expenseDescription}</Expense>',
    id: '2kd9Bh',
  },
  COLLECTIVE_EXPENSE_PROCESSING: {
    defaultMessage: '<Individual></Individual> is processing expense <Expense>{expenseDescription}</Expense>',
    id: '/lEDfS',
  },
  COLLECTIVE_EXPENSE_PUT_ON_HOLD: {
    defaultMessage: '<Individual></Individual> put expense <Expense>{expenseDescription}</Expense> on hold',
    id: 'jHZV57',
  },
  COLLECTIVE_EXPENSE_RELEASED_FROM_HOLD: {
    defaultMessage: '<Individual></Individual> released hold on expense <Expense>{expenseDescription}</Expense>',
    id: 'viWayq',
  },
  COLLECTIVE_EXPENSE_SCHEDULED_FOR_PAYMENT: {
    defaultMessage: '<Individual></Individual> scheduled expense <Expense>{expenseDescription}</Expense> for payment',
    id: 'ZWB99K',
  },
  COLLECTIVE_EXPENSE_UNSCHEDULED_FOR_PAYMENT: {
    defaultMessage:
      '<Individual></Individual> unscheduled expense <Expense>{expenseDescription}</Expense> from payment',
    id: 'xq619k',
  },
  COLLECTIVE_FROZEN: { defaultMessage: '<Individual></Individual> froze <Account></Account>', id: 'CU72pt' },
  COLLECTIVE_UNFROZEN: { defaultMessage: '<Individual></Individual> unfreezed <Account></Account>', id: '468Qmg' },
  COLLECTIVE_UNHOSTED: {
    defaultMessage: '<Individual></Individual> unhosted <Account></Account>',
    id: 'F1HIGZ',
  },
  COLLECTIVE_APPLY: {
    defaultMessage: '<Individual></Individual> submitted an application for <Account></Account> to be hosted',
    id: 'D/dskn',
  },
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
    defaultMessage: `<FromAccount></FromAccount>'s contribution to <Account></Account> failed`,
    id: 'YKqXR6',
    avatar: 'fromAccount',
  },
  PAYMENT_FAILED: {
    defaultMessage: `<FromAccount></FromAccount>'s payment for <Order>contribution</Order> to <Account></Account> failed`,
    id: 'zw0B0K',
    avatar: 'fromAccount',
  },
  COLLECTIVE_MEMBER_CREATED: {
    defaultMessage: '<FromAccount></FromAccount> joined <Account></Account> as <MemberRole></MemberRole>',
    id: 'blBwBm',
    avatar: 'fromAccount',
  },
  COLLECTIVE_MEMBER_INVITED: {
    defaultMessage:
      '<Individual></Individual> invited <FromAccount></FromAccount> to join <Account></Account> as <MemberRole></MemberRole>',
    id: 'CAcrDA',
  },
  COLLECTIVE_MONTHLY_REPORT: {
    defaultMessage: '<Individual></Individual> generated monthly report for <Account></Account>',
    id: 'Ite1ta',
  },
  COLLECTIVE_REJECTED: {
    defaultMessage: '<Individual></Individual> rejected <Account></Account> application',
    id: '46Ln84',
  },
  COLLECTIVE_TRANSACTION_CREATED: {
    defaultMessage:
      '<Individual></Individual> created transaction from <FromAccount></FromAccount> to <Account></Account>',
    id: 'Fif2Ft',
  },
  COLLECTIVE_TRANSACTION_PAID: {
    defaultMessage:
      '<Individual></Individual> paid transaction from <FromAccount></FromAccount> to <Account></Account>',
    id: '3sRNXH',
  },
  COLLECTIVE_UPDATE_CREATED: {
    defaultMessage: '<Individual></Individual> drafted update on <Account></Account>',
    id: 'BHspz7',
  },
  COLLECTIVE_USER_ADDED: {
    defaultMessage: '<Individual></Individual> added user to <Account></Account>',
    id: 'i4XG7q',
  },
  COLLECTIVE_VIRTUAL_CARD_ASSIGNED: {
    defaultMessage: '<Individual></Individual> assigned virtual card to <Account></Account>',
    id: '8jdI/Z',
  },
  COLLECTIVE_VIRTUAL_CARD_CREATED: {
    defaultMessage: '<Individual></Individual> created virtual card on <Account></Account>',
    id: 't6H0HI',
  },
  COLLECTIVE_VIRTUAL_CARD_DELETED: {
    defaultMessage: '<Individual></Individual> deleted virtual card on <Account></Account>',
    id: 'RFY8Jn',
  },
  COLLECTIVE_VIRTUAL_CARD_MISSING_RECEIPTS: {
    defaultMessage:
      '<Individual></Individual> notified admins about missing receipts for virtual card on <Account></Account>',
    id: '7MKNQH',
  },
  COLLECTIVE_VIRTUAL_CARD_RESUMED: {
    defaultMessage: '<Individual></Individual> resumed virtual card on <Account></Account>',
    id: 'RZVniG',
  },
  COLLECTIVE_VIRTUAL_CARD_SUSPENDED_DUE_TO_INACTIVITY: {
    defaultMessage: '<Individual></Individual> suspended virtual card on <Account></Account> due to inactivity',
    id: 'ulMcxk',
  },
  CONNECTED_ACCOUNT_CREATED: {
    defaultMessage: '<Individual></Individual> added connected account',
    id: 'L5rs8v',
  },
  CONNECTED_ACCOUNT_ERROR: {
    defaultMessage: '<Individual></Individual> encountered error with connected account',
    id: 'RgD20A',
  },
  CONNECTED_ACCOUNT_REMOVED: {
    defaultMessage: '<Individual></Individual> removed connected account',
    id: 'lbJ/Vn',
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
    defaultMessage: '<FromAccount></FromAccount> created new <Order>expected funds</Order> to <Account></Account>',
    id: 'NvYiK0',
    avatar: 'fromAccount',
  },
  ORDER_PROCESSED: {
    defaultMessage:
      "<FromAccount></FromAccount>'s <Order>contribution</Order> to <Account></Account> successfully processed",
    id: 'HTHBXN',
    avatar: 'fromAccount',
  },
  ACTIVATED_HOSTING: {
    defaultMessage: '<Individual></Individual> activated "Fiscal Hosting"',
    id: '10zzEB',
  },
  ACTIVATED_MONEY_MANAGEMENT: {
    defaultMessage: '<Individual></Individual> activated "Money Management"',
    id: 'H7Z/m9',
  },
  DEACTIVATED_HOSTING: {
    defaultMessage: '<Individual></Individual> deactivated "Fiscal Hosting"',
    id: '0meZND',
  },
  DEACTIVATED_MONEY_MANAGEMENT: {
    defaultMessage: '<Individual></Individual> deactivated "Money Management"',
    id: '3uQNWr',
  },
  DEACTIVATED_COLLECTIVE_AS_HOST: {
    defaultMessage: '<Individual></Individual> deactivated <Account></Account> as a host',
    id: '51tM0i',
  },
  HOST_APPLICATION_COMMENT_CREATED: {
    defaultMessage: '<Individual></Individual> commented on host application',
    id: 'MOP2FK',
  },
  HOST_APPLICATION_CONTACT: {
    defaultMessage: '<FromAccount></FromAccount> contacted about host application',
    id: '1Lh2F+',
    avatar: 'fromAccount',
  },
  KYC_REQUESTED: {
    defaultMessage: '<Individual></Individual> requested KYC verification',
    id: '5ZPEgN',
  },
  KYC_REVOKED: {
    defaultMessage: '<Individual></Individual> revoked KYC verification',
    id: '5j9aSe',
  },
  KYC_VERIFIED: {
    defaultMessage: '<Individual></Individual> verified KYC',
    id: '7U+Y6h',
  },
  OAUTH_APPLICATION_AUTHORIZED: {
    defaultMessage: '<Individual></Individual> authorized OAuth application',
    id: 'Z+VOcX',
  },
  ORDER_COMMENT_CREATED: {
    defaultMessage: '<Individual></Individual> commented on <Order>contribution</Order>',
    id: 'XNXJm3',
  },
  ORDER_DISPUTE_CLOSED: {
    defaultMessage: '<Individual></Individual> closed dispute for <Order>contribution</Order>',
    id: 'MXxyX/',
  },
  ORDER_DISPUTE_CREATED: {
    defaultMessage: '<Individual></Individual> created dispute for <Order>contribution</Order>',
    id: 'JHvzBW',
  },
  ORDER_PENDING: {
    defaultMessage: '<FromAccount></FromAccount> has pending <Order>contribution</Order> to <Account></Account>',
    id: 'Ot+fCA',
    avatar: 'fromAccount',
  },
  ORDER_PENDING_CONTRIBUTION_REMINDER: {
    defaultMessage:
      '<Individual></Individual> sent reminder about pending contribution from <FromAccount></FromAccount>',
    id: 't3WOba',
  },
  ORDER_PENDING_CREATED: {
    defaultMessage: '<FromAccount></FromAccount> created pending order to <Account></Account>',
    id: 'gjF3aT',
    avatar: 'fromAccount',
  },
  ORDER_PENDING_EXPIRED: {
    defaultMessage: '<FromAccount></FromAccount> pending order expired to <Account></Account>',
    id: 'atbi3J',
    avatar: 'fromAccount',
  },
  ORDER_PENDING_FOLLOWUP: {
    defaultMessage: '<Individual></Individual> followed up on pending order',
    id: '2VeZJd',
  },
  ORDER_PENDING_RECEIVED: {
    defaultMessage: '<FromAccount></FromAccount> received pending order to <Account></Account>',
    id: 'LqFESe',
    avatar: 'fromAccount',
  },
  ORDER_REVIEW_CLOSED: {
    defaultMessage: '<Individual></Individual> closed order review',
    id: 'x3q3HE',
  },
  ORDER_REVIEW_OPENED: {
    defaultMessage: '<Individual></Individual> opened order review',
    id: 'QkCC/V',
  },
  ORDER_UPDATED: {
    defaultMessage: '<Individual></Individual> updated <Order>contribution</Order>',
    id: '6X1Kk9',
  },
  ORGANIZATION_CONVERTED_TO_COLLECTIVE: {
    defaultMessage: '<Individual></Individual> converted to Collective',
    id: 'KrCkBc',
  },
  COLLECTIVE_CONVERTED_TO_ORGANIZATION: {
    defaultMessage: '<Individual></Individual> converted to Organization',
    id: 'St4vQ3',
  },
  PLATFORM_SUBSCRIPTION_UPDATED: {
    defaultMessage: '<Individual></Individual> updated platform subscription',
    id: 'oDeSxJ',
  },
  SUBSCRIPTION_ACTIVATED: {
    defaultMessage: "<FromAccount></FromAccount>'s recurring contribution activated",
    id: '0auWgg',
    avatar: 'fromAccount',
  },
  SUBSCRIPTION_CONFIRMED: {
    defaultMessage: "<FromAccount></FromAccount>'s recurring contribution confirmed",
    id: 'p2d9Zt',
    avatar: 'fromAccount',
  },
  SUBSCRIPTION_RESUMED: {
    defaultMessage: "<FromAccount></FromAccount>'s recurring contribution resumed",
    id: '5EscZU',
    avatar: 'fromAccount',
  },
  TAXFORM_INVALIDATED: {
    defaultMessage: '<Individual></Individual> invalidated tax form for <Account></Account>',
    id: '0qAPqd',
  },
  TAXFORM_RECEIVED: {
    defaultMessage: '<Individual></Individual> received tax form for <Account></Account>',
    id: 'xpucu/',
  },
  TAXFORM_REQUEST: {
    defaultMessage: '<Individual></Individual> requested tax form for <Account></Account>',
    id: '8Vld2o',
  },
  TRANSACTIONS_IMPORT_CREATED: {
    defaultMessage: '<Individual></Individual> added a new transactions import',
    id: 'PevwYy',
  },
  TRANSACTIONS_IMPORT_ROW_UPDATED: {
    defaultMessage: '<Individual></Individual> updated transactions import row',
    id: 'FFTher',
  },
  TWO_FACTOR_METHOD_ADDED: {
    defaultMessage: '<Individual></Individual> added two factor method',
    id: '0ctC5l',
  },
  TWO_FACTOR_METHOD_DELETED: {
    defaultMessage: '<Individual></Individual> deleted two factor method',
    id: 'muBlOw',
  },
  USER_CARD_CLAIMED: {
    defaultMessage: '<FromAccount></FromAccount> claimed gift card',
    id: 't3lE6O',
    avatar: 'fromAccount',
  },
  USER_CARD_INVITED: {
    defaultMessage: '<Individual></Individual> generated gift card for <Account></Account>',
    id: 'sdFiPq',
  },
  USER_CHANGE_EMAIL: {
    defaultMessage: '<Individual></Individual> changed email address',
    id: 'JDrWzR',
  },
  USER_CREATED: {
    defaultMessage: '<Individual></Individual> created user profile',
    id: 'ZU7BO8',
  },
  USER_PASSWORD_SET: {
    defaultMessage: '<Individual></Individual> changed password',
    id: 'zDTt4/',
  },
  USER_PAYMENT_METHOD_CREATED: {
    defaultMessage: '<Individual></Individual> created payment method for <Account></Account>',
    id: '+232S9',
  },
  USER_SIGNIN: {
    defaultMessage: '<Individual></Individual> signed in',
    id: '3kzK7/',
  },
  VENDOR_CREATED: {
    defaultMessage: '<Individual></Individual> created vendor <Vendor></Vendor>',
    id: 'oNyYv0',
  },
  VENDOR_DELETED: {
    defaultMessage: '<Individual></Individual> deleted vendor <Vendor></Vendor>',
    id: 'EDz+8Q',
  },
  VENDOR_EDITED: {
    defaultMessage: '<Individual></Individual> edited vendor <Vendor></Vendor>',
    id: 'raGFNM',
  },
  ORDERS_SUSPICIOUS: {
    defaultMessage: '<Individual></Individual> flagged suspicious orders',
    id: 'H7mpEM',
  },
  ORDER_PROCESSING: {
    defaultMessage:
      '<Individual></Individual> set contribution from <FromAccount></FromAccount> to <Account></Account> as processing',
    id: '3ts87+',
  },
  ORGANIZATION_COLLECTIVE_CREATED: {
    defaultMessage: '<Individual></Individual> created organization <Account></Account>',
    id: '7RCVgj',
  },
  TICKET_CONFIRMED: {
    defaultMessage: '<Individual></Individual> confirmed ticket',
    id: 'lcMp08',
  },
});

export const ActivityDescriptionI18n = defineMessages<
  ActivityWithMandatoryMessageDescriptor & Extract<ActivityType, ActivityType.ACTIVITY_ALL>,
  MessageDescriptor
>({
  ACTIVITY_ALL: {
    defaultMessage: 'All activities',
    id: '1KfRoB',
  },
  ACCOUNTING_CATEGORIES_EDITED: {
    defaultMessage: 'Chart of account edited',
    id: 'F3FkEv',
  },
  ADDED_FUND_TO_ORG: {
    defaultMessage: 'Added fund to organization',
    id: 'wS5KDg',
  },
  AGREEMENT_CREATED: {
    defaultMessage: 'Agreement created',
    id: 'Q/kLys',
  },
  AGREEMENT_DELETED: {
    defaultMessage: 'Agreement deleted',
    id: 'Nx1bbk',
  },
  AGREEMENT_EDITED: {
    defaultMessage: 'Agreement edited',
    id: 'c9Ziym',
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
  COLLECTIVE_CONVERTED_TO_ORGANIZATION: {
    defaultMessage: '<Account></Account> converted to Organization',
    id: 'Gj4ZS9',
  },
  ORGANIZATION_CONVERTED_TO_COLLECTIVE: {
    defaultMessage: '<Account></Account> converted to Collective',
    id: 'fwgTtu',
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
  COLLECTIVE_DELETED: {
    defaultMessage: '<Account></Account> deleted',
    id: 'Zq6/5U',
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
  COLLECTIVE_EXPENSE_INVITE_DECLINED: {
    defaultMessage: 'Expense invite declined',
    id: 'FhNjpq',
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
  COLLECTIVE_EXPENSE_UNSCHEDULED_FOR_PAYMENT: {
    defaultMessage: 'Expense <Expense>{expenseDescription}</Expense> unscheduled from payment',
    id: 'T/r4vq',
  },
  TAXFORM_REQUEST: {
    defaultMessage: 'Tax form request sent to <Account></Account>',
    id: 'p8x23o',
  },
  TAXFORM_RECEIVED: {
    defaultMessage: 'Tax form received for <Account></Account>',
    id: 'DUPkdl',
  },
  TAXFORM_INVALIDATED: {
    defaultMessage: 'Tax form invalidated for <Account></Account>',
    id: 'ActivityLog.TaxForm.Invalidated',
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
  COLLECTIVE_MONTHLY_REPORT: {
    defaultMessage: 'Monthly report generated for <Account></Account>',
    id: 'FmLmM1',
  },
  COLLECTIVE_TRANSACTION_PAID: {
    defaultMessage: 'Transaction paid from <FromAccount></FromAccount> to <Account></Account>',
    id: 'iC1LaR',
  },
  COLLECTIVE_USER_ADDED: {
    defaultMessage: 'User added to <Account></Account>',
    id: 'eIHBye',
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
  COLLECTIVE_CORE_MEMBER_INVITED: {
    defaultMessage: '<FromAccount></FromAccount> was invited to join <Account></Account> as <MemberRole></MemberRole>',
    id: 'MAL7pS',
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
  COLLECTIVE_VIRTUAL_CARD_ASSIGNED: {
    defaultMessage: 'Virtual card assigned to <Account></Account>',
    id: 'YTBNCK',
  },
  COLLECTIVE_VIRTUAL_CARD_CREATED: {
    defaultMessage: 'New virtual card created on <Account></Account>',
    id: 'WjU8+x',
  },
  COLLECTIVE_VIRTUAL_CARD_DELETED: {
    defaultMessage: 'Virtual card deleted on <Account></Account>',
    id: 'aLLG+G',
  },
  COLLECTIVE_VIRTUAL_CARD_MISSING_RECEIPTS: {
    defaultMessage: 'Notified admins about a missing receipt for <Expense>expense</Expense> on <Account></Account>',
    id: '2E8GCk',
  },
  COLLECTIVE_VIRTUAL_CARD_REQUEST_APPROVED: {
    defaultMessage: 'Virtual card request approved for <Account></Account>',
    id: 'cXXlmA',
  },
  COLLECTIVE_VIRTUAL_CARD_REQUEST_REJECTED: {
    defaultMessage: 'Virtual card request rejected for <Account></Account>',
    id: 'JJWfpF',
  },
  COLLECTIVE_VIRTUAL_CARD_RESUMED: {
    defaultMessage: 'Virtual card resumed on <Account></Account>',
    id: '8SrIqJ',
  },
  COLLECTIVE_VIRTUAL_CARD_SUSPENDED: {
    defaultMessage: 'Virtual card suspended on <Account></Account>',
    id: 'a1lJXS',
  },
  COLLECTIVE_VIRTUAL_CARD_SUSPENDED_DUE_TO_INACTIVITY: {
    defaultMessage: 'Virtual card suspended on <Account></Account> due to inactivity',
    id: 'qR5kZF',
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
  CONNECTED_ACCOUNT_ERROR: {
    defaultMessage: 'Connected account error',
    id: 'wkF2z6',
  },
  CONNECTED_ACCOUNT_REMOVED: {
    defaultMessage: 'Connected account removed',
    id: 'PCbj+q',
  },
  // Contributions
  SUBSCRIPTION_CANCELED: {
    defaultMessage: "<FromAccount></FromAccount>'s <Order>recurring contribution</Order> cancelled",
    id: 'gXMGr2',
  },
  SUBSCRIPTION_ACTIVATED: {
    defaultMessage: "<FromAccount></FromAccount>'s <Order>recurring contribution</Order> activated",
    id: 'o7b+E/',
  },
  SUBSCRIPTION_PAUSED: {
    defaultMessage: "<FromAccount></FromAccount>'s <Order>recurring contribution</Order> paused",
    id: 'XEZlSZ',
  },
  SUBSCRIPTION_CONFIRMED: {
    defaultMessage: "<FromAccount></FromAccount>'s <Order>recurring contribution</Order> confirmed",
    id: 'oN6HNf',
  },
  SUBSCRIPTION_READY_TO_BE_RESUMED: {
    defaultMessage: '<Order>Recurring contribution</Order> ready to be resumed',
    id: 'nUWffQ',
  },
  SUBSCRIPTION_RESUMED: {
    defaultMessage: '<Order>Recurring contribution</Order> resumed',
    id: 'wxbjAz',
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
  ORDER_PROCESSED: {
    defaultMessage:
      '<Order>Contribution</Order> from <FromAccount></FromAccount> to <Account></Account> processed successfully',
    id: 'wWPkPb',
  },
  ORDERS_SUSPICIOUS: {
    defaultMessage: 'Suspicious orders flagged',
    id: '6haK6E',
  },
  ORDER_PENDING_CONTRIBUTION_NEW: {
    defaultMessage: 'New <Order>expected funds</Order> from <FromAccount></FromAccount> to <Account></Account>',
    id: 'kh8yZm',
  },
  ORDER_PENDING_CONTRIBUTION_REMINDER: {
    defaultMessage:
      'Sent reminder to <FromAccount></FromAccount> about <Order>expected funds</Order> to <Account></Account>',
    id: '76qdIc',
  },
  ORDER_PENDING: {
    defaultMessage: 'Pending <Order>contribution</Order> from <FromAccount></FromAccount> to <Account></Account>',
    id: 'XlNLRh',
  },
  ORDER_PENDING_CREATED: {
    defaultMessage:
      'Pending <Order>contribution</Order> created from <FromAccount></FromAccount> to <Account></Account>',
    id: '7I2yPR',
  },
  ORDER_PENDING_EXPIRED: {
    defaultMessage:
      'Pending <Order>contribution</Order> expired from <FromAccount></FromAccount> to <Account></Account>',
    id: 'N1hg0P',
  },
  ORDER_PENDING_RECEIVED: {
    defaultMessage:
      'Pending <Order>contribution</Order> received from <FromAccount></FromAccount> to <Account></Account>',
    id: '7e4Bm7',
  },
  ORDER_COMMENT_CREATED: {
    defaultMessage: 'Comment created on <Order>contribution</Order>',
    id: 'Pae6pC',
  },
  ORDER_DISPUTE_CLOSED: {
    defaultMessage: '<Order>Contribution</Order> dispute closed',
    id: '8mKlkK',
  },
  ORDER_DISPUTE_CREATED: {
    defaultMessage: '<Order>Contribution</Order> dispute created',
    id: '46Kjm7',
  },
  ORDER_REVIEW_CLOSED: {
    defaultMessage: '<Order>Contribution</Order> review closed',
    id: 'oAsx8U',
  },
  ORDER_REVIEW_OPENED: {
    defaultMessage: '<Order>Contribution</Order> review opened',
    id: 'PjDV0k',
  },
  ORDER_UPDATED: {
    defaultMessage: '<Order>Contribution</Order> updated',
    id: 'tDQ8iW',
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
  USER_CREATED: {
    defaultMessage: 'User profile created',
    id: 'RUJAuW',
  },
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
  HOST_APPLICATION_COMMENT_CREATED: {
    defaultMessage: 'Comment created on host application',
    id: '181VV9',
  },
  HOST_APPLICATION_CONTACT: {
    defaultMessage: 'Contact about host application',
    id: '7XUDSX',
  },
  KYC_REQUESTED: {
    defaultMessage: 'KYC verification requested',
    id: 'azK1bU',
  },
  KYC_REVOKED: {
    defaultMessage: 'KYC verification revoked',
    id: 'zH3syr',
  },
  KYC_VERIFIED: {
    defaultMessage: 'KYC verification verified',
    id: '/tQumq',
  },
  PLATFORM_BILLING_ADDITIONAL_CHARGES_NOTIFICATION: {
    defaultMessage: 'Platform billing additional charges notification',
    id: '0UJt8J',
  },
  PLATFORM_BILLING_OVERDUE_REMINDER: {
    defaultMessage: 'Platform billing overdue reminder',
    id: 'CMLrMP',
  },
  PLATFORM_SUBSCRIPTION_UPDATED: {
    defaultMessage: 'Platform subscription updated',
    id: '8oLWFR',
  },
  TRANSACTIONS_IMPORT_CREATED: {
    defaultMessage: 'Transactions import created',
    id: 'QkJwIH',
  },
  TRANSACTIONS_IMPORT_ROW_UPDATED: {
    defaultMessage: 'Transactions import row updated',
    id: 'aXNtjO',
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
  VENDOR_DELETED: {
    defaultMessage: 'Vendor <Vendor></Vendor> deleted',
    id: 'L3EHT/',
  },
  ADDED_FUNDS_EDITED: {
    defaultMessage: '<Individual></Individual> edited added funds',
    id: 'nxtsKq',
  },
  ACTIVATED_HOSTING: {
    defaultMessage: 'Activated "Fiscal Hosting" on <Account></Account>',
    id: 'jBr7+k',
  },
  ACTIVATED_MONEY_MANAGEMENT: {
    defaultMessage: 'Activated "Money Management" on <Account></Account>',
    id: 'v+IOuX',
  },
  DEACTIVATED_HOSTING: {
    defaultMessage: 'Deactivated "Fiscal Hosting" on <Account></Account>',
    id: 'dHKP5Y',
  },
  DEACTIVATED_MONEY_MANAGEMENT: {
    defaultMessage: 'Deactivated "Money Management" on <Account></Account>',
    id: 'Cqq301',
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
  ORDER_PENDING_CONTRIBUTION_NEW: {
    defaultMessage: 'New expected funds',
    id: 'kzIWOG',
  },
  ORDER_PROCESSED: {
    defaultMessage: 'Contribution processed',
    id: 'mrdaqR',
  },
  ORDER_PENDING_CREATED: {
    defaultMessage: 'New expected funds',
    id: 'kzIWOG',
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
    id: 'XbazB4',
  },
  TAXFORM_INVALIDATED: {
    defaultMessage: 'Tax form invalidated for <Account></Account>',
    id: 'ActivityLog.TaxForm.Invalidated',
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
