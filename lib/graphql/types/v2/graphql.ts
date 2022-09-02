/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** Values that can be edited in Account's settings */
  AccountSettingsKey: any;
  DateString: any;
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: any;
  /** A field whose value conforms to the standard internet email address format as specified in RFC822: https://www.w3.org/Protocols/rfc822/. */
  EmailAddress: any;
  IsoDateString: any;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: any;
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: any;
  /** A field whose value conforms to the standard URL format as specified in RFC3986: https://www.ietf.org/rfc/rfc3986.txt. */
  URL: any;
};

/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type Account = {
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  /** Categories set by Open Collective to help moderation. */
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...) */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** The public id identifying the account (ie: 5v08jk63-w4g9nbpz-j7qmyder-p7ozax5g) */
  id?: Maybe<Scalars['String']>;
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether the account accepts financial contributions. */
  isActive?: Maybe<Scalars['Boolean']>;
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived?: Maybe<Scalars['Boolean']>;
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost?: Maybe<Scalars['Boolean']>;
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  /**
   * The internal database identifier of the collective (ie: 580)
   * @deprecated 2020-01-01: should only be used during the transition to GraphQL API v2.
   */
  legacyId?: Maybe<Scalars['Int']>;
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** Get pending member invitations for this account */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf?: Maybe<MemberOfCollection>;
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this account can use to pay for Orders */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this account can use to get paid */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug?: Maybe<Scalars['String']>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  twitterHandle?: Maybe<Scalars['String']>;
  /** The type of the account (BOT/COLLECTIVE/EVENT/ORGANIZATION/INDIVIDUAL/VENDOR) */
  type?: Maybe<AccountType>;
  /** The time of last update */
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  website?: Maybe<Scalars['String']>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountMemberInvitationsArgs = {
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountPaymentMethodsArgs = {
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};

export enum AccountCacheType {
  Cloudflare = 'CLOUDFLARE',
  Contributors = 'CONTRIBUTORS',
  GraphqlQueries = 'GRAPHQL_QUERIES'
}

/** A collection of "Accounts" */
export type AccountCollection = Collection & {
  __typename?: 'AccountCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Account>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export enum AccountFreezeAction {
  Freeze = 'FREEZE',
  Unfreeze = 'UNFREEZE'
}

/** Account orders filter (INCOMING or OUTGOING) */
export enum AccountOrdersFilter {
  Incoming = 'INCOMING',
  Outgoing = 'OUTGOING'
}

/** Fields for the user permissions on an account */
export type AccountPermissions = {
  __typename?: 'AccountPermissions';
  /** Whether the current user can mark this order as expired */
  addFunds: Permission;
  id: Scalars['String'];
};

export type AccountReferenceInput = {
  /** The public id identifying the account (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The slug identifying the account (ie: babel for https://opencollective.com/babel) */
  slug?: InputMaybe<Scalars['String']>;
};

/** Stats for the Account */
export type AccountStats = {
  __typename?: 'AccountStats';
  activeRecurringContributions?: Maybe<Scalars['JSON']>;
  /** Amount of money in cents in the currency of the collective */
  balance: Amount;
  /** Amount of money in cents in the currency of the collective currently available to spend */
  balanceWithBlockedFunds: Amount;
  /** The consolidated amount of all the events and projects combined. */
  consolidatedBalance: Amount;
  /** Return amount stats for contributions (default, and only for now: one-time vs recurring) */
  contributionsAmount?: Maybe<Array<Maybe<AmountStats>>>;
  /** Return amount time series for contributions (default, and only for now: one-time vs recurring) */
  contributionsAmountTimeSeries: TimeSeriesAmount;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<AmountStats>>>;
  /** History of the expense tags used by this collective. */
  expensesTagsTimeSeries: TimeSeriesAmount;
  id?: Maybe<Scalars['String']>;
  /** Average amount spent per month based on the last 90 days */
  monthlySpending: Amount;
  /** Net amount received */
  totalAmountReceived: Amount;
  /** Total amount spent */
  totalAmountSpent: Amount;
  /** Total net amount received */
  totalNetAmountReceived: Amount;
  /** Total of paid expenses, filter per expensetype */
  totalPaidExpenses: Amount;
  yearlyBudget: Amount;
  yearlyBudgetManaged: Amount;
};


/** Stats for the Account */
export type AccountStatsBalanceArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
};


/** Stats for the Account */
export type AccountStatsContributionsAmountArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  includeChildren?: InputMaybe<Scalars['Boolean']>;
};


/** Stats for the Account */
export type AccountStatsContributionsAmountTimeSeriesArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  includeChildren?: InputMaybe<Scalars['Boolean']>;
  timeUnit?: InputMaybe<TimeUnit>;
};


/** Stats for the Account */
export type AccountStatsExpensesTagsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  includeChildren?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
};


/** Stats for the Account */
export type AccountStatsExpensesTagsTimeSeriesArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  includeChildren?: InputMaybe<Scalars['Boolean']>;
  timeUnit?: InputMaybe<TimeUnit>;
};


/** Stats for the Account */
export type AccountStatsTotalAmountReceivedArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  periodInMonths?: InputMaybe<Scalars['Int']>;
  useCache?: Scalars['Boolean'];
};


/** Stats for the Account */
export type AccountStatsTotalPaidExpensesArgs = {
  currency?: InputMaybe<Currency>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  expenseType?: InputMaybe<Array<InputMaybe<ExpenseType>>>;
};

/** All account types */
export enum AccountType {
  Bot = 'BOT',
  Collective = 'COLLECTIVE',
  Event = 'EVENT',
  Fund = 'FUND',
  Individual = 'INDIVIDUAL',
  Organization = 'ORGANIZATION',
  Project = 'PROJECT',
  Vendor = 'VENDOR'
}

export type AccountUpdateInput = {
  currency?: InputMaybe<Currency>;
  /** The public id identifying the account (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id: Scalars['String'];
};

/** An account that can receive financial contributions */
export type AccountWithContributions = {
  /**
   * Amount of money in cents in the currency of the account currently available to spend
   * @deprecated 2020/04/09 - Should not have been introduced. Use stats.balance.value
   */
  balance?: Maybe<Scalars['Int']>;
  contributionPolicy?: Maybe<Scalars['String']>;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Int'];
  tiers: TierCollection;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
};


/** An account that can receive financial contributions */
export type AccountWithContributionsContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** An account that can receive financial contributions */
export type AccountWithContributionsTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** An account that can receive financial contributions */
export type AccountWithContributionsTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};

/** An account that can be hosted by a Host */
export type AccountWithHost = {
  /** Date of approval by the Fiscal Host. */
  approvedAt?: Maybe<Scalars['DateTime']>;
  /** Returns the Fiscal Host */
  host?: Maybe<Host>;
  /** Fees percentage that the host takes for this collective */
  hostFeePercent?: Maybe<Scalars['Float']>;
  /** Describe how the host charges the collective */
  hostFeesStructure?: Maybe<HostFeeStructure>;
  /** Returns whether it's active: can accept financial contributions and pay expenses. */
  isActive: Scalars['Boolean'];
  /** Returns whether it's approved by the Fiscal Host */
  isApproved: Scalars['Boolean'];
  /** Fees percentage that the platform takes for this collective */
  platformFeePercent?: Maybe<Scalars['Int']>;
};


/** An account that can be hosted by a Host */
export type AccountWithHostHostFeePercentArgs = {
  paymentMethodService?: InputMaybe<PaymentMethodService>;
  paymentMethodType?: InputMaybe<PaymentMethodType>;
};

/** An account that has a parent account */
export type AccountWithParent = {
  /** The Account parenting this account */
  parent?: Maybe<Account>;
};

/** An activity describing something that happened on the platform */
export type Activity = {
  __typename?: 'Activity';
  /** The account targeted by this activity, if any */
  account?: Maybe<Account>;
  /** The date on which the ConnectedAccount was created */
  createdAt: Scalars['DateTime'];
  /** Data attached to this activity (if any) */
  data: Scalars['JSON'];
  /** The expense related to this activity, if any */
  expense?: Maybe<Expense>;
  /** The account that authored by this activity, if any */
  fromAccount?: Maybe<Account>;
  /** The host under which this activity happened, if any */
  host?: Maybe<Host>;
  /** Unique identifier for this activity */
  id: Scalars['String'];
  /** The person who triggered the action, if any */
  individual?: Maybe<Individual>;
  /** The order related to this activity, if any */
  order?: Maybe<Order>;
  /** The type of the activity */
  type: ActivityType;
};

export enum ActivityAndClassesType {
  ActivatedCollectiveAsHost = 'ACTIVATED_COLLECTIVE_AS_HOST',
  ActivatedCollectiveAsIndependent = 'ACTIVATED_COLLECTIVE_AS_INDEPENDENT',
  ActivitiesUpdates = 'ACTIVITIES_UPDATES',
  ActivityAll = 'ACTIVITY_ALL',
  AddedFundToOrg = 'ADDED_FUND_TO_ORG',
  BackyourstackDispatchConfirmed = 'BACKYOURSTACK_DISPATCH_CONFIRMED',
  Collective = 'COLLECTIVE',
  CollectiveApply = 'COLLECTIVE_APPLY',
  CollectiveApproved = 'COLLECTIVE_APPROVED',
  CollectiveCommentCreated = 'COLLECTIVE_COMMENT_CREATED',
  CollectiveContact = 'COLLECTIVE_CONTACT',
  CollectiveConversationCreated = 'COLLECTIVE_CONVERSATION_CREATED',
  CollectiveCoreMemberAdded = 'COLLECTIVE_CORE_MEMBER_ADDED',
  CollectiveCoreMemberEdited = 'COLLECTIVE_CORE_MEMBER_EDITED',
  CollectiveCoreMemberInvitationDeclined = 'COLLECTIVE_CORE_MEMBER_INVITATION_DECLINED',
  CollectiveCoreMemberInvited = 'COLLECTIVE_CORE_MEMBER_INVITED',
  CollectiveCoreMemberRemoved = 'COLLECTIVE_CORE_MEMBER_REMOVED',
  CollectiveCreated = 'COLLECTIVE_CREATED',
  CollectiveCreatedGithub = 'COLLECTIVE_CREATED_GITHUB',
  CollectiveExpenseApproved = 'COLLECTIVE_EXPENSE_APPROVED',
  CollectiveExpenseCreated = 'COLLECTIVE_EXPENSE_CREATED',
  CollectiveExpenseDeleted = 'COLLECTIVE_EXPENSE_DELETED',
  CollectiveExpenseError = 'COLLECTIVE_EXPENSE_ERROR',
  CollectiveExpenseInviteDrafted = 'COLLECTIVE_EXPENSE_INVITE_DRAFTED',
  CollectiveExpenseMarkedAsIncomplete = 'COLLECTIVE_EXPENSE_MARKED_AS_INCOMPLETE',
  CollectiveExpenseMarkedAsSpam = 'COLLECTIVE_EXPENSE_MARKED_AS_SPAM',
  CollectiveExpenseMarkedAsUnpaid = 'COLLECTIVE_EXPENSE_MARKED_AS_UNPAID',
  CollectiveExpenseMissingReceipt = 'COLLECTIVE_EXPENSE_MISSING_RECEIPT',
  CollectiveExpenseMoved = 'COLLECTIVE_EXPENSE_MOVED',
  CollectiveExpensePaid = 'COLLECTIVE_EXPENSE_PAID',
  CollectiveExpenseProcessing = 'COLLECTIVE_EXPENSE_PROCESSING',
  CollectiveExpenseRecurringDrafted = 'COLLECTIVE_EXPENSE_RECURRING_DRAFTED',
  CollectiveExpenseRejected = 'COLLECTIVE_EXPENSE_REJECTED',
  CollectiveExpenseScheduledForPayment = 'COLLECTIVE_EXPENSE_SCHEDULED_FOR_PAYMENT',
  CollectiveExpenseUnapproved = 'COLLECTIVE_EXPENSE_UNAPPROVED',
  CollectiveExpenseUpdated = 'COLLECTIVE_EXPENSE_UPDATED',
  CollectiveFrozen = 'COLLECTIVE_FROZEN',
  CollectiveMemberCreated = 'COLLECTIVE_MEMBER_CREATED',
  CollectiveMemberInvited = 'COLLECTIVE_MEMBER_INVITED',
  CollectiveMonthly = 'COLLECTIVE_MONTHLY',
  CollectiveMonthlyReport = 'COLLECTIVE_MONTHLY_REPORT',
  CollectiveRejected = 'COLLECTIVE_REJECTED',
  CollectiveTransactionCreated = 'COLLECTIVE_TRANSACTION_CREATED',
  CollectiveTransactionPaid = 'COLLECTIVE_TRANSACTION_PAID',
  CollectiveUnfrozen = 'COLLECTIVE_UNFROZEN',
  CollectiveUpdateCreated = 'COLLECTIVE_UPDATE_CREATED',
  CollectiveUpdatePublished = 'COLLECTIVE_UPDATE_PUBLISHED',
  CollectiveUserAdded = 'COLLECTIVE_USER_ADDED',
  CollectiveVirtualCardAdded = 'COLLECTIVE_VIRTUAL_CARD_ADDED',
  CollectiveVirtualCardAssigned = 'COLLECTIVE_VIRTUAL_CARD_ASSIGNED',
  CollectiveVirtualCardCreated = 'COLLECTIVE_VIRTUAL_CARD_CREATED',
  CollectiveVirtualCardMissingReceipts = 'COLLECTIVE_VIRTUAL_CARD_MISSING_RECEIPTS',
  CollectiveVirtualCardSuspended = 'COLLECTIVE_VIRTUAL_CARD_SUSPENDED',
  ConnectedAccountCreated = 'CONNECTED_ACCOUNT_CREATED',
  Contributions = 'CONTRIBUTIONS',
  ContributionRejected = 'CONTRIBUTION_REJECTED',
  ConversationCommentCreated = 'CONVERSATION_COMMENT_CREATED',
  DeactivatedCollectiveAsHost = 'DEACTIVATED_COLLECTIVE_AS_HOST',
  Expenses = 'EXPENSES',
  ExpenseCommentCreated = 'EXPENSE_COMMENT_CREATED',
  FundEvents = 'FUND_EVENTS',
  HostApplicationContact = 'HOST_APPLICATION_CONTACT',
  OauthApplicationAuthorized = 'OAUTH_APPLICATION_AUTHORIZED',
  OrdersSuspicious = 'ORDERS_SUSPICIOUS',
  OrderCanceledArchivedCollective = 'ORDER_CANCELED_ARCHIVED_COLLECTIVE',
  OrderPendingContributionNew = 'ORDER_PENDING_CONTRIBUTION_NEW',
  OrderPendingContributionReminder = 'ORDER_PENDING_CONTRIBUTION_REMINDER',
  OrderProcessing = 'ORDER_PROCESSING',
  OrderProcessingCrypto = 'ORDER_PROCESSING_CRYPTO',
  OrderThankyou = 'ORDER_THANKYOU',
  OrganizationCollectiveCreated = 'ORGANIZATION_COLLECTIVE_CREATED',
  PaymentCreditcardConfirmation = 'PAYMENT_CREDITCARD_CONFIRMATION',
  PaymentCreditcardExpiring = 'PAYMENT_CREDITCARD_EXPIRING',
  PaymentFailed = 'PAYMENT_FAILED',
  Reports = 'REPORTS',
  SubscriptionActivated = 'SUBSCRIPTION_ACTIVATED',
  SubscriptionCanceled = 'SUBSCRIPTION_CANCELED',
  SubscriptionConfirmed = 'SUBSCRIPTION_CONFIRMED',
  TaxformRequest = 'TAXFORM_REQUEST',
  TicketConfirmed = 'TICKET_CONFIRMED',
  UpdateCommentCreated = 'UPDATE_COMMENT_CREATED',
  UserCardClaimed = 'USER_CARD_CLAIMED',
  UserCardInvited = 'USER_CARD_INVITED',
  UserChangeEmail = 'USER_CHANGE_EMAIL',
  UserCreated = 'USER_CREATED',
  UserNewToken = 'USER_NEW_TOKEN',
  UserPaymentMethodCreated = 'USER_PAYMENT_METHOD_CREATED',
  VirtualCards = 'VIRTUAL_CARDS',
  VirtualCardChargeDeclined = 'VIRTUAL_CARD_CHARGE_DECLINED',
  VirtualCardPurchase = 'VIRTUAL_CARD_PURCHASE',
  VirtualCardRequested = 'VIRTUAL_CARD_REQUESTED',
  WebhookPaypalReceived = 'WEBHOOK_PAYPAL_RECEIVED',
  WebhookStripeReceived = 'WEBHOOK_STRIPE_RECEIVED'
}

/** How an activity is related to an account */
export enum ActivityAttribution {
  /** Activities initiated by this account */
  Authored = 'AUTHORED',
  /** Activities that happened on accounts hosted by this account */
  HostedAccounts = 'HOSTED_ACCOUNTS',
  /** Activities that targeted this account */
  Received = 'RECEIVED',
  /** Activities where author and target both points to this account (e.g. settings update) */
  Self = 'SELF'
}

/** All supported Activity channels we can broadcast to */
export enum ActivityChannel {
  Email = 'email',
  Gitter = 'gitter',
  Slack = 'slack',
  Twitter = 'twitter',
  Webhook = 'webhook'
}

/** A collection of "Activities" */
export type ActivityCollection = Collection & {
  __typename?: 'ActivityCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Activity>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export type ActivitySubscription = {
  __typename?: 'ActivitySubscription';
  /** The account which this notification setting is applied to */
  account?: Maybe<Account>;
  /** Wheter this notification setting is active or not */
  active: Scalars['Boolean'];
  /** The channel this setting is notifying through */
  channel: ActivityChannel;
  createdAt: Scalars['DateTime'];
  /** Unique identifier for this notification setting */
  id: Scalars['String'];
  /** The user who defined the setting */
  individual: Individual;
  /** The type of Activity this setting is notifying about */
  type: Scalars['String'];
  /** If channel supports, this is the webhook URL we submit the notification to */
  webhookUrl?: Maybe<Scalars['String']>;
};

export enum ActivityType {
  ActivatedCollectiveAsHost = 'ACTIVATED_COLLECTIVE_AS_HOST',
  ActivatedCollectiveAsIndependent = 'ACTIVATED_COLLECTIVE_AS_INDEPENDENT',
  ActivityAll = 'ACTIVITY_ALL',
  AddedFundToOrg = 'ADDED_FUND_TO_ORG',
  BackyourstackDispatchConfirmed = 'BACKYOURSTACK_DISPATCH_CONFIRMED',
  CollectiveApply = 'COLLECTIVE_APPLY',
  CollectiveApproved = 'COLLECTIVE_APPROVED',
  CollectiveCommentCreated = 'COLLECTIVE_COMMENT_CREATED',
  CollectiveContact = 'COLLECTIVE_CONTACT',
  CollectiveConversationCreated = 'COLLECTIVE_CONVERSATION_CREATED',
  CollectiveCoreMemberAdded = 'COLLECTIVE_CORE_MEMBER_ADDED',
  CollectiveCoreMemberEdited = 'COLLECTIVE_CORE_MEMBER_EDITED',
  CollectiveCoreMemberInvitationDeclined = 'COLLECTIVE_CORE_MEMBER_INVITATION_DECLINED',
  CollectiveCoreMemberInvited = 'COLLECTIVE_CORE_MEMBER_INVITED',
  CollectiveCoreMemberRemoved = 'COLLECTIVE_CORE_MEMBER_REMOVED',
  CollectiveCreated = 'COLLECTIVE_CREATED',
  CollectiveCreatedGithub = 'COLLECTIVE_CREATED_GITHUB',
  CollectiveExpenseApproved = 'COLLECTIVE_EXPENSE_APPROVED',
  CollectiveExpenseCreated = 'COLLECTIVE_EXPENSE_CREATED',
  CollectiveExpenseDeleted = 'COLLECTIVE_EXPENSE_DELETED',
  CollectiveExpenseError = 'COLLECTIVE_EXPENSE_ERROR',
  CollectiveExpenseInviteDrafted = 'COLLECTIVE_EXPENSE_INVITE_DRAFTED',
  CollectiveExpenseMarkedAsIncomplete = 'COLLECTIVE_EXPENSE_MARKED_AS_INCOMPLETE',
  CollectiveExpenseMarkedAsSpam = 'COLLECTIVE_EXPENSE_MARKED_AS_SPAM',
  CollectiveExpenseMarkedAsUnpaid = 'COLLECTIVE_EXPENSE_MARKED_AS_UNPAID',
  CollectiveExpenseMissingReceipt = 'COLLECTIVE_EXPENSE_MISSING_RECEIPT',
  CollectiveExpenseMoved = 'COLLECTIVE_EXPENSE_MOVED',
  CollectiveExpensePaid = 'COLLECTIVE_EXPENSE_PAID',
  CollectiveExpenseProcessing = 'COLLECTIVE_EXPENSE_PROCESSING',
  CollectiveExpenseRecurringDrafted = 'COLLECTIVE_EXPENSE_RECURRING_DRAFTED',
  CollectiveExpenseRejected = 'COLLECTIVE_EXPENSE_REJECTED',
  CollectiveExpenseScheduledForPayment = 'COLLECTIVE_EXPENSE_SCHEDULED_FOR_PAYMENT',
  CollectiveExpenseUnapproved = 'COLLECTIVE_EXPENSE_UNAPPROVED',
  CollectiveExpenseUpdated = 'COLLECTIVE_EXPENSE_UPDATED',
  CollectiveFrozen = 'COLLECTIVE_FROZEN',
  CollectiveMemberCreated = 'COLLECTIVE_MEMBER_CREATED',
  CollectiveMemberInvited = 'COLLECTIVE_MEMBER_INVITED',
  CollectiveMonthly = 'COLLECTIVE_MONTHLY',
  CollectiveMonthlyReport = 'COLLECTIVE_MONTHLY_REPORT',
  CollectiveRejected = 'COLLECTIVE_REJECTED',
  CollectiveTransactionCreated = 'COLLECTIVE_TRANSACTION_CREATED',
  CollectiveTransactionPaid = 'COLLECTIVE_TRANSACTION_PAID',
  CollectiveUnfrozen = 'COLLECTIVE_UNFROZEN',
  CollectiveUpdateCreated = 'COLLECTIVE_UPDATE_CREATED',
  CollectiveUpdatePublished = 'COLLECTIVE_UPDATE_PUBLISHED',
  CollectiveUserAdded = 'COLLECTIVE_USER_ADDED',
  CollectiveVirtualCardAdded = 'COLLECTIVE_VIRTUAL_CARD_ADDED',
  CollectiveVirtualCardAssigned = 'COLLECTIVE_VIRTUAL_CARD_ASSIGNED',
  CollectiveVirtualCardCreated = 'COLLECTIVE_VIRTUAL_CARD_CREATED',
  CollectiveVirtualCardMissingReceipts = 'COLLECTIVE_VIRTUAL_CARD_MISSING_RECEIPTS',
  CollectiveVirtualCardSuspended = 'COLLECTIVE_VIRTUAL_CARD_SUSPENDED',
  ConnectedAccountCreated = 'CONNECTED_ACCOUNT_CREATED',
  ContributionRejected = 'CONTRIBUTION_REJECTED',
  ConversationCommentCreated = 'CONVERSATION_COMMENT_CREATED',
  DeactivatedCollectiveAsHost = 'DEACTIVATED_COLLECTIVE_AS_HOST',
  ExpenseCommentCreated = 'EXPENSE_COMMENT_CREATED',
  HostApplicationContact = 'HOST_APPLICATION_CONTACT',
  OauthApplicationAuthorized = 'OAUTH_APPLICATION_AUTHORIZED',
  OrdersSuspicious = 'ORDERS_SUSPICIOUS',
  OrderCanceledArchivedCollective = 'ORDER_CANCELED_ARCHIVED_COLLECTIVE',
  OrderPendingContributionNew = 'ORDER_PENDING_CONTRIBUTION_NEW',
  OrderPendingContributionReminder = 'ORDER_PENDING_CONTRIBUTION_REMINDER',
  OrderProcessing = 'ORDER_PROCESSING',
  OrderProcessingCrypto = 'ORDER_PROCESSING_CRYPTO',
  OrderThankyou = 'ORDER_THANKYOU',
  OrganizationCollectiveCreated = 'ORGANIZATION_COLLECTIVE_CREATED',
  PaymentCreditcardConfirmation = 'PAYMENT_CREDITCARD_CONFIRMATION',
  PaymentCreditcardExpiring = 'PAYMENT_CREDITCARD_EXPIRING',
  PaymentFailed = 'PAYMENT_FAILED',
  SubscriptionActivated = 'SUBSCRIPTION_ACTIVATED',
  SubscriptionCanceled = 'SUBSCRIPTION_CANCELED',
  SubscriptionConfirmed = 'SUBSCRIPTION_CONFIRMED',
  TaxformRequest = 'TAXFORM_REQUEST',
  TicketConfirmed = 'TICKET_CONFIRMED',
  UpdateCommentCreated = 'UPDATE_COMMENT_CREATED',
  UserCardClaimed = 'USER_CARD_CLAIMED',
  UserCardInvited = 'USER_CARD_INVITED',
  UserChangeEmail = 'USER_CHANGE_EMAIL',
  UserCreated = 'USER_CREATED',
  UserNewToken = 'USER_NEW_TOKEN',
  UserPaymentMethodCreated = 'USER_PAYMENT_METHOD_CREATED',
  VirtualCardChargeDeclined = 'VIRTUAL_CARD_CHARGE_DECLINED',
  VirtualCardPurchase = 'VIRTUAL_CARD_PURCHASE',
  VirtualCardRequested = 'VIRTUAL_CARD_REQUESTED',
  WebhookPaypalReceived = 'WEBHOOK_PAYPAL_RECEIVED',
  WebhookStripeReceived = 'WEBHOOK_STRIPE_RECEIVED'
}

/** Response for the addTwoFactorAuthTokenToIndividual mutation */
export type AddTwoFactorAuthTokenToIndividualResponse = {
  __typename?: 'AddTwoFactorAuthTokenToIndividualResponse';
  /** The Individual that the 2FA has been enabled for */
  account: Individual;
  /** The recovery codes for the Individual to write down */
  recoveryCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
};

/** A financial amount. */
export type Amount = {
  __typename?: 'Amount';
  currency?: Maybe<Currency>;
  /** If the amount was generated from a currency conversion, this field contains details about the conversion */
  exchangeRate?: Maybe<CurrencyExchangeRate>;
  value?: Maybe<Scalars['Float']>;
  valueInCents?: Maybe<Scalars['Int']>;
};

/** Input type for an amount with the value and currency */
export type AmountInput = {
  /** The currency string */
  currency?: InputMaybe<Currency>;
  /** The value in plain */
  value?: InputMaybe<Scalars['Float']>;
  /** The value in cents */
  valueInCents?: InputMaybe<Scalars['Int']>;
};

/** Statistics aith amounts */
export type AmountStats = {
  __typename?: 'AmountStats';
  /** Total amount for this label */
  amount: Amount;
  /** Number of entries for this label */
  count?: Maybe<Scalars['Int']>;
  /** Name/Label for the amount */
  label: Scalars['String'];
};

/** An OAuth application or a personal token */
export type Application = {
  __typename?: 'Application';
  account: Account;
  /** @deprecated 2022-06-16: This Application object will only be used for OAuth tokens. Use PersonalToken for user tokens */
  apiKey?: Maybe<Scalars['String']>;
  clientId?: Maybe<Scalars['String']>;
  clientSecret?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  legacyId: Scalars['Int'];
  name?: Maybe<Scalars['String']>;
  oAuthAuthorization?: Maybe<OAuthAuthorization>;
  redirectUri?: Maybe<Scalars['URL']>;
  /** @deprecated 2022-06-16: This Application object will only be used for OAuth tokens. Use PersonalToken for user tokens */
  type?: Maybe<ApplicationType>;
};

/** Input type for Application */
export type ApplicationCreateInput = {
  /** The account to use as the owner of the application. Defaults to currently logged in user. */
  account?: InputMaybe<AccountReferenceInput>;
  description?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  redirectUri?: InputMaybe<Scalars['URL']>;
  type?: ApplicationType;
};

export type ApplicationReferenceInput = {
  /** The clientId for the application. */
  clientId?: InputMaybe<Scalars['String']>;
  /** The public id identifying the application (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The legacy public id identifying the application (ie: 4242) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

/** All application types */
export enum ApplicationType {
  ApiKey = 'API_KEY',
  Oauth = 'OAUTH'
}

/** Input type for Application */
export type ApplicationUpdateInput = {
  /** The clientId for the application. */
  clientId?: InputMaybe<Scalars['String']>;
  description?: InputMaybe<Scalars['String']>;
  /** The public id identifying the application (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The legacy public id identifying the application (ie: 4242) */
  legacyId?: InputMaybe<Scalars['Int']>;
  name?: InputMaybe<Scalars['String']>;
  redirectUri?: InputMaybe<Scalars['URL']>;
};

export type BanAccountResponse = {
  __typename?: 'BanAccountResponse';
  /** The accounts impacted by the mutation */
  accounts: Array<Account>;
  /** Whether the accounts can be banned */
  isAllowed: Scalars['Boolean'];
  /** A summary of the changes */
  message?: Maybe<Scalars['String']>;
};

/** This represents a Bot account */
export type Bot = Account & {
  __typename?: 'Bot';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether the account accepts financial contributions. */
  isActive?: Maybe<Scalars['Boolean']>;
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived?: Maybe<Scalars['Boolean']>;
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost?: Maybe<Scalars['Boolean']>;
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId?: Maybe<Scalars['Int']>;
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug?: Maybe<Scalars['String']>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  twitterHandle?: Maybe<Scalars['String']>;
  type?: Maybe<AccountType>;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  website?: Maybe<Scalars['String']>;
};


/** This represents a Bot account */
export type BotActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents a Bot account */
export type BotBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents a Bot account */
export type BotChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Bot account */
export type BotConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents a Bot account */
export type BotConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents a Bot account */
export type BotExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents a Bot account */
export type BotImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents a Bot account */
export type BotMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Bot account */
export type BotMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents a Bot account */
export type BotMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Bot account */
export type BotOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Bot account */
export type BotOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** This represents a Bot account */
export type BotPaymentMethodsArgs = {
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents a Bot account */
export type BotTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** This represents a Bot account */
export type BotUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents a Bot account */
export type BotVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Bot account */
export type BotVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents a Bot account */
export type BotWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type Collective_Minimum_Admins = {
  __typename?: 'COLLECTIVE_MINIMUM_ADMINS';
  applies?: Maybe<Collective_Minimum_Admins_Applies>;
  freeze?: Maybe<Scalars['Boolean']>;
  numberOfAdmins?: Maybe<Scalars['Int']>;
};

export enum Collective_Minimum_Admins_Applies {
  AllCollectives = 'ALL_COLLECTIVES',
  NewCollectives = 'NEW_COLLECTIVES'
}

/** Captcha related information */
export type CaptchaInput = {
  /** Catpcha provider */
  provider: CaptchaProvider;
  /** Captcha validation token */
  token: Scalars['String'];
};

/** Implemented Captcha Providers */
export enum CaptchaProvider {
  Hcaptcha = 'HCAPTCHA',
  Recaptcha = 'RECAPTCHA'
}

/** Input to order results chronologically */
export type ChronologicalOrderInput = {
  /** Ordering direction. */
  direction?: OrderDirection;
  /** Field to chronologically order by. */
  field?: DateTimeField;
};

/** Collection interface shared by all collection types */
export type Collection = {
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** This represents a Collective account */
export type Collective = Account & AccountWithContributions & AccountWithHost & {
  __typename?: 'Collective';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  /** Date of approval by the Fiscal Host. */
  approvedAt?: Maybe<Scalars['DateTime']>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  /**
   * Amount of money in cents in the currency of the account currently available to spend
   * @deprecated 2020/04/09 - Should not have been introduced. Use stats.balance.value
   */
  balance?: Maybe<Scalars['Int']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  contributionPolicy?: Maybe<Scalars['String']>;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** Returns the Fiscal Host */
  host?: Maybe<Host>;
  /** Fees percentage that the host takes for this collective */
  hostFeePercent?: Maybe<Scalars['Float']>;
  /** Describe how the host charges the collective */
  hostFeesStructure?: Maybe<HostFeeStructure>;
  id?: Maybe<Scalars['String']>;
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether it's active: can accept financial contributions and pay expenses. */
  isActive: Scalars['Boolean'];
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether it's approved by the Fiscal Host */
  isApproved: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived?: Maybe<Scalars['Boolean']>;
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost?: Maybe<Scalars['Boolean']>;
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId?: Maybe<Scalars['Int']>;
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Int'];
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug?: Maybe<Scalars['String']>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  tiers: TierCollection;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  twitterHandle?: Maybe<Scalars['String']>;
  type?: Maybe<AccountType>;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  website?: Maybe<Scalars['String']>;
};


/** This represents a Collective account */
export type CollectiveActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents a Collective account */
export type CollectiveBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents a Collective account */
export type CollectiveChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Collective account */
export type CollectiveContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Collective account */
export type CollectiveConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents a Collective account */
export type CollectiveConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents a Collective account */
export type CollectiveExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents a Collective account */
export type CollectiveHostFeePercentArgs = {
  paymentMethodService?: InputMaybe<PaymentMethodService>;
  paymentMethodType?: InputMaybe<PaymentMethodType>;
};


/** This represents a Collective account */
export type CollectiveImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents a Collective account */
export type CollectiveMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Collective account */
export type CollectiveMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents a Collective account */
export type CollectiveMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Collective account */
export type CollectiveOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Collective account */
export type CollectiveOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** This represents a Collective account */
export type CollectivePaymentMethodsArgs = {
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents a Collective account */
export type CollectiveTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Collective account */
export type CollectiveTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};


/** This represents a Collective account */
export type CollectiveTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** This represents a Collective account */
export type CollectiveUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents a Collective account */
export type CollectiveVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Collective account */
export type CollectiveVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents a Collective account */
export type CollectiveWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type CollectiveCreateInput = {
  description: Scalars['String'];
  name: Scalars['String'];
  repositoryUrl?: InputMaybe<Scalars['String']>;
  settings?: InputMaybe<Scalars['JSON']>;
  slug: Scalars['String'];
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};

export enum CollectiveFeatureStatus {
  /** The feature is enabled and is actively used */
  Active = 'ACTIVE',
  /** The feature is enabled, but there is no data for it */
  Available = 'AVAILABLE',
  /** The feature is disabled, but can be enabled by an admin */
  Disabled = 'DISABLED',
  /** The feature is disabled and cannot be activated for this account */
  Unsupported = 'UNSUPPORTED'
}

/** Describes the features enabled and available for this account */
export type CollectiveFeatures = {
  __typename?: 'CollectiveFeatures';
  ABOUT?: Maybe<CollectiveFeatureStatus>;
  ALIPAY?: Maybe<CollectiveFeatureStatus>;
  ALL?: Maybe<CollectiveFeatureStatus>;
  COLLECTIVE_GOALS?: Maybe<CollectiveFeatureStatus>;
  CONNECTED_ACCOUNTS?: Maybe<CollectiveFeatureStatus>;
  CONTACT_COLLECTIVE?: Maybe<CollectiveFeatureStatus>;
  CONTACT_FORM?: Maybe<CollectiveFeatureStatus>;
  CONVERSATIONS?: Maybe<CollectiveFeatureStatus>;
  CREATE_COLLECTIVE?: Maybe<CollectiveFeatureStatus>;
  CROSS_CURRENCY_MANUAL_TRANSACTIONS?: Maybe<CollectiveFeatureStatus>;
  EMAIL_NOTIFICATIONS_PANEL?: Maybe<CollectiveFeatureStatus>;
  EMIT_GIFT_CARDS?: Maybe<CollectiveFeatureStatus>;
  EVENTS?: Maybe<CollectiveFeatureStatus>;
  HOST_DASHBOARD?: Maybe<CollectiveFeatureStatus>;
  MULTI_CURRENCY_EXPENSES?: Maybe<CollectiveFeatureStatus>;
  ORDER?: Maybe<CollectiveFeatureStatus>;
  PAYPAL_DONATIONS?: Maybe<CollectiveFeatureStatus>;
  PAYPAL_PAYOUTS?: Maybe<CollectiveFeatureStatus>;
  PROJECTS?: Maybe<CollectiveFeatureStatus>;
  RECEIVE_EXPENSES?: Maybe<CollectiveFeatureStatus>;
  RECEIVE_FINANCIAL_CONTRIBUTIONS?: Maybe<CollectiveFeatureStatus>;
  RECEIVE_HOST_APPLICATIONS?: Maybe<CollectiveFeatureStatus>;
  RECURRING_CONTRIBUTIONS?: Maybe<CollectiveFeatureStatus>;
  REQUEST_VIRTUAL_CARDS?: Maybe<CollectiveFeatureStatus>;
  TEAM?: Maybe<CollectiveFeatureStatus>;
  TOP_FINANCIAL_CONTRIBUTORS?: Maybe<CollectiveFeatureStatus>;
  TRANSACTIONS?: Maybe<CollectiveFeatureStatus>;
  TRANSFERWISE?: Maybe<CollectiveFeatureStatus>;
  UPDATES?: Maybe<CollectiveFeatureStatus>;
  USE_EXPENSES?: Maybe<CollectiveFeatureStatus>;
  USE_PAYMENT_METHODS?: Maybe<CollectiveFeatureStatus>;
  VIRTUAL_CARDS?: Maybe<CollectiveFeatureStatus>;
  /** The id of the account */
  id: Scalars['String'];
};

/** This represents an Comment */
export type Comment = {
  __typename?: 'Comment';
  account?: Maybe<Account>;
  /** @deprecated 2020-02-25: Please use account */
  collective?: Maybe<Account>;
  createdAt?: Maybe<Scalars['DateTime']>;
  fromAccount?: Maybe<Account>;
  /** @deprecated 2020-02-25: Please use fromAccount */
  fromCollective?: Maybe<Account>;
  html?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  /** Returns a map of reactions counts for this comment */
  reactions?: Maybe<Scalars['JSON']>;
  /** Returns the list of reactions added to this comment by logged in user */
  userReactions?: Maybe<Array<Maybe<Scalars['String']>>>;
};

/** A collection of "Comments" */
export type CommentCollection = Collection & {
  __typename?: 'CommentCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Comment>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** Input to create a comment. You can only specify one entity type: expense, conversation or update */
export type CommentCreateInput = {
  conversation?: InputMaybe<ConversationReferenceInput>;
  /** If your comment is linked to an expense, set it here */
  expense?: InputMaybe<ExpenseReferenceInput>;
  html?: InputMaybe<Scalars['String']>;
  update?: InputMaybe<UpdateReferenceInput>;
};

export type CommentReferenceInput = {
  /** The public id identifying the comment */
  id?: InputMaybe<Scalars['String']>;
};

export type CommentUpdateInput = {
  html?: InputMaybe<Scalars['String']>;
  id: Scalars['String'];
};

/** Response for the confirmGuestAccount mutation */
export type ConfirmGuestAccountResponse = {
  __typename?: 'ConfirmGuestAccountResponse';
  /** A token that can be used to sign in */
  accessToken: Scalars['String'];
  /** The validated account */
  account: Account;
};

/** This represents a Connected Account */
export type ConnectedAccount = {
  __typename?: 'ConnectedAccount';
  /** The date on which the ConnectedAccount was created */
  createdAt: Scalars['DateTime'];
  /** Unique identifier for this connected account */
  id: Scalars['String'];
  /**
   * The internal database identifier of the Connected Account (ie: 580)
   * @deprecated 2020-05-01: should only be used during the transition to GraphQL API v2.
   */
  legacyId?: Maybe<Scalars['Int']>;
  service: ConnectedAccountService;
  settings?: Maybe<Scalars['JSON']>;
  /** The date on which the ConnectedAccount was last updated */
  updatedAt: Scalars['DateTime'];
};

export type ConnectedAccountCreateInput = {
  /** Optional Client ID for the token or secret */
  clientId?: InputMaybe<Scalars['String']>;
  /** Private data related to the connected account */
  data?: InputMaybe<Scalars['JSON']>;
  /** Refresh token for the connected account */
  refreshToken?: InputMaybe<Scalars['String']>;
  /** Service which the connected account belongs to */
  service?: InputMaybe<ConnectedAccountService>;
  /** Public data related to the connected account */
  settings?: InputMaybe<Scalars['JSON']>;
  /** Secret token used to call service */
  token?: InputMaybe<Scalars['String']>;
  /** Optional username for the connected account */
  username?: InputMaybe<Scalars['String']>;
};

export type ConnectedAccountReferenceInput = {
  /** The public id identifying the connected account (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The internal id of the account (ie: 580) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

/** All supported services a user can connect with */
export enum ConnectedAccountService {
  Github = 'github',
  /** @deprecated Not using this service anymore */
  Meetup = 'meetup',
  Paypal = 'paypal',
  Privacy = 'privacy',
  Stripe = 'stripe',
  Thegivingblock = 'thegivingblock',
  Transferwise = 'transferwise',
  Twitter = 'twitter'
}

export enum ContributionFrequency {
  Monthly = 'MONTHLY',
  Onetime = 'ONETIME',
  Yearly = 'YEARLY'
}

/** Contribution statistics related to the given accounts */
export type ContributionStats = {
  __typename?: 'ContributionStats';
  /**
   * The contribution amounts over time
   * @deprecated 2022-04-21: Please use hostMetricsTimeSeries.totalReceived
   */
  contributionAmountOverTime?: Maybe<TimeSeriesAmount>;
  /** The total number of contributions */
  contributionsCount: Scalars['Int'];
  /** The daily average income */
  dailyAverageIncomeAmount: Amount;
  /** Number of one time contributions */
  oneTimeContributionsCount: Scalars['Int'];
  /** Number of recurring contributions */
  recurringContributionsCount: Scalars['Int'];
};

/**
 *
 *     A person or an entity that contributes financially or by any other mean to the mission
 *     of the collective. While "Member" is dedicated to permissions, this type is meant
 *     to surface all the public contributors.
 *
 */
export type Contributor = {
  __typename?: 'Contributor';
  /** If the contributor has a page on Open Collective, this is the slug to link to it */
  collectiveSlug?: Maybe<Scalars['String']>;
  /** Description of how the member contribute. Will usually be a tier name, or "design" or "code". */
  description?: Maybe<Scalars['String']>;
  /** A unique identifier for this member */
  id: Scalars['String'];
  /** Contributor avatar or logo */
  image?: Maybe<Scalars['String']>;
  /** True if the contributor is a collective admin */
  isAdmin: Scalars['Boolean'];
  /** True if the contributor is a financial contributor */
  isBacker: Scalars['Boolean'];
  /** True if the contributor is a core contributor */
  isCore: Scalars['Boolean'];
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  /** Name of the contributor */
  name: Scalars['String'];
  /** A public message from contributors to describe their contributions */
  publicMessage?: Maybe<Scalars['String']>;
  /** All the roles for a given contributor */
  roles?: Maybe<Array<Maybe<ContributorRole>>>;
  /** Member join date */
  since: Scalars['DateTime'];
  /** How much money the user has contributed for this (in cents, using collective currency) */
  totalAmountDonated: Scalars['Int'];
  /** Whether the contributor is an individual, an organization... */
  type: Scalars['String'];
};


/**
 *
 *     A person or an entity that contributes financially or by any other mean to the mission
 *     of the collective. While "Member" is dedicated to permissions, this type is meant
 *     to surface all the public contributors.
 *
 */
export type ContributorImageArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};

/** A collection of "Contributor" */
export type ContributorCollection = Collection & {
  __typename?: 'ContributorCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Contributor>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** Possible roles for a contributor. Extends `Member.Role`. */
export enum ContributorRole {
  Accountant = 'ACCOUNTANT',
  Admin = 'ADMIN',
  Attendee = 'ATTENDEE',
  Backer = 'BACKER',
  ConnectedCollective = 'CONNECTED_COLLECTIVE',
  Contributor = 'CONTRIBUTOR',
  Follower = 'FOLLOWER',
  Fundraiser = 'FUNDRAISER',
  Host = 'HOST',
  Member = 'MEMBER'
}

/** A conversation thread */
export type Conversation = {
  __typename?: 'Conversation';
  /** The root comment / starter for this conversation */
  body?: Maybe<Comment>;
  collective?: Maybe<Account>;
  /** List the comments for this conversation. Not backed by a loader, don't use this in lists. */
  comments: CommentCollection;
  createdAt: Scalars['DateTime'];
  followers: AccountCollection;
  fromCollective?: Maybe<Account>;
  id: Scalars['String'];
  slug: Scalars['String'];
  stats?: Maybe<ConversationStats>;
  summary: Scalars['String'];
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  title: Scalars['String'];
  updatedAt: Scalars['DateTime'];
};


/** A conversation thread */
export type ConversationCommentsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** A conversation thread */
export type ConversationFollowersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

/** A collection of "Conversations" */
export type ConversationCollection = Collection & {
  __typename?: 'ConversationCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Conversation>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export type ConversationReferenceInput = {
  /** The public id identifying the conversation */
  id?: InputMaybe<Scalars['String']>;
  legacyId?: InputMaybe<Scalars['Int']>;
};

export type ConversationStats = {
  __typename?: 'ConversationStats';
  /** Total number of comments for this conversation */
  commentsCount?: Maybe<Scalars['Int']>;
  id: Scalars['String'];
};

/** Two-letters country code following ISO3166_1 */
export enum CountryIso {
  /** Andorra */
  Ad = 'AD',
  /** The United Arab Emirates */
  Ae = 'AE',
  /** Afghanistan */
  Af = 'AF',
  /** Antigua and Barbuda */
  Ag = 'AG',
  /** Anguilla */
  Ai = 'AI',
  /** Albania */
  Al = 'AL',
  /** Armenia */
  Am = 'AM',
  /** Netherlands Antilles */
  An = 'AN',
  /** Angola */
  Ao = 'AO',
  /** Antarctica */
  Aq = 'AQ',
  /** Argentina */
  Ar = 'AR',
  /** American Samoa */
  As = 'AS',
  /** Austria */
  At = 'AT',
  /** Australia */
  Au = 'AU',
  /** Aruba */
  Aw = 'AW',
  /** Åland Islands */
  Ax = 'AX',
  /** Azerbaijan */
  Az = 'AZ',
  /** Bosnia and Herzegovina */
  Ba = 'BA',
  /** Barbados */
  Bb = 'BB',
  /** Bangladesh */
  Bd = 'BD',
  /** Belgium */
  Be = 'BE',
  /** Burkina */
  Bf = 'BF',
  /** Bulgaria */
  Bg = 'BG',
  /** Bahrain */
  Bh = 'BH',
  /** Burundi */
  Bi = 'BI',
  /** Benin */
  Bj = 'BJ',
  /** Saint Barthélemy */
  Bl = 'BL',
  /** Bermuda */
  Bm = 'BM',
  /** Brunei */
  Bn = 'BN',
  /** Bolivia */
  Bo = 'BO',
  /** Brazil */
  Br = 'BR',
  /** The Bahamas */
  Bs = 'BS',
  /** Bhutan */
  Bt = 'BT',
  /** Bouvet Island */
  Bv = 'BV',
  /** Botswana */
  Bw = 'BW',
  /** Belarus */
  By = 'BY',
  /** Belize */
  Bz = 'BZ',
  /** Canada */
  Ca = 'CA',
  /** Cocos Islands */
  Cc = 'CC',
  /** The Democratic Republic of the Congo */
  Cd = 'CD',
  /** The Central African Republic */
  Cf = 'CF',
  /** The Congo */
  Cg = 'CG',
  /** Switzerland */
  Ch = 'CH',
  /** Côte d'Ivoire */
  Ci = 'CI',
  /** Cook Islands */
  Ck = 'CK',
  /** Chile */
  Cl = 'CL',
  /** Cameroon */
  Cm = 'CM',
  /** China */
  Cn = 'CN',
  /** Colombia */
  Co = 'CO',
  /** Costa Rica */
  Cr = 'CR',
  /** Cuba */
  Cu = 'CU',
  /** Cape Verde */
  Cv = 'CV',
  /** Christmas Island */
  Cx = 'CX',
  /** Cyprus */
  Cy = 'CY',
  /** The Czech Republic */
  Cz = 'CZ',
  /** Germany */
  De = 'DE',
  /** Djibouti */
  Dj = 'DJ',
  /** Denmark */
  Dk = 'DK',
  /** Dominica */
  Dm = 'DM',
  /** The Dominican Republic */
  Do = 'DO',
  /** Algeria */
  Dz = 'DZ',
  /** Ecuador */
  Ec = 'EC',
  /** Estonia */
  Ee = 'EE',
  /** Egypt */
  Eg = 'EG',
  /** Western Sahara */
  Eh = 'EH',
  /** Eritrea */
  Er = 'ER',
  /** Spain */
  Es = 'ES',
  /** Ethiopia */
  Et = 'ET',
  /** Finland */
  Fi = 'FI',
  /** Fiji */
  Fj = 'FJ',
  /** Falkland Islands */
  Fk = 'FK',
  /** Micronesia */
  Fm = 'FM',
  /** Faroe Islands */
  Fo = 'FO',
  /** France */
  Fr = 'FR',
  /** Gabon */
  Ga = 'GA',
  /** The United Kingdom */
  Gb = 'GB',
  /** Grenada */
  Gd = 'GD',
  /** Georgia */
  Ge = 'GE',
  /** French Guiana */
  Gf = 'GF',
  /** Guernsey */
  Gg = 'GG',
  /** Ghana */
  Gh = 'GH',
  /** Gibraltar */
  Gi = 'GI',
  /** Greenland */
  Gl = 'GL',
  /** The Gambia */
  Gm = 'GM',
  /** Guinea */
  Gn = 'GN',
  /** Guadeloupe */
  Gp = 'GP',
  /** Equatorial Guinea */
  Gq = 'GQ',
  /** Greece */
  Gr = 'GR',
  /** South Georgia and The South Sandwich Islands */
  Gs = 'GS',
  /** Guatemala */
  Gt = 'GT',
  /** Guam */
  Gu = 'GU',
  /** Guinea-Bissau */
  Gw = 'GW',
  /** Guyana */
  Gy = 'GY',
  /** Hong Kong */
  Hk = 'HK',
  /** Heard Island and McDonald Islands */
  Hm = 'HM',
  /** Honduras */
  Hn = 'HN',
  /** Croatia */
  Hr = 'HR',
  /** Haiti */
  Ht = 'HT',
  /** Hungary */
  Hu = 'HU',
  /** Indonesia */
  Id = 'ID',
  /** Ireland */
  Ie = 'IE',
  /** Israel */
  Il = 'IL',
  /** Isle of Man */
  Im = 'IM',
  /** India */
  In = 'IN',
  /** The British Indian Ocean Territory */
  Io = 'IO',
  /** Iraq */
  Iq = 'IQ',
  /** Iran */
  Ir = 'IR',
  /** Iceland */
  Is = 'IS',
  /** Italy */
  It = 'IT',
  /** Jersey */
  Je = 'JE',
  /** Jamaica */
  Jm = 'JM',
  /** Jordan */
  Jo = 'JO',
  /** Japan */
  Jp = 'JP',
  /** Kenya */
  Ke = 'KE',
  /** Kyrgyzstan */
  Kg = 'KG',
  /** Cambodia */
  Kh = 'KH',
  /** Kiribati */
  Ki = 'KI',
  /** The Comoros */
  Km = 'KM',
  /** Saint Kitts and Nevis */
  Kn = 'KN',
  /** The Democratic People's Republic of Korea */
  Kp = 'KP',
  /** The Republic of Korea */
  Kr = 'KR',
  /** Kuwait */
  Kw = 'KW',
  /** Cayman Islands */
  Ky = 'KY',
  /** Kazakhstan */
  Kz = 'KZ',
  /** Laos */
  La = 'LA',
  /** Lebanon */
  Lb = 'LB',
  /** Saint Lucia */
  Lc = 'LC',
  /** Liechtenstein */
  Li = 'LI',
  /** Sri Lanka */
  Lk = 'LK',
  /** Liberia */
  Lr = 'LR',
  /** Lesotho */
  Ls = 'LS',
  /** Lithuania */
  Lt = 'LT',
  /** Luxembourg */
  Lu = 'LU',
  /** Latvia */
  Lv = 'LV',
  /** Libya */
  Ly = 'LY',
  /** Morocco */
  Ma = 'MA',
  /** Monaco */
  Mc = 'MC',
  /** Moldova */
  Md = 'MD',
  /** Montenegro */
  Me = 'ME',
  /** Saint Martin */
  Mf = 'MF',
  /** Madagascar */
  Mg = 'MG',
  /** The Marshall Islands */
  Mh = 'MH',
  /** Macedonia */
  Mk = 'MK',
  /** Mali */
  Ml = 'ML',
  /** Myanmar */
  Mm = 'MM',
  /** Mongolia */
  Mn = 'MN',
  /** Macao */
  Mo = 'MO',
  /** Northern Mariana Islands */
  Mp = 'MP',
  /** Martinique */
  Mq = 'MQ',
  /** Mauritania */
  Mr = 'MR',
  /** Montserrat */
  Ms = 'MS',
  /** Malta */
  Mt = 'MT',
  /** Mauritius */
  Mu = 'MU',
  /** Maldives */
  Mv = 'MV',
  /** Malawi */
  Mw = 'MW',
  /** Mexico */
  Mx = 'MX',
  /** Malaysia */
  My = 'MY',
  /** Mozambique */
  Mz = 'MZ',
  /** Namibia */
  Na = 'NA',
  /** New Caledonia */
  Nc = 'NC',
  /** The Niger */
  Ne = 'NE',
  /** Norfolk Island */
  Nf = 'NF',
  /** Nigeria */
  Ng = 'NG',
  /** Nicaragua */
  Ni = 'NI',
  /** The Netherlands */
  Nl = 'NL',
  /** Norway */
  No = 'NO',
  /** Nepal */
  Np = 'NP',
  /** Nauru */
  Nr = 'NR',
  /** Niue */
  Nu = 'NU',
  /** New Zealand */
  Nz = 'NZ',
  /** Oman */
  Om = 'OM',
  /** Panama */
  Pa = 'PA',
  /** Peru */
  Pe = 'PE',
  /** French Polynesia */
  Pf = 'PF',
  /** Papua New Guinea */
  Pg = 'PG',
  /** The Philippines */
  Ph = 'PH',
  /** Pakistan */
  Pk = 'PK',
  /** Poland */
  Pl = 'PL',
  /** Saint Pierre and Miquelon */
  Pm = 'PM',
  /** Pitcairn */
  Pn = 'PN',
  /** Puerto Rico */
  Pr = 'PR',
  /** The Occupied Palestinian Territory */
  Ps = 'PS',
  /** Portugal */
  Pt = 'PT',
  /** Palau */
  Pw = 'PW',
  /** Paraguay */
  Py = 'PY',
  /** Qatar */
  Qa = 'QA',
  /** Réunion */
  Re = 'RE',
  /** Romania */
  Ro = 'RO',
  /** Serbia */
  Rs = 'RS',
  /** Russia */
  Ru = 'RU',
  /** Rwanda */
  Rw = 'RW',
  /** Saudi Arabia */
  Sa = 'SA',
  /** Solomon Islands */
  Sb = 'SB',
  /** Seychelles */
  Sc = 'SC',
  /** The Sudan */
  Sd = 'SD',
  /** Sweden */
  Se = 'SE',
  /** Singapore */
  Sg = 'SG',
  /** Saint Helena */
  Sh = 'SH',
  /** Slovenia */
  Si = 'SI',
  /** Svalbard and Jan Mayen */
  Sj = 'SJ',
  /** Slovakia */
  Sk = 'SK',
  /** Sierra Leone */
  Sl = 'SL',
  /** San Marino */
  Sm = 'SM',
  /** Senegal */
  Sn = 'SN',
  /** Somalia */
  So = 'SO',
  /** Suriname */
  Sr = 'SR',
  /** Sao Tome and Principe */
  St = 'ST',
  /** El Salvador */
  Sv = 'SV',
  /** Syria */
  Sy = 'SY',
  /** Swaziland */
  Sz = 'SZ',
  /** Turks and Caicos Islands */
  Tc = 'TC',
  /** Chad */
  Td = 'TD',
  /** The French Southern Territories */
  Tf = 'TF',
  /** Togo */
  Tg = 'TG',
  /** Thailand */
  Th = 'TH',
  /** Tajikistan */
  Tj = 'TJ',
  /** Tokelau */
  Tk = 'TK',
  /** Timor-Leste */
  Tl = 'TL',
  /** Turkmenistan */
  Tm = 'TM',
  /** Tunisia */
  Tn = 'TN',
  /** Tonga */
  To = 'TO',
  /** Turkey */
  Tr = 'TR',
  /** Trinidad and Tobago */
  Tt = 'TT',
  /** Tuvalu */
  Tv = 'TV',
  /** Taiwan */
  Tw = 'TW',
  /** Tanzania */
  Tz = 'TZ',
  /** Ukraine */
  Ua = 'UA',
  /** Uganda */
  Ug = 'UG',
  /** United States Minor Outlying Islands */
  Um = 'UM',
  /** The United States */
  Us = 'US',
  /** Uruguay */
  Uy = 'UY',
  /** Uzbekistan */
  Uz = 'UZ',
  /** The Holy See */
  Va = 'VA',
  /** Saint Vincent and The Grenadines */
  Vc = 'VC',
  /** Venezuela */
  Ve = 'VE',
  /** British Virgin Islands */
  Vg = 'VG',
  /** US Virgin Islands */
  Vi = 'VI',
  /** Viet Nam */
  Vn = 'VN',
  /** Vanuatu */
  Vu = 'VU',
  /** Wallis and Futuna */
  Wf = 'WF',
  /** Samoa */
  Ws = 'WS',
  /** Yemen */
  Ye = 'YE',
  /** Mayotte */
  Yt = 'YT',
  /** South Africa */
  Za = 'ZA',
  /** Zambia */
  Zm = 'ZM',
  /** Zimbabwe */
  Zw = 'ZW'
}

/** This represents a Credit transaction */
export type Credit = Transaction & {
  __typename?: 'Credit';
  /** The account on the main side of the transaction (CREDIT -> recipient, DEBIT -> sender) */
  account?: Maybe<Account>;
  amount: Amount;
  amountInHostCurrency: Amount;
  balanceInHostCurrency?: Maybe<Amount>;
  createdAt?: Maybe<Scalars['DateTime']>;
  description?: Maybe<Scalars['String']>;
  expense?: Maybe<Expense>;
  fromAccount?: Maybe<Account>;
  /** Account that emitted the gift card used for this transaction (if any) */
  giftCardEmitterAccount?: Maybe<Account>;
  group: Scalars['String'];
  host?: Maybe<Account>;
  /** Exchange rate between the currency of the transaction and the currency of the host (transaction.amount * transaction.hostCurrencyFxRate = transaction.amountInHostCurrency) */
  hostCurrencyFxRate?: Maybe<Scalars['Float']>;
  hostFee: Amount;
  id: Scalars['String'];
  invoiceTemplate?: Maybe<Scalars['String']>;
  isOrderRejected: Scalars['Boolean'];
  isRefund?: Maybe<Scalars['Boolean']>;
  isRefunded?: Maybe<Scalars['Boolean']>;
  kind?: Maybe<TransactionKind>;
  legacyId: Scalars['Int'];
  /** Merchant id related to the Transaction (Stripe, PayPal, Wise, Privacy) */
  merchantId?: Maybe<Scalars['String']>;
  netAmount: Amount;
  netAmountInHostCurrency: Amount;
  /** The account on the opposite side of the transaction (CREDIT -> sender, DEBIT -> recipient) */
  oppositeAccount?: Maybe<Account>;
  order?: Maybe<Order>;
  paymentMethod?: Maybe<PaymentMethod>;
  /** Payment Processor Fee (usually in host currency) */
  paymentProcessorFee: Amount;
  payoutMethod?: Maybe<PayoutMethod>;
  /** The permissions given to current logged in user for this transaction */
  permissions: TransactionPermissions;
  platformFee: Amount;
  refundTransaction?: Maybe<Transaction>;
  relatedTransactions: Array<Maybe<Transaction>>;
  taxAmount: Amount;
  /** If taxAmount is set, this field will contain more info about the tax */
  taxInfo?: Maybe<TaxInfo>;
  toAccount?: Maybe<Account>;
  type: TransactionType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** @deprecated 2021-08-15: Use id instead. */
  uuid: Scalars['String'];
};


/** This represents a Credit transaction */
export type CreditDescriptionArgs = {
  dynamic?: InputMaybe<Scalars['Boolean']>;
  full?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Credit transaction */
export type CreditHostFeeArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Credit transaction */
export type CreditNetAmountArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Credit transaction */
export type CreditNetAmountInHostCurrencyArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Credit transaction */
export type CreditRelatedTransactionsArgs = {
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
};

export type CreditCardCreateInput = {
  brand: Scalars['String'];
  country: Scalars['String'];
  expMonth: Scalars['Int'];
  expYear: Scalars['Int'];
  fullName?: InputMaybe<Scalars['String']>;
  funding?: InputMaybe<Scalars['String']>;
  token: Scalars['String'];
  zip?: InputMaybe<Scalars['String']>;
};

export type CreditCardWithStripeError = {
  __typename?: 'CreditCardWithStripeError';
  /** The payment method created */
  paymentMethod: PaymentMethod;
  /** This field will be set if there was an error with Stripe during strong customer authentication */
  stripeError?: Maybe<StripeError>;
};

/** All supported currencies */
export enum Currency {
  /** UAE Dirham */
  Aed = 'AED',
  /** Afghani */
  Afn = 'AFN',
  /** Lek */
  All = 'ALL',
  /** Armenian Dram */
  Amd = 'AMD',
  /** Netherlands Antillean Guilder */
  Ang = 'ANG',
  /** Kwanza */
  Aoa = 'AOA',
  /** Argentine Peso */
  Ars = 'ARS',
  /** Australian Dollar */
  Aud = 'AUD',
  /** Aruban Florin */
  Awg = 'AWG',
  /** Azerbaijanian Manat */
  Azn = 'AZN',
  /** Convertible Mark */
  Bam = 'BAM',
  /** Barbados Dollar */
  Bbd = 'BBD',
  /** Taka */
  Bdt = 'BDT',
  /** Bulgarian Lev */
  Bgn = 'BGN',
  /** Burundi Franc */
  Bif = 'BIF',
  /** Bermudian Dollar */
  Bmd = 'BMD',
  /** Brunei Dollar */
  Bnd = 'BND',
  /** Boliviano */
  Bob = 'BOB',
  /** Brazilian Real */
  Brl = 'BRL',
  /** Bahamian Dollar */
  Bsd = 'BSD',
  /** Pula */
  Bwp = 'BWP',
  /** Belarussian Ruble */
  Byn = 'BYN',
  /** Belize Dollar */
  Bzd = 'BZD',
  /** Canadian Dollar */
  Cad = 'CAD',
  /** Congolese Franc */
  Cdf = 'CDF',
  /** Swiss Franc */
  Chf = 'CHF',
  /** Chilean Peso */
  Clp = 'CLP',
  /** Yuan Renminbi */
  Cny = 'CNY',
  /** Colombian Peso */
  Cop = 'COP',
  /** Costa Rican Colon */
  Crc = 'CRC',
  /** Cabo Verde Escudo */
  Cve = 'CVE',
  /** Czech Koruna */
  Czk = 'CZK',
  /** Djibouti Franc */
  Djf = 'DJF',
  /** Danish Krone */
  Dkk = 'DKK',
  /** Dominican Peso */
  Dop = 'DOP',
  /** Algerian Dinar */
  Dzd = 'DZD',
  /** Egyptian Pound */
  Egp = 'EGP',
  /** Ethiopian Birr */
  Etb = 'ETB',
  /** Euro */
  Eur = 'EUR',
  /** Fiji Dollar */
  Fjd = 'FJD',
  /** Falkland Islands Pound */
  Fkp = 'FKP',
  /** Pound Sterling */
  Gbp = 'GBP',
  /** Lari */
  Gel = 'GEL',
  /** Gibraltar Pound */
  Gip = 'GIP',
  /** Dalasi */
  Gmd = 'GMD',
  /** Guinea Franc */
  Gnf = 'GNF',
  /** Quetzal */
  Gtq = 'GTQ',
  /** Guyana Dollar */
  Gyd = 'GYD',
  /** Hong Kong Dollar */
  Hkd = 'HKD',
  /** Lempira */
  Hnl = 'HNL',
  /** Kuna */
  Hrk = 'HRK',
  /** Gourde */
  Htg = 'HTG',
  /** Forint */
  Huf = 'HUF',
  /** Rupiah */
  Idr = 'IDR',
  /** New Israeli Sheqel */
  Ils = 'ILS',
  /** Indian Rupee */
  Inr = 'INR',
  /** Iceland Krona */
  Isk = 'ISK',
  /** Jamaican Dollar */
  Jmd = 'JMD',
  /** Yen */
  Jpy = 'JPY',
  /** Kenyan Shilling */
  Kes = 'KES',
  /** Som */
  Kgs = 'KGS',
  /** Riel */
  Khr = 'KHR',
  /** Comoro Franc */
  Kmf = 'KMF',
  /** Won */
  Krw = 'KRW',
  /** Cayman Islands Dollar */
  Kyd = 'KYD',
  /** Tenge */
  Kzt = 'KZT',
  /** Kip */
  Lak = 'LAK',
  /** Lebanese Pound */
  Lbp = 'LBP',
  /** Sri Lanka Rupee */
  Lkr = 'LKR',
  /** Liberian Dollar */
  Lrd = 'LRD',
  /** Loti */
  Lsl = 'LSL',
  /** Moroccan Dirham */
  Mad = 'MAD',
  /** Moldovan Leu */
  Mdl = 'MDL',
  /** Malagasy Ariary */
  Mga = 'MGA',
  /** Denar */
  Mkd = 'MKD',
  /** Kyat */
  Mmk = 'MMK',
  /** Tugrik */
  Mnt = 'MNT',
  /** Pataca */
  Mop = 'MOP',
  /** Mauritius Rupee */
  Mur = 'MUR',
  /** Rufiyaa */
  Mvr = 'MVR',
  /** Kwacha */
  Mwk = 'MWK',
  /** Mexican Peso */
  Mxn = 'MXN',
  /** Malaysian Ringgit */
  Myr = 'MYR',
  /** Mozambique Metical */
  Mzn = 'MZN',
  /** Namibia Dollar */
  Nad = 'NAD',
  /** Naira */
  Ngn = 'NGN',
  /** Cordoba Oro */
  Nio = 'NIO',
  /** Norwegian Krone */
  Nok = 'NOK',
  /** Nepalese Rupee */
  Npr = 'NPR',
  /** New Zealand Dollar */
  Nzd = 'NZD',
  /** Balboa */
  Pab = 'PAB',
  /** Nuevo Sol */
  Pen = 'PEN',
  /** Kina */
  Pgk = 'PGK',
  /** Philippine Peso */
  Php = 'PHP',
  /** Pakistan Rupee */
  Pkr = 'PKR',
  /** Zloty */
  Pln = 'PLN',
  /** Guarani */
  Pyg = 'PYG',
  /** Qatari Rial */
  Qar = 'QAR',
  /** Romanian Leu */
  Ron = 'RON',
  /** Serbian Dinar */
  Rsd = 'RSD',
  /** Russian Ruble */
  Rub = 'RUB',
  /** Rwanda Franc */
  Rwf = 'RWF',
  /** Saudi Riyal */
  Sar = 'SAR',
  /** Solomon Islands Dollar */
  Sbd = 'SBD',
  /** Seychelles Rupee */
  Scr = 'SCR',
  /** Swedish Krona */
  Sek = 'SEK',
  /** Singapore Dollar */
  Sgd = 'SGD',
  /** Saint Helena Pound */
  Shp = 'SHP',
  /** Leone */
  Sll = 'SLL',
  /** Somali Shilling */
  Sos = 'SOS',
  /** Surinam Dollar */
  Srd = 'SRD',
  /** Lilangeni */
  Szl = 'SZL',
  /** Baht */
  Thb = 'THB',
  /** Somoni */
  Tjs = 'TJS',
  /** Pa’anga */
  Top = 'TOP',
  /** Turkish Lira */
  Try = 'TRY',
  /** Trinidad and Tobago Dollar */
  Ttd = 'TTD',
  /** New Taiwan Dollar */
  Twd = 'TWD',
  /** Tanzanian Shilling */
  Tzs = 'TZS',
  /** Hryvnia */
  Uah = 'UAH',
  /** Uganda Shilling */
  Ugx = 'UGX',
  /** US Dollar */
  Usd = 'USD',
  /** Peso Uruguayo */
  Uyu = 'UYU',
  /** Uzbekistan Sum */
  Uzs = 'UZS',
  /** Dong */
  Vnd = 'VND',
  /** Vatu */
  Vuv = 'VUV',
  /** Tala */
  Wst = 'WST',
  /** CFA Franc BEAC */
  Xaf = 'XAF',
  /** East Caribbean Dollar */
  Xcd = 'XCD',
  /** CFA Franc BCEAO */
  Xof = 'XOF',
  /** CFP Franc */
  Xpf = 'XPF',
  /** Yemeni Rial */
  Yer = 'YER',
  /** Rand */
  Zar = 'ZAR',
  /** Zambian Kwacha */
  Zmw = 'ZMW'
}

/** Fields for a currency fx rate */
export type CurrencyExchangeRate = {
  __typename?: 'CurrencyExchangeRate';
  /** Date of the FX rate */
  date: Scalars['DateTime'];
  fromCurrency: Currency;
  /** Is the FX rate approximate or a fixed value? */
  isApproximate: Scalars['Boolean'];
  /** Where does the FX rate comes from */
  source: CurrencyExchangeRateSourceType;
  toCurrency: Currency;
  /** Exchange rate value as a scalar (e.g 1.15 or 0.86) */
  value: Scalars['Float'];
};

/** Where does the FX rate come from */
export enum CurrencyExchangeRateSourceType {
  /** Open Collective internal system, relying on caching and 3rd party APIs */
  Opencollective = 'OPENCOLLECTIVE',
  /** PayPal API */
  Paypal = 'PAYPAL',
  /** Wise API */
  Wise = 'WISE'
}

/** All possible DateTime fields for a resource */
export enum DateTimeField {
  /** The creation time of a resource */
  CreatedAt = 'CREATED_AT'
}

/** This represents a Debit transaction */
export type Debit = Transaction & {
  __typename?: 'Debit';
  /** The account on the main side of the transaction (CREDIT -> recipient, DEBIT -> sender) */
  account?: Maybe<Account>;
  amount: Amount;
  amountInHostCurrency: Amount;
  balanceInHostCurrency?: Maybe<Amount>;
  createdAt?: Maybe<Scalars['DateTime']>;
  description?: Maybe<Scalars['String']>;
  expense?: Maybe<Expense>;
  fromAccount?: Maybe<Account>;
  /** Account that emitted the gift card used for this transaction (if any) */
  giftCardEmitterAccount?: Maybe<Account>;
  group: Scalars['String'];
  host?: Maybe<Account>;
  /** Exchange rate between the currency of the transaction and the currency of the host (transaction.amount * transaction.hostCurrencyFxRate = transaction.amountInHostCurrency) */
  hostCurrencyFxRate?: Maybe<Scalars['Float']>;
  hostFee: Amount;
  id: Scalars['String'];
  invoiceTemplate?: Maybe<Scalars['String']>;
  isOrderRejected: Scalars['Boolean'];
  isRefund?: Maybe<Scalars['Boolean']>;
  isRefunded?: Maybe<Scalars['Boolean']>;
  kind?: Maybe<TransactionKind>;
  legacyId: Scalars['Int'];
  /** Merchant id related to the Transaction (Stripe, PayPal, Wise, Privacy) */
  merchantId?: Maybe<Scalars['String']>;
  netAmount: Amount;
  netAmountInHostCurrency: Amount;
  /** The account on the opposite side of the transaction (CREDIT -> sender, DEBIT -> recipient) */
  oppositeAccount?: Maybe<Account>;
  order?: Maybe<Order>;
  paymentMethod?: Maybe<PaymentMethod>;
  /** Payment Processor Fee (usually in host currency) */
  paymentProcessorFee: Amount;
  payoutMethod?: Maybe<PayoutMethod>;
  /** The permissions given to current logged in user for this transaction */
  permissions: TransactionPermissions;
  platformFee: Amount;
  refundTransaction?: Maybe<Transaction>;
  relatedTransactions: Array<Maybe<Transaction>>;
  taxAmount: Amount;
  /** If taxAmount is set, this field will contain more info about the tax */
  taxInfo?: Maybe<TaxInfo>;
  toAccount?: Maybe<Account>;
  type: TransactionType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** @deprecated 2021-08-15: Use id instead. */
  uuid: Scalars['String'];
};


/** This represents a Debit transaction */
export type DebitDescriptionArgs = {
  dynamic?: InputMaybe<Scalars['Boolean']>;
  full?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Debit transaction */
export type DebitHostFeeArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Debit transaction */
export type DebitNetAmountArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Debit transaction */
export type DebitNetAmountInHostCurrencyArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Debit transaction */
export type DebitRelatedTransactionsArgs = {
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
};

export type EmojiReactionResponse = {
  __typename?: 'EmojiReactionResponse';
  /** Reference to the comment corresponding to the emojis */
  comment?: Maybe<Comment>;
  /** Reference to the update corresponding to the emojis */
  update?: Maybe<Update>;
};

/** This represents an Event account */
export type Event = Account & AccountWithContributions & AccountWithHost & AccountWithParent & {
  __typename?: 'Event';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  /** Date of approval by the Fiscal Host. */
  approvedAt?: Maybe<Scalars['DateTime']>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  /**
   * Amount of money in cents in the currency of the account currently available to spend
   * @deprecated 2020/04/09 - Should not have been introduced. Use stats.balance.value
   */
  balance?: Maybe<Scalars['Int']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  contributionPolicy?: Maybe<Scalars['String']>;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  /** The Event end date and time */
  endsAt?: Maybe<Scalars['DateTime']>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** Returns the Fiscal Host */
  host?: Maybe<Host>;
  /** Fees percentage that the host takes for this collective */
  hostFeePercent?: Maybe<Scalars['Float']>;
  /** Describe how the host charges the collective */
  hostFeesStructure?: Maybe<HostFeeStructure>;
  id?: Maybe<Scalars['String']>;
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether it's active: can accept financial contributions and pay expenses. */
  isActive: Scalars['Boolean'];
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether it's approved by the Fiscal Host */
  isApproved: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived?: Maybe<Scalars['Boolean']>;
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost?: Maybe<Scalars['Boolean']>;
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId?: Maybe<Scalars['Int']>;
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  /** The Account parenting this account */
  parent?: Maybe<Account>;
  parentAccount?: Maybe<Account>;
  /**
   * The Collective hosting this Event
   * @deprecated 2020/07/01 - Use parent instead.
   */
  parentCollective?: Maybe<Collective>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Int'];
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug?: Maybe<Scalars['String']>;
  /** The Event start date and time */
  startsAt?: Maybe<Scalars['DateTime']>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  tiers: TierCollection;
  /** Timezone of the Event (TZ database format, e.g. UTC or Europe/Berlin) */
  timezone?: Maybe<Scalars['String']>;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  twitterHandle?: Maybe<Scalars['String']>;
  type?: Maybe<AccountType>;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  website?: Maybe<Scalars['String']>;
};


/** This represents an Event account */
export type EventActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents an Event account */
export type EventBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Event account */
export type EventChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Event account */
export type EventContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Event account */
export type EventConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents an Event account */
export type EventConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Event account */
export type EventExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Event account */
export type EventHostFeePercentArgs = {
  paymentMethodService?: InputMaybe<PaymentMethodService>;
  paymentMethodType?: InputMaybe<PaymentMethodType>;
};


/** This represents an Event account */
export type EventImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Event account */
export type EventMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Event account */
export type EventMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Event account */
export type EventMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Event account */
export type EventOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Event account */
export type EventOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** This represents an Event account */
export type EventPaymentMethodsArgs = {
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents an Event account */
export type EventTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Event account */
export type EventTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};


/** This represents an Event account */
export type EventTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** This represents an Event account */
export type EventUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Event account */
export type EventVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Event account */
export type EventVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents an Event account */
export type EventWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type EventCreateInput = {
  description?: InputMaybe<Scalars['String']>;
  /** The Event end date and time */
  endsAt: Scalars['DateTime'];
  name: Scalars['String'];
  settings?: InputMaybe<Scalars['JSON']>;
  slug?: InputMaybe<Scalars['String']>;
  /** The Event start date and time */
  startsAt: Scalars['DateTime'];
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  /** Timezone of the Event (TZ database format, e.g. UTC or Europe/Berlin) */
  timezone: Scalars['String'];
};

/** This represents an Expense */
export type Expense = {
  __typename?: 'Expense';
  /** The account where the expense was submitted */
  account: Account;
  /**
   * The exchange rate between the expense currency and the account currency
   * @deprecated 2022-02-09: Please use amountV2
   */
  accountCurrencyFxRate: Scalars['Float'];
  /** The list of activities (ie. approved, edited, etc) for this expense ordered by date ascending */
  activities: Array<Activity>;
  /**
   * Total amount of the expense (sum of the item's amounts).
   * @deprecated 2022-02-09: Please use amountV2
   */
  amount: Scalars['Int'];
  /** Total amount of the expense */
  amountV2?: Maybe<Amount>;
  /** (Optional) files attached to the expense */
  attachedFiles?: Maybe<Array<ExpenseAttachedFile>>;
  /** @deprecated 2020-04-08: Field has been renamed to "items" */
  attachments?: Maybe<Array<Maybe<ExpenseItem>>>;
  /** Returns the list of comments for this expense, or `null` if user is not allowed to see them */
  comments?: Maybe<CommentCollection>;
  /** The time of creation */
  createdAt: Scalars['DateTime'];
  /** The account who created this expense */
  createdByAccount?: Maybe<Account>;
  /** Currency that should be used for the payout */
  currency: Currency;
  /** Title/main description for this expense */
  description: Scalars['String'];
  /** Drafted field values that were still not persisted */
  draft?: Maybe<Scalars['JSON']>;
  /** The fees payer for this expense */
  feesPayer: FeesPayer;
  /** The account from where the expense was paid */
  host?: Maybe<Account>;
  id: Scalars['String'];
  /** Information to display on the invoice. Only visible to user and admins. */
  invoiceInfo?: Maybe<Scalars['String']>;
  items?: Maybe<Array<Maybe<ExpenseItem>>>;
  /** Legacy ID as returned by API V1. Avoid relying on this field as it may be removed in the future. */
  legacyId: Scalars['Int'];
  /** Longer description for this expense */
  longDescription?: Maybe<Scalars['String']>;
  /** The account being paid by this expense */
  payee: Account;
  /** The address of the payee */
  payeeLocation?: Maybe<Location>;
  /** The payout method to use for this expense */
  payoutMethod?: Maybe<PayoutMethod>;
  /** The permissions given to current logged in user for this expense */
  permissions: ExpensePermissions;
  /** Additional information about the payment as HTML. Only visible to user and admins. */
  privateMessage?: Maybe<Scalars['String']>;
  quote?: Maybe<ExpenseQuote>;
  recurringExpense?: Maybe<RecurringExpense>;
  /** The account that requested this expense to be submitted */
  requestedByAccount?: Maybe<Account>;
  /** Returns the list of legal documents required from the payee before the expense can be payed. Must be logged in. */
  requiredLegalDocuments?: Maybe<Array<Maybe<LegalDocumentType>>>;
  /** The state of the expense (pending, approved, paid, rejected...etc) */
  status: ExpenseStatus;
  tags: Array<Maybe<Scalars['String']>>;
  /** Taxes applied to this expense */
  taxes: Array<Maybe<TaxInfo>>;
  /** Whether this expense is a receipt or an invoice */
  type: ExpenseType;
  /** The virtual card used to pay for this charge */
  virtualCard?: Maybe<VirtualCard>;
};


/** This represents an Expense */
export type ExpenseAmountV2Args = {
  currencySource?: InputMaybe<ExpenseCurrencySource>;
};


/** This represents an Expense */
export type ExpenseCommentsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
};

/** Fields for an expense's attached file */
export type ExpenseAttachedFile = {
  __typename?: 'ExpenseAttachedFile';
  /** Unique identifier for this file */
  id: Scalars['String'];
  url?: Maybe<Scalars['URL']>;
};

export type ExpenseAttachedFileInput = {
  /** ID of the file */
  id?: InputMaybe<Scalars['String']>;
  /** URL of the file */
  url: Scalars['URL'];
};

/** A collection of "Expenses" */
export type ExpenseCollection = Collection & {
  __typename?: 'ExpenseCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Expense>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export type ExpenseCreateInput = {
  /** (Optional) A list of files that you want to attach to this expense */
  attachedFiles?: InputMaybe<Array<ExpenseAttachedFileInput>>;
  /** Currency that should be used for the payout. Defaults to the account currency */
  currency?: InputMaybe<Currency>;
  /** Main title of the expense */
  description: Scalars['String'];
  /** Custom information to print on the invoice */
  invoiceInfo?: InputMaybe<Scalars['String']>;
  /** The list of items for this expense. Total amount will be computed from them. */
  items?: InputMaybe<Array<InputMaybe<ExpenseItemCreateInput>>>;
  /** Longer text to attach to the expense */
  longDescription?: InputMaybe<Scalars['String']>;
  /** Account to reimburse */
  payee: AccountReferenceInput;
  /** The address of the payee */
  payeeLocation?: InputMaybe<LocationInput>;
  /** The payout method that will be used to reimburse the expense */
  payoutMethod: PayoutMethodInput;
  /** A private note that will be attached to your invoice, as HTML */
  privateMessage?: InputMaybe<Scalars['String']>;
  /** Tags associated to the expense (ie. Food, Engineering...) */
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  /** The list of taxes that should be applied to the expense (VAT, GST, etc...) */
  tax?: InputMaybe<Array<InputMaybe<ExpenseTaxInput>>>;
  /** The type of the expense */
  type: ExpenseType;
};

/** All supported expense currency sources */
export enum ExpenseCurrencySource {
  /** The expense currency expressed as the account currency */
  Account = 'ACCOUNT',
  /** The expense currency expressed as the expense currency */
  Expense = 'EXPENSE',
  /** The expense currency expressed as the host currency */
  Host = 'HOST'
}

export type ExpenseInviteDraftInput = {
  /** (Optional) A list of files that you want to attach to this expense */
  attachedFiles?: InputMaybe<Array<InputMaybe<Scalars['JSON']>>>;
  /** Main title of the expense */
  description?: InputMaybe<Scalars['String']>;
  /** Tax ID, VAT number...etc This information will be printed on your invoice. */
  invoiceInfo?: InputMaybe<Scalars['String']>;
  /** The list of items for this expense. Total amount will be computed from them. */
  items?: InputMaybe<Array<InputMaybe<Scalars['JSON']>>>;
  /** Longer text to attach to the expense */
  longDescription?: InputMaybe<Scalars['String']>;
  /** Account to reimburse */
  payee: ExpenseInvitee;
  /** The address of the payee */
  payeeLocation?: InputMaybe<LocationInput>;
  /** The payout method that will be used to reimburse the expense */
  payoutMethod?: InputMaybe<PayoutMethodInput>;
  /** A private note that will be attached to your invoice, as HTML */
  privateMessage?: InputMaybe<Scalars['String']>;
  /** Note to be sent to the invited user through email. */
  recipientNote?: InputMaybe<Scalars['String']>;
  /** Tags associated to the expense (ie. Food, Engineering...) */
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  /** The type of the expense */
  type: ExpenseType;
};

export type ExpenseInvitee = {
  email?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['Int']>;
  isInvite?: InputMaybe<Scalars['Boolean']>;
  name?: InputMaybe<Scalars['String']>;
  organization?: InputMaybe<ExpenseInviteeOrganizationInput>;
  slug?: InputMaybe<Scalars['String']>;
};

export type ExpenseInviteeOrganizationInput = {
  description?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  website?: InputMaybe<Scalars['String']>;
};

/** Fields for an expense item */
export type ExpenseItem = {
  __typename?: 'ExpenseItem';
  /** Amount of this item */
  amount: Scalars['Int'];
  /** The date on which the item was created */
  createdAt: Scalars['DateTime'];
  /** A description for this item. Enforced for new items, but old expenses may not have one. */
  description?: Maybe<Scalars['String']>;
  /** Unique identifier for this expense item */
  id: Scalars['String'];
  /** The date on which the expense took place */
  incurredAt: Scalars['DateTime'];
  /** The date on which the item was last updated */
  updatedAt: Scalars['DateTime'];
  url?: Maybe<Scalars['URL']>;
};

export type ExpenseItemCreateInput = {
  /** Amount in cents */
  amount: Scalars['Int'];
  /** What is this item about? */
  description: Scalars['String'];
  /** When was the money spent? */
  incurredAt?: InputMaybe<Scalars['DateString']>;
  /** URL of the file linked to this item. Must be provided if the expense type is RECEIPT. */
  url?: InputMaybe<Scalars['URL']>;
};

export type ExpenseItemInput = {
  /** Amount in cents */
  amount?: InputMaybe<Scalars['Int']>;
  /** What is this item about? */
  description?: InputMaybe<Scalars['String']>;
  /** ID of the item */
  id?: InputMaybe<Scalars['String']>;
  /** When was the money spent? */
  incurredAt?: InputMaybe<Scalars['DateString']>;
  /** URL of the file linked to this item. Must be provided if the expense type is RECEIPT. */
  url?: InputMaybe<Scalars['URL']>;
};

/** Fields for the user permissions on an expense */
export type ExpensePermissions = {
  __typename?: 'ExpensePermissions';
  approve: Permission;
  /** Whether the current user can approve this expense */
  canApprove: Scalars['Boolean'];
  /** Whether the current user can comment and see comments for this expense */
  canComment: Scalars['Boolean'];
  /** Whether the current user can edit the expense */
  canDelete: Scalars['Boolean'];
  /** Whether the current user can edit the expense */
  canEdit: Scalars['Boolean'];
  /** Tags permissions are a bit different, and can be edited by admins even if the expense has already been paid */
  canEditTags: Scalars['Boolean'];
  /** Whether the current user can mark this expense as incomplete */
  canMarkAsIncomplete: Scalars['Boolean'];
  /** Whether the current user can mark this expense as spam */
  canMarkAsSpam: Scalars['Boolean'];
  /** Whether the current user can mark this expense as unpaid */
  canMarkAsUnpaid: Scalars['Boolean'];
  /** Whether the current user can trigger the payment for this expense */
  canPay: Scalars['Boolean'];
  /** Whether the current user can reject this expense */
  canReject: Scalars['Boolean'];
  /** Whether the current user can the the invoice info for this expense */
  canSeeInvoiceInfo: Scalars['Boolean'];
  /** Whether the current user can unapprove this expense */
  canUnapprove: Scalars['Boolean'];
  /** Whether the current user can unschedule this expense payment */
  canUnschedulePayment: Scalars['Boolean'];
  comment: Permission;
  delete: Permission;
  edit: Permission;
  editTags: Permission;
  id: Scalars['String'];
  markAsSpam: Permission;
  markAsUnpaid: Permission;
  pay: Permission;
  reject: Permission;
  seeInvoiceInfo: Permission;
  unapprove: Permission;
  unschedulePayment: Permission;
};

/** All supported expense types */
export enum ExpenseProcessAction {
  /** To mark the expense as approved */
  Approve = 'APPROVE',
  /** To mark the expense as incomplete and notify the payee it requires more information */
  MarkAsIncomplete = 'MARK_AS_INCOMPLETE',
  /** To mark the expense as spam */
  MarkAsSpam = 'MARK_AS_SPAM',
  /** To mark the expense as unpaid (marks the transaction as refunded) */
  MarkAsUnpaid = 'MARK_AS_UNPAID',
  /** To trigger the payment */
  Pay = 'PAY',
  /** To mark the expense as rejected */
  Reject = 'REJECT',
  /** To schedule the expense for payment */
  ScheduleForPayment = 'SCHEDULE_FOR_PAYMENT',
  /** To mark the expense as pending after it has been approved */
  Unapprove = 'UNAPPROVE',
  /** To unschedule the expense payment */
  UnschedulePayment = 'UNSCHEDULE_PAYMENT'
}

/** Fields for an expense quote */
export type ExpenseQuote = {
  __typename?: 'ExpenseQuote';
  /** The date on which the item was created */
  estimatedDeliveryAt?: Maybe<Scalars['DateTime']>;
  /** Amount of payment processor fee */
  paymentProcessorFeeAmount: Amount;
  /** Amount of this item */
  totalAmount: Amount;
};

export type ExpenseReferenceInput = {
  /** The public id identifying the expense (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The internal id of the expense (ie: 580) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

/** Expense statistics related to the given accounts */
export type ExpenseStats = {
  __typename?: 'ExpenseStats';
  /** The daily average paid in expenses */
  dailyAverageAmount: Amount;
  /**
   * The total number of expenses over time
   * @deprecated 2022-04-21: Please use hostMetricsTimeSeries.totalSpent
   */
  expenseAmountOverTime?: Maybe<TimeSeriesAmount>;
  /** The total number of expenses */
  expensesCount: Scalars['Int'];
  /** Number of grants */
  grantsCount: Scalars['Int'];
  /** Number of invoices */
  invoicesCount: Scalars['Int'];
  /** Number of reimbursements */
  reimbursementsCount: Scalars['Int'];
};

export enum ExpenseStatus {
  Approved = 'APPROVED',
  Canceled = 'CANCELED',
  Draft = 'DRAFT',
  Error = 'ERROR',
  Incomplete = 'INCOMPLETE',
  Paid = 'PAID',
  Pending = 'PENDING',
  Processing = 'PROCESSING',
  Rejected = 'REJECTED',
  ScheduledForPayment = 'SCHEDULED_FOR_PAYMENT',
  Spam = 'SPAM',
  Unverified = 'UNVERIFIED'
}

/** Describes the values allowed to filter expenses, namely all the expense statuses and the special "READY_TO_PAY" value. */
export enum ExpenseStatusFilter {
  Approved = 'APPROVED',
  Canceled = 'CANCELED',
  Draft = 'DRAFT',
  Error = 'ERROR',
  Incomplete = 'INCOMPLETE',
  Paid = 'PAID',
  Pending = 'PENDING',
  Processing = 'PROCESSING',
  /** Only expenses that are ready to be paid (must be approved, have the sufficiant balance and have the tax forms completed) */
  ReadyToPay = 'READY_TO_PAY',
  Rejected = 'REJECTED',
  ScheduledForPayment = 'SCHEDULED_FOR_PAYMENT',
  Spam = 'SPAM',
  Unverified = 'UNVERIFIED'
}

/** Input to set taxes for an expense */
export type ExpenseTaxInput = {
  /** Tax identification number, if any */
  idNumber?: InputMaybe<Scalars['String']>;
  /** Tax rate as a float number between 0 and 1 */
  rate: Scalars['Float'];
  type: TaxType;
};

/** All supported expense types */
export enum ExpenseType {
  /** Credit Card Charge: Payment done using an issued (virtual) credit card issued by your Fiscal Host. */
  Charge = 'CHARGE',
  /** Funding Request: Request funding for a project or initiative. */
  FundingRequest = 'FUNDING_REQUEST',
  /** Grant: Request funding for a project or initiative. */
  Grant = 'GRANT',
  /** Invoice: Charge for your time or get paid in advance. */
  Invoice = 'INVOICE',
  /** Receipt: Get paid back for a purchase already made. */
  Receipt = 'RECEIPT',
  /** Settlement: expense generated by Open Collective to collect money owed by Fiscal Hosts. */
  Settlement = 'SETTLEMENT',
  /** Unclassified expense */
  Unclassified = 'UNCLASSIFIED'
}

export type ExpenseUpdateInput = {
  /** (Optional) A list of files that you want to attach to this expense */
  attachedFiles?: InputMaybe<Array<ExpenseAttachedFileInput>>;
  /** @deprecated 2020-04-08: Please use the items field - The list of items for this expense. Total amount will be computed from them. */
  attachments?: InputMaybe<Array<InputMaybe<ExpenseItemInput>>>;
  /** Currency that should be used for the payout. Defaults to the account currency */
  currency?: InputMaybe<Currency>;
  /** Main title of the expense */
  description?: InputMaybe<Scalars['String']>;
  /** ID of the expense that you are trying to edit */
  id: Scalars['String'];
  /** Tax ID, VAT number...etc This information will be printed on your invoice. */
  invoiceInfo?: InputMaybe<Scalars['String']>;
  /** The list of items for this expense. Total amount will be computed from them. */
  items?: InputMaybe<Array<InputMaybe<ExpenseItemInput>>>;
  /** Longer text to attach to the expense */
  longDescription?: InputMaybe<Scalars['String']>;
  /** Account to reimburse */
  payee?: InputMaybe<NewAccountOrReferenceInput>;
  /** The address of the payee */
  payeeLocation?: InputMaybe<LocationInput>;
  /** The payout method that will be used to reimburse the expense */
  payoutMethod?: InputMaybe<PayoutMethodInput>;
  /** A private note that will be attached to your invoice, as HTML */
  privateMessage?: InputMaybe<Scalars['String']>;
  /** Tags associated to the expense (ie. Food, Engineering...) */
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  /** The list of taxes that should be applied to the expense (VAT, GST, etc...) */
  tax?: InputMaybe<Array<InputMaybe<ExpenseTaxInput>>>;
  /** The type of the expense */
  type?: InputMaybe<ExpenseType>;
};

/** All supported expense types */
export enum FeesPayer {
  /** The collective will be responsible for paying the fees */
  Collective = 'COLLECTIVE',
  /** The payee will be responsible for paying the fees (they'll be deduced from the total amount) */
  Payee = 'PAYEE'
}

/** This represents an Project account */
export type Fund = Account & AccountWithContributions & AccountWithHost & {
  __typename?: 'Fund';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  /** Date of approval by the Fiscal Host. */
  approvedAt?: Maybe<Scalars['DateTime']>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  /**
   * Amount of money in cents in the currency of the account currently available to spend
   * @deprecated 2020/04/09 - Should not have been introduced. Use stats.balance.value
   */
  balance?: Maybe<Scalars['Int']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  contributionPolicy?: Maybe<Scalars['String']>;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** Returns the Fiscal Host */
  host?: Maybe<Host>;
  /** Fees percentage that the host takes for this collective */
  hostFeePercent?: Maybe<Scalars['Float']>;
  /** Describe how the host charges the collective */
  hostFeesStructure?: Maybe<HostFeeStructure>;
  id?: Maybe<Scalars['String']>;
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether it's active: can accept financial contributions and pay expenses. */
  isActive: Scalars['Boolean'];
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether it's approved by the Fiscal Host */
  isApproved: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived?: Maybe<Scalars['Boolean']>;
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost?: Maybe<Scalars['Boolean']>;
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId?: Maybe<Scalars['Int']>;
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Int'];
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug?: Maybe<Scalars['String']>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  tiers: TierCollection;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  twitterHandle?: Maybe<Scalars['String']>;
  type?: Maybe<AccountType>;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  website?: Maybe<Scalars['String']>;
};


/** This represents an Project account */
export type FundActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents an Project account */
export type FundBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Project account */
export type FundChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type FundContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Project account */
export type FundConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type FundConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Project account */
export type FundExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Project account */
export type FundHostFeePercentArgs = {
  paymentMethodService?: InputMaybe<PaymentMethodService>;
  paymentMethodType?: InputMaybe<PaymentMethodType>;
};


/** This represents an Project account */
export type FundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Project account */
export type FundMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Project account */
export type FundMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type FundMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Project account */
export type FundOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type FundOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** This represents an Project account */
export type FundPaymentMethodsArgs = {
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents an Project account */
export type FundTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type FundTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};


/** This represents an Project account */
export type FundTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** This represents an Project account */
export type FundUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type FundVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type FundVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type FundWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type FundCreateInput = {
  description: Scalars['String'];
  name: Scalars['String'];
  settings?: InputMaybe<Scalars['JSON']>;
  slug: Scalars['String'];
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};

/** Input type for guest contributions */
export type GuestInfoInput = {
  /** Captcha validation for creating an order */
  captcha?: InputMaybe<CaptchaInput>;
  /** Contributor's email */
  email: Scalars['EmailAddress'];
  /** Legal name of the user */
  legalName?: InputMaybe<Scalars['String']>;
  /** Address of the user, mandatory when amount is above $5000. */
  location?: InputMaybe<LocationInput>;
  /** Display name of the user */
  name?: InputMaybe<Scalars['String']>;
};

/** This represents an Host account */
export type Host = Account & AccountWithContributions & {
  __typename?: 'Host';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  /**
   * Amount of money in cents in the currency of the account currently available to spend
   * @deprecated 2020/04/09 - Should not have been introduced. Use stats.balance.value
   */
  balance?: Maybe<Scalars['Int']>;
  bankAccount?: Maybe<PayoutMethod>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  contributionPolicy?: Maybe<Scalars['String']>;
  contributionStats: ContributionStats;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  expenseStats: ExpenseStats;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  hostFeePercent?: Maybe<Scalars['Float']>;
  hostMetrics: HostMetrics;
  hostMetricsTimeSeries: HostMetricsTimeSeries;
  hostedVirtualCardCollectives: AccountCollection;
  hostedVirtualCardMerchants: AccountCollection;
  hostedVirtualCards: VirtualCardCollection;
  id?: Maybe<Scalars['String']>;
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether the account accepts financial contributions. */
  isActive?: Maybe<Scalars['Boolean']>;
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived?: Maybe<Scalars['Boolean']>;
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost?: Maybe<Scalars['Boolean']>;
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  isOpenToApplications?: Maybe<Scalars['Boolean']>;
  /** Returns whether the host is trusted or not */
  isTrustedHost: Scalars['Boolean'];
  legacyId?: Maybe<Scalars['Int']>;
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** If the host supports PayPal, this will contain the client ID to use in the frontend */
  paypalClientId?: Maybe<Scalars['String']>;
  /** Paypal preapproval info. Returns null if PayPal account is not connected. */
  paypalPreApproval?: Maybe<PaymentMethod>;
  /** Pending applications for this host */
  pendingApplications: HostApplicationCollection;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  plan: HostPlan;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Int'];
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug?: Maybe<Scalars['String']>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  /** The list of payment methods (Stripe, Paypal, manual bank transfer, etc ...) the Host can accept for its Collectives */
  supportedPaymentMethods?: Maybe<Array<Maybe<PaymentMethodLegacyType>>>;
  /** The list of payout methods this Host accepts for its expenses */
  supportedPayoutMethods?: Maybe<Array<Maybe<PayoutMethodType>>>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  termsUrl?: Maybe<Scalars['URL']>;
  tiers: TierCollection;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
  totalHostedCollectives?: Maybe<Scalars['Int']>;
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  /** Transferwise balances. Returns null if Transferwise account is not connected. */
  transferwiseBalances?: Maybe<Array<Maybe<Amount>>>;
  twitterHandle?: Maybe<Scalars['String']>;
  type?: Maybe<AccountType>;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  website?: Maybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents an Host account */
export type HostBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Host account */
export type HostChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Host account */
export type HostContributionStatsArgs = {
  account?: InputMaybe<Array<AccountReferenceInput>>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  timeUnit?: InputMaybe<TimeUnit>;
};


/** This represents an Host account */
export type HostContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Host account */
export type HostConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Host account */
export type HostExpenseStatsArgs = {
  account?: InputMaybe<Array<AccountReferenceInput>>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  timeUnit?: InputMaybe<TimeUnit>;
};


/** This represents an Host account */
export type HostExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Host account */
export type HostHostMetricsArgs = {
  account?: InputMaybe<Array<AccountReferenceInput>>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
};


/** This represents an Host account */
export type HostHostMetricsTimeSeriesArgs = {
  account?: InputMaybe<Array<AccountReferenceInput>>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  timeUnit?: InputMaybe<TimeUnit>;
};


/** This represents an Host account */
export type HostHostedVirtualCardCollectivesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Host account */
export type HostHostedVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Host account */
export type HostHostedVirtualCardsArgs = {
  collectiveAccountIds?: InputMaybe<Array<InputMaybe<AccountReferenceInput>>>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Host account */
export type HostMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Host account */
export type HostMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Host account */
export type HostOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Host account */
export type HostOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** This represents an Host account */
export type HostPaymentMethodsArgs = {
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents an Host account */
export type HostPendingApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Host account */
export type HostTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};


/** This represents an Host account */
export type HostTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** This represents an Host account */
export type HostUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Host account */
export type HostVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type HostApplication = {
  __typename?: 'HostApplication';
  /** The account who applied to this host */
  account: Account;
  /** The date on which the item was created */
  createdAt: Scalars['DateTime'];
  customData?: Maybe<Scalars['JSON']>;
  id: Scalars['String'];
  message?: Maybe<Scalars['String']>;
  status?: Maybe<HostApplicationStatus>;
};

/** A collection of "HostApplication" */
export type HostApplicationCollection = Collection & {
  __typename?: 'HostApplicationCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<HostApplication>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export enum HostApplicationStatus {
  Approved = 'APPROVED',
  Expired = 'EXPIRED',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

/** A collection of "Hosts" */
export type HostCollection = Collection & {
  __typename?: 'HostCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Host>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** All supported expense types */
export enum HostFeeStructure {
  /** Custom fee for this Collective only */
  CustomFee = 'CUSTOM_FEE',
  /** Use global host fees */
  Default = 'DEFAULT',
  /** Set a monthly retainer for this Collective */
  MonthlyRetainer = 'MONTHLY_RETAINER'
}

/** Host metrics related to collected and pending fees/tips. */
export type HostMetrics = {
  __typename?: 'HostMetrics';
  /** Amount in host fee shared with the platform */
  hostFeeShare?: Maybe<Amount>;
  /** Host fee sharing percent */
  hostFeeSharePercent?: Maybe<Scalars['Float']>;
  /** Amount collected in host fees for given period */
  hostFees?: Maybe<Amount>;
  /** Amount in host fee shared  requiring settlement */
  pendingHostFeeShare?: Maybe<Amount>;
  /** Amount collected in platform fees requiring settlement */
  pendingPlatformFees?: Maybe<Amount>;
  /** Amount collected in platform tips requiring settlement */
  pendingPlatformTips?: Maybe<Amount>;
  /** Amount collected in platform fees for given period */
  platformFees?: Maybe<Amount>;
  /** Amount collected in platform tips for given period */
  platformTips?: Maybe<Amount>;
  /** Amount in host fee shared not requiring settlement */
  settledHostFeeShare?: Maybe<Amount>;
  /** Total amount managed on behalf of hosted collectives */
  totalMoneyManaged?: Maybe<Amount>;
};

/** Host metrics time series */
export type HostMetricsTimeSeries = {
  __typename?: 'HostMetricsTimeSeries';
  /** The start date of the time series */
  dateFrom: Scalars['DateTime'];
  /** The end date of the time series */
  dateTo: Scalars['DateTime'];
  /** History of the share of host fees collected owed to Open Collective Inc. */
  hostFeeShare: TimeSeriesAmountWithSettlement;
  /** History of the host fees collected */
  hostFees: TimeSeriesAmount;
  /** History of the collected platform tips */
  platformTips: TimeSeriesAmount;
  /** The interval between two data points */
  timeUnit: TimeUnit;
  /** History of the total money managed by this host */
  totalMoneyManaged: TimeSeriesAmount;
  /** History of the total money received by this host */
  totalReceived: TimeSeriesAmountWithKind;
  /** History of the total money spent by this host */
  totalSpent: TimeSeriesAmountWithKind;
};

/** The name of the current plan and its characteristics. */
export type HostPlan = {
  __typename?: 'HostPlan';
  /** Whether this plan allows to use the added funds feature */
  addedFunds?: Maybe<Scalars['Int']>;
  /** Amount limit for the added funds feature under this plan */
  addedFundsLimit?: Maybe<Scalars['Int']>;
  /** Whether this plan allows to use the bank transfers feature */
  bankTransfers?: Maybe<Scalars['Int']>;
  /** Amount limit for the bank transfers feature under this plan */
  bankTransfersLimit?: Maybe<Scalars['Int']>;
  /** Whether this plan allows to use the host dashboard */
  hostDashboard?: Maybe<Scalars['Boolean']>;
  /** Charge on revenues made through Host Fees. */
  hostFeeSharePercent?: Maybe<Scalars['Float']>;
  /** Ability to charge Host Fees. */
  hostFees?: Maybe<Scalars['Boolean']>;
  /** Number of collectives hosted */
  hostedCollectives?: Maybe<Scalars['Int']>;
  /** Max number of collectives than can be hosted */
  hostedCollectivesLimit?: Maybe<Scalars['Int']>;
  /** The public id identifying the account (ie: 5v08jk63-w4g9nbpz-j7qmyder-p7ozax5g) */
  id?: Maybe<Scalars['String']>;
  /** Whether this plan allows to use the manual payments feature */
  manualPayments?: Maybe<Scalars['Boolean']>;
  /** The name of the plan */
  name?: Maybe<Scalars['String']>;
  /** Ability to collect Platform Tips. */
  platformTips?: Maybe<Scalars['Boolean']>;
  /** Whether this plan allows to use the transferwise payouts feature */
  transferwisePayouts?: Maybe<Scalars['Int']>;
  /** Amount limit for the transferwise payouts feature under this plan */
  transferwisePayoutsLimit?: Maybe<Scalars['Int']>;
};

export enum ImageFormat {
  Gif = 'gif',
  Jpg = 'jpg',
  Png = 'png',
  Svg = 'svg',
  Txt = 'txt'
}

/** This represents an Individual account */
export type Individual = Account & {
  __typename?: 'Individual';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Email for the account. For authenticated user: scope: "email". */
  email?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  hasSeenLatestChangelogEntry: Scalars['Boolean'];
  hasTwoFactorAuth?: Maybe<Scalars['Boolean']>;
  /** If the individual is a host account, this will return the matching Host object */
  host?: Maybe<Host>;
  id?: Maybe<Scalars['String']>;
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether the account accepts financial contributions. */
  isActive?: Maybe<Scalars['Boolean']>;
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived?: Maybe<Scalars['Boolean']>;
  isFollowingConversation: Scalars['Boolean'];
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  isGuest: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost?: Maybe<Scalars['Boolean']>;
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId?: Maybe<Scalars['Int']>;
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /**
   *
   *           Address. This field is public for hosts, otherwise:
   *             - Users can see their own address
   *             - Hosts can see the address of users submitting expenses to their collectives
   *
   */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  newsletterOptIn?: Maybe<Scalars['Boolean']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  oAuthAuthorizations?: Maybe<OAuthAuthorizationCollection>;
  orders: OrderCollection;
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug?: Maybe<Scalars['String']>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  twitterHandle?: Maybe<Scalars['String']>;
  type?: Maybe<AccountType>;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  website?: Maybe<Scalars['String']>;
};


/** This represents an Individual account */
export type IndividualActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents an Individual account */
export type IndividualBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Individual account */
export type IndividualChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Individual account */
export type IndividualConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents an Individual account */
export type IndividualConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Individual account */
export type IndividualExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Individual account */
export type IndividualImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Individual account */
export type IndividualIsFollowingConversationArgs = {
  id: Scalars['String'];
};


/** This represents an Individual account */
export type IndividualMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Individual account */
export type IndividualMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Individual account */
export type IndividualMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Individual account */
export type IndividualOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Individual account */
export type IndividualOAuthAuthorizationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Individual account */
export type IndividualOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** This represents an Individual account */
export type IndividualPaymentMethodsArgs = {
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents an Individual account */
export type IndividualTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** This represents an Individual account */
export type IndividualUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Individual account */
export type IndividualVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Individual account */
export type IndividualVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents an Individual account */
export type IndividualWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type IndividualCreateInput = {
  email: Scalars['String'];
  name: Scalars['String'];
};

export type InviteMemberInput = {
  description?: InputMaybe<Scalars['String']>;
  /** Reference to an account for the invitee */
  memberAccount?: InputMaybe<AccountReferenceInput>;
  /** Email and name of the invitee if no reference. */
  memberInfo?: InputMaybe<IndividualCreateInput>;
  /** Role of the invitee */
  role: MemberRole;
  since?: InputMaybe<Scalars['DateTime']>;
};

/** Type for a required legal document */
export enum LegalDocumentType {
  /** US tax form (W9) */
  UsTaxForm = 'US_TAX_FORM'
}

/** Type for Geographic location */
export type Location = {
  __typename?: 'Location';
  /** Postal address without country (eg. 12 opensource avenue, 7500 Paris) */
  address?: Maybe<Scalars['String']>;
  /** Two letters country code (eg. FR, BE...etc) */
  country?: Maybe<Scalars['String']>;
  /** Unique identifier for this location */
  id?: Maybe<Scalars['String']>;
  /** Latitude */
  lat?: Maybe<Scalars['Float']>;
  /** Longitude */
  long?: Maybe<Scalars['Float']>;
  /** A short name for the location (eg. Open Collective Headquarters) */
  name?: Maybe<Scalars['String']>;
  /** Structured JSON address */
  structured?: Maybe<Scalars['JSON']>;
};

/** Input type for Geographic location */
export type LocationInput = {
  /** Postal address without country (eg. 12 opensource avenue, 7500 Paris) */
  address?: InputMaybe<Scalars['String']>;
  /** Two letters country code (eg. FR, BE...etc) */
  country?: InputMaybe<CountryIso>;
  /** Latitude */
  lat?: InputMaybe<Scalars['Float']>;
  /** Longitude */
  long?: InputMaybe<Scalars['Float']>;
  /** A short name for the location (eg. Open Collective Headquarters) */
  name?: InputMaybe<Scalars['String']>;
  /** Structured JSON address */
  structured?: InputMaybe<Scalars['JSON']>;
};

/** This represents a Member relationship (ie: Organization backing a Collective) */
export type Member = {
  __typename?: 'Member';
  account?: Maybe<Account>;
  createdAt?: Maybe<Scalars['DateTime']>;
  /** Custom user description */
  description?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  /** Custom user message from member to the collective */
  publicMessage?: Maybe<Scalars['String']>;
  role?: Maybe<MemberRole>;
  since?: Maybe<Scalars['DateTime']>;
  tier?: Maybe<Tier>;
  /** Total amount donated */
  totalDonations: Amount;
  updatedAt?: Maybe<Scalars['DateTime']>;
};

/** A collection of "Members" (ie: Organization backing a Collective) */
export type MemberCollection = Collection & {
  __typename?: 'MemberCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Member>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** An invitation to join the members of a collective */
export type MemberInvitation = {
  __typename?: 'MemberInvitation';
  account: Account;
  createdAt: Scalars['DateTime'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  /** The person who invited the member, if any */
  inviter?: Maybe<Individual>;
  memberAccount: Account;
  role: MemberRole;
  since?: Maybe<Scalars['DateTime']>;
  tier?: Maybe<Tier>;
};

export type MemberInvitationReferenceInput = {
  /** The public id identifying the member invitation (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The internal id of the invitation (ie: 580) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

/** This represents a MemberOf relationship (ie: Collective backed by an Organization) */
export type MemberOf = {
  __typename?: 'MemberOf';
  account?: Maybe<Account>;
  createdAt?: Maybe<Scalars['DateTime']>;
  /** Custom user description */
  description?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  /** Custom user message from member to the collective */
  publicMessage?: Maybe<Scalars['String']>;
  role?: Maybe<MemberRole>;
  since?: Maybe<Scalars['DateTime']>;
  tier?: Maybe<Tier>;
  /** Total amount donated */
  totalDonations: Amount;
  updatedAt?: Maybe<Scalars['DateTime']>;
};

/** A collection of "MemberOf" (ie: Collective backed by an Organization) */
export type MemberOfCollection = Collection & {
  __typename?: 'MemberOfCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<MemberOf>>>;
  offset?: Maybe<Scalars['Int']>;
  roles?: Maybe<Array<Maybe<MemberOfCollectionRoles>>>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** An existing member role and account type combination used used to filter collections */
export type MemberOfCollectionRoles = {
  __typename?: 'MemberOfCollectionRoles';
  role: MemberRole;
  type: AccountType;
};

/** All member roles */
export enum MemberRole {
  Accountant = 'ACCOUNTANT',
  Admin = 'ADMIN',
  Attendee = 'ATTENDEE',
  Backer = 'BACKER',
  ConnectedAccount = 'CONNECTED_ACCOUNT',
  Contributor = 'CONTRIBUTOR',
  Follower = 'FOLLOWER',
  Fundraiser = 'FUNDRAISER',
  Host = 'HOST',
  Member = 'MEMBER'
}

export type MergeAccountsResponse = {
  __typename?: 'MergeAccountsResponse';
  /** The resulting account */
  account: Account;
  /** A message to display to the user about the result */
  message?: Maybe<Scalars['String']>;
};

/** This is the root mutation */
export type Mutation = {
  __typename?: 'Mutation';
  /** Add a new payment method to be used with an Order. Scope: "orders". */
  addCreditCard: CreditCardWithStripeError;
  /** Add an emoji reaction. Scope: "conversations", "expenses" or "updates". */
  addEmojiReaction: EmojiReactionResponse;
  /** Add funds to the given account. Scope: "host". */
  addFunds: Order;
  /**
   * Add platform tips to a transaction. Scope: "transactions".
   * @deprecated 2022-07-06: This feature will not be supported in the future. Please don't rely on it.
   */
  addPlatformTipToTransaction: Transaction;
  /** Add 2FA to the Individual if it does not have it. Scope: "account". */
  addTwoFactorAuthTokenToIndividual: AddTwoFactorAuthTokenToIndividualResponse;
  /** Apply to an host with a collective. Scope: "account". */
  applyToHost: Account;
  /** Assign Virtual Card information to existing hosted collective. Scope: "virtualCards". */
  assignNewVirtualCard: VirtualCard;
  /** [Root only] Ban accounts */
  banAccount: BanAccountResponse;
  /** Cancel an order. Scope: "orders". */
  cancelOrder?: Maybe<Order>;
  /** [Root only] Clears the cache for a given account */
  clearCacheForAccount: Account;
  /** Confirm a credit card is ready for use after strong customer authentication. Scope: "orders". */
  confirmCreditCard: CreditCardWithStripeError;
  /** Mark an account as confirmed */
  confirmGuestAccount: ConfirmGuestAccountResponse;
  /** Confirm an order (strong customer authentication). Scope: "orders". */
  confirmOrder: OrderWithPayment;
  createApplication?: Maybe<Application>;
  /** Create a Collective. Scope: "account". */
  createCollective?: Maybe<Collective>;
  /** Create a comment. Scope: "conversations", "expenses" or "updates". */
  createComment?: Maybe<Comment>;
  /** Connect external account to Open Collective Account. Scope: "connectedAccounts". */
  createConnectedAccount?: Maybe<ConnectedAccount>;
  /** Create a conversation. Scope: "conversations". */
  createConversation?: Maybe<Conversation>;
  /** Create an Event. Scope: "account". */
  createEvent?: Maybe<Event>;
  /** Submit an expense to a collective. Scope: "expenses". */
  createExpense: Expense;
  /** Create a Fund. Scope: "account". */
  createFund?: Maybe<Fund>;
  /** [Root only] Create a member entry directly. For non-root users, use `inviteMember` */
  createMember: Member;
  /** To submit a new order. Scope: "orders". */
  createOrder: OrderWithPayment;
  /** Create an Organization. Scope: "account". */
  createOrganization?: Maybe<Organization>;
  /** Create a new Payout Method to get paid through the platform. Scope: "expenses". */
  createPayoutMethod?: Maybe<PayoutMethod>;
  /** Create a Project. Scope: "account". */
  createProject?: Maybe<Project>;
  /** Create update. Scope: "updates". */
  createUpdate: Update;
  /** Create new Stripe Virtual Card for existing hosted collective. Scope: "virtualCards". */
  createVirtualCard: VirtualCard;
  /** Create webhook. Scope: "webhooks". */
  createWebhook?: Maybe<Webhook>;
  /** Adds or removes a policy on a given account. Scope: "account". */
  deleteAccount?: Maybe<Account>;
  deleteApplication?: Maybe<Application>;
  deleteComment?: Maybe<Comment>;
  /** Delete ConnectedAccount. Scope: "connectedAccounts". */
  deleteConnectedAccount?: Maybe<ConnectedAccount>;
  /** Delete an expense. Only work if the expense is rejected - please check permissions.canDelete. Scope: "expenses". */
  deleteExpense: Expense;
  /** Delete update. Scope: "updates". */
  deleteUpdate: Update;
  /** Delete Virtual Card. Scope: "virtualCards". */
  deleteVirtualCard?: Maybe<Scalars['Boolean']>;
  /** Delete webhook. Scope: "webhooks". */
  deleteWebhook?: Maybe<Webhook>;
  /** Persist an Expense as a draft and invite someone to edit and submit it. Scope: "expenses". */
  draftExpenseAndInviteUser: Expense;
  /** Edit key properties of an account. Scope: "account". */
  editAccount: Host;
  /** An endpoint for hosts to edit the fees structure of their hosted accounts. Scope: "host". */
  editAccountFeeStructure: Account;
  /** An endpoint for hosts to edit the freeze status of their hosted accounts. Scope: "host". */
  editAccountFreezeStatus: Account;
  /** Edit the settings for the given account. Scope: "account" or "host". */
  editAccountSetting: Account;
  /** Edit a comment. Scope: "conversations", "expenses" or "updates". */
  editComment?: Maybe<Comment>;
  /** Edit a conversation. Scope: "conversations". */
  editConversation?: Maybe<Conversation>;
  /** To update an existing expense */
  editExpense: Expense;
  /**
   * Update the plan. Scope: "account".
   * @deprecated 2022-07-06: Host Plans are deprecated.
   */
  editHostPlan: Host;
  /** Edit an existing member of the Collective. Scope: "account". */
  editMember: Member;
  /** Edit an existing member invitation of the Collective. Scope: "account". */
  editMemberInvitation?: Maybe<MemberInvitation>;
  /** Edit the public message for the given Member of a Collective. Scope: "account". */
  editPublicMessage: Member;
  /** Edit update. Scope: "updates". */
  editUpdate: Update;
  /** Edit existing Virtual Card information. Scope: "virtualCards". */
  editVirtualCard: VirtualCard;
  /** Returns true if user is following, false otherwise. Must be authenticated. Scope: "conversations". */
  followConversation?: Maybe<Scalars['Boolean']>;
  /** Invite a new member to the Collective. Scope: "account". */
  inviteMember: MemberInvitation;
  /** [Root only] Merge two accounts, returns the result account */
  mergeAccounts: MergeAccountsResponse;
  /** [Root only] A mutation to move expenses from one account to another */
  moveExpenses: Array<Maybe<Expense>>;
  /** [Root only] A mutation to move orders from one account to another */
  moveOrders: Array<Maybe<Order>>;
  /** Pause active Virtual Card. Scope: "virtualCards". */
  pauseVirtualCard: VirtualCard;
  /** Process the expense with the given action. Scope: "expenses". */
  processExpense: Expense;
  /** Reply to a host application. Scope: "host". */
  processHostApplication: ProcessHostApplicationResponse;
  /** A mutation for the host to approve or reject an order. Scope: "orders". */
  processPendingOrder: Order;
  /** Publish update. Scope: "updates". */
  publishUpdate: Update;
  /** Refunds a transaction. Scope: "transactions". */
  refundTransaction?: Maybe<Transaction>;
  /** Rejects transaction, removes member from Collective, and sends a message to the contributor. Scope: "transactions". */
  rejectTransaction: Transaction;
  /** Remove an emoji reaction. Scope: "conversations", "expenses" or "updates". */
  removeEmojiReaction: EmojiReactionResponse;
  /** [Root only] Removes the host for an account */
  removeHost: Account;
  /** Remove a member from the Collective. Scope: "account". */
  removeMember?: Maybe<Scalars['Boolean']>;
  /** Remove the given payout method. Scope: "expenses". */
  removePayoutMethod: PayoutMethod;
  /** Remove 2FA from the Individual if it has been enabled. Scope: "account". */
  removeTwoFactorAuthTokenFromIndividual: Individual;
  /** Endpoint to accept or reject an invitation to become a member. Scope: "account". */
  replyToMemberInvitation: Scalars['Boolean'];
  /** Request Virtual Card to host. Scope: "virtualCards". */
  requestVirtualCard?: Maybe<Scalars['Boolean']>;
  /** To re-send the invitation to complete a draft expense. Scope: "expenses". */
  resendDraftExpenseInvite: Expense;
  /** Resume paused Virtual Card. Scope: "virtualCards". */
  resumeVirtualCard: VirtualCard;
  /** Revoke an OAuth authorization. Scope: "account". */
  revokeOAuthAuthorization: OAuthAuthorization;
  /** Sends an email for guest to confirm their emails and create their Open Collective account */
  sendGuestConfirmationEmail: Scalars['Boolean'];
  /** Update the time which the user viewed the changelog updates. Scope: "account". */
  setChangelogViewDate: Individual;
  /** Set email notification subscription for requesting logged-in user */
  setEmailNotification?: Maybe<ActivitySubscription>;
  /** Update newsletter opt-in preference. Scope: "account". */
  setNewsletterOptIn: Individual;
  /** Adds or removes a policy on a given account. Scope: "account". */
  setPolicies: Account;
  /** Unpublish update. Scope: "updates". */
  unpublishUpdate: Update;
  updateApplication?: Maybe<Application>;
  /** Update an Order's amount, tier, or payment method. Scope: "orders". */
  updateOrder?: Maybe<Order>;
  /** Update webhook. Scope: "webhooks". */
  updateWebhook?: Maybe<Webhook>;
  /** To verify and unverified expense. Scope: "expenses". */
  verifyExpense: Expense;
};


/** This is the root mutation */
export type MutationAddCreditCardArgs = {
  account: AccountReferenceInput;
  creditCardInfo: CreditCardCreateInput;
  isSavedForLater?: InputMaybe<Scalars['Boolean']>;
  name: Scalars['String'];
};


/** This is the root mutation */
export type MutationAddEmojiReactionArgs = {
  comment?: InputMaybe<CommentReferenceInput>;
  emoji: Scalars['String'];
  update?: InputMaybe<UpdateReferenceInput>;
};


/** This is the root mutation */
export type MutationAddFundsArgs = {
  account: AccountReferenceInput;
  amount: AmountInput;
  description: Scalars['String'];
  fromAccount: AccountReferenceInput;
  hostFeePercent?: InputMaybe<Scalars['Float']>;
  invoiceTemplate?: InputMaybe<Scalars['String']>;
  tier?: InputMaybe<TierReferenceInput>;
};


/** This is the root mutation */
export type MutationAddPlatformTipToTransactionArgs = {
  amount: AmountInput;
  transaction: TransactionReferenceInput;
};


/** This is the root mutation */
export type MutationAddTwoFactorAuthTokenToIndividualArgs = {
  account: AccountReferenceInput;
  token: Scalars['String'];
};


/** This is the root mutation */
export type MutationApplyToHostArgs = {
  applicationData?: InputMaybe<Scalars['JSON']>;
  collective: AccountReferenceInput;
  host: AccountReferenceInput;
  inviteMembers?: InputMaybe<Array<InputMaybe<InviteMemberInput>>>;
  message?: InputMaybe<Scalars['String']>;
};


/** This is the root mutation */
export type MutationAssignNewVirtualCardArgs = {
  account: AccountReferenceInput;
  assignee: AccountReferenceInput;
  virtualCard: VirtualCardInput;
};


/** This is the root mutation */
export type MutationBanAccountArgs = {
  account: Array<AccountReferenceInput>;
  dryRun: Scalars['Boolean'];
  includeAssociatedAccounts: Scalars['Boolean'];
};


/** This is the root mutation */
export type MutationCancelOrderArgs = {
  order: OrderReferenceInput;
  reason?: InputMaybe<Scalars['String']>;
  reasonCode?: InputMaybe<Scalars['String']>;
};


/** This is the root mutation */
export type MutationClearCacheForAccountArgs = {
  account: AccountReferenceInput;
  type?: Array<InputMaybe<AccountCacheType>>;
};


/** This is the root mutation */
export type MutationConfirmCreditCardArgs = {
  paymentMethod: PaymentMethodReferenceInput;
};


/** This is the root mutation */
export type MutationConfirmGuestAccountArgs = {
  email: Scalars['EmailAddress'];
  emailConfirmationToken: Scalars['String'];
};


/** This is the root mutation */
export type MutationConfirmOrderArgs = {
  guestToken?: InputMaybe<Scalars['String']>;
  order: OrderReferenceInput;
};


/** This is the root mutation */
export type MutationCreateApplicationArgs = {
  application: ApplicationCreateInput;
};


/** This is the root mutation */
export type MutationCreateCollectiveArgs = {
  applicationData?: InputMaybe<Scalars['JSON']>;
  automateApprovalWithGithub?: InputMaybe<Scalars['Boolean']>;
  collective: CollectiveCreateInput;
  host?: InputMaybe<AccountReferenceInput>;
  inviteMembers?: InputMaybe<Array<InputMaybe<InviteMemberInput>>>;
  message?: InputMaybe<Scalars['String']>;
  skipDefaultAdmin?: InputMaybe<Scalars['Boolean']>;
  testPayload?: InputMaybe<Scalars['JSON']>;
  user?: InputMaybe<IndividualCreateInput>;
};


/** This is the root mutation */
export type MutationCreateCommentArgs = {
  comment: CommentCreateInput;
};


/** This is the root mutation */
export type MutationCreateConnectedAccountArgs = {
  account: AccountReferenceInput;
  connectedAccount: ConnectedAccountCreateInput;
};


/** This is the root mutation */
export type MutationCreateConversationArgs = {
  CollectiveId: Scalars['String'];
  html: Scalars['String'];
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  title: Scalars['String'];
};


/** This is the root mutation */
export type MutationCreateEventArgs = {
  account: AccountReferenceInput;
  event: EventCreateInput;
};


/** This is the root mutation */
export type MutationCreateExpenseArgs = {
  account: AccountReferenceInput;
  expense: ExpenseCreateInput;
  recurring?: InputMaybe<RecurringExpenseInput>;
};


/** This is the root mutation */
export type MutationCreateFundArgs = {
  fund: FundCreateInput;
  host?: InputMaybe<AccountReferenceInput>;
};


/** This is the root mutation */
export type MutationCreateMemberArgs = {
  account: AccountReferenceInput;
  description?: InputMaybe<Scalars['String']>;
  memberAccount: AccountReferenceInput;
  role: MemberRole;
  since?: InputMaybe<Scalars['DateTime']>;
};


/** This is the root mutation */
export type MutationCreateOrderArgs = {
  order: OrderCreateInput;
};


/** This is the root mutation */
export type MutationCreateOrganizationArgs = {
  organization: OrganizationCreateInput;
};


/** This is the root mutation */
export type MutationCreatePayoutMethodArgs = {
  account: AccountReferenceInput;
  payoutMethod: PayoutMethodInput;
};


/** This is the root mutation */
export type MutationCreateProjectArgs = {
  parent?: InputMaybe<AccountReferenceInput>;
  project: ProjectCreateInput;
};


/** This is the root mutation */
export type MutationCreateUpdateArgs = {
  update: UpdateCreateInput;
};


/** This is the root mutation */
export type MutationCreateVirtualCardArgs = {
  account: AccountReferenceInput;
  assignee: AccountReferenceInput;
  monthlyLimit: AmountInput;
  name: Scalars['String'];
};


/** This is the root mutation */
export type MutationCreateWebhookArgs = {
  webhook: WebhookCreateInput;
};


/** This is the root mutation */
export type MutationDeleteAccountArgs = {
  account: AccountReferenceInput;
};


/** This is the root mutation */
export type MutationDeleteApplicationArgs = {
  application: ApplicationReferenceInput;
};


/** This is the root mutation */
export type MutationDeleteCommentArgs = {
  id: Scalars['String'];
};


/** This is the root mutation */
export type MutationDeleteConnectedAccountArgs = {
  connectedAccount: ConnectedAccountReferenceInput;
};


/** This is the root mutation */
export type MutationDeleteExpenseArgs = {
  expense: ExpenseReferenceInput;
};


/** This is the root mutation */
export type MutationDeleteUpdateArgs = {
  id: Scalars['String'];
};


/** This is the root mutation */
export type MutationDeleteVirtualCardArgs = {
  virtualCard: VirtualCardReferenceInput;
};


/** This is the root mutation */
export type MutationDeleteWebhookArgs = {
  webhook: WebhookReferenceInput;
};


/** This is the root mutation */
export type MutationDraftExpenseAndInviteUserArgs = {
  account: AccountReferenceInput;
  expense: ExpenseInviteDraftInput;
};


/** This is the root mutation */
export type MutationEditAccountArgs = {
  account: AccountUpdateInput;
};


/** This is the root mutation */
export type MutationEditAccountFeeStructureArgs = {
  account: AccountReferenceInput;
  hostFeePercent: Scalars['Float'];
  isCustomFee: Scalars['Boolean'];
};


/** This is the root mutation */
export type MutationEditAccountFreezeStatusArgs = {
  account: AccountReferenceInput;
  action: AccountFreezeAction;
  message?: InputMaybe<Scalars['String']>;
};


/** This is the root mutation */
export type MutationEditAccountSettingArgs = {
  account: AccountReferenceInput;
  key: Scalars['AccountSettingsKey'];
  value: Scalars['JSON'];
};


/** This is the root mutation */
export type MutationEditCommentArgs = {
  comment: CommentUpdateInput;
};


/** This is the root mutation */
export type MutationEditConversationArgs = {
  id: Scalars['String'];
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  title: Scalars['String'];
};


/** This is the root mutation */
export type MutationEditExpenseArgs = {
  draftKey?: InputMaybe<Scalars['String']>;
  expense: ExpenseUpdateInput;
};


/** This is the root mutation */
export type MutationEditHostPlanArgs = {
  account: AccountReferenceInput;
  plan: Scalars['String'];
};


/** This is the root mutation */
export type MutationEditMemberArgs = {
  account: AccountReferenceInput;
  description?: InputMaybe<Scalars['String']>;
  memberAccount: AccountReferenceInput;
  role?: InputMaybe<MemberRole>;
  since?: InputMaybe<Scalars['DateTime']>;
};


/** This is the root mutation */
export type MutationEditMemberInvitationArgs = {
  account: AccountReferenceInput;
  description?: InputMaybe<Scalars['String']>;
  memberAccount: AccountReferenceInput;
  role?: InputMaybe<MemberRole>;
  since?: InputMaybe<Scalars['DateTime']>;
};


/** This is the root mutation */
export type MutationEditPublicMessageArgs = {
  fromAccount: AccountReferenceInput;
  message?: InputMaybe<Scalars['String']>;
  toAccount: AccountReferenceInput;
};


/** This is the root mutation */
export type MutationEditUpdateArgs = {
  update: UpdateUpdateInput;
};


/** This is the root mutation */
export type MutationEditVirtualCardArgs = {
  assignee?: InputMaybe<AccountReferenceInput>;
  monthlyLimit?: InputMaybe<AmountInput>;
  name?: InputMaybe<Scalars['String']>;
  virtualCard: VirtualCardReferenceInput;
};


/** This is the root mutation */
export type MutationFollowConversationArgs = {
  id: Scalars['String'];
  isActive?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root mutation */
export type MutationInviteMemberArgs = {
  account: AccountReferenceInput;
  description?: InputMaybe<Scalars['String']>;
  memberAccount: AccountReferenceInput;
  role: MemberRole;
  since?: InputMaybe<Scalars['DateTime']>;
};


/** This is the root mutation */
export type MutationMergeAccountsArgs = {
  dryRun?: Scalars['Boolean'];
  fromAccount: AccountReferenceInput;
  toAccount: AccountReferenceInput;
};


/** This is the root mutation */
export type MutationMoveExpensesArgs = {
  destinationAccount: AccountReferenceInput;
  expenses: Array<ExpenseReferenceInput>;
};


/** This is the root mutation */
export type MutationMoveOrdersArgs = {
  fromAccount?: InputMaybe<AccountReferenceInput>;
  makeIncognito?: InputMaybe<Scalars['Boolean']>;
  orders: Array<OrderReferenceInput>;
  tier?: InputMaybe<TierReferenceInput>;
};


/** This is the root mutation */
export type MutationPauseVirtualCardArgs = {
  virtualCard: VirtualCardReferenceInput;
};


/** This is the root mutation */
export type MutationProcessExpenseArgs = {
  action: ExpenseProcessAction;
  expense: ExpenseReferenceInput;
  message?: InputMaybe<Scalars['String']>;
  paymentParams?: InputMaybe<ProcessExpensePaymentParams>;
};


/** This is the root mutation */
export type MutationProcessHostApplicationArgs = {
  account: AccountReferenceInput;
  action: ProcessHostApplicationAction;
  host: AccountReferenceInput;
  message?: InputMaybe<Scalars['String']>;
};


/** This is the root mutation */
export type MutationProcessPendingOrderArgs = {
  action: ProcessOrderAction;
  order: OrderUpdateInput;
};


/** This is the root mutation */
export type MutationPublishUpdateArgs = {
  id: Scalars['String'];
  notificationAudience?: InputMaybe<UpdateAudience>;
};


/** This is the root mutation */
export type MutationRefundTransactionArgs = {
  transaction: TransactionReferenceInput;
};


/** This is the root mutation */
export type MutationRejectTransactionArgs = {
  message?: InputMaybe<Scalars['String']>;
  transaction: TransactionReferenceInput;
};


/** This is the root mutation */
export type MutationRemoveEmojiReactionArgs = {
  comment?: InputMaybe<CommentReferenceInput>;
  emoji: Scalars['String'];
  update?: InputMaybe<UpdateReferenceInput>;
};


/** This is the root mutation */
export type MutationRemoveHostArgs = {
  account: AccountReferenceInput;
};


/** This is the root mutation */
export type MutationRemoveMemberArgs = {
  account: AccountReferenceInput;
  isInvitation?: InputMaybe<Scalars['Boolean']>;
  memberAccount: AccountReferenceInput;
  role: MemberRole;
};


/** This is the root mutation */
export type MutationRemovePayoutMethodArgs = {
  payoutMethodId: Scalars['String'];
};


/** This is the root mutation */
export type MutationRemoveTwoFactorAuthTokenFromIndividualArgs = {
  account: AccountReferenceInput;
  code: Scalars['String'];
};


/** This is the root mutation */
export type MutationReplyToMemberInvitationArgs = {
  accept: Scalars['Boolean'];
  invitation: MemberInvitationReferenceInput;
};


/** This is the root mutation */
export type MutationRequestVirtualCardArgs = {
  account: AccountReferenceInput;
  budget?: InputMaybe<Scalars['Int']>;
  notes?: InputMaybe<Scalars['String']>;
  purpose?: InputMaybe<Scalars['String']>;
};


/** This is the root mutation */
export type MutationResendDraftExpenseInviteArgs = {
  expense: ExpenseReferenceInput;
};


/** This is the root mutation */
export type MutationResumeVirtualCardArgs = {
  virtualCard: VirtualCardReferenceInput;
};


/** This is the root mutation */
export type MutationRevokeOAuthAuthorizationArgs = {
  oAuthAuthorization: OAuthAuthorizationReferenceInput;
};


/** This is the root mutation */
export type MutationSendGuestConfirmationEmailArgs = {
  email: Scalars['EmailAddress'];
};


/** This is the root mutation */
export type MutationSetChangelogViewDateArgs = {
  changelogViewDate: Scalars['DateTime'];
};


/** This is the root mutation */
export type MutationSetEmailNotificationArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  active: Scalars['Boolean'];
  type: ActivityAndClassesType;
};


/** This is the root mutation */
export type MutationSetNewsletterOptInArgs = {
  newsletterOptIn: Scalars['Boolean'];
};


/** This is the root mutation */
export type MutationSetPoliciesArgs = {
  account: AccountReferenceInput;
  policies: Scalars['JSON'];
};


/** This is the root mutation */
export type MutationUnpublishUpdateArgs = {
  id: Scalars['String'];
};


/** This is the root mutation */
export type MutationUpdateApplicationArgs = {
  application: ApplicationUpdateInput;
};


/** This is the root mutation */
export type MutationUpdateOrderArgs = {
  amount?: InputMaybe<AmountInput>;
  order: OrderReferenceInput;
  paymentMethod?: InputMaybe<PaymentMethodReferenceInput>;
  paypalSubscriptionId?: InputMaybe<Scalars['String']>;
  tier?: InputMaybe<TierReferenceInput>;
};


/** This is the root mutation */
export type MutationUpdateWebhookArgs = {
  webhook: WebhookUpdateInput;
};


/** This is the root mutation */
export type MutationVerifyExpenseArgs = {
  draftKey?: InputMaybe<Scalars['String']>;
  expense: ExpenseReferenceInput;
};

export type NewAccountOrReferenceInput = {
  email?: InputMaybe<Scalars['String']>;
  /** The public id identifying the account (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  legalName?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  newsletterOptIn?: InputMaybe<Scalars['Boolean']>;
  organization?: InputMaybe<NewAccountOrganizationInput>;
  /** The slug identifying the account (ie: babel for https://opencollective.com/babel) */
  slug?: InputMaybe<Scalars['String']>;
};

export type NewAccountOrganizationInput = {
  description?: InputMaybe<Scalars['String']>;
  legalName?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  website?: InputMaybe<Scalars['String']>;
};

/** A collection of "Application" */
export type OAuthApplicationCollection = Collection & {
  __typename?: 'OAuthApplicationCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Application>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** An OAuth authorization */
export type OAuthAuthorization = {
  __typename?: 'OAuthAuthorization';
  account: Individual;
  application: Application;
  /** The time of creation */
  createdAt: Scalars['DateTime'];
  /** The time of expiration */
  expiresAt: Scalars['DateTime'];
  id?: Maybe<Scalars['String']>;
  /** The last time of token was used */
  lastUsedAt?: Maybe<Scalars['DateTime']>;
  /** The attached scopes. */
  scope?: Maybe<Array<Maybe<OAuthScope>>>;
  /** The time of last update */
  updatedAt: Scalars['DateTime'];
};

/** A collection of "OAuth Authorizations" */
export type OAuthAuthorizationCollection = Collection & {
  __typename?: 'OAuthAuthorizationCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<OAuthAuthorization>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export type OAuthAuthorizationReferenceInput = {
  /** The id identifying the OAuth Authorization (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
};

/** All supported OAuth scopes */
export enum OAuthScope {
  /** Manage your account, collectives and organizations. */
  Account = 'account',
  /** Create and manage OAuth applications. */
  Applications = 'applications',
  /** Create and manage connected accounts. */
  ConnectedAccounts = 'connectedAccounts',
  /** Create and manage conversations. */
  Conversations = 'conversations',
  /** Access your email address. */
  Email = 'email',
  /** Create and manage expenses, payout methods. */
  Expenses = 'expenses',
  /** Administrate fiscal hosts. */
  Host = 'host',
  /** Access your incognito account. */
  Incognito = 'incognito',
  /** Create and manage contributions, payment methods. */
  Orders = 'orders',
  /** Perform critical administrative operations.  */
  Root = 'root',
  /** Refund and reject recorded transactions. */
  Transactions = 'transactions',
  /** Create and manage updates. */
  Updates = 'updates',
  /** Create and manage virtual cards. */
  VirtualCards = 'virtualCards',
  /** Create and manage webhooks */
  Webhooks = 'webhooks'
}

/** Order model */
export type Order = {
  __typename?: 'Order';
  /** Base order amount (without platform tip) */
  amount: Amount;
  createdAt?: Maybe<Scalars['DateTime']>;
  /** Custom data related to the order, based on the fields described by tier.customFields. Must be authenticated as an admin of the fromAccount or toAccount (returns null otherwise) */
  customData?: Maybe<Scalars['JSON']>;
  /** Data related to the order */
  data?: Maybe<Scalars['JSON']>;
  description?: Maybe<Scalars['String']>;
  frequency?: Maybe<ContributionFrequency>;
  fromAccount?: Maybe<Account>;
  id: Scalars['String'];
  legacyId: Scalars['Int'];
  /** This represents a MemberOf relationship (ie: Collective backed by an Individual) attached to the Order. */
  membership?: Maybe<MemberOf>;
  nextChargeDate?: Maybe<Scalars['DateTime']>;
  paymentMethod?: Maybe<PaymentMethod>;
  /** The permissions given to current logged in user for this order */
  permissions: OrderPermissions;
  /** Platform Tip attached to the Order. */
  platformTipAmount?: Maybe<Amount>;
  platformTipEligible?: Maybe<Scalars['Boolean']>;
  quantity?: Maybe<Scalars['Int']>;
  status?: Maybe<OrderStatus>;
  tags: Array<Maybe<Scalars['String']>>;
  taxes: Array<Maybe<OrderTax>>;
  tier?: Maybe<Tier>;
  toAccount?: Maybe<Account>;
  /** Total order amount, including all taxes and platform tip */
  totalAmount: Amount;
  /** WARNING: Total amount donated between collectives, though there will be edge cases especially when looking on the Order level, as the order id is not used in calculating this. */
  totalDonations: Amount;
  /** Transactions for this order ordered by createdAt ASC */
  transactions: Array<Maybe<Transaction>>;
  updatedAt?: Maybe<Scalars['DateTime']>;
};

/** Possible fields you can use to order by */
export enum OrderByFieldType {
  /** The financial activity of the collective (number of transactions) */
  Activity = 'ACTIVITY',
  CreatedAt = 'CREATED_AT',
  MemberCount = 'MEMBER_COUNT',
  Rank = 'RANK',
  TotalContributed = 'TOTAL_CONTRIBUTED'
}

/** Input to order results */
export type OrderByInput = {
  /** Ordering direction. */
  direction: OrderDirection;
  /** Field to order by. */
  field: OrderByFieldType;
};

/** A collection of "Orders" */
export type OrderCollection = Collection & {
  __typename?: 'OrderCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Order>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** Some context about how an order was created */
export type OrderContextInput = {
  /** Whether this order was created using the embedded contribution flow */
  isEmbed?: InputMaybe<Scalars['Boolean']>;
};

/** Input to create a new order */
export type OrderCreateInput = {
  /** The contribution amount for 1 quantity, without platform contribution and taxes */
  amount: AmountInput;
  /** Some context about how this order was created */
  context?: InputMaybe<OrderContextInput>;
  /** If the tier has some "customFields", use this field to set their values */
  customData?: InputMaybe<Scalars['JSON']>;
  /** Data related to this order */
  data?: InputMaybe<Scalars['JSON']>;
  frequency: ContributionFrequency;
  /** The profile making the order. Can be null for guest contributions. */
  fromAccount?: InputMaybe<AccountReferenceInput>;
  /** Additional information about the contributing profile */
  fromAccountInfo?: InputMaybe<OrderFromAccountInfo>;
  /** Use this when fromAccount is null to pass the guest info */
  guestInfo?: InputMaybe<GuestInfoInput>;
  /** Whether this is transferring the remaining balance from a project/event/collective */
  isBalanceTransfer?: InputMaybe<Scalars['Boolean']>;
  /** The payment method used for this order */
  paymentMethod?: InputMaybe<PaymentMethodInput>;
  /** Platform tip attached to this order */
  platformTipAmount?: InputMaybe<AmountInput>;
  quantity?: Scalars['Int'];
  /** Tags associated to the order */
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  /** Use this field to set the taxes associated to this order */
  taxes?: InputMaybe<Array<InputMaybe<OrderTaxInput>>>;
  /** The tier you are contributing to */
  tier?: InputMaybe<TierReferenceInput>;
  /** The profile you want to contribute to */
  toAccount: AccountReferenceInput;
};

/** Possible directions in which to order a list of items */
export enum OrderDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

/** Some context about how an order was created */
export type OrderFromAccountInfo = {
  legalName?: InputMaybe<Scalars['String']>;
  /** The location of the contributor. Account location will be updated with this address if different from the existing one. */
  location?: InputMaybe<LocationInput>;
  name?: InputMaybe<Scalars['String']>;
};

/** Fields for the user permissions on an order */
export type OrderPermissions = {
  __typename?: 'OrderPermissions';
  /** Whether the current user can mark this order as expired */
  canMarkAsExpired: Scalars['Boolean'];
  /** Whether the current user can mark this order as unpaid */
  canMarkAsPaid: Scalars['Boolean'];
  id: Scalars['String'];
};

export type OrderReferenceInput = {
  /** The public id identifying the order (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The legacy public id identifying the order (ie: 4242) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

/** All order statuses */
export enum OrderStatus {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Error = 'ERROR',
  Expired = 'EXPIRED',
  New = 'NEW',
  Paid = 'PAID',
  Pending = 'PENDING',
  Pledged = 'PLEDGED',
  Rejected = 'REJECTED',
  RequireClientConfirmation = 'REQUIRE_CLIENT_CONFIRMATION'
}

export type OrderTax = {
  __typename?: 'OrderTax';
  percentage: Scalars['Int'];
  type: OrderTaxType;
};

/** Input to set taxes for an order */
export type OrderTaxInput = {
  amount: AmountInput;
  /** Country of the account ordering, to know from where to apply the tax */
  country?: InputMaybe<CountryIso>;
  /** Tax identification number, if any */
  idNumber?: InputMaybe<Scalars['String']>;
  type: OrderTaxType;
};

/** The type of a tax like GST, VAT, etc */
export enum OrderTaxType {
  /** New Zealand Good and Services Tax */
  Gst = 'GST',
  /** European Value Added Tax */
  Vat = 'VAT'
}

export type OrderUpdateInput = {
  /** Amount received by collective, excluding any tips or fees */
  amount?: InputMaybe<AmountInput>;
  /** Host fee percent to be applied to the order */
  hostFeePercent?: InputMaybe<Scalars['Float']>;
  /** The public id identifying the order (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The legacy public id identifying the order (ie: 4242) */
  legacyId?: InputMaybe<Scalars['Int']>;
  /** Amount paid in fees for the payment processor */
  paymentProcessorFee?: InputMaybe<AmountInput>;
  /** Amount intended as tip for the platform */
  platformTip?: InputMaybe<AmountInput>;
};

export type OrderWithPayment = {
  __typename?: 'OrderWithPayment';
  /** If donating as a guest, this will contain your guest token to confirm your order */
  guestToken?: Maybe<Scalars['String']>;
  /** The order created */
  order: Order;
  /** This field will be set if the order was created but there was an error with Stripe during the payment */
  stripeError?: Maybe<StripeError>;
};

/** This represents an Organization account */
export type Organization = Account & AccountWithContributions & {
  __typename?: 'Organization';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  /**
   * Amount of money in cents in the currency of the collective currently available to spend
   * @deprecated 2020/04/09 - Should not have been introduced. Use stats.balance.value
   */
  balance?: Maybe<Scalars['Int']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  contributionPolicy?: Maybe<Scalars['String']>;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** @deprecated 2022-07-18: This field is deprecated and will return null */
  email?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** If the organization if a host account, this will return the matching Host object */
  host?: Maybe<Host>;
  id?: Maybe<Scalars['String']>;
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether the account accepts financial contributions. */
  isActive?: Maybe<Scalars['Boolean']>;
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived?: Maybe<Scalars['Boolean']>;
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost?: Maybe<Scalars['Boolean']>;
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId?: Maybe<Scalars['Int']>;
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /**
   *
   *           Address. This field is public for hosts, otherwise:
   *             - Users can see the addresses of the collectives they're admin of; if they are not an admin they can only see the country that the org belong to.
   *             - Hosts can see the address of organizations submitting expenses to their collectives.
   *
   */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Int'];
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug?: Maybe<Scalars['String']>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  tiers: TierCollection;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  twitterHandle?: Maybe<Scalars['String']>;
  type?: Maybe<AccountType>;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  website?: Maybe<Scalars['String']>;
};


/** This represents an Organization account */
export type OrganizationActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents an Organization account */
export type OrganizationBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Organization account */
export type OrganizationChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Organization account */
export type OrganizationContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Organization account */
export type OrganizationConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents an Organization account */
export type OrganizationConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Organization account */
export type OrganizationExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Organization account */
export type OrganizationImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Organization account */
export type OrganizationMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Organization account */
export type OrganizationMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Organization account */
export type OrganizationMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Organization account */
export type OrganizationOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Organization account */
export type OrganizationOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** This represents an Organization account */
export type OrganizationPaymentMethodsArgs = {
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents an Organization account */
export type OrganizationTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Organization account */
export type OrganizationTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};


/** This represents an Organization account */
export type OrganizationTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** This represents an Organization account */
export type OrganizationUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Organization account */
export type OrganizationVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Organization account */
export type OrganizationVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents an Organization account */
export type OrganizationWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type OrganizationCreateInput = {
  description: Scalars['String'];
  legalName?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  settings?: InputMaybe<Scalars['JSON']>;
  slug: Scalars['String'];
  website?: InputMaybe<Scalars['String']>;
};

/** PaymentMethod model */
export type PaymentMethod = {
  __typename?: 'PaymentMethod';
  account?: Maybe<Account>;
  /** Returns the balance amount and the currency of this paymentMethod */
  balance: Amount;
  createdAt?: Maybe<Scalars['DateTime']>;
  data?: Maybe<Scalars['JSON']>;
  expiryDate?: Maybe<Scalars['DateTime']>;
  id?: Maybe<Scalars['String']>;
  legacyId?: Maybe<Scalars['Int']>;
  limitedToHosts?: Maybe<Array<Maybe<Host>>>;
  name?: Maybe<Scalars['String']>;
  /**
   * Defines the type of the payment method. Meant to be moved to "type" in the future.
   * @deprecated 2021-03-02: Please use service + type
   */
  providerType?: Maybe<PaymentMethodLegacyType>;
  service?: Maybe<PaymentMethodService>;
  /** For gift cards, this field will return to the source payment method */
  sourcePaymentMethod?: Maybe<PaymentMethod>;
  type?: Maybe<PaymentMethodType>;
};

/** An input to use for creating or retrieving payment methods */
export type PaymentMethodInput = {
  /** When creating a credit card, use this field to set its info */
  creditCardInfo?: InputMaybe<CreditCardCreateInput>;
  /** The id assigned to the payment method */
  id?: InputMaybe<Scalars['String']>;
  /** Whether this payment method should be saved for future payments */
  isSavedForLater?: InputMaybe<Scalars['Boolean']>;
  /** Name of this payment method */
  name?: InputMaybe<Scalars['String']>;
  /** To pass when type is PAYPAL */
  paypalInfo?: InputMaybe<PaypalPaymentInput>;
  /** Service of this payment method */
  service?: InputMaybe<PaymentMethodService>;
  /** Type of this payment method */
  type?: InputMaybe<PaymentMethodType>;
};

export enum PaymentMethodLegacyType {
  AccountBalance = 'ACCOUNT_BALANCE',
  AddedFunds = 'ADDED_FUNDS',
  Alipay = 'ALIPAY',
  BankTransfer = 'BANK_TRANSFER',
  CreditCard = 'CREDIT_CARD',
  Crypto = 'CRYPTO',
  GiftCard = 'GIFT_CARD',
  Paypal = 'PAYPAL',
  PrepaidBudget = 'PREPAID_BUDGET'
}

export type PaymentMethodReferenceInput = {
  /** The id assigned to the payment method */
  id?: InputMaybe<Scalars['String']>;
};

export enum PaymentMethodService {
  Opencollective = 'OPENCOLLECTIVE',
  Paypal = 'PAYPAL',
  Prepaid = 'PREPAID',
  Stripe = 'STRIPE',
  Thegivingblock = 'THEGIVINGBLOCK'
}

export enum PaymentMethodType {
  Adaptive = 'ADAPTIVE',
  Alipay = 'ALIPAY',
  Collective = 'COLLECTIVE',
  Creditcard = 'CREDITCARD',
  Crypto = 'CRYPTO',
  Giftcard = 'GIFTCARD',
  Host = 'HOST',
  Manual = 'MANUAL',
  Payment = 'PAYMENT',
  Prepaid = 'PREPAID',
  Subscription = 'SUBSCRIPTION',
  /** @deprecated Please use uppercase values */
  Adaptive = 'adaptive',
  /** @deprecated Please use uppercase values */
  Alipay = 'alipay',
  /** @deprecated Please use uppercase values */
  Collective = 'collective',
  /** @deprecated Please use uppercase values */
  Creditcard = 'creditcard',
  /** @deprecated Please use uppercase values */
  Crypto = 'crypto',
  /** @deprecated Please use uppercase values */
  Giftcard = 'giftcard',
  /** @deprecated Please use uppercase values */
  Host = 'host',
  /** @deprecated Please use uppercase values */
  Manual = 'manual',
  /** @deprecated Please use uppercase values */
  Payment = 'payment',
  /** @deprecated Please use uppercase values */
  Prepaid = 'prepaid',
  /** @deprecated Please use uppercase values */
  Subscription = 'subscription'
}

/** A payout method */
export type PayoutMethod = {
  __typename?: 'PayoutMethod';
  /** The actual data for this payout method. Content depends on the type. */
  data?: Maybe<Scalars['JSON']>;
  /** Unique identifier for this payout method */
  id: Scalars['String'];
  /** Whether this payout method has been saved to be used for future payouts */
  isSaved?: Maybe<Scalars['Boolean']>;
  /** A friendly name for users to easily find their payout methods */
  name?: Maybe<Scalars['String']>;
  /** The type of this payout method (usually the payment provider) */
  type?: Maybe<PayoutMethodType>;
};

export type PayoutMethodInput = {
  data?: InputMaybe<Scalars['JSON']>;
  id?: InputMaybe<Scalars['String']>;
  isSaved?: InputMaybe<Scalars['Boolean']>;
  name?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<PayoutMethodType>;
};

export enum PayoutMethodType {
  AccountBalance = 'ACCOUNT_BALANCE',
  BankAccount = 'BANK_ACCOUNT',
  CreditCard = 'CREDIT_CARD',
  Other = 'OTHER',
  Paypal = 'PAYPAL'
}

export type PaypalPaymentInput = {
  data?: InputMaybe<Scalars['JSON']>;
  orderId?: InputMaybe<Scalars['String']>;
  subscriptionId?: InputMaybe<Scalars['String']>;
  token?: InputMaybe<Scalars['String']>;
};

/** A PayPal plan to associate with a contribution */
export type PaypalPlan = {
  __typename?: 'PaypalPlan';
  id: Scalars['String'];
};

export type Permission = {
  __typename?: 'Permission';
  allowed: Scalars['Boolean'];
  reason?: Maybe<Scalars['String']>;
};

export type Policies = {
  __typename?: 'Policies';
  COLLECTIVE_MINIMUM_ADMINS?: Maybe<Collective_Minimum_Admins>;
  EXPENSE_AUTHOR_CANNOT_APPROVE?: Maybe<Scalars['Boolean']>;
};

/** Parameters for paying an expense */
export type ProcessExpensePaymentParams = {
  /** 2FA code for if the host account has 2FA for payouts turned on. */
  feesPayer?: InputMaybe<FeesPayer>;
  /** Bypass automatic integrations (ie. PayPal, Transferwise) to process the expense manually */
  forceManual?: InputMaybe<Scalars['Boolean']>;
  /** The fee charged by payment processor in collective currency */
  paymentProcessorFee?: InputMaybe<Scalars['Int']>;
  /** Whether the payment processor fees should be refunded when triggering MARK_AS_UNPAID */
  shouldRefundPaymentProcessorFee?: InputMaybe<Scalars['Boolean']>;
  /** 2FA code for if the host account has 2FA for payouts turned on. */
  twoFactorAuthenticatorCode?: InputMaybe<Scalars['String']>;
};

/** Action taken for an account application to the host */
export enum ProcessHostApplicationAction {
  /** Approve the account request to be hosted */
  Approve = 'APPROVE',
  /** Rejects the account request to be hosted */
  Reject = 'REJECT',
  /** Sends a private message to the admins of the account */
  SendPrivateMessage = 'SEND_PRIVATE_MESSAGE',
  /** Creates a public conversation */
  SendPublicMessage = 'SEND_PUBLIC_MESSAGE'
}

export type ProcessHostApplicationResponse = {
  __typename?: 'ProcessHostApplicationResponse';
  /** The account that applied to the host */
  account: Account;
  /** When sending a public message, this field will have the info about the conversation created */
  conversation?: Maybe<Conversation>;
};

/** Action to apply on the order */
export enum ProcessOrderAction {
  /** To mark the order as expired */
  MarkAsExpired = 'MARK_AS_EXPIRED',
  /** To mark the order as paid */
  MarkAsPaid = 'MARK_AS_PAID'
}

/** This represents an Project account */
export type Project = Account & AccountWithContributions & AccountWithHost & AccountWithParent & {
  __typename?: 'Project';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  /** Date of approval by the Fiscal Host. */
  approvedAt?: Maybe<Scalars['DateTime']>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  /**
   * Amount of money in cents in the currency of the account currently available to spend
   * @deprecated 2020/04/09 - Should not have been introduced. Use stats.balance.value
   */
  balance?: Maybe<Scalars['Int']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  contributionPolicy?: Maybe<Scalars['String']>;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** Returns the Fiscal Host */
  host?: Maybe<Host>;
  /** Fees percentage that the host takes for this collective */
  hostFeePercent?: Maybe<Scalars['Float']>;
  /** Describe how the host charges the collective */
  hostFeesStructure?: Maybe<HostFeeStructure>;
  id?: Maybe<Scalars['String']>;
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether it's active: can accept financial contributions and pay expenses. */
  isActive: Scalars['Boolean'];
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether it's approved by the Fiscal Host */
  isApproved: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived?: Maybe<Scalars['Boolean']>;
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost?: Maybe<Scalars['Boolean']>;
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId?: Maybe<Scalars['Int']>;
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  /** The Account parenting this account */
  parent?: Maybe<Account>;
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Int'];
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug?: Maybe<Scalars['String']>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  tiers: TierCollection;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  twitterHandle?: Maybe<Scalars['String']>;
  type?: Maybe<AccountType>;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  website?: Maybe<Scalars['String']>;
};


/** This represents an Project account */
export type ProjectActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents an Project account */
export type ProjectBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Project account */
export type ProjectChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type ProjectContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Project account */
export type ProjectConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type ProjectConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Project account */
export type ProjectExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Project account */
export type ProjectHostFeePercentArgs = {
  paymentMethodService?: InputMaybe<PaymentMethodService>;
  paymentMethodType?: InputMaybe<PaymentMethodType>;
};


/** This represents an Project account */
export type ProjectImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Project account */
export type ProjectMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Project account */
export type ProjectMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type ProjectMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Project account */
export type ProjectOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type ProjectOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** This represents an Project account */
export type ProjectPaymentMethodsArgs = {
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents an Project account */
export type ProjectTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type ProjectTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};


/** This represents an Project account */
export type ProjectTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** This represents an Project account */
export type ProjectUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type ProjectVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type ProjectVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type ProjectWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type ProjectCreateInput = {
  description: Scalars['String'];
  name: Scalars['String'];
  settings?: InputMaybe<Scalars['JSON']>;
  slug: Scalars['String'];
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};

/** This is the root query */
export type Query = {
  __typename?: 'Query';
  account?: Maybe<Account>;
  accounts: AccountCollection;
  activities: ActivityCollection;
  application?: Maybe<Application>;
  collective?: Maybe<Collective>;
  conversation?: Maybe<Conversation>;
  event?: Maybe<Event>;
  expense?: Maybe<Expense>;
  expenses: ExpenseCollection;
  fund?: Maybe<Fund>;
  host?: Maybe<Host>;
  hosts?: Maybe<HostCollection>;
  individual?: Maybe<Individual>;
  loggedInAccount?: Maybe<Individual>;
  me?: Maybe<Individual>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  order?: Maybe<Order>;
  orders: OrderCollection;
  organization?: Maybe<Organization>;
  paypalPlan: PaypalPlan;
  project?: Maybe<Project>;
  tagStats: TagStatsCollection;
  tier?: Maybe<Tier>;
  transactions: TransactionCollection;
  update?: Maybe<Update>;
};


/** This is the root query */
export type QueryAccountArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryAccountsArgs = {
  country?: InputMaybe<Array<InputMaybe<CountryIso>>>;
  hasCustomContributionsEnabled?: InputMaybe<Scalars['Boolean']>;
  isActive?: InputMaybe<Scalars['Boolean']>;
  isHost?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<OrderByInput>;
  searchTerm?: InputMaybe<Scalars['String']>;
  skipRecentAccounts?: InputMaybe<Scalars['Boolean']>;
  tag?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  type?: InputMaybe<Array<InputMaybe<AccountType>>>;
};


/** This is the root query */
export type QueryActivitiesArgs = {
  account: AccountReferenceInput;
  attribution?: InputMaybe<ActivityAttribution>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  type?: InputMaybe<Array<ActivityAndClassesType>>;
};


/** This is the root query */
export type QueryApplicationArgs = {
  clientId?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  legacyId?: InputMaybe<Scalars['Int']>;
};


/** This is the root query */
export type QueryCollectiveArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryConversationArgs = {
  id: Scalars['String'];
};


/** This is the root query */
export type QueryEventArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryExpenseArgs = {
  draftKey?: InputMaybe<Scalars['String']>;
  expense?: InputMaybe<ExpenseReferenceInput>;
};


/** This is the root query */
export type QueryExpensesArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenExpenses?: Scalars['Boolean'];
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  payoutMethodType?: InputMaybe<PayoutMethodType>;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<ExpenseStatusFilter>;
  tag?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  type?: InputMaybe<ExpenseType>;
};


/** This is the root query */
export type QueryFundArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryHostArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryHostsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};


/** This is the root query */
export type QueryIndividualArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This is the root query */
export type QueryOrderArgs = {
  order: OrderReferenceInput;
};


/** This is the root query */
export type QueryOrdersArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** This is the root query */
export type QueryOrganizationArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryPaypalPlanArgs = {
  account: AccountReferenceInput;
  amount: AmountInput;
  frequency: ContributionFrequency;
  tier?: InputMaybe<TierReferenceInput>;
};


/** This is the root query */
export type QueryProjectArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryTagStatsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This is the root query */
export type QueryTierArgs = {
  throwIfMissing?: Scalars['Boolean'];
  tier: TierReferenceInput;
};


/** This is the root query */
export type QueryTransactionsArgs = {
  account?: InputMaybe<Array<AccountReferenceInput>>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** This is the root query */
export type QueryUpdateArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
};

/** A recurring expense object */
export type RecurringExpense = {
  __typename?: 'RecurringExpense';
  account: Account;
  /** The time this expense will cease to be recurring */
  endsAt?: Maybe<Scalars['DateTime']>;
  fromAccount: Account;
  /** Unique identifier for this recurring expense */
  id: Scalars['String'];
  /** The interval in which this recurring expense is created */
  interval: RecurringExpenseInterval;
  /** The last time this recurring expense was paid for */
  lastDraftedAt: Scalars['DateTime'];
  /** The last expense created by this recurring expense record paid for */
  lastExpenseCreated?: Maybe<Expense>;
};

export type RecurringExpenseInput = {
  /** The date when this recurring expense should cease */
  endsAt?: InputMaybe<Scalars['DateTime']>;
  /** The interval in which this recurring expense is created */
  interval: RecurringExpenseInterval;
};

/** All supported intervals for recurring expenses */
export enum RecurringExpenseInterval {
  Day = 'day',
  Month = 'month',
  Quarter = 'quarter',
  Week = 'week',
  Year = 'year'
}

export type StripeError = {
  __typename?: 'StripeError';
  account?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
  response?: Maybe<Scalars['JSON']>;
};

/** Statistics for a given tag */
export type TagStat = {
  __typename?: 'TagStat';
  /** Total amount for this tag */
  amount: Amount;
  /** Number of entries for this tag */
  count: Scalars['Int'];
  /** An unique identifier for this tag */
  id: Scalars['String'];
  /** Name/Label of the tag */
  tag: Scalars['String'];
};

/** A collection of "Tags" */
export type TagStatsCollection = Collection & {
  __typename?: 'TagStatsCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<TagStat>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** Information about a tax */
export type TaxInfo = {
  __typename?: 'TaxInfo';
  /** An unique identifier for this tax (GST, VAT, etc) */
  id: Scalars['String'];
  /** Tax ID number of the 3rd party receiving/paying the tax */
  idNumber?: Maybe<Scalars['String']>;
  /**
   * Percentage applied, between 0-100
   * @deprecated Please use `rate` instead
   */
  percentage: Scalars['Int'];
  /** Percentage applied, between 0-100 */
  rate: Scalars['Float'];
  /** Identifier for this tax (GST, VAT, etc) */
  type: OrderTaxType;
};

/** The type of a tax like GST, VAT, etc */
export enum TaxType {
  /** New Zealand Good and Services Tax */
  Gst = 'GST',
  /** European Value Added Tax */
  Vat = 'VAT'
}

/** Tier model */
export type Tier = {
  __typename?: 'Tier';
  amount: Amount;
  amountType: TierAmountType;
  /** Number of tickets available. Returns null if there is no limit. */
  availableQuantity?: Maybe<Scalars['Int']>;
  customFields?: Maybe<Scalars['JSON']>;
  description?: Maybe<Scalars['String']>;
  endsAt?: Maybe<Scalars['DateTime']>;
  frequency: TierFrequency;
  id: Scalars['String'];
  /** @deprecated 2020-08-24: Please use "frequency" */
  interval?: Maybe<TierInterval>;
  invoiceTemplate?: Maybe<Scalars['String']>;
  legacyId: Scalars['Int'];
  maxQuantity?: Maybe<Scalars['Int']>;
  minimumAmount: Amount;
  name?: Maybe<Scalars['String']>;
  /** Get all orders */
  orders: OrderCollection;
  presets?: Maybe<Array<Maybe<Scalars['Int']>>>;
  slug?: Maybe<Scalars['String']>;
  type: TierType;
};


/** Tier model */
export type TierOrdersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};

export enum TierAmountType {
  Fixed = 'FIXED',
  Flexible = 'FLEXIBLE'
}

/** A collection of "Tiers" */
export type TierCollection = Collection & {
  __typename?: 'TierCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Tier>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export enum TierFrequency {
  Flexible = 'FLEXIBLE',
  Monthly = 'MONTHLY',
  Onetime = 'ONETIME',
  Yearly = 'YEARLY'
}

export enum TierInterval {
  Flexible = 'flexible',
  Month = 'month',
  Year = 'year'
}

export type TierReferenceInput = {
  /** The id assigned to the Tier */
  id?: InputMaybe<Scalars['String']>;
  /** Pass this flag to reference the custom tier (/donate) */
  isCustom?: InputMaybe<Scalars['Boolean']>;
  /** The DB id assigned to the Tier */
  legacyId?: InputMaybe<Scalars['Int']>;
};

export enum TierType {
  Donation = 'DONATION',
  Membership = 'MEMBERSHIP',
  Product = 'PRODUCT',
  Service = 'SERVICE',
  Ticket = 'TICKET',
  Tier = 'TIER'
}

export type TimeSeries = {
  /** The start date of the time series */
  dateFrom: Scalars['DateTime'];
  /** The end date of the time series */
  dateTo: Scalars['DateTime'];
  /** The interval between two data points */
  timeUnit: TimeUnit;
};

/** Amount time series */
export type TimeSeriesAmount = TimeSeries & {
  __typename?: 'TimeSeriesAmount';
  /** The start date of the time series */
  dateFrom: Scalars['DateTime'];
  /** The end date of the time series */
  dateTo: Scalars['DateTime'];
  /** Time series data points */
  nodes: Array<TimeSeriesAmountNode>;
  /** The interval between two data points */
  timeUnit: TimeUnit;
};

export type TimeSeriesAmountNode = {
  __typename?: 'TimeSeriesAmountNode';
  amount: Amount;
  date: Scalars['DateTime'];
  label?: Maybe<Scalars['String']>;
};

/** Amounts with settlements time series */
export type TimeSeriesAmountWithKind = TimeSeries & {
  __typename?: 'TimeSeriesAmountWithKind';
  /** The start date of the time series */
  dateFrom: Scalars['DateTime'];
  /** The end date of the time series */
  dateTo: Scalars['DateTime'];
  /** Time series data points */
  nodes: Array<TimeSeriesAmountWithKindNode>;
  /** The interval between two data points */
  timeUnit: TimeUnit;
};

export type TimeSeriesAmountWithKindNode = {
  __typename?: 'TimeSeriesAmountWithKindNode';
  amount: Amount;
  date: Scalars['DateTime'];
  kind: TransactionKind;
};

/** Amounts with settlements time series */
export type TimeSeriesAmountWithSettlement = TimeSeries & {
  __typename?: 'TimeSeriesAmountWithSettlement';
  /** The start date of the time series */
  dateFrom: Scalars['DateTime'];
  /** The end date of the time series */
  dateTo: Scalars['DateTime'];
  /** Time series data points */
  nodes: Array<TimeSeriesAmountWithSettlementNode>;
  /** The interval between two data points */
  timeUnit: TimeUnit;
};

export type TimeSeriesAmountWithSettlementNode = {
  __typename?: 'TimeSeriesAmountWithSettlementNode';
  amount: Amount;
  date: Scalars['DateTime'];
  settlementStatus: TransactionSettlementStatus;
};

export enum TimeUnit {
  Day = 'DAY',
  Hour = 'HOUR',
  Minute = 'MINUTE',
  Month = 'MONTH',
  Second = 'SECOND',
  Week = 'WEEK',
  Year = 'YEAR'
}

/** Transaction interface shared by all kind of transactions (Debit, Credit) */
export type Transaction = {
  account?: Maybe<Account>;
  amount: Amount;
  amountInHostCurrency: Amount;
  /** The balance after the Transaction has run. Only for financially active accounts. */
  balanceInHostCurrency?: Maybe<Amount>;
  createdAt?: Maybe<Scalars['DateTime']>;
  description?: Maybe<Scalars['String']>;
  expense?: Maybe<Expense>;
  /** The sender of a transaction (on CREDIT = oppositeAccount, DEBIT = account) */
  fromAccount?: Maybe<Account>;
  giftCardEmitterAccount?: Maybe<Account>;
  group: Scalars['String'];
  host?: Maybe<Account>;
  /** Exchange rate between the currency of the transaction and the currency of the host (transaction.amount * transaction.hostCurrencyFxRate = transaction.amountInHostCurrency) */
  hostCurrencyFxRate?: Maybe<Scalars['Float']>;
  hostFee?: Maybe<Amount>;
  id: Scalars['String'];
  invoiceTemplate?: Maybe<Scalars['String']>;
  isOrderRejected: Scalars['Boolean'];
  isRefund?: Maybe<Scalars['Boolean']>;
  isRefunded?: Maybe<Scalars['Boolean']>;
  kind?: Maybe<TransactionKind>;
  legacyId: Scalars['Int'];
  /** Merchant id related to the Transaction (Stripe, PayPal, Wise, Privacy) */
  merchantId?: Maybe<Scalars['String']>;
  netAmount: Amount;
  netAmountInHostCurrency: Amount;
  oppositeAccount?: Maybe<Account>;
  order?: Maybe<Order>;
  paymentMethod?: Maybe<PaymentMethod>;
  paymentProcessorFee?: Maybe<Amount>;
  payoutMethod?: Maybe<PayoutMethod>;
  permissions?: Maybe<TransactionPermissions>;
  platformFee: Amount;
  refundTransaction?: Maybe<Transaction>;
  relatedTransactions: Array<Maybe<Transaction>>;
  taxAmount: Amount;
  /** If taxAmount is set, this field will contain more info about the tax */
  taxInfo?: Maybe<TaxInfo>;
  /** The recipient of a transaction (on CREDIT = account, DEBIT = oppositeAccount) */
  toAccount?: Maybe<Account>;
  type: TransactionType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** @deprecated 2021-08-15: Use id instead. */
  uuid: Scalars['String'];
};


/** Transaction interface shared by all kind of transactions (Debit, Credit) */
export type TransactionDescriptionArgs = {
  dynamic?: InputMaybe<Scalars['Boolean']>;
  full?: InputMaybe<Scalars['Boolean']>;
};


/** Transaction interface shared by all kind of transactions (Debit, Credit) */
export type TransactionHostFeeArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** Transaction interface shared by all kind of transactions (Debit, Credit) */
export type TransactionNetAmountArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** Transaction interface shared by all kind of transactions (Debit, Credit) */
export type TransactionNetAmountInHostCurrencyArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** Transaction interface shared by all kind of transactions (Debit, Credit) */
export type TransactionRelatedTransactionsArgs = {
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
};

/** A collection of Transactions (Debit or Credit) */
export type TransactionCollection = Collection & {
  __typename?: 'TransactionCollection';
  kinds?: Maybe<Array<Maybe<TransactionKind>>>;
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Transaction>>>;
  offset?: Maybe<Scalars['Int']>;
  /** The types of payment methods used in this collection, regardless of the pagination */
  paymentMethodTypes: Array<Maybe<PaymentMethodType>>;
  totalCount?: Maybe<Scalars['Int']>;
};

export enum TransactionKind {
  AddedFunds = 'ADDED_FUNDS',
  BalanceTransfer = 'BALANCE_TRANSFER',
  Contribution = 'CONTRIBUTION',
  Expense = 'EXPENSE',
  HostFee = 'HOST_FEE',
  HostFeeShare = 'HOST_FEE_SHARE',
  HostFeeShareDebt = 'HOST_FEE_SHARE_DEBT',
  PaymentProcessorCover = 'PAYMENT_PROCESSOR_COVER',
  PaymentProcessorFee = 'PAYMENT_PROCESSOR_FEE',
  PlatformFee = 'PLATFORM_FEE',
  PlatformTip = 'PLATFORM_TIP',
  PlatformTipDebt = 'PLATFORM_TIP_DEBT',
  PrepaidPaymentMethod = 'PREPAID_PAYMENT_METHOD'
}

/** Fields for the user permissions on an transaction */
export type TransactionPermissions = {
  __typename?: 'TransactionPermissions';
  /** Whether the current user can download this transaction's invoice */
  canDownloadInvoice: Scalars['Boolean'];
  /** Whether the current user can edit the transaction */
  canRefund: Scalars['Boolean'];
  /** Whether the current user can reject the transaction */
  canReject: Scalars['Boolean'];
  id: Scalars['String'];
};

export type TransactionReferenceInput = {
  /** The public id identifying the transaction (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The internal id of the transaction (ie: 580) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

export enum TransactionSettlementStatus {
  Invoiced = 'INVOICED',
  Owed = 'OWED',
  Settled = 'SETTLED'
}

/** All transaction types */
export enum TransactionType {
  Credit = 'CREDIT',
  Debit = 'DEBIT'
}

/** TransferWise related properties for bank transfer. */
export type TransferWise = {
  __typename?: 'TransferWise';
  availableCurrencies?: Maybe<Array<Maybe<Scalars['JSONObject']>>>;
  /** Unique identifier for this Wise object */
  id: Scalars['String'];
  requiredFields?: Maybe<Array<Maybe<TransferWiseRequiredField>>>;
};


/** TransferWise related properties for bank transfer. */
export type TransferWiseAvailableCurrenciesArgs = {
  ignoreBlockedCurrencies?: InputMaybe<Scalars['Boolean']>;
};


/** TransferWise related properties for bank transfer. */
export type TransferWiseRequiredFieldsArgs = {
  accountDetails?: InputMaybe<Scalars['JSON']>;
  currency: Scalars['String'];
};

export type TransferWiseField = {
  __typename?: 'TransferWiseField';
  group?: Maybe<Array<Maybe<TransferWiseFieldGroup>>>;
  name?: Maybe<Scalars['String']>;
};

export type TransferWiseFieldGroup = {
  __typename?: 'TransferWiseFieldGroup';
  displayFormat?: Maybe<Scalars['String']>;
  example?: Maybe<Scalars['String']>;
  key?: Maybe<Scalars['String']>;
  maxLength?: Maybe<Scalars['Int']>;
  minLength?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  refreshRequirementsOnChange?: Maybe<Scalars['Boolean']>;
  required?: Maybe<Scalars['Boolean']>;
  type?: Maybe<Scalars['String']>;
  validationAsync?: Maybe<Scalars['String']>;
  validationRegexp?: Maybe<Scalars['String']>;
  valuesAllowed?: Maybe<Array<Maybe<TransferWiseFieldVatvkluesAllowed>>>;
};

export type TransferWiseFieldVatvkluesAllowed = {
  __typename?: 'TransferWiseFieldVatvkluesAllowed';
  key?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
};

export type TransferWiseRequiredField = {
  __typename?: 'TransferWiseRequiredField';
  fields?: Maybe<Array<Maybe<TransferWiseField>>>;
  title?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
};

/** This represents an Update */
export type Update = {
  __typename?: 'Update';
  account?: Maybe<Account>;
  /** Some stats about the target audience. Will be null if the update is already published or if you don't have enough permissions so see this information. Not backed by a loader, avoid using this field in lists. */
  audienceStats?: Maybe<UpdateAudienceStats>;
  /** List the comments for this update. Not backed by a loader, don't use this in lists. */
  comments?: Maybe<CommentCollection>;
  createdAt: Scalars['DateTime'];
  fromAccount?: Maybe<Account>;
  html?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  isChangelog: Scalars['Boolean'];
  isPrivate: Scalars['Boolean'];
  legacyId?: Maybe<Scalars['Int']>;
  makePublicOn?: Maybe<Scalars['DateTime']>;
  notificationAudience?: Maybe<UpdateAudience>;
  publishedAt?: Maybe<Scalars['DateTime']>;
  /** Returns a map of reactions counts for this update */
  reactions?: Maybe<Scalars['JSON']>;
  slug: Scalars['String'];
  summary?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  title: Scalars['String'];
  updatedAt: Scalars['DateTime'];
  /** Indicates whether or not the user is allowed to publish this update */
  userCanPublishUpdate: Scalars['Boolean'];
  /** Indicates whether or not the user is allowed to see the content of this update */
  userCanSeeUpdate: Scalars['Boolean'];
  /** Returns the list of reactions added to this update by logged in user */
  userReactions?: Maybe<Array<Maybe<Scalars['String']>>>;
};


/** This represents an Update */
export type UpdateAudienceStatsArgs = {
  audience?: InputMaybe<UpdateAudience>;
};


/** This represents an Update */
export type UpdateCommentsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

/** Defines targets for an update */
export enum UpdateAudience {
  /** Will be sent to collective admins and financial contributors */
  All = 'ALL',
  /** Will be sent to collective admins */
  CollectiveAdmins = 'COLLECTIVE_ADMINS',
  /** Will be sent to financial contributors */
  FinancialContributors = 'FINANCIAL_CONTRIBUTORS',
  /** Will be sent to no one */
  NoOne = 'NO_ONE'
}

/** Stats about the potential audience of an update */
export type UpdateAudienceStats = {
  __typename?: 'UpdateAudienceStats';
  collectives: Scalars['Int'];
  coreContributors: Scalars['Int'];
  hosted: Scalars['Int'];
  id: Scalars['String'];
  individuals: Scalars['Int'];
  organizations: Scalars['Int'];
  /** The total number of emails to send */
  total: Scalars['Int'];
};

/** Input to order updates chronologically */
export type UpdateChronologicalOrderInput = {
  /** Ordering direction. */
  direction?: OrderDirection;
  /** Field to chronologically order by. */
  field?: UpdateDateTimeField;
};

/** A collection of "Updates" */
export type UpdateCollection = Collection & {
  __typename?: 'UpdateCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Update>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** Input type for UpdateType */
export type UpdateCreateInput = {
  account: AccountReferenceInput;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  html: Scalars['String'];
  isChangelog?: InputMaybe<Scalars['Boolean']>;
  isPrivate?: InputMaybe<Scalars['Boolean']>;
  makePublicOn?: InputMaybe<Scalars['IsoDateString']>;
  title: Scalars['String'];
};

/** All possible DateTime fields for an update */
export enum UpdateDateTimeField {
  /** The creation time */
  CreatedAt = 'CREATED_AT',
  /** The creation time */
  PublishedAt = 'PUBLISHED_AT'
}

export type UpdateReferenceInput = {
  /** The public id identifying the update */
  id?: InputMaybe<Scalars['String']>;
};

/** Input type for UpdateType */
export type UpdateUpdateInput = {
  fromAccount?: InputMaybe<AccountReferenceInput>;
  html?: InputMaybe<Scalars['String']>;
  id: Scalars['String'];
  isPrivate?: InputMaybe<Scalars['Boolean']>;
  makePublicOn?: InputMaybe<Scalars['DateTime']>;
  slug?: InputMaybe<Scalars['String']>;
  title?: InputMaybe<Scalars['String']>;
};

/** This represents a Vendor account */
export type Vendor = Account & AccountWithContributions & AccountWithHost & {
  __typename?: 'Vendor';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  /** Date of approval by the Fiscal Host. */
  approvedAt?: Maybe<Scalars['DateTime']>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  /**
   * Amount of money in cents in the currency of the account currently available to spend
   * @deprecated 2020/04/09 - Should not have been introduced. Use stats.balance.value
   */
  balance?: Maybe<Scalars['Int']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  contributionPolicy?: Maybe<Scalars['String']>;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** Returns the Fiscal Host */
  host?: Maybe<Host>;
  /** Fees percentage that the host takes for this collective */
  hostFeePercent?: Maybe<Scalars['Float']>;
  /** Describe how the host charges the collective */
  hostFeesStructure?: Maybe<HostFeeStructure>;
  id?: Maybe<Scalars['String']>;
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether it's active: can accept financial contributions and pay expenses. */
  isActive: Scalars['Boolean'];
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether it's approved by the Fiscal Host */
  isApproved: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived?: Maybe<Scalars['Boolean']>;
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost?: Maybe<Scalars['Boolean']>;
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId?: Maybe<Scalars['Int']>;
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Int'];
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug?: Maybe<Scalars['String']>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  tiers: TierCollection;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  twitterHandle?: Maybe<Scalars['String']>;
  type?: Maybe<AccountType>;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  website?: Maybe<Scalars['String']>;
};


/** This represents a Vendor account */
export type VendorActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents a Vendor account */
export type VendorBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents a Vendor account */
export type VendorChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Vendor account */
export type VendorContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Vendor account */
export type VendorConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents a Vendor account */
export type VendorConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents a Vendor account */
export type VendorExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents a Vendor account */
export type VendorHostFeePercentArgs = {
  paymentMethodService?: InputMaybe<PaymentMethodService>;
  paymentMethodType?: InputMaybe<PaymentMethodType>;
};


/** This represents a Vendor account */
export type VendorImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents a Vendor account */
export type VendorMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Vendor account */
export type VendorMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents a Vendor account */
export type VendorMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Vendor account */
export type VendorOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Vendor account */
export type VendorOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** This represents a Vendor account */
export type VendorPaymentMethodsArgs = {
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents a Vendor account */
export type VendorTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Vendor account */
export type VendorTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};


/** This represents a Vendor account */
export type VendorTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** This represents a Vendor account */
export type VendorUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents a Vendor account */
export type VendorVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Vendor account */
export type VendorVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents a Vendor account */
export type VendorWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

/** A Virtual Card used to pay expenses */
export type VirtualCard = {
  __typename?: 'VirtualCard';
  account?: Maybe<Account>;
  assignee?: Maybe<Individual>;
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Currency>;
  data?: Maybe<Scalars['JSONObject']>;
  host?: Maybe<Account>;
  id?: Maybe<Scalars['String']>;
  last4?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  privateData?: Maybe<Scalars['JSONObject']>;
  provider?: Maybe<Scalars['String']>;
  spendingLimitAmount?: Maybe<Scalars['Int']>;
  spendingLimitInterval?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['DateTime']>;
};

/** A collection of Virtual Cards */
export type VirtualCardCollection = Collection & {
  __typename?: 'VirtualCardCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<VirtualCard>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export type VirtualCardInput = {
  data?: InputMaybe<Scalars['JSONObject']>;
  id?: InputMaybe<Scalars['String']>;
  last4?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  privateData?: InputMaybe<Scalars['JSONObject']>;
  provider?: InputMaybe<VirtualCardProvider>;
};

export enum VirtualCardProvider {
  Privacy = 'PRIVACY',
  Stripe = 'STRIPE'
}

export type VirtualCardReferenceInput = {
  id?: InputMaybe<Scalars['String']>;
};

/** An webhook attached to an account */
export type Webhook = {
  __typename?: 'Webhook';
  account: Account;
  activityType?: Maybe<ActivityType>;
  id: Scalars['String'];
  legacyId: Scalars['Int'];
  webhookUrl?: Maybe<Scalars['URL']>;
};

/** A collection of webhooks */
export type WebhookCollection = Collection & {
  __typename?: 'WebhookCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Webhook>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** Input type for Webhooks */
export type WebhookCreateInput = {
  /** The account to attach the Webhook */
  account: AccountReferenceInput;
  activityType?: ActivityType;
  webhookUrl: Scalars['URL'];
};

export type WebhookReferenceInput = {
  /** The public id identifying the webhook (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The legacy public id identifying the webhook (ie: 4242) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

/** Input type to update a Webhook */
export type WebhookUpdateInput = {
  activityType?: ActivityType;
  /** The public id identifying the webhook (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The legacy public id identifying the webhook (ie: 4242) */
  legacyId?: InputMaybe<Scalars['Int']>;
  webhookUrl: Scalars['URL'];
};

export type ClearCacheMutationVariables = Exact<{
  account: AccountReferenceInput;
}>;


export type ClearCacheMutation = { __typename?: 'Mutation', clearCacheForAccount: { __typename?: 'Bot', id?: string | null, slug?: string | null, name?: string | null } | { __typename?: 'Collective', id?: string | null, slug?: string | null, name?: string | null } | { __typename?: 'Event', id?: string | null, slug?: string | null, name?: string | null } | { __typename?: 'Fund', id?: string | null, slug?: string | null, name?: string | null } | { __typename?: 'Host', id?: string | null, slug?: string | null, name?: string | null } | { __typename?: 'Individual', id?: string | null, slug?: string | null, name?: string | null } | { __typename?: 'Organization', id?: string | null, slug?: string | null, name?: string | null } | { __typename?: 'Project', id?: string | null, slug?: string | null, name?: string | null } | { __typename?: 'Vendor', id?: string | null, slug?: string | null, name?: string | null } };


export const ClearCacheDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ClearCache"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"account"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AccountReferenceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clearCacheForAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"account"},"value":{"kind":"Variable","name":{"kind":"Name","value":"account"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ClearCacheMutation, ClearCacheMutationVariables>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** Values that can be edited in Account's settings */
  AccountSettingsKey: any;
  DateString: any;
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: any;
  /** A field whose value conforms to the standard internet email address format as specified in RFC822: https://www.w3.org/Protocols/rfc822/. */
  EmailAddress: any;
  IsoDateString: any;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: any;
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: any;
  /** A field whose value conforms to the standard URL format as specified in RFC3986: https://www.ietf.org/rfc/rfc3986.txt. */
  URL: any;
};

/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type Account = {
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  /** Categories set by Open Collective to help moderation. */
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...) */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** The public id identifying the account (ie: 5v08jk63-w4g9nbpz-j7qmyder-p7ozax5g) */
  id?: Maybe<Scalars['String']>;
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether the account accepts financial contributions. */
  isActive?: Maybe<Scalars['Boolean']>;
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived?: Maybe<Scalars['Boolean']>;
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost?: Maybe<Scalars['Boolean']>;
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  /**
   * The internal database identifier of the collective (ie: 580)
   * @deprecated 2020-01-01: should only be used during the transition to GraphQL API v2.
   */
  legacyId?: Maybe<Scalars['Int']>;
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** Get pending member invitations for this account */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf?: Maybe<MemberOfCollection>;
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this account can use to pay for Orders */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this account can use to get paid */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug?: Maybe<Scalars['String']>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  twitterHandle?: Maybe<Scalars['String']>;
  /** The type of the account (BOT/COLLECTIVE/EVENT/ORGANIZATION/INDIVIDUAL/VENDOR) */
  type?: Maybe<AccountType>;
  /** The time of last update */
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  website?: Maybe<Scalars['String']>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountMemberInvitationsArgs = {
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountPaymentMethodsArgs = {
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};

export enum AccountCacheType {
  Cloudflare = 'CLOUDFLARE',
  Contributors = 'CONTRIBUTORS',
  GraphqlQueries = 'GRAPHQL_QUERIES'
}

/** A collection of "Accounts" */
export type AccountCollection = Collection & {
  __typename?: 'AccountCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Account>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export enum AccountFreezeAction {
  Freeze = 'FREEZE',
  Unfreeze = 'UNFREEZE'
}

/** Account orders filter (INCOMING or OUTGOING) */
export enum AccountOrdersFilter {
  Incoming = 'INCOMING',
  Outgoing = 'OUTGOING'
}

/** Fields for the user permissions on an account */
export type AccountPermissions = {
  __typename?: 'AccountPermissions';
  /** Whether the current user can mark this order as expired */
  addFunds: Permission;
  id: Scalars['String'];
};

export type AccountReferenceInput = {
  /** The public id identifying the account (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The slug identifying the account (ie: babel for https://opencollective.com/babel) */
  slug?: InputMaybe<Scalars['String']>;
};

/** Stats for the Account */
export type AccountStats = {
  __typename?: 'AccountStats';
  activeRecurringContributions?: Maybe<Scalars['JSON']>;
  /** Amount of money in cents in the currency of the collective */
  balance: Amount;
  /** Amount of money in cents in the currency of the collective currently available to spend */
  balanceWithBlockedFunds: Amount;
  /** The consolidated amount of all the events and projects combined. */
  consolidatedBalance: Amount;
  /** Return amount stats for contributions (default, and only for now: one-time vs recurring) */
  contributionsAmount?: Maybe<Array<Maybe<AmountStats>>>;
  /** Return amount time series for contributions (default, and only for now: one-time vs recurring) */
  contributionsAmountTimeSeries: TimeSeriesAmount;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<AmountStats>>>;
  /** History of the expense tags used by this collective. */
  expensesTagsTimeSeries: TimeSeriesAmount;
  id?: Maybe<Scalars['String']>;
  /** Average amount spent per month based on the last 90 days */
  monthlySpending: Amount;
  /** Net amount received */
  totalAmountReceived: Amount;
  /** Total amount spent */
  totalAmountSpent: Amount;
  /** Total net amount received */
  totalNetAmountReceived: Amount;
  /** Total of paid expenses, filter per expensetype */
  totalPaidExpenses: Amount;
  yearlyBudget: Amount;
  yearlyBudgetManaged: Amount;
};


/** Stats for the Account */
export type AccountStatsBalanceArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
};


/** Stats for the Account */
export type AccountStatsContributionsAmountArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  includeChildren?: InputMaybe<Scalars['Boolean']>;
};


/** Stats for the Account */
export type AccountStatsContributionsAmountTimeSeriesArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  includeChildren?: InputMaybe<Scalars['Boolean']>;
  timeUnit?: InputMaybe<TimeUnit>;
};


/** Stats for the Account */
export type AccountStatsExpensesTagsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  includeChildren?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
};


/** Stats for the Account */
export type AccountStatsExpensesTagsTimeSeriesArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  includeChildren?: InputMaybe<Scalars['Boolean']>;
  timeUnit?: InputMaybe<TimeUnit>;
};


/** Stats for the Account */
export type AccountStatsTotalAmountReceivedArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  periodInMonths?: InputMaybe<Scalars['Int']>;
  useCache?: Scalars['Boolean'];
};


/** Stats for the Account */
export type AccountStatsTotalPaidExpensesArgs = {
  currency?: InputMaybe<Currency>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  expenseType?: InputMaybe<Array<InputMaybe<ExpenseType>>>;
};

/** All account types */
export enum AccountType {
  Bot = 'BOT',
  Collective = 'COLLECTIVE',
  Event = 'EVENT',
  Fund = 'FUND',
  Individual = 'INDIVIDUAL',
  Organization = 'ORGANIZATION',
  Project = 'PROJECT',
  Vendor = 'VENDOR'
}

export type AccountUpdateInput = {
  currency?: InputMaybe<Currency>;
  /** The public id identifying the account (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id: Scalars['String'];
};

/** An account that can receive financial contributions */
export type AccountWithContributions = {
  /**
   * Amount of money in cents in the currency of the account currently available to spend
   * @deprecated 2020/04/09 - Should not have been introduced. Use stats.balance.value
   */
  balance?: Maybe<Scalars['Int']>;
  contributionPolicy?: Maybe<Scalars['String']>;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Int'];
  tiers: TierCollection;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
};


/** An account that can receive financial contributions */
export type AccountWithContributionsContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** An account that can receive financial contributions */
export type AccountWithContributionsTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** An account that can receive financial contributions */
export type AccountWithContributionsTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};

/** An account that can be hosted by a Host */
export type AccountWithHost = {
  /** Date of approval by the Fiscal Host. */
  approvedAt?: Maybe<Scalars['DateTime']>;
  /** Returns the Fiscal Host */
  host?: Maybe<Host>;
  /** Fees percentage that the host takes for this collective */
  hostFeePercent?: Maybe<Scalars['Float']>;
  /** Describe how the host charges the collective */
  hostFeesStructure?: Maybe<HostFeeStructure>;
  /** Returns whether it's active: can accept financial contributions and pay expenses. */
  isActive: Scalars['Boolean'];
  /** Returns whether it's approved by the Fiscal Host */
  isApproved: Scalars['Boolean'];
  /** Fees percentage that the platform takes for this collective */
  platformFeePercent?: Maybe<Scalars['Int']>;
};


/** An account that can be hosted by a Host */
export type AccountWithHostHostFeePercentArgs = {
  paymentMethodService?: InputMaybe<PaymentMethodService>;
  paymentMethodType?: InputMaybe<PaymentMethodType>;
};

/** An account that has a parent account */
export type AccountWithParent = {
  /** The Account parenting this account */
  parent?: Maybe<Account>;
};

/** An activity describing something that happened on the platform */
export type Activity = {
  __typename?: 'Activity';
  /** The account targeted by this activity, if any */
  account?: Maybe<Account>;
  /** The date on which the ConnectedAccount was created */
  createdAt: Scalars['DateTime'];
  /** Data attached to this activity (if any) */
  data: Scalars['JSON'];
  /** The expense related to this activity, if any */
  expense?: Maybe<Expense>;
  /** The account that authored by this activity, if any */
  fromAccount?: Maybe<Account>;
  /** The host under which this activity happened, if any */
  host?: Maybe<Host>;
  /** Unique identifier for this activity */
  id: Scalars['String'];
  /** The person who triggered the action, if any */
  individual?: Maybe<Individual>;
  /** The order related to this activity, if any */
  order?: Maybe<Order>;
  /** The type of the activity */
  type: ActivityType;
};

export enum ActivityAndClassesType {
  ActivatedCollectiveAsHost = 'ACTIVATED_COLLECTIVE_AS_HOST',
  ActivatedCollectiveAsIndependent = 'ACTIVATED_COLLECTIVE_AS_INDEPENDENT',
  ActivitiesUpdates = 'ACTIVITIES_UPDATES',
  ActivityAll = 'ACTIVITY_ALL',
  AddedFundToOrg = 'ADDED_FUND_TO_ORG',
  BackyourstackDispatchConfirmed = 'BACKYOURSTACK_DISPATCH_CONFIRMED',
  Collective = 'COLLECTIVE',
  CollectiveApply = 'COLLECTIVE_APPLY',
  CollectiveApproved = 'COLLECTIVE_APPROVED',
  CollectiveCommentCreated = 'COLLECTIVE_COMMENT_CREATED',
  CollectiveContact = 'COLLECTIVE_CONTACT',
  CollectiveConversationCreated = 'COLLECTIVE_CONVERSATION_CREATED',
  CollectiveCoreMemberAdded = 'COLLECTIVE_CORE_MEMBER_ADDED',
  CollectiveCoreMemberEdited = 'COLLECTIVE_CORE_MEMBER_EDITED',
  CollectiveCoreMemberInvitationDeclined = 'COLLECTIVE_CORE_MEMBER_INVITATION_DECLINED',
  CollectiveCoreMemberInvited = 'COLLECTIVE_CORE_MEMBER_INVITED',
  CollectiveCoreMemberRemoved = 'COLLECTIVE_CORE_MEMBER_REMOVED',
  CollectiveCreated = 'COLLECTIVE_CREATED',
  CollectiveCreatedGithub = 'COLLECTIVE_CREATED_GITHUB',
  CollectiveExpenseApproved = 'COLLECTIVE_EXPENSE_APPROVED',
  CollectiveExpenseCreated = 'COLLECTIVE_EXPENSE_CREATED',
  CollectiveExpenseDeleted = 'COLLECTIVE_EXPENSE_DELETED',
  CollectiveExpenseError = 'COLLECTIVE_EXPENSE_ERROR',
  CollectiveExpenseInviteDrafted = 'COLLECTIVE_EXPENSE_INVITE_DRAFTED',
  CollectiveExpenseMarkedAsIncomplete = 'COLLECTIVE_EXPENSE_MARKED_AS_INCOMPLETE',
  CollectiveExpenseMarkedAsSpam = 'COLLECTIVE_EXPENSE_MARKED_AS_SPAM',
  CollectiveExpenseMarkedAsUnpaid = 'COLLECTIVE_EXPENSE_MARKED_AS_UNPAID',
  CollectiveExpenseMissingReceipt = 'COLLECTIVE_EXPENSE_MISSING_RECEIPT',
  CollectiveExpenseMoved = 'COLLECTIVE_EXPENSE_MOVED',
  CollectiveExpensePaid = 'COLLECTIVE_EXPENSE_PAID',
  CollectiveExpenseProcessing = 'COLLECTIVE_EXPENSE_PROCESSING',
  CollectiveExpenseRecurringDrafted = 'COLLECTIVE_EXPENSE_RECURRING_DRAFTED',
  CollectiveExpenseRejected = 'COLLECTIVE_EXPENSE_REJECTED',
  CollectiveExpenseScheduledForPayment = 'COLLECTIVE_EXPENSE_SCHEDULED_FOR_PAYMENT',
  CollectiveExpenseUnapproved = 'COLLECTIVE_EXPENSE_UNAPPROVED',
  CollectiveExpenseUpdated = 'COLLECTIVE_EXPENSE_UPDATED',
  CollectiveFrozen = 'COLLECTIVE_FROZEN',
  CollectiveMemberCreated = 'COLLECTIVE_MEMBER_CREATED',
  CollectiveMemberInvited = 'COLLECTIVE_MEMBER_INVITED',
  CollectiveMonthly = 'COLLECTIVE_MONTHLY',
  CollectiveMonthlyReport = 'COLLECTIVE_MONTHLY_REPORT',
  CollectiveRejected = 'COLLECTIVE_REJECTED',
  CollectiveTransactionCreated = 'COLLECTIVE_TRANSACTION_CREATED',
  CollectiveTransactionPaid = 'COLLECTIVE_TRANSACTION_PAID',
  CollectiveUnfrozen = 'COLLECTIVE_UNFROZEN',
  CollectiveUpdateCreated = 'COLLECTIVE_UPDATE_CREATED',
  CollectiveUpdatePublished = 'COLLECTIVE_UPDATE_PUBLISHED',
  CollectiveUserAdded = 'COLLECTIVE_USER_ADDED',
  CollectiveVirtualCardAdded = 'COLLECTIVE_VIRTUAL_CARD_ADDED',
  CollectiveVirtualCardAssigned = 'COLLECTIVE_VIRTUAL_CARD_ASSIGNED',
  CollectiveVirtualCardCreated = 'COLLECTIVE_VIRTUAL_CARD_CREATED',
  CollectiveVirtualCardMissingReceipts = 'COLLECTIVE_VIRTUAL_CARD_MISSING_RECEIPTS',
  CollectiveVirtualCardSuspended = 'COLLECTIVE_VIRTUAL_CARD_SUSPENDED',
  ConnectedAccountCreated = 'CONNECTED_ACCOUNT_CREATED',
  Contributions = 'CONTRIBUTIONS',
  ContributionRejected = 'CONTRIBUTION_REJECTED',
  ConversationCommentCreated = 'CONVERSATION_COMMENT_CREATED',
  DeactivatedCollectiveAsHost = 'DEACTIVATED_COLLECTIVE_AS_HOST',
  Expenses = 'EXPENSES',
  ExpenseCommentCreated = 'EXPENSE_COMMENT_CREATED',
  FundEvents = 'FUND_EVENTS',
  HostApplicationContact = 'HOST_APPLICATION_CONTACT',
  OauthApplicationAuthorized = 'OAUTH_APPLICATION_AUTHORIZED',
  OrdersSuspicious = 'ORDERS_SUSPICIOUS',
  OrderCanceledArchivedCollective = 'ORDER_CANCELED_ARCHIVED_COLLECTIVE',
  OrderPendingContributionNew = 'ORDER_PENDING_CONTRIBUTION_NEW',
  OrderPendingContributionReminder = 'ORDER_PENDING_CONTRIBUTION_REMINDER',
  OrderProcessing = 'ORDER_PROCESSING',
  OrderProcessingCrypto = 'ORDER_PROCESSING_CRYPTO',
  OrderThankyou = 'ORDER_THANKYOU',
  OrganizationCollectiveCreated = 'ORGANIZATION_COLLECTIVE_CREATED',
  PaymentCreditcardConfirmation = 'PAYMENT_CREDITCARD_CONFIRMATION',
  PaymentCreditcardExpiring = 'PAYMENT_CREDITCARD_EXPIRING',
  PaymentFailed = 'PAYMENT_FAILED',
  Reports = 'REPORTS',
  SubscriptionActivated = 'SUBSCRIPTION_ACTIVATED',
  SubscriptionCanceled = 'SUBSCRIPTION_CANCELED',
  SubscriptionConfirmed = 'SUBSCRIPTION_CONFIRMED',
  TaxformRequest = 'TAXFORM_REQUEST',
  TicketConfirmed = 'TICKET_CONFIRMED',
  UpdateCommentCreated = 'UPDATE_COMMENT_CREATED',
  UserCardClaimed = 'USER_CARD_CLAIMED',
  UserCardInvited = 'USER_CARD_INVITED',
  UserChangeEmail = 'USER_CHANGE_EMAIL',
  UserCreated = 'USER_CREATED',
  UserNewToken = 'USER_NEW_TOKEN',
  UserPaymentMethodCreated = 'USER_PAYMENT_METHOD_CREATED',
  VirtualCards = 'VIRTUAL_CARDS',
  VirtualCardChargeDeclined = 'VIRTUAL_CARD_CHARGE_DECLINED',
  VirtualCardPurchase = 'VIRTUAL_CARD_PURCHASE',
  VirtualCardRequested = 'VIRTUAL_CARD_REQUESTED',
  WebhookPaypalReceived = 'WEBHOOK_PAYPAL_RECEIVED',
  WebhookStripeReceived = 'WEBHOOK_STRIPE_RECEIVED'
}

/** How an activity is related to an account */
export enum ActivityAttribution {
  /** Activities initiated by this account */
  Authored = 'AUTHORED',
  /** Activities that happened on accounts hosted by this account */
  HostedAccounts = 'HOSTED_ACCOUNTS',
  /** Activities that targeted this account */
  Received = 'RECEIVED',
  /** Activities where author and target both points to this account (e.g. settings update) */
  Self = 'SELF'
}

/** All supported Activity channels we can broadcast to */
export enum ActivityChannel {
  Email = 'email',
  Gitter = 'gitter',
  Slack = 'slack',
  Twitter = 'twitter',
  Webhook = 'webhook'
}

/** A collection of "Activities" */
export type ActivityCollection = Collection & {
  __typename?: 'ActivityCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Activity>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export type ActivitySubscription = {
  __typename?: 'ActivitySubscription';
  /** The account which this notification setting is applied to */
  account?: Maybe<Account>;
  /** Wheter this notification setting is active or not */
  active: Scalars['Boolean'];
  /** The channel this setting is notifying through */
  channel: ActivityChannel;
  createdAt: Scalars['DateTime'];
  /** Unique identifier for this notification setting */
  id: Scalars['String'];
  /** The user who defined the setting */
  individual: Individual;
  /** The type of Activity this setting is notifying about */
  type: Scalars['String'];
  /** If channel supports, this is the webhook URL we submit the notification to */
  webhookUrl?: Maybe<Scalars['String']>;
};

export enum ActivityType {
  ActivatedCollectiveAsHost = 'ACTIVATED_COLLECTIVE_AS_HOST',
  ActivatedCollectiveAsIndependent = 'ACTIVATED_COLLECTIVE_AS_INDEPENDENT',
  ActivityAll = 'ACTIVITY_ALL',
  AddedFundToOrg = 'ADDED_FUND_TO_ORG',
  BackyourstackDispatchConfirmed = 'BACKYOURSTACK_DISPATCH_CONFIRMED',
  CollectiveApply = 'COLLECTIVE_APPLY',
  CollectiveApproved = 'COLLECTIVE_APPROVED',
  CollectiveCommentCreated = 'COLLECTIVE_COMMENT_CREATED',
  CollectiveContact = 'COLLECTIVE_CONTACT',
  CollectiveConversationCreated = 'COLLECTIVE_CONVERSATION_CREATED',
  CollectiveCoreMemberAdded = 'COLLECTIVE_CORE_MEMBER_ADDED',
  CollectiveCoreMemberEdited = 'COLLECTIVE_CORE_MEMBER_EDITED',
  CollectiveCoreMemberInvitationDeclined = 'COLLECTIVE_CORE_MEMBER_INVITATION_DECLINED',
  CollectiveCoreMemberInvited = 'COLLECTIVE_CORE_MEMBER_INVITED',
  CollectiveCoreMemberRemoved = 'COLLECTIVE_CORE_MEMBER_REMOVED',
  CollectiveCreated = 'COLLECTIVE_CREATED',
  CollectiveCreatedGithub = 'COLLECTIVE_CREATED_GITHUB',
  CollectiveExpenseApproved = 'COLLECTIVE_EXPENSE_APPROVED',
  CollectiveExpenseCreated = 'COLLECTIVE_EXPENSE_CREATED',
  CollectiveExpenseDeleted = 'COLLECTIVE_EXPENSE_DELETED',
  CollectiveExpenseError = 'COLLECTIVE_EXPENSE_ERROR',
  CollectiveExpenseInviteDrafted = 'COLLECTIVE_EXPENSE_INVITE_DRAFTED',
  CollectiveExpenseMarkedAsIncomplete = 'COLLECTIVE_EXPENSE_MARKED_AS_INCOMPLETE',
  CollectiveExpenseMarkedAsSpam = 'COLLECTIVE_EXPENSE_MARKED_AS_SPAM',
  CollectiveExpenseMarkedAsUnpaid = 'COLLECTIVE_EXPENSE_MARKED_AS_UNPAID',
  CollectiveExpenseMissingReceipt = 'COLLECTIVE_EXPENSE_MISSING_RECEIPT',
  CollectiveExpenseMoved = 'COLLECTIVE_EXPENSE_MOVED',
  CollectiveExpensePaid = 'COLLECTIVE_EXPENSE_PAID',
  CollectiveExpenseProcessing = 'COLLECTIVE_EXPENSE_PROCESSING',
  CollectiveExpenseRecurringDrafted = 'COLLECTIVE_EXPENSE_RECURRING_DRAFTED',
  CollectiveExpenseRejected = 'COLLECTIVE_EXPENSE_REJECTED',
  CollectiveExpenseScheduledForPayment = 'COLLECTIVE_EXPENSE_SCHEDULED_FOR_PAYMENT',
  CollectiveExpenseUnapproved = 'COLLECTIVE_EXPENSE_UNAPPROVED',
  CollectiveExpenseUpdated = 'COLLECTIVE_EXPENSE_UPDATED',
  CollectiveFrozen = 'COLLECTIVE_FROZEN',
  CollectiveMemberCreated = 'COLLECTIVE_MEMBER_CREATED',
  CollectiveMemberInvited = 'COLLECTIVE_MEMBER_INVITED',
  CollectiveMonthly = 'COLLECTIVE_MONTHLY',
  CollectiveMonthlyReport = 'COLLECTIVE_MONTHLY_REPORT',
  CollectiveRejected = 'COLLECTIVE_REJECTED',
  CollectiveTransactionCreated = 'COLLECTIVE_TRANSACTION_CREATED',
  CollectiveTransactionPaid = 'COLLECTIVE_TRANSACTION_PAID',
  CollectiveUnfrozen = 'COLLECTIVE_UNFROZEN',
  CollectiveUpdateCreated = 'COLLECTIVE_UPDATE_CREATED',
  CollectiveUpdatePublished = 'COLLECTIVE_UPDATE_PUBLISHED',
  CollectiveUserAdded = 'COLLECTIVE_USER_ADDED',
  CollectiveVirtualCardAdded = 'COLLECTIVE_VIRTUAL_CARD_ADDED',
  CollectiveVirtualCardAssigned = 'COLLECTIVE_VIRTUAL_CARD_ASSIGNED',
  CollectiveVirtualCardCreated = 'COLLECTIVE_VIRTUAL_CARD_CREATED',
  CollectiveVirtualCardMissingReceipts = 'COLLECTIVE_VIRTUAL_CARD_MISSING_RECEIPTS',
  CollectiveVirtualCardSuspended = 'COLLECTIVE_VIRTUAL_CARD_SUSPENDED',
  ConnectedAccountCreated = 'CONNECTED_ACCOUNT_CREATED',
  ContributionRejected = 'CONTRIBUTION_REJECTED',
  ConversationCommentCreated = 'CONVERSATION_COMMENT_CREATED',
  DeactivatedCollectiveAsHost = 'DEACTIVATED_COLLECTIVE_AS_HOST',
  ExpenseCommentCreated = 'EXPENSE_COMMENT_CREATED',
  HostApplicationContact = 'HOST_APPLICATION_CONTACT',
  OauthApplicationAuthorized = 'OAUTH_APPLICATION_AUTHORIZED',
  OrdersSuspicious = 'ORDERS_SUSPICIOUS',
  OrderCanceledArchivedCollective = 'ORDER_CANCELED_ARCHIVED_COLLECTIVE',
  OrderPendingContributionNew = 'ORDER_PENDING_CONTRIBUTION_NEW',
  OrderPendingContributionReminder = 'ORDER_PENDING_CONTRIBUTION_REMINDER',
  OrderProcessing = 'ORDER_PROCESSING',
  OrderProcessingCrypto = 'ORDER_PROCESSING_CRYPTO',
  OrderThankyou = 'ORDER_THANKYOU',
  OrganizationCollectiveCreated = 'ORGANIZATION_COLLECTIVE_CREATED',
  PaymentCreditcardConfirmation = 'PAYMENT_CREDITCARD_CONFIRMATION',
  PaymentCreditcardExpiring = 'PAYMENT_CREDITCARD_EXPIRING',
  PaymentFailed = 'PAYMENT_FAILED',
  SubscriptionActivated = 'SUBSCRIPTION_ACTIVATED',
  SubscriptionCanceled = 'SUBSCRIPTION_CANCELED',
  SubscriptionConfirmed = 'SUBSCRIPTION_CONFIRMED',
  TaxformRequest = 'TAXFORM_REQUEST',
  TicketConfirmed = 'TICKET_CONFIRMED',
  UpdateCommentCreated = 'UPDATE_COMMENT_CREATED',
  UserCardClaimed = 'USER_CARD_CLAIMED',
  UserCardInvited = 'USER_CARD_INVITED',
  UserChangeEmail = 'USER_CHANGE_EMAIL',
  UserCreated = 'USER_CREATED',
  UserNewToken = 'USER_NEW_TOKEN',
  UserPaymentMethodCreated = 'USER_PAYMENT_METHOD_CREATED',
  VirtualCardChargeDeclined = 'VIRTUAL_CARD_CHARGE_DECLINED',
  VirtualCardPurchase = 'VIRTUAL_CARD_PURCHASE',
  VirtualCardRequested = 'VIRTUAL_CARD_REQUESTED',
  WebhookPaypalReceived = 'WEBHOOK_PAYPAL_RECEIVED',
  WebhookStripeReceived = 'WEBHOOK_STRIPE_RECEIVED'
}

/** Response for the addTwoFactorAuthTokenToIndividual mutation */
export type AddTwoFactorAuthTokenToIndividualResponse = {
  __typename?: 'AddTwoFactorAuthTokenToIndividualResponse';
  /** The Individual that the 2FA has been enabled for */
  account: Individual;
  /** The recovery codes for the Individual to write down */
  recoveryCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
};

/** A financial amount. */
export type Amount = {
  __typename?: 'Amount';
  currency?: Maybe<Currency>;
  /** If the amount was generated from a currency conversion, this field contains details about the conversion */
  exchangeRate?: Maybe<CurrencyExchangeRate>;
  value?: Maybe<Scalars['Float']>;
  valueInCents?: Maybe<Scalars['Int']>;
};

/** Input type for an amount with the value and currency */
export type AmountInput = {
  /** The currency string */
  currency?: InputMaybe<Currency>;
  /** The value in plain */
  value?: InputMaybe<Scalars['Float']>;
  /** The value in cents */
  valueInCents?: InputMaybe<Scalars['Int']>;
};

/** Statistics aith amounts */
export type AmountStats = {
  __typename?: 'AmountStats';
  /** Total amount for this label */
  amount: Amount;
  /** Number of entries for this label */
  count?: Maybe<Scalars['Int']>;
  /** Name/Label for the amount */
  label: Scalars['String'];
};

/** An OAuth application or a personal token */
export type Application = {
  __typename?: 'Application';
  account: Account;
  /** @deprecated 2022-06-16: This Application object will only be used for OAuth tokens. Use PersonalToken for user tokens */
  apiKey?: Maybe<Scalars['String']>;
  clientId?: Maybe<Scalars['String']>;
  clientSecret?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  legacyId: Scalars['Int'];
  name?: Maybe<Scalars['String']>;
  oAuthAuthorization?: Maybe<OAuthAuthorization>;
  redirectUri?: Maybe<Scalars['URL']>;
  /** @deprecated 2022-06-16: This Application object will only be used for OAuth tokens. Use PersonalToken for user tokens */
  type?: Maybe<ApplicationType>;
};

/** Input type for Application */
export type ApplicationCreateInput = {
  /** The account to use as the owner of the application. Defaults to currently logged in user. */
  account?: InputMaybe<AccountReferenceInput>;
  description?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  redirectUri?: InputMaybe<Scalars['URL']>;
  type?: ApplicationType;
};

export type ApplicationReferenceInput = {
  /** The clientId for the application. */
  clientId?: InputMaybe<Scalars['String']>;
  /** The public id identifying the application (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The legacy public id identifying the application (ie: 4242) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

/** All application types */
export enum ApplicationType {
  ApiKey = 'API_KEY',
  Oauth = 'OAUTH'
}

/** Input type for Application */
export type ApplicationUpdateInput = {
  /** The clientId for the application. */
  clientId?: InputMaybe<Scalars['String']>;
  description?: InputMaybe<Scalars['String']>;
  /** The public id identifying the application (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The legacy public id identifying the application (ie: 4242) */
  legacyId?: InputMaybe<Scalars['Int']>;
  name?: InputMaybe<Scalars['String']>;
  redirectUri?: InputMaybe<Scalars['URL']>;
};

export type BanAccountResponse = {
  __typename?: 'BanAccountResponse';
  /** The accounts impacted by the mutation */
  accounts: Array<Account>;
  /** Whether the accounts can be banned */
  isAllowed: Scalars['Boolean'];
  /** A summary of the changes */
  message?: Maybe<Scalars['String']>;
};

/** This represents a Bot account */
export type Bot = Account & {
  __typename?: 'Bot';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether the account accepts financial contributions. */
  isActive?: Maybe<Scalars['Boolean']>;
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived?: Maybe<Scalars['Boolean']>;
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost?: Maybe<Scalars['Boolean']>;
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId?: Maybe<Scalars['Int']>;
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug?: Maybe<Scalars['String']>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  twitterHandle?: Maybe<Scalars['String']>;
  type?: Maybe<AccountType>;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  website?: Maybe<Scalars['String']>;
};


/** This represents a Bot account */
export type BotActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents a Bot account */
export type BotBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents a Bot account */
export type BotChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Bot account */
export type BotConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents a Bot account */
export type BotConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents a Bot account */
export type BotExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents a Bot account */
export type BotImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents a Bot account */
export type BotMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Bot account */
export type BotMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents a Bot account */
export type BotMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Bot account */
export type BotOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Bot account */
export type BotOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** This represents a Bot account */
export type BotPaymentMethodsArgs = {
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents a Bot account */
export type BotTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** This represents a Bot account */
export type BotUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents a Bot account */
export type BotVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Bot account */
export type BotVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents a Bot account */
export type BotWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type Collective_Minimum_Admins = {
  __typename?: 'COLLECTIVE_MINIMUM_ADMINS';
  applies?: Maybe<Collective_Minimum_Admins_Applies>;
  freeze?: Maybe<Scalars['Boolean']>;
  numberOfAdmins?: Maybe<Scalars['Int']>;
};

export enum Collective_Minimum_Admins_Applies {
  AllCollectives = 'ALL_COLLECTIVES',
  NewCollectives = 'NEW_COLLECTIVES'
}

/** Captcha related information */
export type CaptchaInput = {
  /** Catpcha provider */
  provider: CaptchaProvider;
  /** Captcha validation token */
  token: Scalars['String'];
};

/** Implemented Captcha Providers */
export enum CaptchaProvider {
  Hcaptcha = 'HCAPTCHA',
  Recaptcha = 'RECAPTCHA'
}

/** Input to order results chronologically */
export type ChronologicalOrderInput = {
  /** Ordering direction. */
  direction?: OrderDirection;
  /** Field to chronologically order by. */
  field?: DateTimeField;
};

/** Collection interface shared by all collection types */
export type Collection = {
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** This represents a Collective account */
export type Collective = Account & AccountWithContributions & AccountWithHost & {
  __typename?: 'Collective';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  /** Date of approval by the Fiscal Host. */
  approvedAt?: Maybe<Scalars['DateTime']>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  /**
   * Amount of money in cents in the currency of the account currently available to spend
   * @deprecated 2020/04/09 - Should not have been introduced. Use stats.balance.value
   */
  balance?: Maybe<Scalars['Int']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  contributionPolicy?: Maybe<Scalars['String']>;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** Returns the Fiscal Host */
  host?: Maybe<Host>;
  /** Fees percentage that the host takes for this collective */
  hostFeePercent?: Maybe<Scalars['Float']>;
  /** Describe how the host charges the collective */
  hostFeesStructure?: Maybe<HostFeeStructure>;
  id?: Maybe<Scalars['String']>;
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether it's active: can accept financial contributions and pay expenses. */
  isActive: Scalars['Boolean'];
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether it's approved by the Fiscal Host */
  isApproved: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived?: Maybe<Scalars['Boolean']>;
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost?: Maybe<Scalars['Boolean']>;
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId?: Maybe<Scalars['Int']>;
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Int'];
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug?: Maybe<Scalars['String']>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  tiers: TierCollection;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  twitterHandle?: Maybe<Scalars['String']>;
  type?: Maybe<AccountType>;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  website?: Maybe<Scalars['String']>;
};


/** This represents a Collective account */
export type CollectiveActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents a Collective account */
export type CollectiveBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents a Collective account */
export type CollectiveChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Collective account */
export type CollectiveContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Collective account */
export type CollectiveConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents a Collective account */
export type CollectiveConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents a Collective account */
export type CollectiveExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents a Collective account */
export type CollectiveHostFeePercentArgs = {
  paymentMethodService?: InputMaybe<PaymentMethodService>;
  paymentMethodType?: InputMaybe<PaymentMethodType>;
};


/** This represents a Collective account */
export type CollectiveImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents a Collective account */
export type CollectiveMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Collective account */
export type CollectiveMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents a Collective account */
export type CollectiveMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Collective account */
export type CollectiveOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Collective account */
export type CollectiveOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** This represents a Collective account */
export type CollectivePaymentMethodsArgs = {
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents a Collective account */
export type CollectiveTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Collective account */
export type CollectiveTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};


/** This represents a Collective account */
export type CollectiveTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** This represents a Collective account */
export type CollectiveUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents a Collective account */
export type CollectiveVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Collective account */
export type CollectiveVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents a Collective account */
export type CollectiveWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type CollectiveCreateInput = {
  description: Scalars['String'];
  name: Scalars['String'];
  repositoryUrl?: InputMaybe<Scalars['String']>;
  settings?: InputMaybe<Scalars['JSON']>;
  slug: Scalars['String'];
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};

export enum CollectiveFeatureStatus {
  /** The feature is enabled and is actively used */
  Active = 'ACTIVE',
  /** The feature is enabled, but there is no data for it */
  Available = 'AVAILABLE',
  /** The feature is disabled, but can be enabled by an admin */
  Disabled = 'DISABLED',
  /** The feature is disabled and cannot be activated for this account */
  Unsupported = 'UNSUPPORTED'
}

/** Describes the features enabled and available for this account */
export type CollectiveFeatures = {
  __typename?: 'CollectiveFeatures';
  ABOUT?: Maybe<CollectiveFeatureStatus>;
  ALIPAY?: Maybe<CollectiveFeatureStatus>;
  ALL?: Maybe<CollectiveFeatureStatus>;
  COLLECTIVE_GOALS?: Maybe<CollectiveFeatureStatus>;
  CONNECTED_ACCOUNTS?: Maybe<CollectiveFeatureStatus>;
  CONTACT_COLLECTIVE?: Maybe<CollectiveFeatureStatus>;
  CONTACT_FORM?: Maybe<CollectiveFeatureStatus>;
  CONVERSATIONS?: Maybe<CollectiveFeatureStatus>;
  CREATE_COLLECTIVE?: Maybe<CollectiveFeatureStatus>;
  CROSS_CURRENCY_MANUAL_TRANSACTIONS?: Maybe<CollectiveFeatureStatus>;
  EMAIL_NOTIFICATIONS_PANEL?: Maybe<CollectiveFeatureStatus>;
  EMIT_GIFT_CARDS?: Maybe<CollectiveFeatureStatus>;
  EVENTS?: Maybe<CollectiveFeatureStatus>;
  HOST_DASHBOARD?: Maybe<CollectiveFeatureStatus>;
  MULTI_CURRENCY_EXPENSES?: Maybe<CollectiveFeatureStatus>;
  ORDER?: Maybe<CollectiveFeatureStatus>;
  PAYPAL_DONATIONS?: Maybe<CollectiveFeatureStatus>;
  PAYPAL_PAYOUTS?: Maybe<CollectiveFeatureStatus>;
  PROJECTS?: Maybe<CollectiveFeatureStatus>;
  RECEIVE_EXPENSES?: Maybe<CollectiveFeatureStatus>;
  RECEIVE_FINANCIAL_CONTRIBUTIONS?: Maybe<CollectiveFeatureStatus>;
  RECEIVE_HOST_APPLICATIONS?: Maybe<CollectiveFeatureStatus>;
  RECURRING_CONTRIBUTIONS?: Maybe<CollectiveFeatureStatus>;
  REQUEST_VIRTUAL_CARDS?: Maybe<CollectiveFeatureStatus>;
  TEAM?: Maybe<CollectiveFeatureStatus>;
  TOP_FINANCIAL_CONTRIBUTORS?: Maybe<CollectiveFeatureStatus>;
  TRANSACTIONS?: Maybe<CollectiveFeatureStatus>;
  TRANSFERWISE?: Maybe<CollectiveFeatureStatus>;
  UPDATES?: Maybe<CollectiveFeatureStatus>;
  USE_EXPENSES?: Maybe<CollectiveFeatureStatus>;
  USE_PAYMENT_METHODS?: Maybe<CollectiveFeatureStatus>;
  VIRTUAL_CARDS?: Maybe<CollectiveFeatureStatus>;
  /** The id of the account */
  id: Scalars['String'];
};

/** This represents an Comment */
export type Comment = {
  __typename?: 'Comment';
  account?: Maybe<Account>;
  /** @deprecated 2020-02-25: Please use account */
  collective?: Maybe<Account>;
  createdAt?: Maybe<Scalars['DateTime']>;
  fromAccount?: Maybe<Account>;
  /** @deprecated 2020-02-25: Please use fromAccount */
  fromCollective?: Maybe<Account>;
  html?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  /** Returns a map of reactions counts for this comment */
  reactions?: Maybe<Scalars['JSON']>;
  /** Returns the list of reactions added to this comment by logged in user */
  userReactions?: Maybe<Array<Maybe<Scalars['String']>>>;
};

/** A collection of "Comments" */
export type CommentCollection = Collection & {
  __typename?: 'CommentCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Comment>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** Input to create a comment. You can only specify one entity type: expense, conversation or update */
export type CommentCreateInput = {
  conversation?: InputMaybe<ConversationReferenceInput>;
  /** If your comment is linked to an expense, set it here */
  expense?: InputMaybe<ExpenseReferenceInput>;
  html?: InputMaybe<Scalars['String']>;
  update?: InputMaybe<UpdateReferenceInput>;
};

export type CommentReferenceInput = {
  /** The public id identifying the comment */
  id?: InputMaybe<Scalars['String']>;
};

export type CommentUpdateInput = {
  html?: InputMaybe<Scalars['String']>;
  id: Scalars['String'];
};

/** Response for the confirmGuestAccount mutation */
export type ConfirmGuestAccountResponse = {
  __typename?: 'ConfirmGuestAccountResponse';
  /** A token that can be used to sign in */
  accessToken: Scalars['String'];
  /** The validated account */
  account: Account;
};

/** This represents a Connected Account */
export type ConnectedAccount = {
  __typename?: 'ConnectedAccount';
  /** The date on which the ConnectedAccount was created */
  createdAt: Scalars['DateTime'];
  /** Unique identifier for this connected account */
  id: Scalars['String'];
  /**
   * The internal database identifier of the Connected Account (ie: 580)
   * @deprecated 2020-05-01: should only be used during the transition to GraphQL API v2.
   */
  legacyId?: Maybe<Scalars['Int']>;
  service: ConnectedAccountService;
  settings?: Maybe<Scalars['JSON']>;
  /** The date on which the ConnectedAccount was last updated */
  updatedAt: Scalars['DateTime'];
};

export type ConnectedAccountCreateInput = {
  /** Optional Client ID for the token or secret */
  clientId?: InputMaybe<Scalars['String']>;
  /** Private data related to the connected account */
  data?: InputMaybe<Scalars['JSON']>;
  /** Refresh token for the connected account */
  refreshToken?: InputMaybe<Scalars['String']>;
  /** Service which the connected account belongs to */
  service?: InputMaybe<ConnectedAccountService>;
  /** Public data related to the connected account */
  settings?: InputMaybe<Scalars['JSON']>;
  /** Secret token used to call service */
  token?: InputMaybe<Scalars['String']>;
  /** Optional username for the connected account */
  username?: InputMaybe<Scalars['String']>;
};

export type ConnectedAccountReferenceInput = {
  /** The public id identifying the connected account (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The internal id of the account (ie: 580) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

/** All supported services a user can connect with */
export enum ConnectedAccountService {
  Github = 'github',
  /** @deprecated Not using this service anymore */
  Meetup = 'meetup',
  Paypal = 'paypal',
  Privacy = 'privacy',
  Stripe = 'stripe',
  Thegivingblock = 'thegivingblock',
  Transferwise = 'transferwise',
  Twitter = 'twitter'
}

export enum ContributionFrequency {
  Monthly = 'MONTHLY',
  Onetime = 'ONETIME',
  Yearly = 'YEARLY'
}

/** Contribution statistics related to the given accounts */
export type ContributionStats = {
  __typename?: 'ContributionStats';
  /**
   * The contribution amounts over time
   * @deprecated 2022-04-21: Please use hostMetricsTimeSeries.totalReceived
   */
  contributionAmountOverTime?: Maybe<TimeSeriesAmount>;
  /** The total number of contributions */
  contributionsCount: Scalars['Int'];
  /** The daily average income */
  dailyAverageIncomeAmount: Amount;
  /** Number of one time contributions */
  oneTimeContributionsCount: Scalars['Int'];
  /** Number of recurring contributions */
  recurringContributionsCount: Scalars['Int'];
};

/**
 *
 *     A person or an entity that contributes financially or by any other mean to the mission
 *     of the collective. While "Member" is dedicated to permissions, this type is meant
 *     to surface all the public contributors.
 *
 */
export type Contributor = {
  __typename?: 'Contributor';
  /** If the contributor has a page on Open Collective, this is the slug to link to it */
  collectiveSlug?: Maybe<Scalars['String']>;
  /** Description of how the member contribute. Will usually be a tier name, or "design" or "code". */
  description?: Maybe<Scalars['String']>;
  /** A unique identifier for this member */
  id: Scalars['String'];
  /** Contributor avatar or logo */
  image?: Maybe<Scalars['String']>;
  /** True if the contributor is a collective admin */
  isAdmin: Scalars['Boolean'];
  /** True if the contributor is a financial contributor */
  isBacker: Scalars['Boolean'];
  /** True if the contributor is a core contributor */
  isCore: Scalars['Boolean'];
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  /** Name of the contributor */
  name: Scalars['String'];
  /** A public message from contributors to describe their contributions */
  publicMessage?: Maybe<Scalars['String']>;
  /** All the roles for a given contributor */
  roles?: Maybe<Array<Maybe<ContributorRole>>>;
  /** Member join date */
  since: Scalars['DateTime'];
  /** How much money the user has contributed for this (in cents, using collective currency) */
  totalAmountDonated: Scalars['Int'];
  /** Whether the contributor is an individual, an organization... */
  type: Scalars['String'];
};


/**
 *
 *     A person or an entity that contributes financially or by any other mean to the mission
 *     of the collective. While "Member" is dedicated to permissions, this type is meant
 *     to surface all the public contributors.
 *
 */
export type ContributorImageArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};

/** A collection of "Contributor" */
export type ContributorCollection = Collection & {
  __typename?: 'ContributorCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Contributor>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** Possible roles for a contributor. Extends `Member.Role`. */
export enum ContributorRole {
  Accountant = 'ACCOUNTANT',
  Admin = 'ADMIN',
  Attendee = 'ATTENDEE',
  Backer = 'BACKER',
  ConnectedCollective = 'CONNECTED_COLLECTIVE',
  Contributor = 'CONTRIBUTOR',
  Follower = 'FOLLOWER',
  Fundraiser = 'FUNDRAISER',
  Host = 'HOST',
  Member = 'MEMBER'
}

/** A conversation thread */
export type Conversation = {
  __typename?: 'Conversation';
  /** The root comment / starter for this conversation */
  body?: Maybe<Comment>;
  collective?: Maybe<Account>;
  /** List the comments for this conversation. Not backed by a loader, don't use this in lists. */
  comments: CommentCollection;
  createdAt: Scalars['DateTime'];
  followers: AccountCollection;
  fromCollective?: Maybe<Account>;
  id: Scalars['String'];
  slug: Scalars['String'];
  stats?: Maybe<ConversationStats>;
  summary: Scalars['String'];
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  title: Scalars['String'];
  updatedAt: Scalars['DateTime'];
};


/** A conversation thread */
export type ConversationCommentsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** A conversation thread */
export type ConversationFollowersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

/** A collection of "Conversations" */
export type ConversationCollection = Collection & {
  __typename?: 'ConversationCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Conversation>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export type ConversationReferenceInput = {
  /** The public id identifying the conversation */
  id?: InputMaybe<Scalars['String']>;
  legacyId?: InputMaybe<Scalars['Int']>;
};

export type ConversationStats = {
  __typename?: 'ConversationStats';
  /** Total number of comments for this conversation */
  commentsCount?: Maybe<Scalars['Int']>;
  id: Scalars['String'];
};

/** Two-letters country code following ISO3166_1 */
export enum CountryIso {
  /** Andorra */
  Ad = 'AD',
  /** The United Arab Emirates */
  Ae = 'AE',
  /** Afghanistan */
  Af = 'AF',
  /** Antigua and Barbuda */
  Ag = 'AG',
  /** Anguilla */
  Ai = 'AI',
  /** Albania */
  Al = 'AL',
  /** Armenia */
  Am = 'AM',
  /** Netherlands Antilles */
  An = 'AN',
  /** Angola */
  Ao = 'AO',
  /** Antarctica */
  Aq = 'AQ',
  /** Argentina */
  Ar = 'AR',
  /** American Samoa */
  As = 'AS',
  /** Austria */
  At = 'AT',
  /** Australia */
  Au = 'AU',
  /** Aruba */
  Aw = 'AW',
  /** Åland Islands */
  Ax = 'AX',
  /** Azerbaijan */
  Az = 'AZ',
  /** Bosnia and Herzegovina */
  Ba = 'BA',
  /** Barbados */
  Bb = 'BB',
  /** Bangladesh */
  Bd = 'BD',
  /** Belgium */
  Be = 'BE',
  /** Burkina */
  Bf = 'BF',
  /** Bulgaria */
  Bg = 'BG',
  /** Bahrain */
  Bh = 'BH',
  /** Burundi */
  Bi = 'BI',
  /** Benin */
  Bj = 'BJ',
  /** Saint Barthélemy */
  Bl = 'BL',
  /** Bermuda */
  Bm = 'BM',
  /** Brunei */
  Bn = 'BN',
  /** Bolivia */
  Bo = 'BO',
  /** Brazil */
  Br = 'BR',
  /** The Bahamas */
  Bs = 'BS',
  /** Bhutan */
  Bt = 'BT',
  /** Bouvet Island */
  Bv = 'BV',
  /** Botswana */
  Bw = 'BW',
  /** Belarus */
  By = 'BY',
  /** Belize */
  Bz = 'BZ',
  /** Canada */
  Ca = 'CA',
  /** Cocos Islands */
  Cc = 'CC',
  /** The Democratic Republic of the Congo */
  Cd = 'CD',
  /** The Central African Republic */
  Cf = 'CF',
  /** The Congo */
  Cg = 'CG',
  /** Switzerland */
  Ch = 'CH',
  /** Côte d'Ivoire */
  Ci = 'CI',
  /** Cook Islands */
  Ck = 'CK',
  /** Chile */
  Cl = 'CL',
  /** Cameroon */
  Cm = 'CM',
  /** China */
  Cn = 'CN',
  /** Colombia */
  Co = 'CO',
  /** Costa Rica */
  Cr = 'CR',
  /** Cuba */
  Cu = 'CU',
  /** Cape Verde */
  Cv = 'CV',
  /** Christmas Island */
  Cx = 'CX',
  /** Cyprus */
  Cy = 'CY',
  /** The Czech Republic */
  Cz = 'CZ',
  /** Germany */
  De = 'DE',
  /** Djibouti */
  Dj = 'DJ',
  /** Denmark */
  Dk = 'DK',
  /** Dominica */
  Dm = 'DM',
  /** The Dominican Republic */
  Do = 'DO',
  /** Algeria */
  Dz = 'DZ',
  /** Ecuador */
  Ec = 'EC',
  /** Estonia */
  Ee = 'EE',
  /** Egypt */
  Eg = 'EG',
  /** Western Sahara */
  Eh = 'EH',
  /** Eritrea */
  Er = 'ER',
  /** Spain */
  Es = 'ES',
  /** Ethiopia */
  Et = 'ET',
  /** Finland */
  Fi = 'FI',
  /** Fiji */
  Fj = 'FJ',
  /** Falkland Islands */
  Fk = 'FK',
  /** Micronesia */
  Fm = 'FM',
  /** Faroe Islands */
  Fo = 'FO',
  /** France */
  Fr = 'FR',
  /** Gabon */
  Ga = 'GA',
  /** The United Kingdom */
  Gb = 'GB',
  /** Grenada */
  Gd = 'GD',
  /** Georgia */
  Ge = 'GE',
  /** French Guiana */
  Gf = 'GF',
  /** Guernsey */
  Gg = 'GG',
  /** Ghana */
  Gh = 'GH',
  /** Gibraltar */
  Gi = 'GI',
  /** Greenland */
  Gl = 'GL',
  /** The Gambia */
  Gm = 'GM',
  /** Guinea */
  Gn = 'GN',
  /** Guadeloupe */
  Gp = 'GP',
  /** Equatorial Guinea */
  Gq = 'GQ',
  /** Greece */
  Gr = 'GR',
  /** South Georgia and The South Sandwich Islands */
  Gs = 'GS',
  /** Guatemala */
  Gt = 'GT',
  /** Guam */
  Gu = 'GU',
  /** Guinea-Bissau */
  Gw = 'GW',
  /** Guyana */
  Gy = 'GY',
  /** Hong Kong */
  Hk = 'HK',
  /** Heard Island and McDonald Islands */
  Hm = 'HM',
  /** Honduras */
  Hn = 'HN',
  /** Croatia */
  Hr = 'HR',
  /** Haiti */
  Ht = 'HT',
  /** Hungary */
  Hu = 'HU',
  /** Indonesia */
  Id = 'ID',
  /** Ireland */
  Ie = 'IE',
  /** Israel */
  Il = 'IL',
  /** Isle of Man */
  Im = 'IM',
  /** India */
  In = 'IN',
  /** The British Indian Ocean Territory */
  Io = 'IO',
  /** Iraq */
  Iq = 'IQ',
  /** Iran */
  Ir = 'IR',
  /** Iceland */
  Is = 'IS',
  /** Italy */
  It = 'IT',
  /** Jersey */
  Je = 'JE',
  /** Jamaica */
  Jm = 'JM',
  /** Jordan */
  Jo = 'JO',
  /** Japan */
  Jp = 'JP',
  /** Kenya */
  Ke = 'KE',
  /** Kyrgyzstan */
  Kg = 'KG',
  /** Cambodia */
  Kh = 'KH',
  /** Kiribati */
  Ki = 'KI',
  /** The Comoros */
  Km = 'KM',
  /** Saint Kitts and Nevis */
  Kn = 'KN',
  /** The Democratic People's Republic of Korea */
  Kp = 'KP',
  /** The Republic of Korea */
  Kr = 'KR',
  /** Kuwait */
  Kw = 'KW',
  /** Cayman Islands */
  Ky = 'KY',
  /** Kazakhstan */
  Kz = 'KZ',
  /** Laos */
  La = 'LA',
  /** Lebanon */
  Lb = 'LB',
  /** Saint Lucia */
  Lc = 'LC',
  /** Liechtenstein */
  Li = 'LI',
  /** Sri Lanka */
  Lk = 'LK',
  /** Liberia */
  Lr = 'LR',
  /** Lesotho */
  Ls = 'LS',
  /** Lithuania */
  Lt = 'LT',
  /** Luxembourg */
  Lu = 'LU',
  /** Latvia */
  Lv = 'LV',
  /** Libya */
  Ly = 'LY',
  /** Morocco */
  Ma = 'MA',
  /** Monaco */
  Mc = 'MC',
  /** Moldova */
  Md = 'MD',
  /** Montenegro */
  Me = 'ME',
  /** Saint Martin */
  Mf = 'MF',
  /** Madagascar */
  Mg = 'MG',
  /** The Marshall Islands */
  Mh = 'MH',
  /** Macedonia */
  Mk = 'MK',
  /** Mali */
  Ml = 'ML',
  /** Myanmar */
  Mm = 'MM',
  /** Mongolia */
  Mn = 'MN',
  /** Macao */
  Mo = 'MO',
  /** Northern Mariana Islands */
  Mp = 'MP',
  /** Martinique */
  Mq = 'MQ',
  /** Mauritania */
  Mr = 'MR',
  /** Montserrat */
  Ms = 'MS',
  /** Malta */
  Mt = 'MT',
  /** Mauritius */
  Mu = 'MU',
  /** Maldives */
  Mv = 'MV',
  /** Malawi */
  Mw = 'MW',
  /** Mexico */
  Mx = 'MX',
  /** Malaysia */
  My = 'MY',
  /** Mozambique */
  Mz = 'MZ',
  /** Namibia */
  Na = 'NA',
  /** New Caledonia */
  Nc = 'NC',
  /** The Niger */
  Ne = 'NE',
  /** Norfolk Island */
  Nf = 'NF',
  /** Nigeria */
  Ng = 'NG',
  /** Nicaragua */
  Ni = 'NI',
  /** The Netherlands */
  Nl = 'NL',
  /** Norway */
  No = 'NO',
  /** Nepal */
  Np = 'NP',
  /** Nauru */
  Nr = 'NR',
  /** Niue */
  Nu = 'NU',
  /** New Zealand */
  Nz = 'NZ',
  /** Oman */
  Om = 'OM',
  /** Panama */
  Pa = 'PA',
  /** Peru */
  Pe = 'PE',
  /** French Polynesia */
  Pf = 'PF',
  /** Papua New Guinea */
  Pg = 'PG',
  /** The Philippines */
  Ph = 'PH',
  /** Pakistan */
  Pk = 'PK',
  /** Poland */
  Pl = 'PL',
  /** Saint Pierre and Miquelon */
  Pm = 'PM',
  /** Pitcairn */
  Pn = 'PN',
  /** Puerto Rico */
  Pr = 'PR',
  /** The Occupied Palestinian Territory */
  Ps = 'PS',
  /** Portugal */
  Pt = 'PT',
  /** Palau */
  Pw = 'PW',
  /** Paraguay */
  Py = 'PY',
  /** Qatar */
  Qa = 'QA',
  /** Réunion */
  Re = 'RE',
  /** Romania */
  Ro = 'RO',
  /** Serbia */
  Rs = 'RS',
  /** Russia */
  Ru = 'RU',
  /** Rwanda */
  Rw = 'RW',
  /** Saudi Arabia */
  Sa = 'SA',
  /** Solomon Islands */
  Sb = 'SB',
  /** Seychelles */
  Sc = 'SC',
  /** The Sudan */
  Sd = 'SD',
  /** Sweden */
  Se = 'SE',
  /** Singapore */
  Sg = 'SG',
  /** Saint Helena */
  Sh = 'SH',
  /** Slovenia */
  Si = 'SI',
  /** Svalbard and Jan Mayen */
  Sj = 'SJ',
  /** Slovakia */
  Sk = 'SK',
  /** Sierra Leone */
  Sl = 'SL',
  /** San Marino */
  Sm = 'SM',
  /** Senegal */
  Sn = 'SN',
  /** Somalia */
  So = 'SO',
  /** Suriname */
  Sr = 'SR',
  /** Sao Tome and Principe */
  St = 'ST',
  /** El Salvador */
  Sv = 'SV',
  /** Syria */
  Sy = 'SY',
  /** Swaziland */
  Sz = 'SZ',
  /** Turks and Caicos Islands */
  Tc = 'TC',
  /** Chad */
  Td = 'TD',
  /** The French Southern Territories */
  Tf = 'TF',
  /** Togo */
  Tg = 'TG',
  /** Thailand */
  Th = 'TH',
  /** Tajikistan */
  Tj = 'TJ',
  /** Tokelau */
  Tk = 'TK',
  /** Timor-Leste */
  Tl = 'TL',
  /** Turkmenistan */
  Tm = 'TM',
  /** Tunisia */
  Tn = 'TN',
  /** Tonga */
  To = 'TO',
  /** Turkey */
  Tr = 'TR',
  /** Trinidad and Tobago */
  Tt = 'TT',
  /** Tuvalu */
  Tv = 'TV',
  /** Taiwan */
  Tw = 'TW',
  /** Tanzania */
  Tz = 'TZ',
  /** Ukraine */
  Ua = 'UA',
  /** Uganda */
  Ug = 'UG',
  /** United States Minor Outlying Islands */
  Um = 'UM',
  /** The United States */
  Us = 'US',
  /** Uruguay */
  Uy = 'UY',
  /** Uzbekistan */
  Uz = 'UZ',
  /** The Holy See */
  Va = 'VA',
  /** Saint Vincent and The Grenadines */
  Vc = 'VC',
  /** Venezuela */
  Ve = 'VE',
  /** British Virgin Islands */
  Vg = 'VG',
  /** US Virgin Islands */
  Vi = 'VI',
  /** Viet Nam */
  Vn = 'VN',
  /** Vanuatu */
  Vu = 'VU',
  /** Wallis and Futuna */
  Wf = 'WF',
  /** Samoa */
  Ws = 'WS',
  /** Yemen */
  Ye = 'YE',
  /** Mayotte */
  Yt = 'YT',
  /** South Africa */
  Za = 'ZA',
  /** Zambia */
  Zm = 'ZM',
  /** Zimbabwe */
  Zw = 'ZW'
}

/** This represents a Credit transaction */
export type Credit = Transaction & {
  __typename?: 'Credit';
  /** The account on the main side of the transaction (CREDIT -> recipient, DEBIT -> sender) */
  account?: Maybe<Account>;
  amount: Amount;
  amountInHostCurrency: Amount;
  balanceInHostCurrency?: Maybe<Amount>;
  createdAt?: Maybe<Scalars['DateTime']>;
  description?: Maybe<Scalars['String']>;
  expense?: Maybe<Expense>;
  fromAccount?: Maybe<Account>;
  /** Account that emitted the gift card used for this transaction (if any) */
  giftCardEmitterAccount?: Maybe<Account>;
  group: Scalars['String'];
  host?: Maybe<Account>;
  /** Exchange rate between the currency of the transaction and the currency of the host (transaction.amount * transaction.hostCurrencyFxRate = transaction.amountInHostCurrency) */
  hostCurrencyFxRate?: Maybe<Scalars['Float']>;
  hostFee: Amount;
  id: Scalars['String'];
  invoiceTemplate?: Maybe<Scalars['String']>;
  isOrderRejected: Scalars['Boolean'];
  isRefund?: Maybe<Scalars['Boolean']>;
  isRefunded?: Maybe<Scalars['Boolean']>;
  kind?: Maybe<TransactionKind>;
  legacyId: Scalars['Int'];
  /** Merchant id related to the Transaction (Stripe, PayPal, Wise, Privacy) */
  merchantId?: Maybe<Scalars['String']>;
  netAmount: Amount;
  netAmountInHostCurrency: Amount;
  /** The account on the opposite side of the transaction (CREDIT -> sender, DEBIT -> recipient) */
  oppositeAccount?: Maybe<Account>;
  order?: Maybe<Order>;
  paymentMethod?: Maybe<PaymentMethod>;
  /** Payment Processor Fee (usually in host currency) */
  paymentProcessorFee: Amount;
  payoutMethod?: Maybe<PayoutMethod>;
  /** The permissions given to current logged in user for this transaction */
  permissions: TransactionPermissions;
  platformFee: Amount;
  refundTransaction?: Maybe<Transaction>;
  relatedTransactions: Array<Maybe<Transaction>>;
  taxAmount: Amount;
  /** If taxAmount is set, this field will contain more info about the tax */
  taxInfo?: Maybe<TaxInfo>;
  toAccount?: Maybe<Account>;
  type: TransactionType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** @deprecated 2021-08-15: Use id instead. */
  uuid: Scalars['String'];
};


/** This represents a Credit transaction */
export type CreditDescriptionArgs = {
  dynamic?: InputMaybe<Scalars['Boolean']>;
  full?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Credit transaction */
export type CreditHostFeeArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Credit transaction */
export type CreditNetAmountArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Credit transaction */
export type CreditNetAmountInHostCurrencyArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Credit transaction */
export type CreditRelatedTransactionsArgs = {
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
};

export type CreditCardCreateInput = {
  brand: Scalars['String'];
  country: Scalars['String'];
  expMonth: Scalars['Int'];
  expYear: Scalars['Int'];
  fullName?: InputMaybe<Scalars['String']>;
  funding?: InputMaybe<Scalars['String']>;
  token: Scalars['String'];
  zip?: InputMaybe<Scalars['String']>;
};

export type CreditCardWithStripeError = {
  __typename?: 'CreditCardWithStripeError';
  /** The payment method created */
  paymentMethod: PaymentMethod;
  /** This field will be set if there was an error with Stripe during strong customer authentication */
  stripeError?: Maybe<StripeError>;
};

/** All supported currencies */
export enum Currency {
  /** UAE Dirham */
  Aed = 'AED',
  /** Afghani */
  Afn = 'AFN',
  /** Lek */
  All = 'ALL',
  /** Armenian Dram */
  Amd = 'AMD',
  /** Netherlands Antillean Guilder */
  Ang = 'ANG',
  /** Kwanza */
  Aoa = 'AOA',
  /** Argentine Peso */
  Ars = 'ARS',
  /** Australian Dollar */
  Aud = 'AUD',
  /** Aruban Florin */
  Awg = 'AWG',
  /** Azerbaijanian Manat */
  Azn = 'AZN',
  /** Convertible Mark */
  Bam = 'BAM',
  /** Barbados Dollar */
  Bbd = 'BBD',
  /** Taka */
  Bdt = 'BDT',
  /** Bulgarian Lev */
  Bgn = 'BGN',
  /** Burundi Franc */
  Bif = 'BIF',
  /** Bermudian Dollar */
  Bmd = 'BMD',
  /** Brunei Dollar */
  Bnd = 'BND',
  /** Boliviano */
  Bob = 'BOB',
  /** Brazilian Real */
  Brl = 'BRL',
  /** Bahamian Dollar */
  Bsd = 'BSD',
  /** Pula */
  Bwp = 'BWP',
  /** Belarussian Ruble */
  Byn = 'BYN',
  /** Belize Dollar */
  Bzd = 'BZD',
  /** Canadian Dollar */
  Cad = 'CAD',
  /** Congolese Franc */
  Cdf = 'CDF',
  /** Swiss Franc */
  Chf = 'CHF',
  /** Chilean Peso */
  Clp = 'CLP',
  /** Yuan Renminbi */
  Cny = 'CNY',
  /** Colombian Peso */
  Cop = 'COP',
  /** Costa Rican Colon */
  Crc = 'CRC',
  /** Cabo Verde Escudo */
  Cve = 'CVE',
  /** Czech Koruna */
  Czk = 'CZK',
  /** Djibouti Franc */
  Djf = 'DJF',
  /** Danish Krone */
  Dkk = 'DKK',
  /** Dominican Peso */
  Dop = 'DOP',
  /** Algerian Dinar */
  Dzd = 'DZD',
  /** Egyptian Pound */
  Egp = 'EGP',
  /** Ethiopian Birr */
  Etb = 'ETB',
  /** Euro */
  Eur = 'EUR',
  /** Fiji Dollar */
  Fjd = 'FJD',
  /** Falkland Islands Pound */
  Fkp = 'FKP',
  /** Pound Sterling */
  Gbp = 'GBP',
  /** Lari */
  Gel = 'GEL',
  /** Gibraltar Pound */
  Gip = 'GIP',
  /** Dalasi */
  Gmd = 'GMD',
  /** Guinea Franc */
  Gnf = 'GNF',
  /** Quetzal */
  Gtq = 'GTQ',
  /** Guyana Dollar */
  Gyd = 'GYD',
  /** Hong Kong Dollar */
  Hkd = 'HKD',
  /** Lempira */
  Hnl = 'HNL',
  /** Kuna */
  Hrk = 'HRK',
  /** Gourde */
  Htg = 'HTG',
  /** Forint */
  Huf = 'HUF',
  /** Rupiah */
  Idr = 'IDR',
  /** New Israeli Sheqel */
  Ils = 'ILS',
  /** Indian Rupee */
  Inr = 'INR',
  /** Iceland Krona */
  Isk = 'ISK',
  /** Jamaican Dollar */
  Jmd = 'JMD',
  /** Yen */
  Jpy = 'JPY',
  /** Kenyan Shilling */
  Kes = 'KES',
  /** Som */
  Kgs = 'KGS',
  /** Riel */
  Khr = 'KHR',
  /** Comoro Franc */
  Kmf = 'KMF',
  /** Won */
  Krw = 'KRW',
  /** Cayman Islands Dollar */
  Kyd = 'KYD',
  /** Tenge */
  Kzt = 'KZT',
  /** Kip */
  Lak = 'LAK',
  /** Lebanese Pound */
  Lbp = 'LBP',
  /** Sri Lanka Rupee */
  Lkr = 'LKR',
  /** Liberian Dollar */
  Lrd = 'LRD',
  /** Loti */
  Lsl = 'LSL',
  /** Moroccan Dirham */
  Mad = 'MAD',
  /** Moldovan Leu */
  Mdl = 'MDL',
  /** Malagasy Ariary */
  Mga = 'MGA',
  /** Denar */
  Mkd = 'MKD',
  /** Kyat */
  Mmk = 'MMK',
  /** Tugrik */
  Mnt = 'MNT',
  /** Pataca */
  Mop = 'MOP',
  /** Mauritius Rupee */
  Mur = 'MUR',
  /** Rufiyaa */
  Mvr = 'MVR',
  /** Kwacha */
  Mwk = 'MWK',
  /** Mexican Peso */
  Mxn = 'MXN',
  /** Malaysian Ringgit */
  Myr = 'MYR',
  /** Mozambique Metical */
  Mzn = 'MZN',
  /** Namibia Dollar */
  Nad = 'NAD',
  /** Naira */
  Ngn = 'NGN',
  /** Cordoba Oro */
  Nio = 'NIO',
  /** Norwegian Krone */
  Nok = 'NOK',
  /** Nepalese Rupee */
  Npr = 'NPR',
  /** New Zealand Dollar */
  Nzd = 'NZD',
  /** Balboa */
  Pab = 'PAB',
  /** Nuevo Sol */
  Pen = 'PEN',
  /** Kina */
  Pgk = 'PGK',
  /** Philippine Peso */
  Php = 'PHP',
  /** Pakistan Rupee */
  Pkr = 'PKR',
  /** Zloty */
  Pln = 'PLN',
  /** Guarani */
  Pyg = 'PYG',
  /** Qatari Rial */
  Qar = 'QAR',
  /** Romanian Leu */
  Ron = 'RON',
  /** Serbian Dinar */
  Rsd = 'RSD',
  /** Russian Ruble */
  Rub = 'RUB',
  /** Rwanda Franc */
  Rwf = 'RWF',
  /** Saudi Riyal */
  Sar = 'SAR',
  /** Solomon Islands Dollar */
  Sbd = 'SBD',
  /** Seychelles Rupee */
  Scr = 'SCR',
  /** Swedish Krona */
  Sek = 'SEK',
  /** Singapore Dollar */
  Sgd = 'SGD',
  /** Saint Helena Pound */
  Shp = 'SHP',
  /** Leone */
  Sll = 'SLL',
  /** Somali Shilling */
  Sos = 'SOS',
  /** Surinam Dollar */
  Srd = 'SRD',
  /** Lilangeni */
  Szl = 'SZL',
  /** Baht */
  Thb = 'THB',
  /** Somoni */
  Tjs = 'TJS',
  /** Pa’anga */
  Top = 'TOP',
  /** Turkish Lira */
  Try = 'TRY',
  /** Trinidad and Tobago Dollar */
  Ttd = 'TTD',
  /** New Taiwan Dollar */
  Twd = 'TWD',
  /** Tanzanian Shilling */
  Tzs = 'TZS',
  /** Hryvnia */
  Uah = 'UAH',
  /** Uganda Shilling */
  Ugx = 'UGX',
  /** US Dollar */
  Usd = 'USD',
  /** Peso Uruguayo */
  Uyu = 'UYU',
  /** Uzbekistan Sum */
  Uzs = 'UZS',
  /** Dong */
  Vnd = 'VND',
  /** Vatu */
  Vuv = 'VUV',
  /** Tala */
  Wst = 'WST',
  /** CFA Franc BEAC */
  Xaf = 'XAF',
  /** East Caribbean Dollar */
  Xcd = 'XCD',
  /** CFA Franc BCEAO */
  Xof = 'XOF',
  /** CFP Franc */
  Xpf = 'XPF',
  /** Yemeni Rial */
  Yer = 'YER',
  /** Rand */
  Zar = 'ZAR',
  /** Zambian Kwacha */
  Zmw = 'ZMW'
}

/** Fields for a currency fx rate */
export type CurrencyExchangeRate = {
  __typename?: 'CurrencyExchangeRate';
  /** Date of the FX rate */
  date: Scalars['DateTime'];
  fromCurrency: Currency;
  /** Is the FX rate approximate or a fixed value? */
  isApproximate: Scalars['Boolean'];
  /** Where does the FX rate comes from */
  source: CurrencyExchangeRateSourceType;
  toCurrency: Currency;
  /** Exchange rate value as a scalar (e.g 1.15 or 0.86) */
  value: Scalars['Float'];
};

/** Where does the FX rate come from */
export enum CurrencyExchangeRateSourceType {
  /** Open Collective internal system, relying on caching and 3rd party APIs */
  Opencollective = 'OPENCOLLECTIVE',
  /** PayPal API */
  Paypal = 'PAYPAL',
  /** Wise API */
  Wise = 'WISE'
}

/** All possible DateTime fields for a resource */
export enum DateTimeField {
  /** The creation time of a resource */
  CreatedAt = 'CREATED_AT'
}

/** This represents a Debit transaction */
export type Debit = Transaction & {
  __typename?: 'Debit';
  /** The account on the main side of the transaction (CREDIT -> recipient, DEBIT -> sender) */
  account?: Maybe<Account>;
  amount: Amount;
  amountInHostCurrency: Amount;
  balanceInHostCurrency?: Maybe<Amount>;
  createdAt?: Maybe<Scalars['DateTime']>;
  description?: Maybe<Scalars['String']>;
  expense?: Maybe<Expense>;
  fromAccount?: Maybe<Account>;
  /** Account that emitted the gift card used for this transaction (if any) */
  giftCardEmitterAccount?: Maybe<Account>;
  group: Scalars['String'];
  host?: Maybe<Account>;
  /** Exchange rate between the currency of the transaction and the currency of the host (transaction.amount * transaction.hostCurrencyFxRate = transaction.amountInHostCurrency) */
  hostCurrencyFxRate?: Maybe<Scalars['Float']>;
  hostFee: Amount;
  id: Scalars['String'];
  invoiceTemplate?: Maybe<Scalars['String']>;
  isOrderRejected: Scalars['Boolean'];
  isRefund?: Maybe<Scalars['Boolean']>;
  isRefunded?: Maybe<Scalars['Boolean']>;
  kind?: Maybe<TransactionKind>;
  legacyId: Scalars['Int'];
  /** Merchant id related to the Transaction (Stripe, PayPal, Wise, Privacy) */
  merchantId?: Maybe<Scalars['String']>;
  netAmount: Amount;
  netAmountInHostCurrency: Amount;
  /** The account on the opposite side of the transaction (CREDIT -> sender, DEBIT -> recipient) */
  oppositeAccount?: Maybe<Account>;
  order?: Maybe<Order>;
  paymentMethod?: Maybe<PaymentMethod>;
  /** Payment Processor Fee (usually in host currency) */
  paymentProcessorFee: Amount;
  payoutMethod?: Maybe<PayoutMethod>;
  /** The permissions given to current logged in user for this transaction */
  permissions: TransactionPermissions;
  platformFee: Amount;
  refundTransaction?: Maybe<Transaction>;
  relatedTransactions: Array<Maybe<Transaction>>;
  taxAmount: Amount;
  /** If taxAmount is set, this field will contain more info about the tax */
  taxInfo?: Maybe<TaxInfo>;
  toAccount?: Maybe<Account>;
  type: TransactionType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** @deprecated 2021-08-15: Use id instead. */
  uuid: Scalars['String'];
};


/** This represents a Debit transaction */
export type DebitDescriptionArgs = {
  dynamic?: InputMaybe<Scalars['Boolean']>;
  full?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Debit transaction */
export type DebitHostFeeArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Debit transaction */
export type DebitNetAmountArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Debit transaction */
export type DebitNetAmountInHostCurrencyArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Debit transaction */
export type DebitRelatedTransactionsArgs = {
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
};

export type EmojiReactionResponse = {
  __typename?: 'EmojiReactionResponse';
  /** Reference to the comment corresponding to the emojis */
  comment?: Maybe<Comment>;
  /** Reference to the update corresponding to the emojis */
  update?: Maybe<Update>;
};

/** This represents an Event account */
export type Event = Account & AccountWithContributions & AccountWithHost & AccountWithParent & {
  __typename?: 'Event';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  /** Date of approval by the Fiscal Host. */
  approvedAt?: Maybe<Scalars['DateTime']>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  /**
   * Amount of money in cents in the currency of the account currently available to spend
   * @deprecated 2020/04/09 - Should not have been introduced. Use stats.balance.value
   */
  balance?: Maybe<Scalars['Int']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  contributionPolicy?: Maybe<Scalars['String']>;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  /** The Event end date and time */
  endsAt?: Maybe<Scalars['DateTime']>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** Returns the Fiscal Host */
  host?: Maybe<Host>;
  /** Fees percentage that the host takes for this collective */
  hostFeePercent?: Maybe<Scalars['Float']>;
  /** Describe how the host charges the collective */
  hostFeesStructure?: Maybe<HostFeeStructure>;
  id?: Maybe<Scalars['String']>;
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether it's active: can accept financial contributions and pay expenses. */
  isActive: Scalars['Boolean'];
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether it's approved by the Fiscal Host */
  isApproved: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived?: Maybe<Scalars['Boolean']>;
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost?: Maybe<Scalars['Boolean']>;
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId?: Maybe<Scalars['Int']>;
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  /** The Account parenting this account */
  parent?: Maybe<Account>;
  parentAccount?: Maybe<Account>;
  /**
   * The Collective hosting this Event
   * @deprecated 2020/07/01 - Use parent instead.
   */
  parentCollective?: Maybe<Collective>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Int'];
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug?: Maybe<Scalars['String']>;
  /** The Event start date and time */
  startsAt?: Maybe<Scalars['DateTime']>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  tiers: TierCollection;
  /** Timezone of the Event (TZ database format, e.g. UTC or Europe/Berlin) */
  timezone?: Maybe<Scalars['String']>;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  twitterHandle?: Maybe<Scalars['String']>;
  type?: Maybe<AccountType>;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  website?: Maybe<Scalars['String']>;
};


/** This represents an Event account */
export type EventActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents an Event account */
export type EventBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Event account */
export type EventChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Event account */
export type EventContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Event account */
export type EventConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents an Event account */
export type EventConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Event account */
export type EventExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Event account */
export type EventHostFeePercentArgs = {
  paymentMethodService?: InputMaybe<PaymentMethodService>;
  paymentMethodType?: InputMaybe<PaymentMethodType>;
};


/** This represents an Event account */
export type EventImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Event account */
export type EventMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Event account */
export type EventMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Event account */
export type EventMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Event account */
export type EventOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Event account */
export type EventOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** This represents an Event account */
export type EventPaymentMethodsArgs = {
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents an Event account */
export type EventTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Event account */
export type EventTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};


/** This represents an Event account */
export type EventTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** This represents an Event account */
export type EventUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Event account */
export type EventVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Event account */
export type EventVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents an Event account */
export type EventWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type EventCreateInput = {
  description?: InputMaybe<Scalars['String']>;
  /** The Event end date and time */
  endsAt: Scalars['DateTime'];
  name: Scalars['String'];
  settings?: InputMaybe<Scalars['JSON']>;
  slug?: InputMaybe<Scalars['String']>;
  /** The Event start date and time */
  startsAt: Scalars['DateTime'];
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  /** Timezone of the Event (TZ database format, e.g. UTC or Europe/Berlin) */
  timezone: Scalars['String'];
};

/** This represents an Expense */
export type Expense = {
  __typename?: 'Expense';
  /** The account where the expense was submitted */
  account: Account;
  /**
   * The exchange rate between the expense currency and the account currency
   * @deprecated 2022-02-09: Please use amountV2
   */
  accountCurrencyFxRate: Scalars['Float'];
  /** The list of activities (ie. approved, edited, etc) for this expense ordered by date ascending */
  activities: Array<Activity>;
  /**
   * Total amount of the expense (sum of the item's amounts).
   * @deprecated 2022-02-09: Please use amountV2
   */
  amount: Scalars['Int'];
  /** Total amount of the expense */
  amountV2?: Maybe<Amount>;
  /** (Optional) files attached to the expense */
  attachedFiles?: Maybe<Array<ExpenseAttachedFile>>;
  /** @deprecated 2020-04-08: Field has been renamed to "items" */
  attachments?: Maybe<Array<Maybe<ExpenseItem>>>;
  /** Returns the list of comments for this expense, or `null` if user is not allowed to see them */
  comments?: Maybe<CommentCollection>;
  /** The time of creation */
  createdAt: Scalars['DateTime'];
  /** The account who created this expense */
  createdByAccount?: Maybe<Account>;
  /** Currency that should be used for the payout */
  currency: Currency;
  /** Title/main description for this expense */
  description: Scalars['String'];
  /** Drafted field values that were still not persisted */
  draft?: Maybe<Scalars['JSON']>;
  /** The fees payer for this expense */
  feesPayer: FeesPayer;
  /** The account from where the expense was paid */
  host?: Maybe<Account>;
  id: Scalars['String'];
  /** Information to display on the invoice. Only visible to user and admins. */
  invoiceInfo?: Maybe<Scalars['String']>;
  items?: Maybe<Array<Maybe<ExpenseItem>>>;
  /** Legacy ID as returned by API V1. Avoid relying on this field as it may be removed in the future. */
  legacyId: Scalars['Int'];
  /** Longer description for this expense */
  longDescription?: Maybe<Scalars['String']>;
  /** The account being paid by this expense */
  payee: Account;
  /** The address of the payee */
  payeeLocation?: Maybe<Location>;
  /** The payout method to use for this expense */
  payoutMethod?: Maybe<PayoutMethod>;
  /** The permissions given to current logged in user for this expense */
  permissions: ExpensePermissions;
  /** Additional information about the payment as HTML. Only visible to user and admins. */
  privateMessage?: Maybe<Scalars['String']>;
  quote?: Maybe<ExpenseQuote>;
  recurringExpense?: Maybe<RecurringExpense>;
  /** The account that requested this expense to be submitted */
  requestedByAccount?: Maybe<Account>;
  /** Returns the list of legal documents required from the payee before the expense can be payed. Must be logged in. */
  requiredLegalDocuments?: Maybe<Array<Maybe<LegalDocumentType>>>;
  /** The state of the expense (pending, approved, paid, rejected...etc) */
  status: ExpenseStatus;
  tags: Array<Maybe<Scalars['String']>>;
  /** Taxes applied to this expense */
  taxes: Array<Maybe<TaxInfo>>;
  /** Whether this expense is a receipt or an invoice */
  type: ExpenseType;
  /** The virtual card used to pay for this charge */
  virtualCard?: Maybe<VirtualCard>;
};


/** This represents an Expense */
export type ExpenseAmountV2Args = {
  currencySource?: InputMaybe<ExpenseCurrencySource>;
};


/** This represents an Expense */
export type ExpenseCommentsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
};

/** Fields for an expense's attached file */
export type ExpenseAttachedFile = {
  __typename?: 'ExpenseAttachedFile';
  /** Unique identifier for this file */
  id: Scalars['String'];
  url?: Maybe<Scalars['URL']>;
};

export type ExpenseAttachedFileInput = {
  /** ID of the file */
  id?: InputMaybe<Scalars['String']>;
  /** URL of the file */
  url: Scalars['URL'];
};

/** A collection of "Expenses" */
export type ExpenseCollection = Collection & {
  __typename?: 'ExpenseCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Expense>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export type ExpenseCreateInput = {
  /** (Optional) A list of files that you want to attach to this expense */
  attachedFiles?: InputMaybe<Array<ExpenseAttachedFileInput>>;
  /** Currency that should be used for the payout. Defaults to the account currency */
  currency?: InputMaybe<Currency>;
  /** Main title of the expense */
  description: Scalars['String'];
  /** Custom information to print on the invoice */
  invoiceInfo?: InputMaybe<Scalars['String']>;
  /** The list of items for this expense. Total amount will be computed from them. */
  items?: InputMaybe<Array<InputMaybe<ExpenseItemCreateInput>>>;
  /** Longer text to attach to the expense */
  longDescription?: InputMaybe<Scalars['String']>;
  /** Account to reimburse */
  payee: AccountReferenceInput;
  /** The address of the payee */
  payeeLocation?: InputMaybe<LocationInput>;
  /** The payout method that will be used to reimburse the expense */
  payoutMethod: PayoutMethodInput;
  /** A private note that will be attached to your invoice, as HTML */
  privateMessage?: InputMaybe<Scalars['String']>;
  /** Tags associated to the expense (ie. Food, Engineering...) */
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  /** The list of taxes that should be applied to the expense (VAT, GST, etc...) */
  tax?: InputMaybe<Array<InputMaybe<ExpenseTaxInput>>>;
  /** The type of the expense */
  type: ExpenseType;
};

/** All supported expense currency sources */
export enum ExpenseCurrencySource {
  /** The expense currency expressed as the account currency */
  Account = 'ACCOUNT',
  /** The expense currency expressed as the expense currency */
  Expense = 'EXPENSE',
  /** The expense currency expressed as the host currency */
  Host = 'HOST'
}

export type ExpenseInviteDraftInput = {
  /** (Optional) A list of files that you want to attach to this expense */
  attachedFiles?: InputMaybe<Array<InputMaybe<Scalars['JSON']>>>;
  /** Main title of the expense */
  description?: InputMaybe<Scalars['String']>;
  /** Tax ID, VAT number...etc This information will be printed on your invoice. */
  invoiceInfo?: InputMaybe<Scalars['String']>;
  /** The list of items for this expense. Total amount will be computed from them. */
  items?: InputMaybe<Array<InputMaybe<Scalars['JSON']>>>;
  /** Longer text to attach to the expense */
  longDescription?: InputMaybe<Scalars['String']>;
  /** Account to reimburse */
  payee: ExpenseInvitee;
  /** The address of the payee */
  payeeLocation?: InputMaybe<LocationInput>;
  /** The payout method that will be used to reimburse the expense */
  payoutMethod?: InputMaybe<PayoutMethodInput>;
  /** A private note that will be attached to your invoice, as HTML */
  privateMessage?: InputMaybe<Scalars['String']>;
  /** Note to be sent to the invited user through email. */
  recipientNote?: InputMaybe<Scalars['String']>;
  /** Tags associated to the expense (ie. Food, Engineering...) */
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  /** The type of the expense */
  type: ExpenseType;
};

export type ExpenseInvitee = {
  email?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['Int']>;
  isInvite?: InputMaybe<Scalars['Boolean']>;
  name?: InputMaybe<Scalars['String']>;
  organization?: InputMaybe<ExpenseInviteeOrganizationInput>;
  slug?: InputMaybe<Scalars['String']>;
};

export type ExpenseInviteeOrganizationInput = {
  description?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  website?: InputMaybe<Scalars['String']>;
};

/** Fields for an expense item */
export type ExpenseItem = {
  __typename?: 'ExpenseItem';
  /** Amount of this item */
  amount: Scalars['Int'];
  /** The date on which the item was created */
  createdAt: Scalars['DateTime'];
  /** A description for this item. Enforced for new items, but old expenses may not have one. */
  description?: Maybe<Scalars['String']>;
  /** Unique identifier for this expense item */
  id: Scalars['String'];
  /** The date on which the expense took place */
  incurredAt: Scalars['DateTime'];
  /** The date on which the item was last updated */
  updatedAt: Scalars['DateTime'];
  url?: Maybe<Scalars['URL']>;
};

export type ExpenseItemCreateInput = {
  /** Amount in cents */
  amount: Scalars['Int'];
  /** What is this item about? */
  description: Scalars['String'];
  /** When was the money spent? */
  incurredAt?: InputMaybe<Scalars['DateString']>;
  /** URL of the file linked to this item. Must be provided if the expense type is RECEIPT. */
  url?: InputMaybe<Scalars['URL']>;
};

export type ExpenseItemInput = {
  /** Amount in cents */
  amount?: InputMaybe<Scalars['Int']>;
  /** What is this item about? */
  description?: InputMaybe<Scalars['String']>;
  /** ID of the item */
  id?: InputMaybe<Scalars['String']>;
  /** When was the money spent? */
  incurredAt?: InputMaybe<Scalars['DateString']>;
  /** URL of the file linked to this item. Must be provided if the expense type is RECEIPT. */
  url?: InputMaybe<Scalars['URL']>;
};

/** Fields for the user permissions on an expense */
export type ExpensePermissions = {
  __typename?: 'ExpensePermissions';
  approve: Permission;
  /** Whether the current user can approve this expense */
  canApprove: Scalars['Boolean'];
  /** Whether the current user can comment and see comments for this expense */
  canComment: Scalars['Boolean'];
  /** Whether the current user can edit the expense */
  canDelete: Scalars['Boolean'];
  /** Whether the current user can edit the expense */
  canEdit: Scalars['Boolean'];
  /** Tags permissions are a bit different, and can be edited by admins even if the expense has already been paid */
  canEditTags: Scalars['Boolean'];
  /** Whether the current user can mark this expense as incomplete */
  canMarkAsIncomplete: Scalars['Boolean'];
  /** Whether the current user can mark this expense as spam */
  canMarkAsSpam: Scalars['Boolean'];
  /** Whether the current user can mark this expense as unpaid */
  canMarkAsUnpaid: Scalars['Boolean'];
  /** Whether the current user can trigger the payment for this expense */
  canPay: Scalars['Boolean'];
  /** Whether the current user can reject this expense */
  canReject: Scalars['Boolean'];
  /** Whether the current user can the the invoice info for this expense */
  canSeeInvoiceInfo: Scalars['Boolean'];
  /** Whether the current user can unapprove this expense */
  canUnapprove: Scalars['Boolean'];
  /** Whether the current user can unschedule this expense payment */
  canUnschedulePayment: Scalars['Boolean'];
  comment: Permission;
  delete: Permission;
  edit: Permission;
  editTags: Permission;
  id: Scalars['String'];
  markAsSpam: Permission;
  markAsUnpaid: Permission;
  pay: Permission;
  reject: Permission;
  seeInvoiceInfo: Permission;
  unapprove: Permission;
  unschedulePayment: Permission;
};

/** All supported expense types */
export enum ExpenseProcessAction {
  /** To mark the expense as approved */
  Approve = 'APPROVE',
  /** To mark the expense as incomplete and notify the payee it requires more information */
  MarkAsIncomplete = 'MARK_AS_INCOMPLETE',
  /** To mark the expense as spam */
  MarkAsSpam = 'MARK_AS_SPAM',
  /** To mark the expense as unpaid (marks the transaction as refunded) */
  MarkAsUnpaid = 'MARK_AS_UNPAID',
  /** To trigger the payment */
  Pay = 'PAY',
  /** To mark the expense as rejected */
  Reject = 'REJECT',
  /** To schedule the expense for payment */
  ScheduleForPayment = 'SCHEDULE_FOR_PAYMENT',
  /** To mark the expense as pending after it has been approved */
  Unapprove = 'UNAPPROVE',
  /** To unschedule the expense payment */
  UnschedulePayment = 'UNSCHEDULE_PAYMENT'
}

/** Fields for an expense quote */
export type ExpenseQuote = {
  __typename?: 'ExpenseQuote';
  /** The date on which the item was created */
  estimatedDeliveryAt?: Maybe<Scalars['DateTime']>;
  /** Amount of payment processor fee */
  paymentProcessorFeeAmount: Amount;
  /** Amount of this item */
  totalAmount: Amount;
};

export type ExpenseReferenceInput = {
  /** The public id identifying the expense (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The internal id of the expense (ie: 580) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

/** Expense statistics related to the given accounts */
export type ExpenseStats = {
  __typename?: 'ExpenseStats';
  /** The daily average paid in expenses */
  dailyAverageAmount: Amount;
  /**
   * The total number of expenses over time
   * @deprecated 2022-04-21: Please use hostMetricsTimeSeries.totalSpent
   */
  expenseAmountOverTime?: Maybe<TimeSeriesAmount>;
  /** The total number of expenses */
  expensesCount: Scalars['Int'];
  /** Number of grants */
  grantsCount: Scalars['Int'];
  /** Number of invoices */
  invoicesCount: Scalars['Int'];
  /** Number of reimbursements */
  reimbursementsCount: Scalars['Int'];
};

export enum ExpenseStatus {
  Approved = 'APPROVED',
  Canceled = 'CANCELED',
  Draft = 'DRAFT',
  Error = 'ERROR',
  Incomplete = 'INCOMPLETE',
  Paid = 'PAID',
  Pending = 'PENDING',
  Processing = 'PROCESSING',
  Rejected = 'REJECTED',
  ScheduledForPayment = 'SCHEDULED_FOR_PAYMENT',
  Spam = 'SPAM',
  Unverified = 'UNVERIFIED'
}

/** Describes the values allowed to filter expenses, namely all the expense statuses and the special "READY_TO_PAY" value. */
export enum ExpenseStatusFilter {
  Approved = 'APPROVED',
  Canceled = 'CANCELED',
  Draft = 'DRAFT',
  Error = 'ERROR',
  Incomplete = 'INCOMPLETE',
  Paid = 'PAID',
  Pending = 'PENDING',
  Processing = 'PROCESSING',
  /** Only expenses that are ready to be paid (must be approved, have the sufficiant balance and have the tax forms completed) */
  ReadyToPay = 'READY_TO_PAY',
  Rejected = 'REJECTED',
  ScheduledForPayment = 'SCHEDULED_FOR_PAYMENT',
  Spam = 'SPAM',
  Unverified = 'UNVERIFIED'
}

/** Input to set taxes for an expense */
export type ExpenseTaxInput = {
  /** Tax identification number, if any */
  idNumber?: InputMaybe<Scalars['String']>;
  /** Tax rate as a float number between 0 and 1 */
  rate: Scalars['Float'];
  type: TaxType;
};

/** All supported expense types */
export enum ExpenseType {
  /** Credit Card Charge: Payment done using an issued (virtual) credit card issued by your Fiscal Host. */
  Charge = 'CHARGE',
  /** Funding Request: Request funding for a project or initiative. */
  FundingRequest = 'FUNDING_REQUEST',
  /** Grant: Request funding for a project or initiative. */
  Grant = 'GRANT',
  /** Invoice: Charge for your time or get paid in advance. */
  Invoice = 'INVOICE',
  /** Receipt: Get paid back for a purchase already made. */
  Receipt = 'RECEIPT',
  /** Settlement: expense generated by Open Collective to collect money owed by Fiscal Hosts. */
  Settlement = 'SETTLEMENT',
  /** Unclassified expense */
  Unclassified = 'UNCLASSIFIED'
}

export type ExpenseUpdateInput = {
  /** (Optional) A list of files that you want to attach to this expense */
  attachedFiles?: InputMaybe<Array<ExpenseAttachedFileInput>>;
  /** @deprecated 2020-04-08: Please use the items field - The list of items for this expense. Total amount will be computed from them. */
  attachments?: InputMaybe<Array<InputMaybe<ExpenseItemInput>>>;
  /** Currency that should be used for the payout. Defaults to the account currency */
  currency?: InputMaybe<Currency>;
  /** Main title of the expense */
  description?: InputMaybe<Scalars['String']>;
  /** ID of the expense that you are trying to edit */
  id: Scalars['String'];
  /** Tax ID, VAT number...etc This information will be printed on your invoice. */
  invoiceInfo?: InputMaybe<Scalars['String']>;
  /** The list of items for this expense. Total amount will be computed from them. */
  items?: InputMaybe<Array<InputMaybe<ExpenseItemInput>>>;
  /** Longer text to attach to the expense */
  longDescription?: InputMaybe<Scalars['String']>;
  /** Account to reimburse */
  payee?: InputMaybe<NewAccountOrReferenceInput>;
  /** The address of the payee */
  payeeLocation?: InputMaybe<LocationInput>;
  /** The payout method that will be used to reimburse the expense */
  payoutMethod?: InputMaybe<PayoutMethodInput>;
  /** A private note that will be attached to your invoice, as HTML */
  privateMessage?: InputMaybe<Scalars['String']>;
  /** Tags associated to the expense (ie. Food, Engineering...) */
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  /** The list of taxes that should be applied to the expense (VAT, GST, etc...) */
  tax?: InputMaybe<Array<InputMaybe<ExpenseTaxInput>>>;
  /** The type of the expense */
  type?: InputMaybe<ExpenseType>;
};

/** All supported expense types */
export enum FeesPayer {
  /** The collective will be responsible for paying the fees */
  Collective = 'COLLECTIVE',
  /** The payee will be responsible for paying the fees (they'll be deduced from the total amount) */
  Payee = 'PAYEE'
}

/** This represents an Project account */
export type Fund = Account & AccountWithContributions & AccountWithHost & {
  __typename?: 'Fund';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  /** Date of approval by the Fiscal Host. */
  approvedAt?: Maybe<Scalars['DateTime']>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  /**
   * Amount of money in cents in the currency of the account currently available to spend
   * @deprecated 2020/04/09 - Should not have been introduced. Use stats.balance.value
   */
  balance?: Maybe<Scalars['Int']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  contributionPolicy?: Maybe<Scalars['String']>;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** Returns the Fiscal Host */
  host?: Maybe<Host>;
  /** Fees percentage that the host takes for this collective */
  hostFeePercent?: Maybe<Scalars['Float']>;
  /** Describe how the host charges the collective */
  hostFeesStructure?: Maybe<HostFeeStructure>;
  id?: Maybe<Scalars['String']>;
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether it's active: can accept financial contributions and pay expenses. */
  isActive: Scalars['Boolean'];
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether it's approved by the Fiscal Host */
  isApproved: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived?: Maybe<Scalars['Boolean']>;
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost?: Maybe<Scalars['Boolean']>;
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId?: Maybe<Scalars['Int']>;
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Int'];
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug?: Maybe<Scalars['String']>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  tiers: TierCollection;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  twitterHandle?: Maybe<Scalars['String']>;
  type?: Maybe<AccountType>;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  website?: Maybe<Scalars['String']>;
};


/** This represents an Project account */
export type FundActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents an Project account */
export type FundBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Project account */
export type FundChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type FundContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Project account */
export type FundConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type FundConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Project account */
export type FundExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Project account */
export type FundHostFeePercentArgs = {
  paymentMethodService?: InputMaybe<PaymentMethodService>;
  paymentMethodType?: InputMaybe<PaymentMethodType>;
};


/** This represents an Project account */
export type FundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Project account */
export type FundMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Project account */
export type FundMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type FundMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Project account */
export type FundOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type FundOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** This represents an Project account */
export type FundPaymentMethodsArgs = {
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents an Project account */
export type FundTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type FundTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};


/** This represents an Project account */
export type FundTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** This represents an Project account */
export type FundUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type FundVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type FundVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type FundWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type FundCreateInput = {
  description: Scalars['String'];
  name: Scalars['String'];
  settings?: InputMaybe<Scalars['JSON']>;
  slug: Scalars['String'];
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};

/** Input type for guest contributions */
export type GuestInfoInput = {
  /** Captcha validation for creating an order */
  captcha?: InputMaybe<CaptchaInput>;
  /** Contributor's email */
  email: Scalars['EmailAddress'];
  /** Legal name of the user */
  legalName?: InputMaybe<Scalars['String']>;
  /** Address of the user, mandatory when amount is above $5000. */
  location?: InputMaybe<LocationInput>;
  /** Display name of the user */
  name?: InputMaybe<Scalars['String']>;
};

/** This represents an Host account */
export type Host = Account & AccountWithContributions & {
  __typename?: 'Host';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  /**
   * Amount of money in cents in the currency of the account currently available to spend
   * @deprecated 2020/04/09 - Should not have been introduced. Use stats.balance.value
   */
  balance?: Maybe<Scalars['Int']>;
  bankAccount?: Maybe<PayoutMethod>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  contributionPolicy?: Maybe<Scalars['String']>;
  contributionStats: ContributionStats;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  expenseStats: ExpenseStats;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  hostFeePercent?: Maybe<Scalars['Float']>;
  hostMetrics: HostMetrics;
  hostMetricsTimeSeries: HostMetricsTimeSeries;
  hostedVirtualCardCollectives: AccountCollection;
  hostedVirtualCardMerchants: AccountCollection;
  hostedVirtualCards: VirtualCardCollection;
  id?: Maybe<Scalars['String']>;
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether the account accepts financial contributions. */
  isActive?: Maybe<Scalars['Boolean']>;
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived?: Maybe<Scalars['Boolean']>;
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost?: Maybe<Scalars['Boolean']>;
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  isOpenToApplications?: Maybe<Scalars['Boolean']>;
  /** Returns whether the host is trusted or not */
  isTrustedHost: Scalars['Boolean'];
  legacyId?: Maybe<Scalars['Int']>;
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** If the host supports PayPal, this will contain the client ID to use in the frontend */
  paypalClientId?: Maybe<Scalars['String']>;
  /** Paypal preapproval info. Returns null if PayPal account is not connected. */
  paypalPreApproval?: Maybe<PaymentMethod>;
  /** Pending applications for this host */
  pendingApplications: HostApplicationCollection;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  plan: HostPlan;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Int'];
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug?: Maybe<Scalars['String']>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  /** The list of payment methods (Stripe, Paypal, manual bank transfer, etc ...) the Host can accept for its Collectives */
  supportedPaymentMethods?: Maybe<Array<Maybe<PaymentMethodLegacyType>>>;
  /** The list of payout methods this Host accepts for its expenses */
  supportedPayoutMethods?: Maybe<Array<Maybe<PayoutMethodType>>>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  termsUrl?: Maybe<Scalars['URL']>;
  tiers: TierCollection;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
  totalHostedCollectives?: Maybe<Scalars['Int']>;
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  /** Transferwise balances. Returns null if Transferwise account is not connected. */
  transferwiseBalances?: Maybe<Array<Maybe<Amount>>>;
  twitterHandle?: Maybe<Scalars['String']>;
  type?: Maybe<AccountType>;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  website?: Maybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents an Host account */
export type HostBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Host account */
export type HostChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Host account */
export type HostContributionStatsArgs = {
  account?: InputMaybe<Array<AccountReferenceInput>>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  timeUnit?: InputMaybe<TimeUnit>;
};


/** This represents an Host account */
export type HostContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Host account */
export type HostConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Host account */
export type HostExpenseStatsArgs = {
  account?: InputMaybe<Array<AccountReferenceInput>>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  timeUnit?: InputMaybe<TimeUnit>;
};


/** This represents an Host account */
export type HostExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Host account */
export type HostHostMetricsArgs = {
  account?: InputMaybe<Array<AccountReferenceInput>>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
};


/** This represents an Host account */
export type HostHostMetricsTimeSeriesArgs = {
  account?: InputMaybe<Array<AccountReferenceInput>>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  timeUnit?: InputMaybe<TimeUnit>;
};


/** This represents an Host account */
export type HostHostedVirtualCardCollectivesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Host account */
export type HostHostedVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Host account */
export type HostHostedVirtualCardsArgs = {
  collectiveAccountIds?: InputMaybe<Array<InputMaybe<AccountReferenceInput>>>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Host account */
export type HostMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Host account */
export type HostMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Host account */
export type HostOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Host account */
export type HostOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** This represents an Host account */
export type HostPaymentMethodsArgs = {
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents an Host account */
export type HostPendingApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Host account */
export type HostTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};


/** This represents an Host account */
export type HostTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** This represents an Host account */
export type HostUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Host account */
export type HostVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type HostApplication = {
  __typename?: 'HostApplication';
  /** The account who applied to this host */
  account: Account;
  /** The date on which the item was created */
  createdAt: Scalars['DateTime'];
  customData?: Maybe<Scalars['JSON']>;
  id: Scalars['String'];
  message?: Maybe<Scalars['String']>;
  status?: Maybe<HostApplicationStatus>;
};

/** A collection of "HostApplication" */
export type HostApplicationCollection = Collection & {
  __typename?: 'HostApplicationCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<HostApplication>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export enum HostApplicationStatus {
  Approved = 'APPROVED',
  Expired = 'EXPIRED',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

/** A collection of "Hosts" */
export type HostCollection = Collection & {
  __typename?: 'HostCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Host>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** All supported expense types */
export enum HostFeeStructure {
  /** Custom fee for this Collective only */
  CustomFee = 'CUSTOM_FEE',
  /** Use global host fees */
  Default = 'DEFAULT',
  /** Set a monthly retainer for this Collective */
  MonthlyRetainer = 'MONTHLY_RETAINER'
}

/** Host metrics related to collected and pending fees/tips. */
export type HostMetrics = {
  __typename?: 'HostMetrics';
  /** Amount in host fee shared with the platform */
  hostFeeShare?: Maybe<Amount>;
  /** Host fee sharing percent */
  hostFeeSharePercent?: Maybe<Scalars['Float']>;
  /** Amount collected in host fees for given period */
  hostFees?: Maybe<Amount>;
  /** Amount in host fee shared  requiring settlement */
  pendingHostFeeShare?: Maybe<Amount>;
  /** Amount collected in platform fees requiring settlement */
  pendingPlatformFees?: Maybe<Amount>;
  /** Amount collected in platform tips requiring settlement */
  pendingPlatformTips?: Maybe<Amount>;
  /** Amount collected in platform fees for given period */
  platformFees?: Maybe<Amount>;
  /** Amount collected in platform tips for given period */
  platformTips?: Maybe<Amount>;
  /** Amount in host fee shared not requiring settlement */
  settledHostFeeShare?: Maybe<Amount>;
  /** Total amount managed on behalf of hosted collectives */
  totalMoneyManaged?: Maybe<Amount>;
};

/** Host metrics time series */
export type HostMetricsTimeSeries = {
  __typename?: 'HostMetricsTimeSeries';
  /** The start date of the time series */
  dateFrom: Scalars['DateTime'];
  /** The end date of the time series */
  dateTo: Scalars['DateTime'];
  /** History of the share of host fees collected owed to Open Collective Inc. */
  hostFeeShare: TimeSeriesAmountWithSettlement;
  /** History of the host fees collected */
  hostFees: TimeSeriesAmount;
  /** History of the collected platform tips */
  platformTips: TimeSeriesAmount;
  /** The interval between two data points */
  timeUnit: TimeUnit;
  /** History of the total money managed by this host */
  totalMoneyManaged: TimeSeriesAmount;
  /** History of the total money received by this host */
  totalReceived: TimeSeriesAmountWithKind;
  /** History of the total money spent by this host */
  totalSpent: TimeSeriesAmountWithKind;
};

/** The name of the current plan and its characteristics. */
export type HostPlan = {
  __typename?: 'HostPlan';
  /** Whether this plan allows to use the added funds feature */
  addedFunds?: Maybe<Scalars['Int']>;
  /** Amount limit for the added funds feature under this plan */
  addedFundsLimit?: Maybe<Scalars['Int']>;
  /** Whether this plan allows to use the bank transfers feature */
  bankTransfers?: Maybe<Scalars['Int']>;
  /** Amount limit for the bank transfers feature under this plan */
  bankTransfersLimit?: Maybe<Scalars['Int']>;
  /** Whether this plan allows to use the host dashboard */
  hostDashboard?: Maybe<Scalars['Boolean']>;
  /** Charge on revenues made through Host Fees. */
  hostFeeSharePercent?: Maybe<Scalars['Float']>;
  /** Ability to charge Host Fees. */
  hostFees?: Maybe<Scalars['Boolean']>;
  /** Number of collectives hosted */
  hostedCollectives?: Maybe<Scalars['Int']>;
  /** Max number of collectives than can be hosted */
  hostedCollectivesLimit?: Maybe<Scalars['Int']>;
  /** The public id identifying the account (ie: 5v08jk63-w4g9nbpz-j7qmyder-p7ozax5g) */
  id?: Maybe<Scalars['String']>;
  /** Whether this plan allows to use the manual payments feature */
  manualPayments?: Maybe<Scalars['Boolean']>;
  /** The name of the plan */
  name?: Maybe<Scalars['String']>;
  /** Ability to collect Platform Tips. */
  platformTips?: Maybe<Scalars['Boolean']>;
  /** Whether this plan allows to use the transferwise payouts feature */
  transferwisePayouts?: Maybe<Scalars['Int']>;
  /** Amount limit for the transferwise payouts feature under this plan */
  transferwisePayoutsLimit?: Maybe<Scalars['Int']>;
};

export enum ImageFormat {
  Gif = 'gif',
  Jpg = 'jpg',
  Png = 'png',
  Svg = 'svg',
  Txt = 'txt'
}

/** This represents an Individual account */
export type Individual = Account & {
  __typename?: 'Individual';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Email for the account. For authenticated user: scope: "email". */
  email?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  hasSeenLatestChangelogEntry: Scalars['Boolean'];
  hasTwoFactorAuth?: Maybe<Scalars['Boolean']>;
  /** If the individual is a host account, this will return the matching Host object */
  host?: Maybe<Host>;
  id?: Maybe<Scalars['String']>;
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether the account accepts financial contributions. */
  isActive?: Maybe<Scalars['Boolean']>;
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived?: Maybe<Scalars['Boolean']>;
  isFollowingConversation: Scalars['Boolean'];
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  isGuest: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost?: Maybe<Scalars['Boolean']>;
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId?: Maybe<Scalars['Int']>;
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /**
   *
   *           Address. This field is public for hosts, otherwise:
   *             - Users can see their own address
   *             - Hosts can see the address of users submitting expenses to their collectives
   *
   */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  newsletterOptIn?: Maybe<Scalars['Boolean']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  oAuthAuthorizations?: Maybe<OAuthAuthorizationCollection>;
  orders: OrderCollection;
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug?: Maybe<Scalars['String']>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  twitterHandle?: Maybe<Scalars['String']>;
  type?: Maybe<AccountType>;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  website?: Maybe<Scalars['String']>;
};


/** This represents an Individual account */
export type IndividualActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents an Individual account */
export type IndividualBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Individual account */
export type IndividualChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Individual account */
export type IndividualConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents an Individual account */
export type IndividualConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Individual account */
export type IndividualExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Individual account */
export type IndividualImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Individual account */
export type IndividualIsFollowingConversationArgs = {
  id: Scalars['String'];
};


/** This represents an Individual account */
export type IndividualMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Individual account */
export type IndividualMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Individual account */
export type IndividualMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Individual account */
export type IndividualOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Individual account */
export type IndividualOAuthAuthorizationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Individual account */
export type IndividualOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** This represents an Individual account */
export type IndividualPaymentMethodsArgs = {
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents an Individual account */
export type IndividualTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** This represents an Individual account */
export type IndividualUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Individual account */
export type IndividualVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Individual account */
export type IndividualVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents an Individual account */
export type IndividualWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type IndividualCreateInput = {
  email: Scalars['String'];
  name: Scalars['String'];
};

export type InviteMemberInput = {
  description?: InputMaybe<Scalars['String']>;
  /** Reference to an account for the invitee */
  memberAccount?: InputMaybe<AccountReferenceInput>;
  /** Email and name of the invitee if no reference. */
  memberInfo?: InputMaybe<IndividualCreateInput>;
  /** Role of the invitee */
  role: MemberRole;
  since?: InputMaybe<Scalars['DateTime']>;
};

/** Type for a required legal document */
export enum LegalDocumentType {
  /** US tax form (W9) */
  UsTaxForm = 'US_TAX_FORM'
}

/** Type for Geographic location */
export type Location = {
  __typename?: 'Location';
  /** Postal address without country (eg. 12 opensource avenue, 7500 Paris) */
  address?: Maybe<Scalars['String']>;
  /** Two letters country code (eg. FR, BE...etc) */
  country?: Maybe<Scalars['String']>;
  /** Unique identifier for this location */
  id?: Maybe<Scalars['String']>;
  /** Latitude */
  lat?: Maybe<Scalars['Float']>;
  /** Longitude */
  long?: Maybe<Scalars['Float']>;
  /** A short name for the location (eg. Open Collective Headquarters) */
  name?: Maybe<Scalars['String']>;
  /** Structured JSON address */
  structured?: Maybe<Scalars['JSON']>;
};

/** Input type for Geographic location */
export type LocationInput = {
  /** Postal address without country (eg. 12 opensource avenue, 7500 Paris) */
  address?: InputMaybe<Scalars['String']>;
  /** Two letters country code (eg. FR, BE...etc) */
  country?: InputMaybe<CountryIso>;
  /** Latitude */
  lat?: InputMaybe<Scalars['Float']>;
  /** Longitude */
  long?: InputMaybe<Scalars['Float']>;
  /** A short name for the location (eg. Open Collective Headquarters) */
  name?: InputMaybe<Scalars['String']>;
  /** Structured JSON address */
  structured?: InputMaybe<Scalars['JSON']>;
};

/** This represents a Member relationship (ie: Organization backing a Collective) */
export type Member = {
  __typename?: 'Member';
  account?: Maybe<Account>;
  createdAt?: Maybe<Scalars['DateTime']>;
  /** Custom user description */
  description?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  /** Custom user message from member to the collective */
  publicMessage?: Maybe<Scalars['String']>;
  role?: Maybe<MemberRole>;
  since?: Maybe<Scalars['DateTime']>;
  tier?: Maybe<Tier>;
  /** Total amount donated */
  totalDonations: Amount;
  updatedAt?: Maybe<Scalars['DateTime']>;
};

/** A collection of "Members" (ie: Organization backing a Collective) */
export type MemberCollection = Collection & {
  __typename?: 'MemberCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Member>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** An invitation to join the members of a collective */
export type MemberInvitation = {
  __typename?: 'MemberInvitation';
  account: Account;
  createdAt: Scalars['DateTime'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  /** The person who invited the member, if any */
  inviter?: Maybe<Individual>;
  memberAccount: Account;
  role: MemberRole;
  since?: Maybe<Scalars['DateTime']>;
  tier?: Maybe<Tier>;
};

export type MemberInvitationReferenceInput = {
  /** The public id identifying the member invitation (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The internal id of the invitation (ie: 580) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

/** This represents a MemberOf relationship (ie: Collective backed by an Organization) */
export type MemberOf = {
  __typename?: 'MemberOf';
  account?: Maybe<Account>;
  createdAt?: Maybe<Scalars['DateTime']>;
  /** Custom user description */
  description?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  /** Custom user message from member to the collective */
  publicMessage?: Maybe<Scalars['String']>;
  role?: Maybe<MemberRole>;
  since?: Maybe<Scalars['DateTime']>;
  tier?: Maybe<Tier>;
  /** Total amount donated */
  totalDonations: Amount;
  updatedAt?: Maybe<Scalars['DateTime']>;
};

/** A collection of "MemberOf" (ie: Collective backed by an Organization) */
export type MemberOfCollection = Collection & {
  __typename?: 'MemberOfCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<MemberOf>>>;
  offset?: Maybe<Scalars['Int']>;
  roles?: Maybe<Array<Maybe<MemberOfCollectionRoles>>>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** An existing member role and account type combination used used to filter collections */
export type MemberOfCollectionRoles = {
  __typename?: 'MemberOfCollectionRoles';
  role: MemberRole;
  type: AccountType;
};

/** All member roles */
export enum MemberRole {
  Accountant = 'ACCOUNTANT',
  Admin = 'ADMIN',
  Attendee = 'ATTENDEE',
  Backer = 'BACKER',
  ConnectedAccount = 'CONNECTED_ACCOUNT',
  Contributor = 'CONTRIBUTOR',
  Follower = 'FOLLOWER',
  Fundraiser = 'FUNDRAISER',
  Host = 'HOST',
  Member = 'MEMBER'
}

export type MergeAccountsResponse = {
  __typename?: 'MergeAccountsResponse';
  /** The resulting account */
  account: Account;
  /** A message to display to the user about the result */
  message?: Maybe<Scalars['String']>;
};

/** This is the root mutation */
export type Mutation = {
  __typename?: 'Mutation';
  /** Add a new payment method to be used with an Order. Scope: "orders". */
  addCreditCard: CreditCardWithStripeError;
  /** Add an emoji reaction. Scope: "conversations", "expenses" or "updates". */
  addEmojiReaction: EmojiReactionResponse;
  /** Add funds to the given account. Scope: "host". */
  addFunds: Order;
  /**
   * Add platform tips to a transaction. Scope: "transactions".
   * @deprecated 2022-07-06: This feature will not be supported in the future. Please don't rely on it.
   */
  addPlatformTipToTransaction: Transaction;
  /** Add 2FA to the Individual if it does not have it. Scope: "account". */
  addTwoFactorAuthTokenToIndividual: AddTwoFactorAuthTokenToIndividualResponse;
  /** Apply to an host with a collective. Scope: "account". */
  applyToHost: Account;
  /** Assign Virtual Card information to existing hosted collective. Scope: "virtualCards". */
  assignNewVirtualCard: VirtualCard;
  /** [Root only] Ban accounts */
  banAccount: BanAccountResponse;
  /** Cancel an order. Scope: "orders". */
  cancelOrder?: Maybe<Order>;
  /** [Root only] Clears the cache for a given account */
  clearCacheForAccount: Account;
  /** Confirm a credit card is ready for use after strong customer authentication. Scope: "orders". */
  confirmCreditCard: CreditCardWithStripeError;
  /** Mark an account as confirmed */
  confirmGuestAccount: ConfirmGuestAccountResponse;
  /** Confirm an order (strong customer authentication). Scope: "orders". */
  confirmOrder: OrderWithPayment;
  createApplication?: Maybe<Application>;
  /** Create a Collective. Scope: "account". */
  createCollective?: Maybe<Collective>;
  /** Create a comment. Scope: "conversations", "expenses" or "updates". */
  createComment?: Maybe<Comment>;
  /** Connect external account to Open Collective Account. Scope: "connectedAccounts". */
  createConnectedAccount?: Maybe<ConnectedAccount>;
  /** Create a conversation. Scope: "conversations". */
  createConversation?: Maybe<Conversation>;
  /** Create an Event. Scope: "account". */
  createEvent?: Maybe<Event>;
  /** Submit an expense to a collective. Scope: "expenses". */
  createExpense: Expense;
  /** Create a Fund. Scope: "account". */
  createFund?: Maybe<Fund>;
  /** [Root only] Create a member entry directly. For non-root users, use `inviteMember` */
  createMember: Member;
  /** To submit a new order. Scope: "orders". */
  createOrder: OrderWithPayment;
  /** Create an Organization. Scope: "account". */
  createOrganization?: Maybe<Organization>;
  /** Create a new Payout Method to get paid through the platform. Scope: "expenses". */
  createPayoutMethod?: Maybe<PayoutMethod>;
  /** Create a Project. Scope: "account". */
  createProject?: Maybe<Project>;
  /** Create update. Scope: "updates". */
  createUpdate: Update;
  /** Create new Stripe Virtual Card for existing hosted collective. Scope: "virtualCards". */
  createVirtualCard: VirtualCard;
  /** Create webhook. Scope: "webhooks". */
  createWebhook?: Maybe<Webhook>;
  /** Adds or removes a policy on a given account. Scope: "account". */
  deleteAccount?: Maybe<Account>;
  deleteApplication?: Maybe<Application>;
  deleteComment?: Maybe<Comment>;
  /** Delete ConnectedAccount. Scope: "connectedAccounts". */
  deleteConnectedAccount?: Maybe<ConnectedAccount>;
  /** Delete an expense. Only work if the expense is rejected - please check permissions.canDelete. Scope: "expenses". */
  deleteExpense: Expense;
  /** Delete update. Scope: "updates". */
  deleteUpdate: Update;
  /** Delete Virtual Card. Scope: "virtualCards". */
  deleteVirtualCard?: Maybe<Scalars['Boolean']>;
  /** Delete webhook. Scope: "webhooks". */
  deleteWebhook?: Maybe<Webhook>;
  /** Persist an Expense as a draft and invite someone to edit and submit it. Scope: "expenses". */
  draftExpenseAndInviteUser: Expense;
  /** Edit key properties of an account. Scope: "account". */
  editAccount: Host;
  /** An endpoint for hosts to edit the fees structure of their hosted accounts. Scope: "host". */
  editAccountFeeStructure: Account;
  /** An endpoint for hosts to edit the freeze status of their hosted accounts. Scope: "host". */
  editAccountFreezeStatus: Account;
  /** Edit the settings for the given account. Scope: "account" or "host". */
  editAccountSetting: Account;
  /** Edit a comment. Scope: "conversations", "expenses" or "updates". */
  editComment?: Maybe<Comment>;
  /** Edit a conversation. Scope: "conversations". */
  editConversation?: Maybe<Conversation>;
  /** To update an existing expense */
  editExpense: Expense;
  /**
   * Update the plan. Scope: "account".
   * @deprecated 2022-07-06: Host Plans are deprecated.
   */
  editHostPlan: Host;
  /** Edit an existing member of the Collective. Scope: "account". */
  editMember: Member;
  /** Edit an existing member invitation of the Collective. Scope: "account". */
  editMemberInvitation?: Maybe<MemberInvitation>;
  /** Edit the public message for the given Member of a Collective. Scope: "account". */
  editPublicMessage: Member;
  /** Edit update. Scope: "updates". */
  editUpdate: Update;
  /** Edit existing Virtual Card information. Scope: "virtualCards". */
  editVirtualCard: VirtualCard;
  /** Returns true if user is following, false otherwise. Must be authenticated. Scope: "conversations". */
  followConversation?: Maybe<Scalars['Boolean']>;
  /** Invite a new member to the Collective. Scope: "account". */
  inviteMember: MemberInvitation;
  /** [Root only] Merge two accounts, returns the result account */
  mergeAccounts: MergeAccountsResponse;
  /** [Root only] A mutation to move expenses from one account to another */
  moveExpenses: Array<Maybe<Expense>>;
  /** [Root only] A mutation to move orders from one account to another */
  moveOrders: Array<Maybe<Order>>;
  /** Pause active Virtual Card. Scope: "virtualCards". */
  pauseVirtualCard: VirtualCard;
  /** Process the expense with the given action. Scope: "expenses". */
  processExpense: Expense;
  /** Reply to a host application. Scope: "host". */
  processHostApplication: ProcessHostApplicationResponse;
  /** A mutation for the host to approve or reject an order. Scope: "orders". */
  processPendingOrder: Order;
  /** Publish update. Scope: "updates". */
  publishUpdate: Update;
  /** Refunds a transaction. Scope: "transactions". */
  refundTransaction?: Maybe<Transaction>;
  /** Rejects transaction, removes member from Collective, and sends a message to the contributor. Scope: "transactions". */
  rejectTransaction: Transaction;
  /** Remove an emoji reaction. Scope: "conversations", "expenses" or "updates". */
  removeEmojiReaction: EmojiReactionResponse;
  /** [Root only] Removes the host for an account */
  removeHost: Account;
  /** Remove a member from the Collective. Scope: "account". */
  removeMember?: Maybe<Scalars['Boolean']>;
  /** Remove the given payout method. Scope: "expenses". */
  removePayoutMethod: PayoutMethod;
  /** Remove 2FA from the Individual if it has been enabled. Scope: "account". */
  removeTwoFactorAuthTokenFromIndividual: Individual;
  /** Endpoint to accept or reject an invitation to become a member. Scope: "account". */
  replyToMemberInvitation: Scalars['Boolean'];
  /** Request Virtual Card to host. Scope: "virtualCards". */
  requestVirtualCard?: Maybe<Scalars['Boolean']>;
  /** To re-send the invitation to complete a draft expense. Scope: "expenses". */
  resendDraftExpenseInvite: Expense;
  /** Resume paused Virtual Card. Scope: "virtualCards". */
  resumeVirtualCard: VirtualCard;
  /** Revoke an OAuth authorization. Scope: "account". */
  revokeOAuthAuthorization: OAuthAuthorization;
  /** Sends an email for guest to confirm their emails and create their Open Collective account */
  sendGuestConfirmationEmail: Scalars['Boolean'];
  /** Update the time which the user viewed the changelog updates. Scope: "account". */
  setChangelogViewDate: Individual;
  /** Set email notification subscription for requesting logged-in user */
  setEmailNotification?: Maybe<ActivitySubscription>;
  /** Update newsletter opt-in preference. Scope: "account". */
  setNewsletterOptIn: Individual;
  /** Adds or removes a policy on a given account. Scope: "account". */
  setPolicies: Account;
  /** Unpublish update. Scope: "updates". */
  unpublishUpdate: Update;
  updateApplication?: Maybe<Application>;
  /** Update an Order's amount, tier, or payment method. Scope: "orders". */
  updateOrder?: Maybe<Order>;
  /** Update webhook. Scope: "webhooks". */
  updateWebhook?: Maybe<Webhook>;
  /** To verify and unverified expense. Scope: "expenses". */
  verifyExpense: Expense;
};


/** This is the root mutation */
export type MutationAddCreditCardArgs = {
  account: AccountReferenceInput;
  creditCardInfo: CreditCardCreateInput;
  isSavedForLater?: InputMaybe<Scalars['Boolean']>;
  name: Scalars['String'];
};


/** This is the root mutation */
export type MutationAddEmojiReactionArgs = {
  comment?: InputMaybe<CommentReferenceInput>;
  emoji: Scalars['String'];
  update?: InputMaybe<UpdateReferenceInput>;
};


/** This is the root mutation */
export type MutationAddFundsArgs = {
  account: AccountReferenceInput;
  amount: AmountInput;
  description: Scalars['String'];
  fromAccount: AccountReferenceInput;
  hostFeePercent?: InputMaybe<Scalars['Float']>;
  invoiceTemplate?: InputMaybe<Scalars['String']>;
  tier?: InputMaybe<TierReferenceInput>;
};


/** This is the root mutation */
export type MutationAddPlatformTipToTransactionArgs = {
  amount: AmountInput;
  transaction: TransactionReferenceInput;
};


/** This is the root mutation */
export type MutationAddTwoFactorAuthTokenToIndividualArgs = {
  account: AccountReferenceInput;
  token: Scalars['String'];
};


/** This is the root mutation */
export type MutationApplyToHostArgs = {
  applicationData?: InputMaybe<Scalars['JSON']>;
  collective: AccountReferenceInput;
  host: AccountReferenceInput;
  inviteMembers?: InputMaybe<Array<InputMaybe<InviteMemberInput>>>;
  message?: InputMaybe<Scalars['String']>;
};


/** This is the root mutation */
export type MutationAssignNewVirtualCardArgs = {
  account: AccountReferenceInput;
  assignee: AccountReferenceInput;
  virtualCard: VirtualCardInput;
};


/** This is the root mutation */
export type MutationBanAccountArgs = {
  account: Array<AccountReferenceInput>;
  dryRun: Scalars['Boolean'];
  includeAssociatedAccounts: Scalars['Boolean'];
};


/** This is the root mutation */
export type MutationCancelOrderArgs = {
  order: OrderReferenceInput;
  reason?: InputMaybe<Scalars['String']>;
  reasonCode?: InputMaybe<Scalars['String']>;
};


/** This is the root mutation */
export type MutationClearCacheForAccountArgs = {
  account: AccountReferenceInput;
  type?: Array<InputMaybe<AccountCacheType>>;
};


/** This is the root mutation */
export type MutationConfirmCreditCardArgs = {
  paymentMethod: PaymentMethodReferenceInput;
};


/** This is the root mutation */
export type MutationConfirmGuestAccountArgs = {
  email: Scalars['EmailAddress'];
  emailConfirmationToken: Scalars['String'];
};


/** This is the root mutation */
export type MutationConfirmOrderArgs = {
  guestToken?: InputMaybe<Scalars['String']>;
  order: OrderReferenceInput;
};


/** This is the root mutation */
export type MutationCreateApplicationArgs = {
  application: ApplicationCreateInput;
};


/** This is the root mutation */
export type MutationCreateCollectiveArgs = {
  applicationData?: InputMaybe<Scalars['JSON']>;
  automateApprovalWithGithub?: InputMaybe<Scalars['Boolean']>;
  collective: CollectiveCreateInput;
  host?: InputMaybe<AccountReferenceInput>;
  inviteMembers?: InputMaybe<Array<InputMaybe<InviteMemberInput>>>;
  message?: InputMaybe<Scalars['String']>;
  skipDefaultAdmin?: InputMaybe<Scalars['Boolean']>;
  testPayload?: InputMaybe<Scalars['JSON']>;
  user?: InputMaybe<IndividualCreateInput>;
};


/** This is the root mutation */
export type MutationCreateCommentArgs = {
  comment: CommentCreateInput;
};


/** This is the root mutation */
export type MutationCreateConnectedAccountArgs = {
  account: AccountReferenceInput;
  connectedAccount: ConnectedAccountCreateInput;
};


/** This is the root mutation */
export type MutationCreateConversationArgs = {
  CollectiveId: Scalars['String'];
  html: Scalars['String'];
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  title: Scalars['String'];
};


/** This is the root mutation */
export type MutationCreateEventArgs = {
  account: AccountReferenceInput;
  event: EventCreateInput;
};


/** This is the root mutation */
export type MutationCreateExpenseArgs = {
  account: AccountReferenceInput;
  expense: ExpenseCreateInput;
  recurring?: InputMaybe<RecurringExpenseInput>;
};


/** This is the root mutation */
export type MutationCreateFundArgs = {
  fund: FundCreateInput;
  host?: InputMaybe<AccountReferenceInput>;
};


/** This is the root mutation */
export type MutationCreateMemberArgs = {
  account: AccountReferenceInput;
  description?: InputMaybe<Scalars['String']>;
  memberAccount: AccountReferenceInput;
  role: MemberRole;
  since?: InputMaybe<Scalars['DateTime']>;
};


/** This is the root mutation */
export type MutationCreateOrderArgs = {
  order: OrderCreateInput;
};


/** This is the root mutation */
export type MutationCreateOrganizationArgs = {
  organization: OrganizationCreateInput;
};


/** This is the root mutation */
export type MutationCreatePayoutMethodArgs = {
  account: AccountReferenceInput;
  payoutMethod: PayoutMethodInput;
};


/** This is the root mutation */
export type MutationCreateProjectArgs = {
  parent?: InputMaybe<AccountReferenceInput>;
  project: ProjectCreateInput;
};


/** This is the root mutation */
export type MutationCreateUpdateArgs = {
  update: UpdateCreateInput;
};


/** This is the root mutation */
export type MutationCreateVirtualCardArgs = {
  account: AccountReferenceInput;
  assignee: AccountReferenceInput;
  monthlyLimit: AmountInput;
  name: Scalars['String'];
};


/** This is the root mutation */
export type MutationCreateWebhookArgs = {
  webhook: WebhookCreateInput;
};


/** This is the root mutation */
export type MutationDeleteAccountArgs = {
  account: AccountReferenceInput;
};


/** This is the root mutation */
export type MutationDeleteApplicationArgs = {
  application: ApplicationReferenceInput;
};


/** This is the root mutation */
export type MutationDeleteCommentArgs = {
  id: Scalars['String'];
};


/** This is the root mutation */
export type MutationDeleteConnectedAccountArgs = {
  connectedAccount: ConnectedAccountReferenceInput;
};


/** This is the root mutation */
export type MutationDeleteExpenseArgs = {
  expense: ExpenseReferenceInput;
};


/** This is the root mutation */
export type MutationDeleteUpdateArgs = {
  id: Scalars['String'];
};


/** This is the root mutation */
export type MutationDeleteVirtualCardArgs = {
  virtualCard: VirtualCardReferenceInput;
};


/** This is the root mutation */
export type MutationDeleteWebhookArgs = {
  webhook: WebhookReferenceInput;
};


/** This is the root mutation */
export type MutationDraftExpenseAndInviteUserArgs = {
  account: AccountReferenceInput;
  expense: ExpenseInviteDraftInput;
};


/** This is the root mutation */
export type MutationEditAccountArgs = {
  account: AccountUpdateInput;
};


/** This is the root mutation */
export type MutationEditAccountFeeStructureArgs = {
  account: AccountReferenceInput;
  hostFeePercent: Scalars['Float'];
  isCustomFee: Scalars['Boolean'];
};


/** This is the root mutation */
export type MutationEditAccountFreezeStatusArgs = {
  account: AccountReferenceInput;
  action: AccountFreezeAction;
  message?: InputMaybe<Scalars['String']>;
};


/** This is the root mutation */
export type MutationEditAccountSettingArgs = {
  account: AccountReferenceInput;
  key: Scalars['AccountSettingsKey'];
  value: Scalars['JSON'];
};


/** This is the root mutation */
export type MutationEditCommentArgs = {
  comment: CommentUpdateInput;
};


/** This is the root mutation */
export type MutationEditConversationArgs = {
  id: Scalars['String'];
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  title: Scalars['String'];
};


/** This is the root mutation */
export type MutationEditExpenseArgs = {
  draftKey?: InputMaybe<Scalars['String']>;
  expense: ExpenseUpdateInput;
};


/** This is the root mutation */
export type MutationEditHostPlanArgs = {
  account: AccountReferenceInput;
  plan: Scalars['String'];
};


/** This is the root mutation */
export type MutationEditMemberArgs = {
  account: AccountReferenceInput;
  description?: InputMaybe<Scalars['String']>;
  memberAccount: AccountReferenceInput;
  role?: InputMaybe<MemberRole>;
  since?: InputMaybe<Scalars['DateTime']>;
};


/** This is the root mutation */
export type MutationEditMemberInvitationArgs = {
  account: AccountReferenceInput;
  description?: InputMaybe<Scalars['String']>;
  memberAccount: AccountReferenceInput;
  role?: InputMaybe<MemberRole>;
  since?: InputMaybe<Scalars['DateTime']>;
};


/** This is the root mutation */
export type MutationEditPublicMessageArgs = {
  fromAccount: AccountReferenceInput;
  message?: InputMaybe<Scalars['String']>;
  toAccount: AccountReferenceInput;
};


/** This is the root mutation */
export type MutationEditUpdateArgs = {
  update: UpdateUpdateInput;
};


/** This is the root mutation */
export type MutationEditVirtualCardArgs = {
  assignee?: InputMaybe<AccountReferenceInput>;
  monthlyLimit?: InputMaybe<AmountInput>;
  name?: InputMaybe<Scalars['String']>;
  virtualCard: VirtualCardReferenceInput;
};


/** This is the root mutation */
export type MutationFollowConversationArgs = {
  id: Scalars['String'];
  isActive?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root mutation */
export type MutationInviteMemberArgs = {
  account: AccountReferenceInput;
  description?: InputMaybe<Scalars['String']>;
  memberAccount: AccountReferenceInput;
  role: MemberRole;
  since?: InputMaybe<Scalars['DateTime']>;
};


/** This is the root mutation */
export type MutationMergeAccountsArgs = {
  dryRun?: Scalars['Boolean'];
  fromAccount: AccountReferenceInput;
  toAccount: AccountReferenceInput;
};


/** This is the root mutation */
export type MutationMoveExpensesArgs = {
  destinationAccount: AccountReferenceInput;
  expenses: Array<ExpenseReferenceInput>;
};


/** This is the root mutation */
export type MutationMoveOrdersArgs = {
  fromAccount?: InputMaybe<AccountReferenceInput>;
  makeIncognito?: InputMaybe<Scalars['Boolean']>;
  orders: Array<OrderReferenceInput>;
  tier?: InputMaybe<TierReferenceInput>;
};


/** This is the root mutation */
export type MutationPauseVirtualCardArgs = {
  virtualCard: VirtualCardReferenceInput;
};


/** This is the root mutation */
export type MutationProcessExpenseArgs = {
  action: ExpenseProcessAction;
  expense: ExpenseReferenceInput;
  message?: InputMaybe<Scalars['String']>;
  paymentParams?: InputMaybe<ProcessExpensePaymentParams>;
};


/** This is the root mutation */
export type MutationProcessHostApplicationArgs = {
  account: AccountReferenceInput;
  action: ProcessHostApplicationAction;
  host: AccountReferenceInput;
  message?: InputMaybe<Scalars['String']>;
};


/** This is the root mutation */
export type MutationProcessPendingOrderArgs = {
  action: ProcessOrderAction;
  order: OrderUpdateInput;
};


/** This is the root mutation */
export type MutationPublishUpdateArgs = {
  id: Scalars['String'];
  notificationAudience?: InputMaybe<UpdateAudience>;
};


/** This is the root mutation */
export type MutationRefundTransactionArgs = {
  transaction: TransactionReferenceInput;
};


/** This is the root mutation */
export type MutationRejectTransactionArgs = {
  message?: InputMaybe<Scalars['String']>;
  transaction: TransactionReferenceInput;
};


/** This is the root mutation */
export type MutationRemoveEmojiReactionArgs = {
  comment?: InputMaybe<CommentReferenceInput>;
  emoji: Scalars['String'];
  update?: InputMaybe<UpdateReferenceInput>;
};


/** This is the root mutation */
export type MutationRemoveHostArgs = {
  account: AccountReferenceInput;
};


/** This is the root mutation */
export type MutationRemoveMemberArgs = {
  account: AccountReferenceInput;
  isInvitation?: InputMaybe<Scalars['Boolean']>;
  memberAccount: AccountReferenceInput;
  role: MemberRole;
};


/** This is the root mutation */
export type MutationRemovePayoutMethodArgs = {
  payoutMethodId: Scalars['String'];
};


/** This is the root mutation */
export type MutationRemoveTwoFactorAuthTokenFromIndividualArgs = {
  account: AccountReferenceInput;
  code: Scalars['String'];
};


/** This is the root mutation */
export type MutationReplyToMemberInvitationArgs = {
  accept: Scalars['Boolean'];
  invitation: MemberInvitationReferenceInput;
};


/** This is the root mutation */
export type MutationRequestVirtualCardArgs = {
  account: AccountReferenceInput;
  budget?: InputMaybe<Scalars['Int']>;
  notes?: InputMaybe<Scalars['String']>;
  purpose?: InputMaybe<Scalars['String']>;
};


/** This is the root mutation */
export type MutationResendDraftExpenseInviteArgs = {
  expense: ExpenseReferenceInput;
};


/** This is the root mutation */
export type MutationResumeVirtualCardArgs = {
  virtualCard: VirtualCardReferenceInput;
};


/** This is the root mutation */
export type MutationRevokeOAuthAuthorizationArgs = {
  oAuthAuthorization: OAuthAuthorizationReferenceInput;
};


/** This is the root mutation */
export type MutationSendGuestConfirmationEmailArgs = {
  email: Scalars['EmailAddress'];
};


/** This is the root mutation */
export type MutationSetChangelogViewDateArgs = {
  changelogViewDate: Scalars['DateTime'];
};


/** This is the root mutation */
export type MutationSetEmailNotificationArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  active: Scalars['Boolean'];
  type: ActivityAndClassesType;
};


/** This is the root mutation */
export type MutationSetNewsletterOptInArgs = {
  newsletterOptIn: Scalars['Boolean'];
};


/** This is the root mutation */
export type MutationSetPoliciesArgs = {
  account: AccountReferenceInput;
  policies: Scalars['JSON'];
};


/** This is the root mutation */
export type MutationUnpublishUpdateArgs = {
  id: Scalars['String'];
};


/** This is the root mutation */
export type MutationUpdateApplicationArgs = {
  application: ApplicationUpdateInput;
};


/** This is the root mutation */
export type MutationUpdateOrderArgs = {
  amount?: InputMaybe<AmountInput>;
  order: OrderReferenceInput;
  paymentMethod?: InputMaybe<PaymentMethodReferenceInput>;
  paypalSubscriptionId?: InputMaybe<Scalars['String']>;
  tier?: InputMaybe<TierReferenceInput>;
};


/** This is the root mutation */
export type MutationUpdateWebhookArgs = {
  webhook: WebhookUpdateInput;
};


/** This is the root mutation */
export type MutationVerifyExpenseArgs = {
  draftKey?: InputMaybe<Scalars['String']>;
  expense: ExpenseReferenceInput;
};

export type NewAccountOrReferenceInput = {
  email?: InputMaybe<Scalars['String']>;
  /** The public id identifying the account (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  legalName?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  newsletterOptIn?: InputMaybe<Scalars['Boolean']>;
  organization?: InputMaybe<NewAccountOrganizationInput>;
  /** The slug identifying the account (ie: babel for https://opencollective.com/babel) */
  slug?: InputMaybe<Scalars['String']>;
};

export type NewAccountOrganizationInput = {
  description?: InputMaybe<Scalars['String']>;
  legalName?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  website?: InputMaybe<Scalars['String']>;
};

/** A collection of "Application" */
export type OAuthApplicationCollection = Collection & {
  __typename?: 'OAuthApplicationCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Application>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** An OAuth authorization */
export type OAuthAuthorization = {
  __typename?: 'OAuthAuthorization';
  account: Individual;
  application: Application;
  /** The time of creation */
  createdAt: Scalars['DateTime'];
  /** The time of expiration */
  expiresAt: Scalars['DateTime'];
  id?: Maybe<Scalars['String']>;
  /** The last time of token was used */
  lastUsedAt?: Maybe<Scalars['DateTime']>;
  /** The attached scopes. */
  scope?: Maybe<Array<Maybe<OAuthScope>>>;
  /** The time of last update */
  updatedAt: Scalars['DateTime'];
};

/** A collection of "OAuth Authorizations" */
export type OAuthAuthorizationCollection = Collection & {
  __typename?: 'OAuthAuthorizationCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<OAuthAuthorization>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export type OAuthAuthorizationReferenceInput = {
  /** The id identifying the OAuth Authorization (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
};

/** All supported OAuth scopes */
export enum OAuthScope {
  /** Manage your account, collectives and organizations. */
  Account = 'account',
  /** Create and manage OAuth applications. */
  Applications = 'applications',
  /** Create and manage connected accounts. */
  ConnectedAccounts = 'connectedAccounts',
  /** Create and manage conversations. */
  Conversations = 'conversations',
  /** Access your email address. */
  Email = 'email',
  /** Create and manage expenses, payout methods. */
  Expenses = 'expenses',
  /** Administrate fiscal hosts. */
  Host = 'host',
  /** Access your incognito account. */
  Incognito = 'incognito',
  /** Create and manage contributions, payment methods. */
  Orders = 'orders',
  /** Perform critical administrative operations.  */
  Root = 'root',
  /** Refund and reject recorded transactions. */
  Transactions = 'transactions',
  /** Create and manage updates. */
  Updates = 'updates',
  /** Create and manage virtual cards. */
  VirtualCards = 'virtualCards',
  /** Create and manage webhooks */
  Webhooks = 'webhooks'
}

/** Order model */
export type Order = {
  __typename?: 'Order';
  /** Base order amount (without platform tip) */
  amount: Amount;
  createdAt?: Maybe<Scalars['DateTime']>;
  /** Custom data related to the order, based on the fields described by tier.customFields. Must be authenticated as an admin of the fromAccount or toAccount (returns null otherwise) */
  customData?: Maybe<Scalars['JSON']>;
  /** Data related to the order */
  data?: Maybe<Scalars['JSON']>;
  description?: Maybe<Scalars['String']>;
  frequency?: Maybe<ContributionFrequency>;
  fromAccount?: Maybe<Account>;
  id: Scalars['String'];
  legacyId: Scalars['Int'];
  /** This represents a MemberOf relationship (ie: Collective backed by an Individual) attached to the Order. */
  membership?: Maybe<MemberOf>;
  nextChargeDate?: Maybe<Scalars['DateTime']>;
  paymentMethod?: Maybe<PaymentMethod>;
  /** The permissions given to current logged in user for this order */
  permissions: OrderPermissions;
  /** Platform Tip attached to the Order. */
  platformTipAmount?: Maybe<Amount>;
  platformTipEligible?: Maybe<Scalars['Boolean']>;
  quantity?: Maybe<Scalars['Int']>;
  status?: Maybe<OrderStatus>;
  tags: Array<Maybe<Scalars['String']>>;
  taxes: Array<Maybe<OrderTax>>;
  tier?: Maybe<Tier>;
  toAccount?: Maybe<Account>;
  /** Total order amount, including all taxes and platform tip */
  totalAmount: Amount;
  /** WARNING: Total amount donated between collectives, though there will be edge cases especially when looking on the Order level, as the order id is not used in calculating this. */
  totalDonations: Amount;
  /** Transactions for this order ordered by createdAt ASC */
  transactions: Array<Maybe<Transaction>>;
  updatedAt?: Maybe<Scalars['DateTime']>;
};

/** Possible fields you can use to order by */
export enum OrderByFieldType {
  /** The financial activity of the collective (number of transactions) */
  Activity = 'ACTIVITY',
  CreatedAt = 'CREATED_AT',
  MemberCount = 'MEMBER_COUNT',
  Rank = 'RANK',
  TotalContributed = 'TOTAL_CONTRIBUTED'
}

/** Input to order results */
export type OrderByInput = {
  /** Ordering direction. */
  direction: OrderDirection;
  /** Field to order by. */
  field: OrderByFieldType;
};

/** A collection of "Orders" */
export type OrderCollection = Collection & {
  __typename?: 'OrderCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Order>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** Some context about how an order was created */
export type OrderContextInput = {
  /** Whether this order was created using the embedded contribution flow */
  isEmbed?: InputMaybe<Scalars['Boolean']>;
};

/** Input to create a new order */
export type OrderCreateInput = {
  /** The contribution amount for 1 quantity, without platform contribution and taxes */
  amount: AmountInput;
  /** Some context about how this order was created */
  context?: InputMaybe<OrderContextInput>;
  /** If the tier has some "customFields", use this field to set their values */
  customData?: InputMaybe<Scalars['JSON']>;
  /** Data related to this order */
  data?: InputMaybe<Scalars['JSON']>;
  frequency: ContributionFrequency;
  /** The profile making the order. Can be null for guest contributions. */
  fromAccount?: InputMaybe<AccountReferenceInput>;
  /** Additional information about the contributing profile */
  fromAccountInfo?: InputMaybe<OrderFromAccountInfo>;
  /** Use this when fromAccount is null to pass the guest info */
  guestInfo?: InputMaybe<GuestInfoInput>;
  /** Whether this is transferring the remaining balance from a project/event/collective */
  isBalanceTransfer?: InputMaybe<Scalars['Boolean']>;
  /** The payment method used for this order */
  paymentMethod?: InputMaybe<PaymentMethodInput>;
  /** Platform tip attached to this order */
  platformTipAmount?: InputMaybe<AmountInput>;
  quantity?: Scalars['Int'];
  /** Tags associated to the order */
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  /** Use this field to set the taxes associated to this order */
  taxes?: InputMaybe<Array<InputMaybe<OrderTaxInput>>>;
  /** The tier you are contributing to */
  tier?: InputMaybe<TierReferenceInput>;
  /** The profile you want to contribute to */
  toAccount: AccountReferenceInput;
};

/** Possible directions in which to order a list of items */
export enum OrderDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

/** Some context about how an order was created */
export type OrderFromAccountInfo = {
  legalName?: InputMaybe<Scalars['String']>;
  /** The location of the contributor. Account location will be updated with this address if different from the existing one. */
  location?: InputMaybe<LocationInput>;
  name?: InputMaybe<Scalars['String']>;
};

/** Fields for the user permissions on an order */
export type OrderPermissions = {
  __typename?: 'OrderPermissions';
  /** Whether the current user can mark this order as expired */
  canMarkAsExpired: Scalars['Boolean'];
  /** Whether the current user can mark this order as unpaid */
  canMarkAsPaid: Scalars['Boolean'];
  id: Scalars['String'];
};

export type OrderReferenceInput = {
  /** The public id identifying the order (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The legacy public id identifying the order (ie: 4242) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

/** All order statuses */
export enum OrderStatus {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Error = 'ERROR',
  Expired = 'EXPIRED',
  New = 'NEW',
  Paid = 'PAID',
  Pending = 'PENDING',
  Pledged = 'PLEDGED',
  Rejected = 'REJECTED',
  RequireClientConfirmation = 'REQUIRE_CLIENT_CONFIRMATION'
}

export type OrderTax = {
  __typename?: 'OrderTax';
  percentage: Scalars['Int'];
  type: OrderTaxType;
};

/** Input to set taxes for an order */
export type OrderTaxInput = {
  amount: AmountInput;
  /** Country of the account ordering, to know from where to apply the tax */
  country?: InputMaybe<CountryIso>;
  /** Tax identification number, if any */
  idNumber?: InputMaybe<Scalars['String']>;
  type: OrderTaxType;
};

/** The type of a tax like GST, VAT, etc */
export enum OrderTaxType {
  /** New Zealand Good and Services Tax */
  Gst = 'GST',
  /** European Value Added Tax */
  Vat = 'VAT'
}

export type OrderUpdateInput = {
  /** Amount received by collective, excluding any tips or fees */
  amount?: InputMaybe<AmountInput>;
  /** Host fee percent to be applied to the order */
  hostFeePercent?: InputMaybe<Scalars['Float']>;
  /** The public id identifying the order (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The legacy public id identifying the order (ie: 4242) */
  legacyId?: InputMaybe<Scalars['Int']>;
  /** Amount paid in fees for the payment processor */
  paymentProcessorFee?: InputMaybe<AmountInput>;
  /** Amount intended as tip for the platform */
  platformTip?: InputMaybe<AmountInput>;
};

export type OrderWithPayment = {
  __typename?: 'OrderWithPayment';
  /** If donating as a guest, this will contain your guest token to confirm your order */
  guestToken?: Maybe<Scalars['String']>;
  /** The order created */
  order: Order;
  /** This field will be set if the order was created but there was an error with Stripe during the payment */
  stripeError?: Maybe<StripeError>;
};

/** This represents an Organization account */
export type Organization = Account & AccountWithContributions & {
  __typename?: 'Organization';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  /**
   * Amount of money in cents in the currency of the collective currently available to spend
   * @deprecated 2020/04/09 - Should not have been introduced. Use stats.balance.value
   */
  balance?: Maybe<Scalars['Int']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  contributionPolicy?: Maybe<Scalars['String']>;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** @deprecated 2022-07-18: This field is deprecated and will return null */
  email?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** If the organization if a host account, this will return the matching Host object */
  host?: Maybe<Host>;
  id?: Maybe<Scalars['String']>;
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether the account accepts financial contributions. */
  isActive?: Maybe<Scalars['Boolean']>;
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived?: Maybe<Scalars['Boolean']>;
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost?: Maybe<Scalars['Boolean']>;
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId?: Maybe<Scalars['Int']>;
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /**
   *
   *           Address. This field is public for hosts, otherwise:
   *             - Users can see the addresses of the collectives they're admin of; if they are not an admin they can only see the country that the org belong to.
   *             - Hosts can see the address of organizations submitting expenses to their collectives.
   *
   */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Int'];
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug?: Maybe<Scalars['String']>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  tiers: TierCollection;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  twitterHandle?: Maybe<Scalars['String']>;
  type?: Maybe<AccountType>;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  website?: Maybe<Scalars['String']>;
};


/** This represents an Organization account */
export type OrganizationActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents an Organization account */
export type OrganizationBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Organization account */
export type OrganizationChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Organization account */
export type OrganizationContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Organization account */
export type OrganizationConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents an Organization account */
export type OrganizationConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Organization account */
export type OrganizationExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Organization account */
export type OrganizationImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Organization account */
export type OrganizationMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Organization account */
export type OrganizationMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Organization account */
export type OrganizationMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Organization account */
export type OrganizationOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Organization account */
export type OrganizationOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** This represents an Organization account */
export type OrganizationPaymentMethodsArgs = {
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents an Organization account */
export type OrganizationTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Organization account */
export type OrganizationTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};


/** This represents an Organization account */
export type OrganizationTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** This represents an Organization account */
export type OrganizationUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Organization account */
export type OrganizationVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Organization account */
export type OrganizationVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents an Organization account */
export type OrganizationWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type OrganizationCreateInput = {
  description: Scalars['String'];
  legalName?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  settings?: InputMaybe<Scalars['JSON']>;
  slug: Scalars['String'];
  website?: InputMaybe<Scalars['String']>;
};

/** PaymentMethod model */
export type PaymentMethod = {
  __typename?: 'PaymentMethod';
  account?: Maybe<Account>;
  /** Returns the balance amount and the currency of this paymentMethod */
  balance: Amount;
  createdAt?: Maybe<Scalars['DateTime']>;
  data?: Maybe<Scalars['JSON']>;
  expiryDate?: Maybe<Scalars['DateTime']>;
  id?: Maybe<Scalars['String']>;
  legacyId?: Maybe<Scalars['Int']>;
  limitedToHosts?: Maybe<Array<Maybe<Host>>>;
  name?: Maybe<Scalars['String']>;
  /**
   * Defines the type of the payment method. Meant to be moved to "type" in the future.
   * @deprecated 2021-03-02: Please use service + type
   */
  providerType?: Maybe<PaymentMethodLegacyType>;
  service?: Maybe<PaymentMethodService>;
  /** For gift cards, this field will return to the source payment method */
  sourcePaymentMethod?: Maybe<PaymentMethod>;
  type?: Maybe<PaymentMethodType>;
};

/** An input to use for creating or retrieving payment methods */
export type PaymentMethodInput = {
  /** When creating a credit card, use this field to set its info */
  creditCardInfo?: InputMaybe<CreditCardCreateInput>;
  /** The id assigned to the payment method */
  id?: InputMaybe<Scalars['String']>;
  /** Whether this payment method should be saved for future payments */
  isSavedForLater?: InputMaybe<Scalars['Boolean']>;
  /** Name of this payment method */
  name?: InputMaybe<Scalars['String']>;
  /** To pass when type is PAYPAL */
  paypalInfo?: InputMaybe<PaypalPaymentInput>;
  /** Service of this payment method */
  service?: InputMaybe<PaymentMethodService>;
  /** Type of this payment method */
  type?: InputMaybe<PaymentMethodType>;
};

export enum PaymentMethodLegacyType {
  AccountBalance = 'ACCOUNT_BALANCE',
  AddedFunds = 'ADDED_FUNDS',
  Alipay = 'ALIPAY',
  BankTransfer = 'BANK_TRANSFER',
  CreditCard = 'CREDIT_CARD',
  Crypto = 'CRYPTO',
  GiftCard = 'GIFT_CARD',
  Paypal = 'PAYPAL',
  PrepaidBudget = 'PREPAID_BUDGET'
}

export type PaymentMethodReferenceInput = {
  /** The id assigned to the payment method */
  id?: InputMaybe<Scalars['String']>;
};

export enum PaymentMethodService {
  Opencollective = 'OPENCOLLECTIVE',
  Paypal = 'PAYPAL',
  Prepaid = 'PREPAID',
  Stripe = 'STRIPE',
  Thegivingblock = 'THEGIVINGBLOCK'
}

export enum PaymentMethodType {
  Adaptive = 'ADAPTIVE',
  Alipay = 'ALIPAY',
  Collective = 'COLLECTIVE',
  Creditcard = 'CREDITCARD',
  Crypto = 'CRYPTO',
  Giftcard = 'GIFTCARD',
  Host = 'HOST',
  Manual = 'MANUAL',
  Payment = 'PAYMENT',
  Prepaid = 'PREPAID',
  Subscription = 'SUBSCRIPTION',
  /** @deprecated Please use uppercase values */
  Adaptive = 'adaptive',
  /** @deprecated Please use uppercase values */
  Alipay = 'alipay',
  /** @deprecated Please use uppercase values */
  Collective = 'collective',
  /** @deprecated Please use uppercase values */
  Creditcard = 'creditcard',
  /** @deprecated Please use uppercase values */
  Crypto = 'crypto',
  /** @deprecated Please use uppercase values */
  Giftcard = 'giftcard',
  /** @deprecated Please use uppercase values */
  Host = 'host',
  /** @deprecated Please use uppercase values */
  Manual = 'manual',
  /** @deprecated Please use uppercase values */
  Payment = 'payment',
  /** @deprecated Please use uppercase values */
  Prepaid = 'prepaid',
  /** @deprecated Please use uppercase values */
  Subscription = 'subscription'
}

/** A payout method */
export type PayoutMethod = {
  __typename?: 'PayoutMethod';
  /** The actual data for this payout method. Content depends on the type. */
  data?: Maybe<Scalars['JSON']>;
  /** Unique identifier for this payout method */
  id: Scalars['String'];
  /** Whether this payout method has been saved to be used for future payouts */
  isSaved?: Maybe<Scalars['Boolean']>;
  /** A friendly name for users to easily find their payout methods */
  name?: Maybe<Scalars['String']>;
  /** The type of this payout method (usually the payment provider) */
  type?: Maybe<PayoutMethodType>;
};

export type PayoutMethodInput = {
  data?: InputMaybe<Scalars['JSON']>;
  id?: InputMaybe<Scalars['String']>;
  isSaved?: InputMaybe<Scalars['Boolean']>;
  name?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<PayoutMethodType>;
};

export enum PayoutMethodType {
  AccountBalance = 'ACCOUNT_BALANCE',
  BankAccount = 'BANK_ACCOUNT',
  CreditCard = 'CREDIT_CARD',
  Other = 'OTHER',
  Paypal = 'PAYPAL'
}

export type PaypalPaymentInput = {
  data?: InputMaybe<Scalars['JSON']>;
  orderId?: InputMaybe<Scalars['String']>;
  subscriptionId?: InputMaybe<Scalars['String']>;
  token?: InputMaybe<Scalars['String']>;
};

/** A PayPal plan to associate with a contribution */
export type PaypalPlan = {
  __typename?: 'PaypalPlan';
  id: Scalars['String'];
};

export type Permission = {
  __typename?: 'Permission';
  allowed: Scalars['Boolean'];
  reason?: Maybe<Scalars['String']>;
};

export type Policies = {
  __typename?: 'Policies';
  COLLECTIVE_MINIMUM_ADMINS?: Maybe<Collective_Minimum_Admins>;
  EXPENSE_AUTHOR_CANNOT_APPROVE?: Maybe<Scalars['Boolean']>;
};

/** Parameters for paying an expense */
export type ProcessExpensePaymentParams = {
  /** 2FA code for if the host account has 2FA for payouts turned on. */
  feesPayer?: InputMaybe<FeesPayer>;
  /** Bypass automatic integrations (ie. PayPal, Transferwise) to process the expense manually */
  forceManual?: InputMaybe<Scalars['Boolean']>;
  /** The fee charged by payment processor in collective currency */
  paymentProcessorFee?: InputMaybe<Scalars['Int']>;
  /** Whether the payment processor fees should be refunded when triggering MARK_AS_UNPAID */
  shouldRefundPaymentProcessorFee?: InputMaybe<Scalars['Boolean']>;
  /** 2FA code for if the host account has 2FA for payouts turned on. */
  twoFactorAuthenticatorCode?: InputMaybe<Scalars['String']>;
};

/** Action taken for an account application to the host */
export enum ProcessHostApplicationAction {
  /** Approve the account request to be hosted */
  Approve = 'APPROVE',
  /** Rejects the account request to be hosted */
  Reject = 'REJECT',
  /** Sends a private message to the admins of the account */
  SendPrivateMessage = 'SEND_PRIVATE_MESSAGE',
  /** Creates a public conversation */
  SendPublicMessage = 'SEND_PUBLIC_MESSAGE'
}

export type ProcessHostApplicationResponse = {
  __typename?: 'ProcessHostApplicationResponse';
  /** The account that applied to the host */
  account: Account;
  /** When sending a public message, this field will have the info about the conversation created */
  conversation?: Maybe<Conversation>;
};

/** Action to apply on the order */
export enum ProcessOrderAction {
  /** To mark the order as expired */
  MarkAsExpired = 'MARK_AS_EXPIRED',
  /** To mark the order as paid */
  MarkAsPaid = 'MARK_AS_PAID'
}

/** This represents an Project account */
export type Project = Account & AccountWithContributions & AccountWithHost & AccountWithParent & {
  __typename?: 'Project';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  /** Date of approval by the Fiscal Host. */
  approvedAt?: Maybe<Scalars['DateTime']>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  /**
   * Amount of money in cents in the currency of the account currently available to spend
   * @deprecated 2020/04/09 - Should not have been introduced. Use stats.balance.value
   */
  balance?: Maybe<Scalars['Int']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  contributionPolicy?: Maybe<Scalars['String']>;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** Returns the Fiscal Host */
  host?: Maybe<Host>;
  /** Fees percentage that the host takes for this collective */
  hostFeePercent?: Maybe<Scalars['Float']>;
  /** Describe how the host charges the collective */
  hostFeesStructure?: Maybe<HostFeeStructure>;
  id?: Maybe<Scalars['String']>;
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether it's active: can accept financial contributions and pay expenses. */
  isActive: Scalars['Boolean'];
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether it's approved by the Fiscal Host */
  isApproved: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived?: Maybe<Scalars['Boolean']>;
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost?: Maybe<Scalars['Boolean']>;
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId?: Maybe<Scalars['Int']>;
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  /** The Account parenting this account */
  parent?: Maybe<Account>;
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Int'];
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug?: Maybe<Scalars['String']>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  tiers: TierCollection;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  twitterHandle?: Maybe<Scalars['String']>;
  type?: Maybe<AccountType>;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  website?: Maybe<Scalars['String']>;
};


/** This represents an Project account */
export type ProjectActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents an Project account */
export type ProjectBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Project account */
export type ProjectChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type ProjectContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Project account */
export type ProjectConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type ProjectConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Project account */
export type ProjectExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Project account */
export type ProjectHostFeePercentArgs = {
  paymentMethodService?: InputMaybe<PaymentMethodService>;
  paymentMethodType?: InputMaybe<PaymentMethodType>;
};


/** This represents an Project account */
export type ProjectImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Project account */
export type ProjectMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Project account */
export type ProjectMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type ProjectMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Project account */
export type ProjectOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type ProjectOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** This represents an Project account */
export type ProjectPaymentMethodsArgs = {
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents an Project account */
export type ProjectTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type ProjectTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};


/** This represents an Project account */
export type ProjectTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** This represents an Project account */
export type ProjectUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type ProjectVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type ProjectVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type ProjectWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type ProjectCreateInput = {
  description: Scalars['String'];
  name: Scalars['String'];
  settings?: InputMaybe<Scalars['JSON']>;
  slug: Scalars['String'];
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};

/** This is the root query */
export type Query = {
  __typename?: 'Query';
  account?: Maybe<Account>;
  accounts: AccountCollection;
  activities: ActivityCollection;
  application?: Maybe<Application>;
  collective?: Maybe<Collective>;
  conversation?: Maybe<Conversation>;
  event?: Maybe<Event>;
  expense?: Maybe<Expense>;
  expenses: ExpenseCollection;
  fund?: Maybe<Fund>;
  host?: Maybe<Host>;
  hosts?: Maybe<HostCollection>;
  individual?: Maybe<Individual>;
  loggedInAccount?: Maybe<Individual>;
  me?: Maybe<Individual>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  order?: Maybe<Order>;
  orders: OrderCollection;
  organization?: Maybe<Organization>;
  paypalPlan: PaypalPlan;
  project?: Maybe<Project>;
  tagStats: TagStatsCollection;
  tier?: Maybe<Tier>;
  transactions: TransactionCollection;
  update?: Maybe<Update>;
};


/** This is the root query */
export type QueryAccountArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryAccountsArgs = {
  country?: InputMaybe<Array<InputMaybe<CountryIso>>>;
  hasCustomContributionsEnabled?: InputMaybe<Scalars['Boolean']>;
  isActive?: InputMaybe<Scalars['Boolean']>;
  isHost?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<OrderByInput>;
  searchTerm?: InputMaybe<Scalars['String']>;
  skipRecentAccounts?: InputMaybe<Scalars['Boolean']>;
  tag?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  type?: InputMaybe<Array<InputMaybe<AccountType>>>;
};


/** This is the root query */
export type QueryActivitiesArgs = {
  account: AccountReferenceInput;
  attribution?: InputMaybe<ActivityAttribution>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  type?: InputMaybe<Array<ActivityAndClassesType>>;
};


/** This is the root query */
export type QueryApplicationArgs = {
  clientId?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  legacyId?: InputMaybe<Scalars['Int']>;
};


/** This is the root query */
export type QueryCollectiveArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryConversationArgs = {
  id: Scalars['String'];
};


/** This is the root query */
export type QueryEventArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryExpenseArgs = {
  draftKey?: InputMaybe<Scalars['String']>;
  expense?: InputMaybe<ExpenseReferenceInput>;
};


/** This is the root query */
export type QueryExpensesArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenExpenses?: Scalars['Boolean'];
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  payoutMethodType?: InputMaybe<PayoutMethodType>;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<ExpenseStatusFilter>;
  tag?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  type?: InputMaybe<ExpenseType>;
};


/** This is the root query */
export type QueryFundArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryHostArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryHostsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};


/** This is the root query */
export type QueryIndividualArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This is the root query */
export type QueryOrderArgs = {
  order: OrderReferenceInput;
};


/** This is the root query */
export type QueryOrdersArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** This is the root query */
export type QueryOrganizationArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryPaypalPlanArgs = {
  account: AccountReferenceInput;
  amount: AmountInput;
  frequency: ContributionFrequency;
  tier?: InputMaybe<TierReferenceInput>;
};


/** This is the root query */
export type QueryProjectArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryTagStatsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This is the root query */
export type QueryTierArgs = {
  throwIfMissing?: Scalars['Boolean'];
  tier: TierReferenceInput;
};


/** This is the root query */
export type QueryTransactionsArgs = {
  account?: InputMaybe<Array<AccountReferenceInput>>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** This is the root query */
export type QueryUpdateArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
};

/** A recurring expense object */
export type RecurringExpense = {
  __typename?: 'RecurringExpense';
  account: Account;
  /** The time this expense will cease to be recurring */
  endsAt?: Maybe<Scalars['DateTime']>;
  fromAccount: Account;
  /** Unique identifier for this recurring expense */
  id: Scalars['String'];
  /** The interval in which this recurring expense is created */
  interval: RecurringExpenseInterval;
  /** The last time this recurring expense was paid for */
  lastDraftedAt: Scalars['DateTime'];
  /** The last expense created by this recurring expense record paid for */
  lastExpenseCreated?: Maybe<Expense>;
};

export type RecurringExpenseInput = {
  /** The date when this recurring expense should cease */
  endsAt?: InputMaybe<Scalars['DateTime']>;
  /** The interval in which this recurring expense is created */
  interval: RecurringExpenseInterval;
};

/** All supported intervals for recurring expenses */
export enum RecurringExpenseInterval {
  Day = 'day',
  Month = 'month',
  Quarter = 'quarter',
  Week = 'week',
  Year = 'year'
}

export type StripeError = {
  __typename?: 'StripeError';
  account?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
  response?: Maybe<Scalars['JSON']>;
};

/** Statistics for a given tag */
export type TagStat = {
  __typename?: 'TagStat';
  /** Total amount for this tag */
  amount: Amount;
  /** Number of entries for this tag */
  count: Scalars['Int'];
  /** An unique identifier for this tag */
  id: Scalars['String'];
  /** Name/Label of the tag */
  tag: Scalars['String'];
};

/** A collection of "Tags" */
export type TagStatsCollection = Collection & {
  __typename?: 'TagStatsCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<TagStat>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** Information about a tax */
export type TaxInfo = {
  __typename?: 'TaxInfo';
  /** An unique identifier for this tax (GST, VAT, etc) */
  id: Scalars['String'];
  /** Tax ID number of the 3rd party receiving/paying the tax */
  idNumber?: Maybe<Scalars['String']>;
  /**
   * Percentage applied, between 0-100
   * @deprecated Please use `rate` instead
   */
  percentage: Scalars['Int'];
  /** Percentage applied, between 0-100 */
  rate: Scalars['Float'];
  /** Identifier for this tax (GST, VAT, etc) */
  type: OrderTaxType;
};

/** The type of a tax like GST, VAT, etc */
export enum TaxType {
  /** New Zealand Good and Services Tax */
  Gst = 'GST',
  /** European Value Added Tax */
  Vat = 'VAT'
}

/** Tier model */
export type Tier = {
  __typename?: 'Tier';
  amount: Amount;
  amountType: TierAmountType;
  /** Number of tickets available. Returns null if there is no limit. */
  availableQuantity?: Maybe<Scalars['Int']>;
  customFields?: Maybe<Scalars['JSON']>;
  description?: Maybe<Scalars['String']>;
  endsAt?: Maybe<Scalars['DateTime']>;
  frequency: TierFrequency;
  id: Scalars['String'];
  /** @deprecated 2020-08-24: Please use "frequency" */
  interval?: Maybe<TierInterval>;
  invoiceTemplate?: Maybe<Scalars['String']>;
  legacyId: Scalars['Int'];
  maxQuantity?: Maybe<Scalars['Int']>;
  minimumAmount: Amount;
  name?: Maybe<Scalars['String']>;
  /** Get all orders */
  orders: OrderCollection;
  presets?: Maybe<Array<Maybe<Scalars['Int']>>>;
  slug?: Maybe<Scalars['String']>;
  type: TierType;
};


/** Tier model */
export type TierOrdersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};

export enum TierAmountType {
  Fixed = 'FIXED',
  Flexible = 'FLEXIBLE'
}

/** A collection of "Tiers" */
export type TierCollection = Collection & {
  __typename?: 'TierCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Tier>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export enum TierFrequency {
  Flexible = 'FLEXIBLE',
  Monthly = 'MONTHLY',
  Onetime = 'ONETIME',
  Yearly = 'YEARLY'
}

export enum TierInterval {
  Flexible = 'flexible',
  Month = 'month',
  Year = 'year'
}

export type TierReferenceInput = {
  /** The id assigned to the Tier */
  id?: InputMaybe<Scalars['String']>;
  /** Pass this flag to reference the custom tier (/donate) */
  isCustom?: InputMaybe<Scalars['Boolean']>;
  /** The DB id assigned to the Tier */
  legacyId?: InputMaybe<Scalars['Int']>;
};

export enum TierType {
  Donation = 'DONATION',
  Membership = 'MEMBERSHIP',
  Product = 'PRODUCT',
  Service = 'SERVICE',
  Ticket = 'TICKET',
  Tier = 'TIER'
}

export type TimeSeries = {
  /** The start date of the time series */
  dateFrom: Scalars['DateTime'];
  /** The end date of the time series */
  dateTo: Scalars['DateTime'];
  /** The interval between two data points */
  timeUnit: TimeUnit;
};

/** Amount time series */
export type TimeSeriesAmount = TimeSeries & {
  __typename?: 'TimeSeriesAmount';
  /** The start date of the time series */
  dateFrom: Scalars['DateTime'];
  /** The end date of the time series */
  dateTo: Scalars['DateTime'];
  /** Time series data points */
  nodes: Array<TimeSeriesAmountNode>;
  /** The interval between two data points */
  timeUnit: TimeUnit;
};

export type TimeSeriesAmountNode = {
  __typename?: 'TimeSeriesAmountNode';
  amount: Amount;
  date: Scalars['DateTime'];
  label?: Maybe<Scalars['String']>;
};

/** Amounts with settlements time series */
export type TimeSeriesAmountWithKind = TimeSeries & {
  __typename?: 'TimeSeriesAmountWithKind';
  /** The start date of the time series */
  dateFrom: Scalars['DateTime'];
  /** The end date of the time series */
  dateTo: Scalars['DateTime'];
  /** Time series data points */
  nodes: Array<TimeSeriesAmountWithKindNode>;
  /** The interval between two data points */
  timeUnit: TimeUnit;
};

export type TimeSeriesAmountWithKindNode = {
  __typename?: 'TimeSeriesAmountWithKindNode';
  amount: Amount;
  date: Scalars['DateTime'];
  kind: TransactionKind;
};

/** Amounts with settlements time series */
export type TimeSeriesAmountWithSettlement = TimeSeries & {
  __typename?: 'TimeSeriesAmountWithSettlement';
  /** The start date of the time series */
  dateFrom: Scalars['DateTime'];
  /** The end date of the time series */
  dateTo: Scalars['DateTime'];
  /** Time series data points */
  nodes: Array<TimeSeriesAmountWithSettlementNode>;
  /** The interval between two data points */
  timeUnit: TimeUnit;
};

export type TimeSeriesAmountWithSettlementNode = {
  __typename?: 'TimeSeriesAmountWithSettlementNode';
  amount: Amount;
  date: Scalars['DateTime'];
  settlementStatus: TransactionSettlementStatus;
};

export enum TimeUnit {
  Day = 'DAY',
  Hour = 'HOUR',
  Minute = 'MINUTE',
  Month = 'MONTH',
  Second = 'SECOND',
  Week = 'WEEK',
  Year = 'YEAR'
}

/** Transaction interface shared by all kind of transactions (Debit, Credit) */
export type Transaction = {
  account?: Maybe<Account>;
  amount: Amount;
  amountInHostCurrency: Amount;
  /** The balance after the Transaction has run. Only for financially active accounts. */
  balanceInHostCurrency?: Maybe<Amount>;
  createdAt?: Maybe<Scalars['DateTime']>;
  description?: Maybe<Scalars['String']>;
  expense?: Maybe<Expense>;
  /** The sender of a transaction (on CREDIT = oppositeAccount, DEBIT = account) */
  fromAccount?: Maybe<Account>;
  giftCardEmitterAccount?: Maybe<Account>;
  group: Scalars['String'];
  host?: Maybe<Account>;
  /** Exchange rate between the currency of the transaction and the currency of the host (transaction.amount * transaction.hostCurrencyFxRate = transaction.amountInHostCurrency) */
  hostCurrencyFxRate?: Maybe<Scalars['Float']>;
  hostFee?: Maybe<Amount>;
  id: Scalars['String'];
  invoiceTemplate?: Maybe<Scalars['String']>;
  isOrderRejected: Scalars['Boolean'];
  isRefund?: Maybe<Scalars['Boolean']>;
  isRefunded?: Maybe<Scalars['Boolean']>;
  kind?: Maybe<TransactionKind>;
  legacyId: Scalars['Int'];
  /** Merchant id related to the Transaction (Stripe, PayPal, Wise, Privacy) */
  merchantId?: Maybe<Scalars['String']>;
  netAmount: Amount;
  netAmountInHostCurrency: Amount;
  oppositeAccount?: Maybe<Account>;
  order?: Maybe<Order>;
  paymentMethod?: Maybe<PaymentMethod>;
  paymentProcessorFee?: Maybe<Amount>;
  payoutMethod?: Maybe<PayoutMethod>;
  permissions?: Maybe<TransactionPermissions>;
  platformFee: Amount;
  refundTransaction?: Maybe<Transaction>;
  relatedTransactions: Array<Maybe<Transaction>>;
  taxAmount: Amount;
  /** If taxAmount is set, this field will contain more info about the tax */
  taxInfo?: Maybe<TaxInfo>;
  /** The recipient of a transaction (on CREDIT = account, DEBIT = oppositeAccount) */
  toAccount?: Maybe<Account>;
  type: TransactionType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** @deprecated 2021-08-15: Use id instead. */
  uuid: Scalars['String'];
};


/** Transaction interface shared by all kind of transactions (Debit, Credit) */
export type TransactionDescriptionArgs = {
  dynamic?: InputMaybe<Scalars['Boolean']>;
  full?: InputMaybe<Scalars['Boolean']>;
};


/** Transaction interface shared by all kind of transactions (Debit, Credit) */
export type TransactionHostFeeArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** Transaction interface shared by all kind of transactions (Debit, Credit) */
export type TransactionNetAmountArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** Transaction interface shared by all kind of transactions (Debit, Credit) */
export type TransactionNetAmountInHostCurrencyArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** Transaction interface shared by all kind of transactions (Debit, Credit) */
export type TransactionRelatedTransactionsArgs = {
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
};

/** A collection of Transactions (Debit or Credit) */
export type TransactionCollection = Collection & {
  __typename?: 'TransactionCollection';
  kinds?: Maybe<Array<Maybe<TransactionKind>>>;
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Transaction>>>;
  offset?: Maybe<Scalars['Int']>;
  /** The types of payment methods used in this collection, regardless of the pagination */
  paymentMethodTypes: Array<Maybe<PaymentMethodType>>;
  totalCount?: Maybe<Scalars['Int']>;
};

export enum TransactionKind {
  AddedFunds = 'ADDED_FUNDS',
  BalanceTransfer = 'BALANCE_TRANSFER',
  Contribution = 'CONTRIBUTION',
  Expense = 'EXPENSE',
  HostFee = 'HOST_FEE',
  HostFeeShare = 'HOST_FEE_SHARE',
  HostFeeShareDebt = 'HOST_FEE_SHARE_DEBT',
  PaymentProcessorCover = 'PAYMENT_PROCESSOR_COVER',
  PaymentProcessorFee = 'PAYMENT_PROCESSOR_FEE',
  PlatformFee = 'PLATFORM_FEE',
  PlatformTip = 'PLATFORM_TIP',
  PlatformTipDebt = 'PLATFORM_TIP_DEBT',
  PrepaidPaymentMethod = 'PREPAID_PAYMENT_METHOD'
}

/** Fields for the user permissions on an transaction */
export type TransactionPermissions = {
  __typename?: 'TransactionPermissions';
  /** Whether the current user can download this transaction's invoice */
  canDownloadInvoice: Scalars['Boolean'];
  /** Whether the current user can edit the transaction */
  canRefund: Scalars['Boolean'];
  /** Whether the current user can reject the transaction */
  canReject: Scalars['Boolean'];
  id: Scalars['String'];
};

export type TransactionReferenceInput = {
  /** The public id identifying the transaction (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The internal id of the transaction (ie: 580) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

export enum TransactionSettlementStatus {
  Invoiced = 'INVOICED',
  Owed = 'OWED',
  Settled = 'SETTLED'
}

/** All transaction types */
export enum TransactionType {
  Credit = 'CREDIT',
  Debit = 'DEBIT'
}

/** TransferWise related properties for bank transfer. */
export type TransferWise = {
  __typename?: 'TransferWise';
  availableCurrencies?: Maybe<Array<Maybe<Scalars['JSONObject']>>>;
  /** Unique identifier for this Wise object */
  id: Scalars['String'];
  requiredFields?: Maybe<Array<Maybe<TransferWiseRequiredField>>>;
};


/** TransferWise related properties for bank transfer. */
export type TransferWiseAvailableCurrenciesArgs = {
  ignoreBlockedCurrencies?: InputMaybe<Scalars['Boolean']>;
};


/** TransferWise related properties for bank transfer. */
export type TransferWiseRequiredFieldsArgs = {
  accountDetails?: InputMaybe<Scalars['JSON']>;
  currency: Scalars['String'];
};

export type TransferWiseField = {
  __typename?: 'TransferWiseField';
  group?: Maybe<Array<Maybe<TransferWiseFieldGroup>>>;
  name?: Maybe<Scalars['String']>;
};

export type TransferWiseFieldGroup = {
  __typename?: 'TransferWiseFieldGroup';
  displayFormat?: Maybe<Scalars['String']>;
  example?: Maybe<Scalars['String']>;
  key?: Maybe<Scalars['String']>;
  maxLength?: Maybe<Scalars['Int']>;
  minLength?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  refreshRequirementsOnChange?: Maybe<Scalars['Boolean']>;
  required?: Maybe<Scalars['Boolean']>;
  type?: Maybe<Scalars['String']>;
  validationAsync?: Maybe<Scalars['String']>;
  validationRegexp?: Maybe<Scalars['String']>;
  valuesAllowed?: Maybe<Array<Maybe<TransferWiseFieldVatvkluesAllowed>>>;
};

export type TransferWiseFieldVatvkluesAllowed = {
  __typename?: 'TransferWiseFieldVatvkluesAllowed';
  key?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
};

export type TransferWiseRequiredField = {
  __typename?: 'TransferWiseRequiredField';
  fields?: Maybe<Array<Maybe<TransferWiseField>>>;
  title?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
};

/** This represents an Update */
export type Update = {
  __typename?: 'Update';
  account?: Maybe<Account>;
  /** Some stats about the target audience. Will be null if the update is already published or if you don't have enough permissions so see this information. Not backed by a loader, avoid using this field in lists. */
  audienceStats?: Maybe<UpdateAudienceStats>;
  /** List the comments for this update. Not backed by a loader, don't use this in lists. */
  comments?: Maybe<CommentCollection>;
  createdAt: Scalars['DateTime'];
  fromAccount?: Maybe<Account>;
  html?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  isChangelog: Scalars['Boolean'];
  isPrivate: Scalars['Boolean'];
  legacyId?: Maybe<Scalars['Int']>;
  makePublicOn?: Maybe<Scalars['DateTime']>;
  notificationAudience?: Maybe<UpdateAudience>;
  publishedAt?: Maybe<Scalars['DateTime']>;
  /** Returns a map of reactions counts for this update */
  reactions?: Maybe<Scalars['JSON']>;
  slug: Scalars['String'];
  summary?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  title: Scalars['String'];
  updatedAt: Scalars['DateTime'];
  /** Indicates whether or not the user is allowed to publish this update */
  userCanPublishUpdate: Scalars['Boolean'];
  /** Indicates whether or not the user is allowed to see the content of this update */
  userCanSeeUpdate: Scalars['Boolean'];
  /** Returns the list of reactions added to this update by logged in user */
  userReactions?: Maybe<Array<Maybe<Scalars['String']>>>;
};


/** This represents an Update */
export type UpdateAudienceStatsArgs = {
  audience?: InputMaybe<UpdateAudience>;
};


/** This represents an Update */
export type UpdateCommentsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

/** Defines targets for an update */
export enum UpdateAudience {
  /** Will be sent to collective admins and financial contributors */
  All = 'ALL',
  /** Will be sent to collective admins */
  CollectiveAdmins = 'COLLECTIVE_ADMINS',
  /** Will be sent to financial contributors */
  FinancialContributors = 'FINANCIAL_CONTRIBUTORS',
  /** Will be sent to no one */
  NoOne = 'NO_ONE'
}

/** Stats about the potential audience of an update */
export type UpdateAudienceStats = {
  __typename?: 'UpdateAudienceStats';
  collectives: Scalars['Int'];
  coreContributors: Scalars['Int'];
  hosted: Scalars['Int'];
  id: Scalars['String'];
  individuals: Scalars['Int'];
  organizations: Scalars['Int'];
  /** The total number of emails to send */
  total: Scalars['Int'];
};

/** Input to order updates chronologically */
export type UpdateChronologicalOrderInput = {
  /** Ordering direction. */
  direction?: OrderDirection;
  /** Field to chronologically order by. */
  field?: UpdateDateTimeField;
};

/** A collection of "Updates" */
export type UpdateCollection = Collection & {
  __typename?: 'UpdateCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Update>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** Input type for UpdateType */
export type UpdateCreateInput = {
  account: AccountReferenceInput;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  html: Scalars['String'];
  isChangelog?: InputMaybe<Scalars['Boolean']>;
  isPrivate?: InputMaybe<Scalars['Boolean']>;
  makePublicOn?: InputMaybe<Scalars['IsoDateString']>;
  title: Scalars['String'];
};

/** All possible DateTime fields for an update */
export enum UpdateDateTimeField {
  /** The creation time */
  CreatedAt = 'CREATED_AT',
  /** The creation time */
  PublishedAt = 'PUBLISHED_AT'
}

export type UpdateReferenceInput = {
  /** The public id identifying the update */
  id?: InputMaybe<Scalars['String']>;
};

/** Input type for UpdateType */
export type UpdateUpdateInput = {
  fromAccount?: InputMaybe<AccountReferenceInput>;
  html?: InputMaybe<Scalars['String']>;
  id: Scalars['String'];
  isPrivate?: InputMaybe<Scalars['Boolean']>;
  makePublicOn?: InputMaybe<Scalars['DateTime']>;
  slug?: InputMaybe<Scalars['String']>;
  title?: InputMaybe<Scalars['String']>;
};

/** This represents a Vendor account */
export type Vendor = Account & AccountWithContributions & AccountWithHost & {
  __typename?: 'Vendor';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  /** Date of approval by the Fiscal Host. */
  approvedAt?: Maybe<Scalars['DateTime']>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  /**
   * Amount of money in cents in the currency of the account currently available to spend
   * @deprecated 2020/04/09 - Should not have been introduced. Use stats.balance.value
   */
  balance?: Maybe<Scalars['Int']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  contributionPolicy?: Maybe<Scalars['String']>;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** Returns the Fiscal Host */
  host?: Maybe<Host>;
  /** Fees percentage that the host takes for this collective */
  hostFeePercent?: Maybe<Scalars['Float']>;
  /** Describe how the host charges the collective */
  hostFeesStructure?: Maybe<HostFeeStructure>;
  id?: Maybe<Scalars['String']>;
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether it's active: can accept financial contributions and pay expenses. */
  isActive: Scalars['Boolean'];
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether it's approved by the Fiscal Host */
  isApproved: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived?: Maybe<Scalars['Boolean']>;
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost?: Maybe<Scalars['Boolean']>;
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId?: Maybe<Scalars['Int']>;
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Int'];
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug?: Maybe<Scalars['String']>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  tiers: TierCollection;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  twitterHandle?: Maybe<Scalars['String']>;
  type?: Maybe<AccountType>;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  website?: Maybe<Scalars['String']>;
};


/** This represents a Vendor account */
export type VendorActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents a Vendor account */
export type VendorBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents a Vendor account */
export type VendorChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Vendor account */
export type VendorContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Vendor account */
export type VendorConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents a Vendor account */
export type VendorConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents a Vendor account */
export type VendorExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents a Vendor account */
export type VendorHostFeePercentArgs = {
  paymentMethodService?: InputMaybe<PaymentMethodService>;
  paymentMethodType?: InputMaybe<PaymentMethodType>;
};


/** This represents a Vendor account */
export type VendorImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents a Vendor account */
export type VendorMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Vendor account */
export type VendorMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents a Vendor account */
export type VendorMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Vendor account */
export type VendorOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Vendor account */
export type VendorOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};


/** This represents a Vendor account */
export type VendorPaymentMethodsArgs = {
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents a Vendor account */
export type VendorTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Vendor account */
export type VendorTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};


/** This represents a Vendor account */
export type VendorTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<TransactionType>;
};


/** This represents a Vendor account */
export type VendorUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents a Vendor account */
export type VendorVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Vendor account */
export type VendorVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents a Vendor account */
export type VendorWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

/** A Virtual Card used to pay expenses */
export type VirtualCard = {
  __typename?: 'VirtualCard';
  account?: Maybe<Account>;
  assignee?: Maybe<Individual>;
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Currency>;
  data?: Maybe<Scalars['JSONObject']>;
  host?: Maybe<Account>;
  id?: Maybe<Scalars['String']>;
  last4?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  privateData?: Maybe<Scalars['JSONObject']>;
  provider?: Maybe<Scalars['String']>;
  spendingLimitAmount?: Maybe<Scalars['Int']>;
  spendingLimitInterval?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['DateTime']>;
};

/** A collection of Virtual Cards */
export type VirtualCardCollection = Collection & {
  __typename?: 'VirtualCardCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<VirtualCard>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export type VirtualCardInput = {
  data?: InputMaybe<Scalars['JSONObject']>;
  id?: InputMaybe<Scalars['String']>;
  last4?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  privateData?: InputMaybe<Scalars['JSONObject']>;
  provider?: InputMaybe<VirtualCardProvider>;
};

export enum VirtualCardProvider {
  Privacy = 'PRIVACY',
  Stripe = 'STRIPE'
}

export type VirtualCardReferenceInput = {
  id?: InputMaybe<Scalars['String']>;
};

/** An webhook attached to an account */
export type Webhook = {
  __typename?: 'Webhook';
  account: Account;
  activityType?: Maybe<ActivityType>;
  id: Scalars['String'];
  legacyId: Scalars['Int'];
  webhookUrl?: Maybe<Scalars['URL']>;
};

/** A collection of webhooks */
export type WebhookCollection = Collection & {
  __typename?: 'WebhookCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Webhook>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** Input type for Webhooks */
export type WebhookCreateInput = {
  /** The account to attach the Webhook */
  account: AccountReferenceInput;
  activityType?: ActivityType;
  webhookUrl: Scalars['URL'];
};

export type WebhookReferenceInput = {
  /** The public id identifying the webhook (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The legacy public id identifying the webhook (ie: 4242) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

/** Input type to update a Webhook */
export type WebhookUpdateInput = {
  activityType?: ActivityType;
  /** The public id identifying the webhook (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The legacy public id identifying the webhook (ie: 4242) */
  legacyId?: InputMaybe<Scalars['Int']>;
  webhookUrl: Scalars['URL'];
};

export type ClearCacheMutationVariables = Exact<{
  account: AccountReferenceInput;
}>;


export type ClearCacheMutation = { __typename?: 'Mutation', clearCacheForAccount: { __typename?: 'Bot', id?: string | null, slug?: string | null, name?: string | null } | { __typename?: 'Collective', id?: string | null, slug?: string | null, name?: string | null } | { __typename?: 'Event', id?: string | null, slug?: string | null, name?: string | null } | { __typename?: 'Fund', id?: string | null, slug?: string | null, name?: string | null } | { __typename?: 'Host', id?: string | null, slug?: string | null, name?: string | null } | { __typename?: 'Individual', id?: string | null, slug?: string | null, name?: string | null } | { __typename?: 'Organization', id?: string | null, slug?: string | null, name?: string | null } | { __typename?: 'Project', id?: string | null, slug?: string | null, name?: string | null } | { __typename?: 'Vendor', id?: string | null, slug?: string | null, name?: string | null } };


export const ClearCacheDocument = gql`
    mutation ClearCache($account: AccountReferenceInput!) {
  clearCacheForAccount(account: $account) {
    id
    slug
    name
  }
}
    `;
export type ClearCacheMutationFn = Apollo.MutationFunction<ClearCacheMutation, ClearCacheMutationVariables>;

/**
 * __useClearCacheMutation__
 *
 * To run a mutation, you first call `useClearCacheMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useClearCacheMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [clearCacheMutation, { data, loading, error }] = useClearCacheMutation({
 *   variables: {
 *      account: // value for 'account'
 *   },
 * });
 */
export function useClearCacheMutation(baseOptions?: Apollo.MutationHookOptions<ClearCacheMutation, ClearCacheMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ClearCacheMutation, ClearCacheMutationVariables>(ClearCacheDocument, options);
      }
export type ClearCacheMutationHookResult = ReturnType<typeof useClearCacheMutation>;
export type ClearCacheMutationResult = Apollo.MutationResult<ClearCacheMutation>;
export type ClearCacheMutationOptions = Apollo.BaseMutationOptions<ClearCacheMutation, ClearCacheMutationVariables>;

      export interface PossibleTypesResultData {
        possibleTypes: {
          [key: string]: string[]
        }
      }
      const result: PossibleTypesResultData = {
  "possibleTypes": {
    "Account": [
      "Bot",
      "Collective",
      "Event",
      "Fund",
      "Host",
      "Individual",
      "Organization",
      "Project",
      "Vendor"
    ],
    "AccountWithContributions": [
      "Collective",
      "Event",
      "Fund",
      "Host",
      "Organization",
      "Project",
      "Vendor"
    ],
    "AccountWithHost": [
      "Collective",
      "Event",
      "Fund",
      "Project",
      "Vendor"
    ],
    "AccountWithParent": [
      "Event",
      "Project"
    ],
    "Collection": [
      "AccountCollection",
      "ActivityCollection",
      "CommentCollection",
      "ContributorCollection",
      "ConversationCollection",
      "ExpenseCollection",
      "HostApplicationCollection",
      "HostCollection",
      "MemberCollection",
      "MemberOfCollection",
      "OAuthApplicationCollection",
      "OAuthAuthorizationCollection",
      "OrderCollection",
      "TagStatsCollection",
      "TierCollection",
      "TransactionCollection",
      "UpdateCollection",
      "VirtualCardCollection",
      "WebhookCollection"
    ],
    "TimeSeries": [
      "TimeSeriesAmount",
      "TimeSeriesAmountWithKind",
      "TimeSeriesAmountWithSettlement"
    ],
    "Transaction": [
      "Credit",
      "Debit"
    ]
  }
};
      export default result;
    